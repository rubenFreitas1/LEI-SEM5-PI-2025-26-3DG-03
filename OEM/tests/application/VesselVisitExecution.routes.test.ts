import "reflect-metadata";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { Container } from "typedi";
import { errors as celebrateErrors } from "celebrate";

import vesselVisitExecutionRoutes from "../../src/api/routes/VesselVisitExecutionRoute";
import VesselVisitExecutionController from "../../src/controllers/VesselVisitExecutionController";
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
    vesselVisitExecution: {
      name: "VesselVisitExecutionController"
    }
  },
  services: {
    vesselVisitExecution: {
      name: "vesselVisitExecutionService"
    }
  },
  env: "development"
}));

// ----------------------------------------------------
// Mock do Service (SUT = Routes + Controller + Validação)
// O Controller é REAL, apenas o Service é mockado
// ----------------------------------------------------
const vesselVisitExecutionServiceMock = {
  getAllVesselVisitExecutions: jest.fn(),
  getVesselVisitExecutions: jest.fn(),
  getVesselVisitExecutionById: jest.fn(),
  getVesselVisitExecutionByCode: jest.fn(),
  getVesselVisitExecutionsByStatus: jest.fn(),
  getVesselVisitExecutionsByVesselIMO: jest.fn(),
  createVesselVisitExecution: jest.fn(),
  updateVesselVisitExecution: jest.fn(),
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
    config.services.vesselVisitExecution.name,
    vesselVisitExecutionServiceMock
  );

  // CONTROLLER REAL (instância real do controller)
  const controllerInstance = new VesselVisitExecutionController(
    vesselVisitExecutionServiceMock,
    Container.get("logger")
  );
  Container.set(
    config.controllers.vesselVisitExecution.name,
    controllerInstance
  );

  // Carregar routes reais
  vesselVisitExecutionRoutes(app);

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
describe("VesselVisitExecution Routes (Application Tests)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET /vessel-visit-executions
  // -----------------------------
  describe("GET /vessel-visit-executions", () => {
    it("should return 200 with all vessel visit executions when no filters provided", async () => {
      vesselVisitExecutionServiceMock.getAllVesselVisitExecutions.mockResolvedValue({
        isSuccess: true,
        getValue: () => [{ code: "2025-PA-000001" }]
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ code: "2025-PA-000001" }]);
      expect(vesselVisitExecutionServiceMock.getAllVesselVisitExecutions).toHaveBeenCalled();
    });

    it("should return 200 with empty array when no executions exist", async () => {
      vesselVisitExecutionServiceMock.getAllVesselVisitExecutions.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return 200 with multiple executions", async () => {
      vesselVisitExecutionServiceMock.getAllVesselVisitExecutions.mockResolvedValue({
        isSuccess: true,
        getValue: () => [
          { code: "2025-PA-000001", status: "InProgress" },
          { code: "2025-PA-000002", status: "Completed" },
          { code: "2025-PA-000003", status: "InProgress" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      expect(res.body[0].code).toBe("2025-PA-000001");
    });

    it("should return 200 with filtered results when query params provided", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutions.mockResolvedValue({
        isSuccess: true,
        getValue: () => [{ code: "2025-PA-000001", vesselIMO: "IMO1234567" }]
      });

      const app = createTestApp();

      const res = await request(app)
        .get("/vessel-visit-executions")
        .query({ vesselIMO: "IMO1234567" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ code: "2025-PA-000001", vesselIMO: "IMO1234567" }]);
      expect(vesselVisitExecutionServiceMock.getVesselVisitExecutions).toHaveBeenCalledWith({
        from: undefined,
        to: undefined,
        vesselIMO: "IMO1234567",
        status: undefined
      });
    });

    it("should return 404 when filtered query returns no results", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutions.mockResolvedValue({
        isSuccess: false,
        error: "No vessel visit executions found"
      });

      const app = createTestApp();

      const res = await request(app)
        .get("/vessel-visit-executions")
        .query({ status: "Completed" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("No vessel visit executions found");
    });

    it("should call service with all query parameters", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutions.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app)
        .get("/vessel-visit-executions")
        .query({
          from: "2025-01-01",
          to: "2025-12-31",
          vesselIMO: "IMO1234567",
          status: "InProgress"
        });

      expect(vesselVisitExecutionServiceMock.getVesselVisitExecutions).toHaveBeenCalledWith({
        from: "2025-01-01",
        to: "2025-12-31",
        vesselIMO: "IMO1234567",
        status: "InProgress"
      });
    });
  });

  // -----------------------------
  // GET /vessel-visit-executions/id/:id
  // -----------------------------
  describe("GET /vessel-visit-executions/id/:id", () => {
    it("should return 200 when vessel visit execution found by ID", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionById.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ 
          id: "123e4567-e89b-12d3-a456-426614174000",
          code: "2025-PA-000001"
        })
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions/id/123e4567-e89b-12d3-a456-426614174000");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(res.body.code).toBe("2025-PA-000001");
    });

    it("should return 404 when vessel visit execution not found by ID", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionById.mockResolvedValue({
        isSuccess: false,
        error: "Vessel visit execution not found"
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions/id/nonexistent-id");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Vessel visit execution not found");
    });

    it("should call service with correct ID parameter", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionById.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ id: "test-id" })
      });

      const app = createTestApp();

      await request(app).get("/vessel-visit-executions/id/test-id-123");

      expect(vesselVisitExecutionServiceMock.getVesselVisitExecutionById).toHaveBeenCalledWith("test-id-123");
    });
  });

  // -----------------------------
  // GET /vessel-visit-executions/code/:code
  // -----------------------------
  describe("GET /vessel-visit-executions/code/:code", () => {
    it("should return 200 when vessel visit execution found by code", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionByCode.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ 
          code: "2025-PA-000001",
          vesselVisitNotificationCode: "2025-PA-000005",
          status: "InProgress"
        })
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions/code/2025-PA-000001");

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("2025-PA-000001");
    });

    it("should return 404 when vessel visit execution not found by code", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionByCode.mockResolvedValue({
        isSuccess: false,
        error: "Vessel visit execution not found"
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions/code/2025-PA-999999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Vessel visit execution not found");
    });

    it("should call service with correct code parameter", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionByCode.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ code: "2025-PA-000001" })
      });

      const app = createTestApp();

      await request(app).get("/vessel-visit-executions/code/2025-PA-000001");

      expect(vesselVisitExecutionServiceMock.getVesselVisitExecutionByCode).toHaveBeenCalledWith("2025-PA-000001");
    });
  });

  // -----------------------------
  // GET /vessel-visit-executions/status/:status
  // -----------------------------
  describe("GET /vessel-visit-executions/status/:status", () => {
    it("should return 200 with list of executions filtered by InProgress status", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionsByStatus.mockResolvedValue({
        isSuccess: true,
        getValue: () => [
          { code: "2025-PA-000001", status: "InProgress" },
          { code: "2025-PA-000002", status: "InProgress" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions/status/InProgress");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].status).toBe("InProgress");
    });

    it("should return 200 with list of executions filtered by Completed status", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionsByStatus.mockResolvedValue({
        isSuccess: true,
        getValue: () => [
          { code: "2025-PA-000003", status: "Completed" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions/status/Completed");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe("Completed");
    });

    it("should return 404 when no executions found for status", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionsByStatus.mockResolvedValue({
        isSuccess: false,
        error: "No executions found for this status"
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions/status/InProgress");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("No executions found for this status");
    });

    it("should call service with correct status parameter", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionsByStatus.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/vessel-visit-executions/status/Completed");

      expect(vesselVisitExecutionServiceMock.getVesselVisitExecutionsByStatus).toHaveBeenCalledWith("Completed");
    });
  });

  // -----------------------------
  // GET /vessel-visit-executions/vessel-imo/:vesselIMO
  // -----------------------------
  describe("GET /vessel-visit-executions/vessel-imo/:vesselIMO", () => {
    it("should return 200 with list of executions for specific vessel IMO", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionsByVesselIMO.mockResolvedValue({
        isSuccess: true,
        getValue: () => [
          { code: "2025-PA-000001", vesselIMO: "IMO1234567" },
          { code: "2025-PA-000002", vesselIMO: "IMO1234567" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions/vessel-imo/IMO1234567");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].vesselIMO).toBe("IMO1234567");
    });

    it("should return 404 when no executions found for vessel IMO", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionsByVesselIMO.mockResolvedValue({
        isSuccess: false,
        error: "No executions found for this vessel"
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions/vessel-imo/IMO9999999");

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("No executions found for this vessel");
    });

    it("should call service with correct vessel IMO parameter", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutionsByVesselIMO.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/vessel-visit-executions/vessel-imo/IMO1234567");

      expect(vesselVisitExecutionServiceMock.getVesselVisitExecutionsByVesselIMO).toHaveBeenCalledWith("IMO1234567");
    });
  });

  // -----------------------------
  // POST /vessel-visit-executions
  // -----------------------------
  describe("POST /vessel-visit-executions", () => {
    it("should return 201 when vessel visit execution created successfully", async () => {
      vesselVisitExecutionServiceMock.createVesselVisitExecution.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ 
          code: "2025-PA-000010",
          vesselVisitNotificationCode: "2025-PA-000005",
          arrivalDate: new Date("2025-12-16T10:30:00Z")
        })
      });

      const app = createTestApp();

      const res = await request(app)
        .post("/vessel-visit-executions")
        .send({
          vesselVisitNotificationCode: "2025-PA-000005",
          arrivalDate: "2025-12-16T10:30:00Z"
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe("2025-PA-000010");
    });

    it("should return 400 when validation fails (missing required fields)", async () => {
      const app = createTestApp();

      const res = await request(app)
        .post("/vessel-visit-executions")
        .send({
          vesselVisitNotificationCode: "2025-PA-000005"
          // missing arrivalDate
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when arrivalDate is invalid", async () => {
      const app = createTestApp();

      const res = await request(app)
        .post("/vessel-visit-executions")
        .send({
          vesselVisitNotificationCode: "2025-PA-000005",
          arrivalDate: "invalid-date"
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when vessel visit notification not found", async () => {
      vesselVisitExecutionServiceMock.createVesselVisitExecution.mockResolvedValue({
        isSuccess: false,
        error: "Vessel visit notification with code '2025-PA-999999' not found."
      });

      const app = createTestApp();

      const res = await request(app)
        .post("/vessel-visit-executions")
        .send({
          vesselVisitNotificationCode: "2025-PA-999999",
          arrivalDate: "2025-12-16T10:30:00Z"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("not found");
    });

    it("should return 400 when execution already exists for notification", async () => {
      vesselVisitExecutionServiceMock.createVesselVisitExecution.mockResolvedValue({
        isSuccess: false,
        error: "Vessel visit execution already exists for this notification"
      });

      const app = createTestApp();

      const res = await request(app)
        .post("/vessel-visit-executions")
        .send({
          vesselVisitNotificationCode: "2025-PA-000005",
          arrivalDate: "2025-12-16T10:30:00Z"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already exists");
    });

    it("should call service with correct parameters including API URL and auth header", async () => {
      vesselVisitExecutionServiceMock.createVesselVisitExecution.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ code: "2025-PA-000010" })
      });

      const app = createTestApp();

      await request(app)
        .post("/vessel-visit-executions")
        .set("Authorization", "Bearer test-token")
        .send({
          vesselVisitNotificationCode: "2025-PA-000005",
          arrivalDate: "2025-12-16T10:30:00Z"
        });

      expect(vesselVisitExecutionServiceMock.createVesselVisitExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          vesselVisitNotificationCode: "2025-PA-000005",
          arrivalDate: expect.any(Date)
        }),
        expect.any(String),
        "Bearer test-token"
      );
    });

    it("should accept Date objects for arrivalDate", async () => {
      vesselVisitExecutionServiceMock.createVesselVisitExecution.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ code: "2025-PA-000010" })
      });

      const app = createTestApp();

      const res = await request(app)
        .post("/vessel-visit-executions")
        .send({
          vesselVisitNotificationCode: "2025-PA-000005",
          arrivalDate: new Date("2025-12-16T10:30:00Z")
        });

      expect(res.status).toBe(201);
    });
  });

  // -----------------------------
  // PUT /vessel-visit-executions/:code
  // -----------------------------
  describe("PUT /vessel-visit-executions/:code", () => {
    it("should return 200 when vessel visit execution updated successfully", async () => {
      vesselVisitExecutionServiceMock.updateVesselVisitExecution.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ 
          code: "2025-PA-000001",
          status: "Completed"
        })
      });

      const app = createTestApp();

      const res = await request(app)
        .put("/vessel-visit-executions/2025-PA-000001")
        .send({
          status: "Completed"
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Completed");
    });

    it("should return 404 when vessel visit execution not found", async () => {
      vesselVisitExecutionServiceMock.updateVesselVisitExecution.mockResolvedValue({
        isSuccess: false,
        error: "Vessel visit execution with code '2025-PA-999999' not found."
      });

      const app = createTestApp();

      const res = await request(app)
        .put("/vessel-visit-executions/2025-PA-999999")
        .send({
          status: "Completed"
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });

    it("should return 400 when validation fails (missing status)", async () => {
      const app = createTestApp();

      const res = await request(app)
        .put("/vessel-visit-executions/2025-PA-000001")
        .send({});

      expect(res.status).toBe(400);
    });

    it("should return 400 when status is invalid", async () => {
      const app = createTestApp();

      const res = await request(app)
        .put("/vessel-visit-executions/2025-PA-000001")
        .send({
          status: "InvalidStatus"
        });

      expect(res.status).toBe(400);
    });

    it("should call service with InProgress status", async () => {
      vesselVisitExecutionServiceMock.updateVesselVisitExecution.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ code: "2025-PA-000001", status: "InProgress" })
      });

      const app = createTestApp();

      await request(app)
        .put("/vessel-visit-executions/2025-PA-000001")
        .send({
          status: "InProgress"
        });

      expect(vesselVisitExecutionServiceMock.updateVesselVisitExecution).toHaveBeenCalledWith(
        "2025-PA-000001",
        expect.objectContaining({
          status: "InProgress"
        })
      );
    });

    it("should call service with Completed status and include departureDate", async () => {
      vesselVisitExecutionServiceMock.updateVesselVisitExecution.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ code: "2025-PA-000001", status: "Completed" })
      });

      const app = createTestApp();

      await request(app)
        .put("/vessel-visit-executions/2025-PA-000001")
        .send({
          status: "Completed"
        });

      expect(vesselVisitExecutionServiceMock.updateVesselVisitExecution).toHaveBeenCalledWith(
        "2025-PA-000001",
        expect.objectContaining({
          status: "Completed",
          departureDate: expect.any(Date)
        })
      );
    });

    it("should return 400 when service returns error other than not found", async () => {
      vesselVisitExecutionServiceMock.updateVesselVisitExecution.mockResolvedValue({
        isSuccess: false,
        error: "Cannot update execution that is already completed"
      });

      const app = createTestApp();

      const res = await request(app)
        .put("/vessel-visit-executions/2025-PA-000001")
        .send({
          status: "InProgress"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Cannot update execution that is already completed");
    });

    it("should accept only InProgress or Completed as valid status values", async () => {
      const app = createTestApp();

      const validStatuses = ["InProgress", "Completed"];

      for (const status of validStatuses) {
        vesselVisitExecutionServiceMock.updateVesselVisitExecution.mockResolvedValue({
          isSuccess: true,
          getValue: () => ({ code: "2025-PA-000001", status })
        });

        const res = await request(app)
          .put("/vessel-visit-executions/2025-PA-000001")
          .send({ status });

        expect(res.status).toBe(200);
      }
    });
  });

  // -----------------------------
  // Edge Cases e Testes Adicionais
  // -----------------------------
  describe("Edge Cases", () => {
    it("GET /vessel-visit-executions → should handle service error gracefully", async () => {
      vesselVisitExecutionServiceMock.getAllVesselVisitExecutions.mockResolvedValue({
        isSuccess: false,
        error: "Database connection error"
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions");

      expect(res.status).toBe(500);
    });

    it("POST /vessel-visit-executions → should verify service is called with Date object", async () => {
      vesselVisitExecutionServiceMock.createVesselVisitExecution.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ code: "2025-PA-000010" })
      });

      const app = createTestApp();

      await request(app)
        .post("/vessel-visit-executions")
        .send({
          vesselVisitNotificationCode: "2025-PA-000005",
          arrivalDate: "2025-12-16T10:30:00Z"
        });

      const callArgs = vesselVisitExecutionServiceMock.createVesselVisitExecution.mock.calls[0];
      expect(callArgs[0].arrivalDate).toBeInstanceOf(Date);
    });

    it("PUT /vessel-visit-executions/:code → should verify correct code parameter passed", async () => {
      vesselVisitExecutionServiceMock.updateVesselVisitExecution.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ code: "TEST-CODE-123" })
      });

      const app = createTestApp();

      await request(app)
        .put("/vessel-visit-executions/TEST-CODE-123")
        .send({ status: "Completed" });

      expect(vesselVisitExecutionServiceMock.updateVesselVisitExecution).toHaveBeenCalledWith(
        "TEST-CODE-123",
        expect.any(Object)
      );
    });

    it("GET /vessel-visit-executions with filters → should not call getAllVesselVisitExecutions", async () => {
      vesselVisitExecutionServiceMock.getVesselVisitExecutions.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app)
        .get("/vessel-visit-executions")
        .query({ status: "InProgress" });

      expect(vesselVisitExecutionServiceMock.getAllVesselVisitExecutions).not.toHaveBeenCalled();
      expect(vesselVisitExecutionServiceMock.getVesselVisitExecutions).toHaveBeenCalled();
    });

    it("POST /vessel-visit-executions → should handle missing vesselVisitNotificationCode", async () => {
      const app = createTestApp();

      const res = await request(app)
        .post("/vessel-visit-executions")
        .send({
          arrivalDate: "2025-12-16T10:30:00Z"
        });

      expect(res.status).toBe(400);
    });

    it("GET /vessel-visit-executions → should verify response structure", async () => {
      vesselVisitExecutionServiceMock.getAllVesselVisitExecutions.mockResolvedValue({
        isSuccess: true,
        getValue: () => [
          {
            code: "2025-PA-000001",
            vesselVisitNotificationCode: "2025-PA-000005",
            arrivalDate: new Date("2025-12-16T10:30:00Z"),
            status: "InProgress"
          }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/vessel-visit-executions");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty("code");
      expect(res.body[0]).toHaveProperty("vesselVisitNotificationCode");
      expect(res.body[0]).toHaveProperty("status");
    });
  });
});
