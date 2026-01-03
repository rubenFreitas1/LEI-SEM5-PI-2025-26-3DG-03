import "reflect-metadata";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { Container } from "typedi";
import { errors as celebrateErrors } from "celebrate";

import incidentRoutes from "../../src/api/routes/IncidentRoute";
import IncidentController from "../../src/controllers/IncidentController";
import config from "../../config";

// Mock do middleware requireRole
jest.mock("../../src/api/middlewares/RequiredRole", () => ({
  requireRole: () => {
    return (req: any, res: any, next: any) => {
      // Simular que o utilizador tem a role necessária
      req.userRole = 'Admin';
      next();
    };
  }
}));

jest.mock("../../config", () => ({
  controllers: {
    incident: {
      name: "incidentController"
    }
  },
  services: {
    incident: {
      name: "incidentService"
    }
  },
  env: 'test'
}));

// ----------------------------------------------------
// Mock do Service (SUT = Routes + Controller + Validação)
// O Controller é REAL, apenas o Service é mockado
// ----------------------------------------------------
const incidentServiceMock = {
  getAllIncidents: jest.fn(),
  getIncidentById: jest.fn(),
  getIncidentsByVessel: jest.fn(),
  getIncidentsByDateRange: jest.fn(),
  getIncidentsBySeverity: jest.fn(),
  getIncidentsByStatus: jest.fn(),
  createIncident: jest.fn(),
  updateIncident: jest.fn(),
};

// ----------------------------------------------------
// Helper para criar app de teste
// ----------------------------------------------------
function createTestApp() {
  const app = express();
  app.use(bodyParser.json());

  Container.reset();

  // Logger mock
  Container.set("logger", { 
    error: jest.fn(), 
    info: jest.fn(),
    silly: jest.fn()
  });

  // SERVICE MOCK (apenas o service é mockado)
  Container.set(
    config.services.incident.name,
    incidentServiceMock
  );

  // CONTROLLER REAL (instância real do controller)
  const controllerInstance = new IncidentController(
    incidentServiceMock,
    Container.get("logger")
  );
  Container.set(
    config.controllers.incident.name,
    controllerInstance
  );

  // Carregar routes reais
  incidentRoutes(app);

  // Error handler do Celebrate (IMPORTANTE para validação)
  app.use(celebrateErrors());

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: "Not Found" });
  });

  return app;
}

// ----------------------------------------------------
// TESTES
// ----------------------------------------------------
describe("Incident Routes (Application Tests)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET /incidents
  // -----------------------------
  it("GET /incidents → 200", async () => {
    incidentServiceMock.getAllIncidents.mockResolvedValue({
      isSuccess: true,
      getValue: () => [{ id: "INC1" }]
    });

    const app = createTestApp();

    const res = await request(app).get("/incidents");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "INC1" }]);
  });

  it("GET /incidents → 200 with empty array when no incidents exist", async () => {
    incidentServiceMock.getAllIncidents.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => []
    });

    const app = createTestApp();

    const res = await request(app).get("/incidents");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /incidents → 200 with multiple incidents", async () => {
    incidentServiceMock.getAllIncidents.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => [
        { id: "INC1", description: "First incident", status: "Active" },
        { id: "INC2", description: "Second incident", status: "Resolved" },
        { id: "INC3", description: "Third incident", status: "Active" }
      ]
    });

    const app = createTestApp();

    const res = await request(app).get("/incidents");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].id).toBe("INC1");
    expect(res.body[1].id).toBe("INC2");
    expect(res.body[2].id).toBe("INC3");
  });

  // -----------------------------
  // GET /incidents/id/:id
  // -----------------------------
  describe("GET /incidents/id/:id", () => {
    it("should return 200 when incident found by ID", async () => {
      incidentServiceMock.getIncidentById.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => ({ 
          id: "123e4567-e89b-12d3-a456-426614174000",
          description: "Test incident",
          status: "Active"
        })
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/id/123e4567-e89b-12d3-a456-426614174000");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("should return 404 when incident not found by ID", async () => {
      incidentServiceMock.getIncidentById.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: "Incident not found",
        errorValue: () => "Incident not found"
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/id/nonexistent-id");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });

    it("should call service with correct ID parameter", async () => {
      incidentServiceMock.getIncidentById.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ id: "test-id" })
      });

      const app = createTestApp();

      await request(app).get("/incidents/id/test-id-123");

      expect(incidentServiceMock.getIncidentById).toHaveBeenCalledWith("test-id-123");
    });
  });

  // -----------------------------
  // GET /incidents/vessel/:vesselIMO
  // -----------------------------
  describe("GET /incidents/vessel/:vesselIMO", () => {
    it("should return 200 with list of incidents for vessel", async () => {
      incidentServiceMock.getIncidentsByVessel.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { id: "INC1", description: "Incident 1", vesselIMO: "IMO1234567" },
          { id: "INC2", description: "Incident 2", vesselIMO: "IMO1234567" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/vessel/IMO1234567");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("should return 404 when no incidents found for vessel", async () => {
      incidentServiceMock.getIncidentsByVessel.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: "No incidents found",
        errorValue: () => "No incidents found"
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/vessel/IMO9999999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("No incidents found");
    });

    it("should call service with correct vessel IMO", async () => {
      incidentServiceMock.getIncidentsByVessel.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/incidents/vessel/IMO1234567");

      expect(incidentServiceMock.getIncidentsByVessel).toHaveBeenCalledWith("IMO1234567");
    });
  });

  // -----------------------------
  // GET /incidents/date-range
  // -----------------------------
  describe("GET /incidents/date-range", () => {
    it("should return 200 with incidents in date range", async () => {
      incidentServiceMock.getIncidentsByDateRange.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { id: "INC1", startDate: "2025-12-01", endDate: "2025-12-05" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/date-range?startDate=2025-12-01&endDate=2025-12-31");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should return 200 with empty array when no incidents in range", async () => {
      incidentServiceMock.getIncidentsByDateRange.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/date-range?startDate=2025-01-01&endDate=2025-01-31");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should call service with correct date parameters", async () => {
      incidentServiceMock.getIncidentsByDateRange.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/incidents/date-range?startDate=2025-12-01&endDate=2025-12-31");

      expect(incidentServiceMock.getIncidentsByDateRange).toHaveBeenCalledWith(
        new Date("2025-12-01"),
        new Date("2025-12-31")
      );
    });
  });

  // -----------------------------
  // GET /incidents/severity/:severity
  // -----------------------------
  describe("GET /incidents/severity/:severity", () => {
    it("should return 200 with incidents filtered by Minor severity", async () => {
      incidentServiceMock.getIncidentsBySeverity.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { id: "INC1", description: "Minor incident" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/severity/Minor");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should return 200 with incidents filtered by Major severity", async () => {
      incidentServiceMock.getIncidentsBySeverity.mockResolvedValue({
        isSuccess: true,
        getValue: () => [
          { id: "INC2", description: "Major incident" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/severity/Major");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should return 200 with incidents filtered by Critical severity", async () => {
      incidentServiceMock.getIncidentsBySeverity.mockResolvedValue({
        isSuccess: true,
        getValue: () => [
          { id: "INC3", description: "Critical incident" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/severity/Critical");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should call service with correct severity parameter", async () => {
      incidentServiceMock.getIncidentsBySeverity.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/incidents/severity/Critical");

      expect(incidentServiceMock.getIncidentsBySeverity).toHaveBeenCalledWith("Critical");
    });
  });

  // -----------------------------
  // GET /incidents/status/:status
  // -----------------------------
  describe("GET /incidents/status/:status", () => {
    it("should return 200 with Active incidents", async () => {
      incidentServiceMock.getIncidentsByStatus.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { id: "INC1", status: "Active" },
          { id: "INC2", status: "Active" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/status/Active");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("should return 200 with Resolved incidents", async () => {
      incidentServiceMock.getIncidentsByStatus.mockResolvedValue({
        isSuccess: true,
        getValue: () => [
          { id: "INC3", status: "Resolved" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incidents/status/Resolved");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should call service with correct status parameter", async () => {
      incidentServiceMock.getIncidentsByStatus.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/incidents/status/Active");

      expect(incidentServiceMock.getIncidentsByStatus).toHaveBeenCalledWith("Active");
    });
  });

  // -----------------------------
  // POST /incidents
  // -----------------------------
  it("POST /incidents → 201 when created", async () => {
    incidentServiceMock.createIncident.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ id: "INC10" })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/incidents")
      .send({
        incidentTypeByCode: "TYPE1",
        startDate: "2025-12-20",
        endDate: "2025-12-21",
        status: "Active",
        description: "Test incident",
        classification: "Critical",
        vesselVisitExecutionsCodes: ["2025-PA-000001"]
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("INC10");
  });

  it("POST /incidents → 400 when validation fails (missing required fields)", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/incidents")
      .send({
        description: "Invalid" // missing incidentTypeByCode, startDate, status
      });

    expect(res.status).toBe(400);
  });

  it("POST /incidents → 400 when status is invalid", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/incidents")
      .send({
        incidentTypeByCode: "TYPE1",
        startDate: "2025-12-20",
        status: "InvalidStatus", // deve ser Active ou Resolved
        description: "Test",
        classification: "Critical"
      });

    expect(res.status).toBe(400);
  });

  it("POST /incidents → 201 with null endDate", async () => {
    incidentServiceMock.createIncident.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ id: "INC11", endDate: null })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/incidents")
      .send({
        incidentTypeByCode: "TYPE1",
        startDate: "2025-12-20",
        endDate: null,
        status: "Active",
        description: "Ongoing incident",
        classification: "Critical"
      });

    expect(res.status).toBe(201);
  });

  it("POST /incidents → 201 with null vesselVisitExecutionsCodes", async () => {
    incidentServiceMock.createIncident.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ id: "INC12" })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/incidents")
      .send({
        incidentTypeByCode: "TYPE1",
        startDate: "2025-12-20",
        status: "Active",
        description: "Incident without vessels",
        classification: "Critical",
        vesselVisitExecutionsCodes: null
      });

    expect(res.status).toBe(201);
  });

  it("POST /incidents → 400 when incident type not found", async () => {
    incidentServiceMock.createIncident.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "IncidentType with code 'NONEXISTENT' not found.",
      errorValue: () => "IncidentType with code 'NONEXISTENT' not found."
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/incidents")
      .send({
        incidentTypeByCode: "NONEXISTENT",
        startDate: "2025-12-20",
        status: "Active",
        description: "Test",
        classification: "Critical"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("not found");
  });

  it("POST /incidents → verifica que o service é chamado com o payload correto", async () => {
    incidentServiceMock.createIncident.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ id: "INC20" })
    });

    const app = createTestApp();

    const payload = {
      incidentTypeByCode: "TYPE1",
      startDate: "2025-12-20",
      status: "Active",
      description: "Test incident",
      classification: "Critical"
    };

    await request(app)
      .post("/incidents")
      .send(payload);

    expect(incidentServiceMock.createIncident).toHaveBeenCalledWith(
      expect.objectContaining({
        incidentTypeByCode: "TYPE1",
        startDate: expect.any(Date),
        status: "Active",
        description: "Test incident"
      }),
      undefined
    );
  });

  // -----------------------------
  // PUT /incidents/update/:id
  // -----------------------------
  it("PUT /incidents/update/:id → 200 when updated", async () => {
    incidentServiceMock.updateIncident.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ id: "INC1", status: "Resolved" })
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/incidents/update/INC1")
      .send({
        endDate: "2025-12-22",
        status: "Resolved",
        description: "Updated description",
        classification: "Major",
        vesselVisitExecutionsCodes: []
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Resolved");
  });

  it("PUT /incidents/update/:id → 400 when incident not found", async () => {
    incidentServiceMock.updateIncident.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Incident not found",
      errorValue: () => "Incident not found"
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/incidents/update/NONEXISTENT")
      .send({
        status: "Resolved",
        description: "Test",
        classification: "Critical"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Incident not found");
  });

  it("PUT /incidents/update/:id → 400 when validation fails", async () => {
    const app = createTestApp();

    const res = await request(app)
      .put("/incidents/update/INC1")
      .send({
        status: "InvalidStatus" // missing required fields and invalid status
      });

    expect(res.status).toBe(400);
  });

  it("PUT /incidents/update/:id → 400 when status is invalid", async () => {
    const app = createTestApp();

    const res = await request(app)
      .put("/incidents/update/INC1")
      .send({
        status: "Pending", // inválido
        description: "Test"
      });

    expect(res.status).toBe(400);
  });

  it("PUT /incidents/update/:id → verifica que o service é chamado com parâmetros corretos", async () => {
    incidentServiceMock.updateIncident.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ id: "INC1" })
    });

    const app = createTestApp();

    const payload = {
      endDate: "2025-12-22",
      status: "Resolved",
      description: "Updated",
      classification: "Major",
      vesselVisitExecutionsCodes: ["2025-PA-000002"]
    };

    await request(app)
      .put("/incidents/update/INC1")
      .send(payload);

    expect(incidentServiceMock.updateIncident).toHaveBeenCalledWith(
      "INC1",
      expect.objectContaining({
        endDate: expect.any(Date),
        status: "Resolved",
        description: "Updated",
        classification: "Major",
        vesselVisitExecutionsCodes: ["2025-PA-000002"]
      })
    );
  });

  it("PUT /incidents/update/:id → 200 when updating with vessel executions", async () => {
    incidentServiceMock.updateIncident.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ 
        id: "INC1",
        vesselVisitExecutionsCodes: ["2025-PA-000001", "2025-PA-000002"]
      })
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/incidents/update/INC1")
      .send({
        status: "Active",
        description: "With vessels",
        classification: "Major",
        vesselVisitExecutionsCodes: ["2025-PA-000001", "2025-PA-000002"]
      });

    expect(res.status).toBe(200);
    expect(res.body.vesselVisitExecutionsCodes).toHaveLength(2);
  });
});
