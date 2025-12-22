import "reflect-metadata";
import request from "supertest";
import { Express } from "express";
import { createSystemApp, clearDatabase, closeDatabase } from "./setup";

// Mock do middleware requireRole para testes de sistema
jest.mock("../../src/api/middlewares/RequiredRole", () => ({
  requireRole: () => {
    return (req: any, res: any, next: any) => {
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

// Mock do VesselVisitNotificationClient para evitar chamadas HTTP externas
jest.mock("../../src/services/clients/VesselVisitNotificationClient", () => {
  return jest.fn().mockImplementation(() => ({
    getByCode: jest.fn().mockImplementation((code: string) => {
      // Extract the last 6 digits from the code (e.g., "000001" from "2025-PA-000001")
      const lastDigits = code.slice(-6);
      // Use it directly to create a unique 7-digit IMO (9000001, 9000002, etc.)
      const vesselIMO = `9${lastDigits}`;
      
      return Promise.resolve({
        code: code,
        vesselIMO: vesselIMO,
        visitStatus: "Approved"
      });
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

describe("VesselVisitExecution – System Tests (MongoDB Atlas)", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createSystemApp();
  }, 30000);

  beforeEach(async () => {
    await clearDatabase();
  }, 10000);

  afterAll(async () => {
    await closeDatabase();
  }, 10000);

  // =========================================
  // TESTES DE CRIAÇÃO (POST)
  // =========================================
  describe("POST /vessel-visit-executions", () => {
    it("should create and retrieve a vessel visit execution from real database", async () => {
      const payload = {
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      };

      const createRes = await request(app)
        .post("/api/vessel-visit-executions")
        .send(payload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.code).toMatch(/^\d{4}-PA-\d{6}$/);
      expect(createRes.body.status).toBe("InProgress");

      const getRes = await request(app).get(`/api/vessel-visit-executions/code/${createRes.body.code}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.code).toBe(createRes.body.code);
    });

    it("should fail when creating duplicate vessel visit notification code in database", async () => {
      const payload = {
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      };

      await request(app).post("/api/vessel-visit-executions").send(payload);

      const res = await request(app).post("/api/vessel-visit-executions").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already exists");
    });

    it("should fail when arrivalDate is missing", async () => {
      const res = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001"
      });

      expect(res.status).toBe(400);
    });

    it("should fail when vesselVisitNotificationCode is missing", async () => {
      const res = await request(app).post("/api/vessel-visit-executions").send({
        arrivalDate: new Date().toISOString()
      });

      expect(res.status).toBe(400);
    });
  });

  // =========================================
  // TESTES DE LEITURA (GET)
  // =========================================
  describe("GET /vessel-visit-executions", () => {
    it("should return empty array when database is empty", async () => {
      const res = await request(app).get("/api/vessel-visit-executions");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all vessel visit executions from database", async () => {
      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000002",
        arrivalDate: new Date().toISOString()
      });

      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000003",
        arrivalDate: new Date().toISOString()
      });

      const res = await request(app).get("/api/vessel-visit-executions");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
    });
  });

  describe("GET /vessel-visit-executions/id/:id", () => {
    it("should find vessel visit execution by id in database", async () => {
      const createRes = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      const res = await request(app).get(`/api/vessel-visit-executions/id/${createRes.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createRes.body.id);
    });

    it("should return 404 when id does not exist in database", async () => {
      const res = await request(app).get("/api/vessel-visit-executions/id/000000000000000000000000");

      expect(res.status).toBe(404);
    });

    it("should return 404 when id format is invalid", async () => {
      const res = await request(app).get("/api/vessel-visit-executions/id/invalid-id");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /vessel-visit-executions/code/:code", () => {
    it("should find vessel visit execution by code in database", async () => {
      const createRes = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      const res = await request(app).get(`/api/vessel-visit-executions/code/${createRes.body.code}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(createRes.body.code);
    });

    it("should return 404 when code does not exist in database", async () => {
      const res = await request(app).get("/api/vessel-visit-executions/code/2025-PA-999999");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /vessel-visit-executions/status/:status", () => {
    beforeEach(async () => {
      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      const createRes2 = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000002",
        arrivalDate: new Date().toISOString()
      });

      await request(app).put(`/api/vessel-visit-executions/${createRes2.body.code}`).send({
        status: "Completed"
      });

      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000003",
        arrivalDate: new Date().toISOString()
      });
    });

    it("should filter by InProgress status from database", async () => {
      const res = await request(app).get("/api/vessel-visit-executions/status/InProgress");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      res.body.forEach((vve: any) => {
        expect(vve.status).toBe("InProgress");
      });
    });

    it("should filter by Completed status from database", async () => {
      const res = await request(app).get("/api/vessel-visit-executions/status/Completed");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe("Completed");
    });

    it("should return 404 when no executions have the specified status", async () => {
      await clearDatabase();
      
      const res = await request(app).get("/api/vessel-visit-executions/status/InProgress");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /vessel-visit-executions/vessel-imo/:vesselIMO", () => {
    it("should find vessel visit executions by vessel IMO in database", async () => {
      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      const res = await request(app).get("/api/vessel-visit-executions/vessel-imo/9000001");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].vesselIMO).toBe("9000001");
    });

    it("should return 404 when vessel IMO does not exist in database", async () => {
      const res = await request(app).get("/api/vessel-visit-executions/vessel-imo/9999999");

      expect(res.status).toBe(404);
    });

    it("should find vessel visit execution by specific vessel IMO", async () => {
      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000002",
        arrivalDate: new Date().toISOString()
      });

      const res = await request(app).get("/api/vessel-visit-executions/vessel-imo/9000001");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].vesselIMO).toBe("9000001");
    });
  });

  // =========================================
  // TESTES DE ATUALIZAÇÃO (PUT)
  // =========================================
  describe("PUT /vessel-visit-executions/:code", () => {
    it("should update vessel visit execution status to Completed in database", async () => {
      const createRes = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      const updateRes = await request(app)
        .put(`/api/vessel-visit-executions/${createRes.body.code}`)
        .send({
          status: "Completed"
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe("Completed");

      const getRes = await request(app).get(`/api/vessel-visit-executions/code/${createRes.body.code}`);
      expect(getRes.body.status).toBe("Completed");
    });

    it("should update vessel visit execution status to InProgress in database", async () => {
      const createRes = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      await request(app)
        .put(`/api/vessel-visit-executions/${createRes.body.code}`)
        .send({
          status: "Completed"
        });

      const updateRes = await request(app)
        .put(`/api/vessel-visit-executions/${createRes.body.code}`)
        .send({
          status: "InProgress"
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe("InProgress");
    });

    it("should return 404 when updating non-existing vessel visit execution", async () => {
      const res = await request(app)
        .put("/api/vessel-visit-executions/2025-PA-999999")
        .send({
          status: "Completed"
        });

      expect(res.status).toBe(404);
    });

    it("should fail when status is invalid", async () => {
      const createRes = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      const res = await request(app)
        .put(`/api/vessel-visit-executions/${createRes.body.code}`)
        .send({
          status: "InvalidStatus"
        });

      expect(res.status).toBe(400);
    });

    it("should fail when status is missing", async () => {
      const createRes = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      const res = await request(app)
        .put(`/api/vessel-visit-executions/${createRes.body.code}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // =========================================
  // TESTES DE INTEGRAÇÃO COMPLEXOS
  // =========================================
  describe("Complex Integration Scenarios", () => {
    it("should handle complete CRUD workflow with real database", async () => {
      const payload = {
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      };

      const createRes = await request(app).post("/api/vessel-visit-executions").send(payload);
      expect(createRes.status).toBe(201);
      expect(createRes.body.status).toBe("InProgress");

      const readRes = await request(app).get(`/api/vessel-visit-executions/code/${createRes.body.code}`);
      expect(readRes.status).toBe(200);
      expect(readRes.body.status).toBe("InProgress");

      const updateRes = await request(app)
        .put(`/api/vessel-visit-executions/${createRes.body.code}`)
        .send({ status: "Completed" });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe("Completed");

      const verifyRes = await request(app).get(`/api/vessel-visit-executions/code/${createRes.body.code}`);
      expect(verifyRes.body.status).toBe("Completed");
    });

    it("should persist data between requests (real database test)", async () => {
      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000002",
        arrivalDate: new Date().toISOString()
      });

      await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000003",
        arrivalDate: new Date().toISOString()
      });

      const allExecutions = await request(app).get("/api/vessel-visit-executions");
      expect(allExecutions.body).toHaveLength(3);

      const exec1 = await request(app).get(`/api/vessel-visit-executions/vessel-imo/9000001`);
      expect(exec1.status).toBe(200);
      expect(exec1.body).toHaveLength(1);
      expect(exec1.body[0].vesselIMO).toBe("9000001");
    });

    it("should handle multiple status updates correctly in database", async () => {
      const createRes = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      expect(createRes.body.status).toBe("InProgress");

      await request(app)
        .put(`/api/vessel-visit-executions/${createRes.body.code}`)
        .send({ status: "Completed" });

      const check1 = await request(app).get(`/api/vessel-visit-executions/code/${createRes.body.code}`);
      expect(check1.body.status).toBe("Completed");

      await request(app)
        .put(`/api/vessel-visit-executions/${createRes.body.code}`)
        .send({ status: "InProgress" });

      const check2 = await request(app).get(`/api/vessel-visit-executions/code/${createRes.body.code}`);
      expect(check2.body.status).toBe("InProgress");

      await request(app)
        .put(`/api/vessel-visit-executions/${createRes.body.code}`)
        .send({ status: "Completed" });

      const check3 = await request(app).get(`/api/vessel-visit-executions/code/${createRes.body.code}`);
      expect(check3.body.status).toBe("Completed");
    });

    it("should correctly filter by status after multiple operations", async () => {
      const create1 = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      const create2 = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000002",
        arrivalDate: new Date().toISOString()
      });

      const create3 = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000003",
        arrivalDate: new Date().toISOString()
      });

      await request(app)
        .put(`/api/vessel-visit-executions/${create1.body.code}`)
        .send({ status: "Completed" });

      await request(app)
        .put(`/api/vessel-visit-executions/${create2.body.code}`)
        .send({ status: "Completed" });

      const inProgress = await request(app).get("/api/vessel-visit-executions/status/InProgress");
      expect(inProgress.body).toHaveLength(1);
      expect(inProgress.body[0].code).toBe(create3.body.code);

      const completed = await request(app).get("/api/vessel-visit-executions/status/Completed");
      expect(completed.body).toHaveLength(2);
      const completedCodes = completed.body.map((vve: any) => vve.code);
      expect(completedCodes).toContain(create1.body.code);
      expect(completedCodes).toContain(create2.body.code);
    });

    it("should generate unique codes for each vessel visit execution", async () => {
      const create1 = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      const create2 = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000002",
        arrivalDate: new Date().toISOString()
      });

      const create3 = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000003",
        arrivalDate: new Date().toISOString()
      });

      expect(create1.body.code).toMatch(/^\d{4}-PA-\d{6}$/);
      expect(create2.body.code).toMatch(/^\d{4}-PA-\d{6}$/);
      expect(create3.body.code).toMatch(/^\d{4}-PA-\d{6}$/);

      expect(create1.body.code).not.toBe(create2.body.code);
      expect(create2.body.code).not.toBe(create3.body.code);
      expect(create1.body.code).not.toBe(create3.body.code);
    });

    it("should validate vessel visit execution code format", async () => {
      const createRes = await request(app).post("/api/vessel-visit-executions").send({
        vesselVisitNotificationCode: "2025-PA-000001",
        arrivalDate: new Date().toISOString()
      });

      expect(createRes.body.code).toMatch(/^\d{4}-PA-\d{6}$/);
      
      const year = createRes.body.code.substring(0, 4);
      expect(parseInt(year)).toBeGreaterThanOrEqual(2025);
    });
  });
});
