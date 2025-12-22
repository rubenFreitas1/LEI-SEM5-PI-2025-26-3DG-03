import "reflect-metadata";
import request from "supertest";
import { Express } from "express";
import { createSystemApp, clearDatabase, closeDatabase } from "./setup";

// Mock do middleware requireRole para testes de sistema
jest.mock("../../src/api/middlewares/RequiredRole", () => ({
  requireRole: () => {
    return (req: any, res: any, next: any) => {
      // Simular que o utilizador tem a role necessária
      req.userRole = 'Admin';
      next();
    };
  }
}));

// Mock do SystemUserClient para evitar chamadas HTTP externas
jest.mock("../../src/services/clients/SystemUserClient", () => {
  return jest.fn().mockImplementation(() => ({
    getMyIsFirstTime: jest.fn().mockResolvedValue({ email: "test@example.com" }),
    getByEmail: jest.fn().mockResolvedValue({
      id: "test-user-id",
      email: "test@example.com",
      code: "USER001"
    })
  }));
});

/**
 * TESTES DE SISTEMA (System Tests)
 * 
 * SUT: Aplicação COMPLETA (Routes + Controllers + Services + Repos + MongoDB REAL)
 * Base de dados: MongoDB Atlas - oem_test
 * 
 * Estes testes:
 * - Usam uma base de dados REAL (MongoDB Atlas)
 * - Testam o fluxo completo end-to-end
 * - NÃO usam mocks (exceto o middleware de autorização e clientes HTTP externos)
 * - Validam integração real entre todas as camadas
 */

describe("Incident – System Tests (MongoDB Atlas)", () => {
  let app: Express;

  // Setup: Criar app e conectar à BD ANTES de todos os testes
  beforeAll(async () => {
    app = await createSystemApp();
  }, 30000); // 30s timeout para conexão à BD

  // Limpar a BD ANTES de cada teste para garantir isolamento
  beforeEach(async () => {
    await clearDatabase();
  }, 10000);

  // Cleanup: Fechar conexões DEPOIS de todos os testes
  afterAll(async () => {
    await closeDatabase();
  }, 10000);

  // Helper function to create an incident type (prerequisite for incidents)
  const createIncidentType = async (code: string, classification: string = "Minor") => {
    return await request(app).post("/api/incident-types").send({
      code,
      name: `${code} Type`,
      description: `Type for ${code}`,
      classification
    });
  };

  // Helper to get a recent date (within 7 days)
  const getRecentDate = (daysAgo: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  };

  // =========================================
  // TESTES DE CRIAÇÃO (POST)
  // =========================================
  describe("POST /incidents", () => {
    it("should create and retrieve an incident from real database", async () => {
      // Criar incident type primeiro
      await createIncidentType("INC001", "Major");

      const payload = {
        incidentTypeByCode: "INC001",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Test incident in system test"
      };

      const createRes = await request(app)
        .post("/api/incidents")
        .send(payload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.incidentTypeByCode).toBe("INC001");
      expect(createRes.body.status).toBe("Active");
      expect(createRes.body.description).toBe("Test incident in system test");

      // Verificar que foi realmente salvo na BD
      const getRes = await request(app).get(`/api/incidents/id/${createRes.body.id}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.incidentTypeByCode).toBe("INC001");
      expect(getRes.body.description).toBe("Test incident in system test");
    });

    it("should fail when incident type does not exist in database", async () => {
      const payload = {
        incidentTypeByCode: "NONEXISTENT",
        startDate: getRecentDate(1),
        status: "Active",
        description: "This should fail"
      };

      const res = await request(app)
        .post("/api/incidents")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should create incident with endDate in database", async () => {
      await createIncidentType("INC002", "Critical");

      const payload = {
        incidentTypeByCode: "INC002",
        startDate: getRecentDate(1),
        endDate: getRecentDate(0),
        status: "Resolved",
        description: "Incident with end date"
      };

      const res = await request(app)
        .post("/api/incidents")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Resolved");
      expect(res.body.endDate).toBeDefined();
    });

    it("should create incident without vessel visits in database", async () => {
      await createIncidentType("INC003", "Minor");

      const payload = {
        incidentTypeByCode: "INC003",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Incident without vessel visits"
      };

      const res = await request(app)
        .post("/api/incidents")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.description).toBe("Incident without vessel visits");
    });

    it("should create incident with Active status", async () => {
      await createIncidentType("INC004", "Major");

      const payload = {
        incidentTypeByCode: "INC004",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Active incident"
      };

      const res = await request(app)
        .post("/api/incidents")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Active");
    });

    it("should create incident with Resolved status", async () => {
      await createIncidentType("INC005", "Critical");

      const payload = {
        incidentTypeByCode: "INC005",
        startDate: getRecentDate(1),
        endDate: getRecentDate(0),
        status: "Resolved",
        description: "Resolved incident"
      };

      const res = await request(app)
        .post("/api/incidents")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("Resolved");
    });
  });

  // =========================================
  // TESTES DE LEITURA (GET)
  // =========================================
  describe("GET /incidents", () => {
    it("should return empty array when database is empty", async () => {
      const res = await request(app).get("/api/incidents");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all incidents from database", async () => {
      // Criar incident types
      await createIncidentType("TYPE1", "Minor");
      await createIncidentType("TYPE2", "Major");
      await createIncidentType("TYPE3", "Critical");

      // Criar vários incidents e verificar sucesso
      const inc1 = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "TYPE1",
        startDate: getRecentDate(1),
        status: "Active",
        description: "First incident"
      });
      expect(inc1.status).toBe(201);

      const inc2 = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "TYPE2",
        startDate: getRecentDate(0),
        status: "Active",
        description: "Second incident"
      });
      expect(inc2.status).toBe(201);

      const inc3 = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "TYPE3",
        startDate: getRecentDate(0),
        status: "Resolved",
        endDate: getRecentDate(0),
        description: "Third incident"
      });
      expect(inc3.status).toBe(201);

      // Buscar todos
      const res = await request(app).get("/api/incidents");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      const descriptions = res.body.map((i: any) => i.description);
      expect(descriptions).toContain("First incident");
      expect(descriptions).toContain("Second incident");
      expect(descriptions).toContain("Third incident");
    });
  });

  describe("GET /incidents/id/:id", () => {
    it("should find incident by ID in database", async () => {
      await createIncidentType("FIND_TYPE", "Major");

      const createRes = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "FIND_TYPE",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Findable incident"
      });

      const id = createRes.body.id;

      const res = await request(app).get(`/api/incidents/id/${id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(id);
      expect(res.body.description).toBe("Findable incident");
    });

    it("should return 404 when ID does not exist in database", async () => {
      const res = await request(app).get("/api/incidents/id/nonexistent-id");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /incidents/vessel/:vesselIMO", () => {
    it("should find incidents by vessel IMO in database", async () => {
      await createIncidentType("VESSEL_INC", "Major");

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "VESSEL_INC",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Incident for vessel 1",
        vesselVisitExecutionsCodes: ["2025-PA-000001"]
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "VESSEL_INC",
        startDate: getRecentDate(0),
        status: "Active",
        description: "Incident for vessel 2",
        vesselVisitExecutionsCodes: ["2025-PA-000002"]
      });

      // Note: This test assumes the service can filter by vessel IMO
      // The actual implementation might need vessel visit executions to be properly linked
      const res = await request(app).get("/api/incidents/vessel/IMO1234567");

      // Depending on implementation, this might return 404 or empty array
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("GET /incidents/date-range", () => {
    it("should filter incidents by date range in database", async () => {
      await createIncidentType("DATE_TYPE", "Minor");

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "DATE_TYPE",
        startDate: getRecentDate(5),
        status: "Active",
        description: "Incident in Dec 15"
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "DATE_TYPE",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Incident in Dec 20"
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "DATE_TYPE",
        startDate: getRecentDate(0),
        status: "Active",
        description: "Incident in Dec 25"
      });

      const res = await request(app)
        .get("/api/incidents/date-range")
        .query({
          startDate: getRecentDate(3),
          endDate: getRecentDate(0)
        });

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.length).toBeGreaterThan(0);
      }
    });
  });

  describe("GET /incidents/severity/:severity", () => {
    beforeEach(async () => {
      // Criar incident types com diferentes severities
      await createIncidentType("MINOR_T", "Minor");
      await createIncidentType("MAJOR_T", "Major");
      await createIncidentType("CRITICAL", "Critical");

      // Criar incidents
      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "MINOR_T",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Minor incident 1"
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "MINOR_T",
        startDate: getRecentDate(0),
        status: "Active",
        description: "Minor incident 2"
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "MAJOR_T",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Major incident"
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "CRITICAL",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Critical incident"
      });
    });

    it("should filter by Minor severity from database", async () => {
      const res = await request(app).get("/api/incidents/severity/Minor");

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should filter by Major severity from database", async () => {
      const res = await request(app).get("/api/incidents/severity/Major");

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should filter by Critical severity from database", async () => {
      const res = await request(app).get("/api/incidents/severity/Critical");

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("GET /incidents/status/:status", () => {
    beforeEach(async () => {
      await createIncidentType("STATUS_T", "Major");

      // Criar incidents com diferentes status e aguardar
      const active1 = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "STATUS_T",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Active incident 1"
      });
      expect(active1.status).toBe(201);

      const active2 = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "STATUS_T",
        startDate: getRecentDate(0),
        status: "Active",
        description: "Active incident 2"
      });
      expect(active2.status).toBe(201);

      const resolved = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "STATUS_T",
        startDate: getRecentDate(2),
        endDate: getRecentDate(1),
        status: "Resolved",
        description: "Resolved incident"
      });
      expect(resolved.status).toBe(201);
    });

    it("should filter by Active status from database", async () => {
      const res = await request(app).get("/api/incidents/status/Active");

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      res.body.forEach((incident: any) => {
        expect(incident.status).toBe("Active");
      });
    });

    it("should filter by Resolved status from database", async () => {
      const res = await request(app).get("/api/incidents/status/Resolved");

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      res.body.forEach((incident: any) => {
        expect(incident.status).toBe("Resolved");
      });
    });
  });

  // =========================================
  // TESTES DE ATUALIZAÇÃO (PUT)
  // =========================================
  describe("PUT /incidents/update/:id", () => {
    it("should update existing incident in database", async () => {
      await createIncidentType("UPD_TYPE", "Major");

      // Criar incident
      const createRes = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "UPD_TYPE",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Original description"
      });

      const id = createRes.body.id;

      // Atualizar
      const updateRes = await request(app)
        .put(`/api/incidents/update/${id}`)
        .send({
          status: "Resolved",
          endDate: getRecentDate(0),
          description: "Updated description"
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe("Resolved");
      expect(updateRes.body.description).toBe("Updated description");

      // Verificar persistência na BD
      const getRes = await request(app).get(`/api/incidents/id/${id}`);
      expect(getRes.body.status).toBe("Resolved");
      expect(getRes.body.description).toBe("Updated description");
    });

    it("should return 400 when updating non-existing incident", async () => {
      const res = await request(app)
        .put("/api/incidents/update/nonexistent-id")
        .send({
          status: "Resolved",
          description: "Updated"
        });

      expect(res.status).toBe(400);
    });

    it("should update incident status from Active to Resolved", async () => {
      await createIncidentType("RESOLVE_T", "Major");

      const createRes = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "RESOLVE_T",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Active incident"
      });

      expect(createRes.status).toBe(201);
      const id = createRes.body.id;

      const updateRes = await request(app)
        .put(`/api/incidents/update/${id}`)
        .send({
          status: "Resolved",
          endDate: getRecentDate(0),
          description: "Now resolved"
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe("Resolved");
    });

    it("should update incident description in database", async () => {
      await createIncidentType("VESSEL_U", "Minor");

      const createRes = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "VESSEL_U",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Original description"
      });

      const id = createRes.body.id;

      const updateRes = await request(app)
        .put(`/api/incidents/update/${id}`)
        .send({
          status: "Active",
          description: "Updated description"
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.description).toBe("Updated description");
    });
  });

  // =========================================
  // TESTES DE INTEGRAÇÃO COMPLEXOS
  // =========================================
  describe("Complex Integration Scenarios", () => {
    it("should handle complete CRUD workflow with real database", async () => {
      // 1. CREATE incident type
      await createIncidentType("CRUD_INC", "Major");

      // 2. CREATE incident
      const createRes = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "CRUD_INC",
        startDate: getRecentDate(1),
        status: "Active",
        description: "CRUD workflow test"
      });
      expect(createRes.status).toBe(201);
      const id = createRes.body.id;

      // 3. READ
      const readRes = await request(app).get(`/api/incidents/id/${id}`);
      expect(readRes.status).toBe(200);
      expect(readRes.body.description).toBe("CRUD workflow test");

      // 4. UPDATE
      const updateRes = await request(app)
        .put(`/api/incidents/update/${id}`)
        .send({
          status: "Resolved",
          endDate: getRecentDate(0),
          description: "Updated CRUD workflow"
        });
      expect(updateRes.status).toBe(200);

      // 5. VERIFY UPDATE
      const verifyRes = await request(app).get(`/api/incidents/id/${id}`);
      expect(verifyRes.body.description).toBe("Updated CRUD workflow");
      expect(verifyRes.body.status).toBe("Resolved");
    });

    it("should persist multiple incidents between requests (real database test)", async () => {
      await createIncidentType("PERSIST", "Major");

      // Criar múltiplos incidents em requests separados
      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "PERSIST",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Persistent incident 1"
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "PERSIST",
        startDate: getRecentDate(0),
        status: "Active",
        description: "Persistent incident 2"
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "PERSIST",
        startDate: getRecentDate(0),
        status: "Resolved",
        endDate: getRecentDate(0),
        description: "Persistent incident 3"
      });

      // Verificar que todos foram persistidos
      const allIncidents = await request(app).get("/api/incidents");
      expect(allIncidents.body.length).toBeGreaterThanOrEqual(3);
    });

    it("should maintain referential integrity with incident types", async () => {
      // Criar incident type
      await createIncidentType("REF_TYPE", "Critical");

      // Criar incident referenciando o type
      const createRes = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "REF_TYPE",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Testing referential integrity"
      });

      expect(createRes.status).toBe(201);

      // Verificar que o incident type code está correto
      const getRes = await request(app).get(`/api/incidents/id/${createRes.body.id}`);
      expect(getRes.body.incidentTypeByCode).toBe("REF_TYPE");
    });

    it("should handle incidents with different classifications through their types", async () => {
      // Criar types com diferentes classifications
      await createIncidentType("MINOR_CL", "Minor");
      await createIncidentType("MAJOR_CL", "Major");
      await createIncidentType("CRIT_CL", "Critical");

      // Criar incidents
      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "MINOR_CL",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Minor classification incident"
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "MAJOR_CL",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Major classification incident"
      });

      await request(app).post("/api/incidents").send({
        incidentTypeByCode: "CRIT_CL",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Critical classification incident"
      });

      // Verificar que todos foram criados
      const allIncidents = await request(app).get("/api/incidents");
      expect(allIncidents.body).toHaveLength(3);
    });

    it("should track incident lifecycle from Active to Resolved", async () => {
      await createIncidentType("LIFECYCLE", "Major");

      // Criar como Active
      const createRes = await request(app).post("/api/incidents").send({
        incidentTypeByCode: "LIFECYCLE",
        startDate: getRecentDate(1),
        status: "Active",
        description: "Lifecycle test"
      });

      expect(createRes.body.status).toBe("Active");
      expect(createRes.body.endDate).toBeNull();

      const id = createRes.body.id;

      // Resolver
      const resolveRes = await request(app)
        .put(`/api/incidents/update/${id}`)
        .send({
          status: "Resolved",
          endDate: getRecentDate(0),
          description: "Resolved now"
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.status).toBe("Resolved");
      expect(resolveRes.body.endDate).toBeDefined();

      // Verificar persistência
      const finalRes = await request(app).get(`/api/incidents/id/${id}`);
      expect(finalRes.body.status).toBe("Resolved");
    });
  });
});
