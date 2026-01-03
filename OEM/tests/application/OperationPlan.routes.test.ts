import "reflect-metadata";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { Container } from "typedi";
import { errors as celebrateErrors } from "celebrate";

import operationPlanRoutes from "../../src/api/routes/OperationPlanRoute";
import OperationPlanController from "../../src/controllers/OperationPlanController";
import config from "../../config";

// Mock do middleware requireRole
jest.mock("../../src/api/middlewares/RequiredRole", () => ({
  requireRole: () => {
    return (req: any, res: any, next: any) => {
      req.userRole = 'Admin';
      next();
    };
  }
}));

jest.mock("../../config", () => ({
  controllers: {
    operationPlan: {
      name: "OperationPlanController"
    }
  },
  services: {
    operationPlan: {
      name: "operationPlanService"
    }
  },
  env: "development"
}));

// ----------------------------------------------------
// Mock do Service (SUT = Routes + Controller + Validação)
// O Controller é REAL, apenas o Service é mockado
// ----------------------------------------------------
const operationPlanServiceMock = {
  getAllOperationPlans: jest.fn(),
  getOperationPlanById: jest.fn(),
  getOperationPlansByVvn: jest.fn(),
  getOperationPlansByTargetDay: jest.fn(),
  create: jest.fn(),
  createBatch: jest.fn(),
  update: jest.fn(),
  getVvnsWithoutOperationPlan: jest.fn(),
  regenerateOperationPlansForDay: jest.fn(),
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
    config.services.operationPlan.name,
    operationPlanServiceMock
  );

  // CONTROLLER REAL (instância real do controller)
  const controllerInstance = new OperationPlanController(
    operationPlanServiceMock,
    Container.get("logger")
  );
  Container.set(
    config.controllers.operationPlan.name,
    controllerInstance
  );

  // Carregar routes reais
  operationPlanRoutes(app);

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

describe("OperationPlan Routes - Missing Plans Tests (Application Tests)", () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createTestApp();
  });

  // =========================================
  // GET /operation-plans/missing
  // =========================================
  describe("GET /operation-plans/missing", () => {
    it("should return 200 and list of VVNs without operation plans", async () => {
      // Arrange
      const mockVvns = [
        { 
          code: "2026-PA-000001", 
          vessel: { vesselName: "Vessel A" }, 
          eta: "2026-01-15T10:00:00Z",
          estimatedCargoOperations: 10
        },
        { 
          code: "2026-PA-000002", 
          vessel: { vesselName: "Vessel B" }, 
          eta: "2026-01-15T14:00:00Z",
          estimatedCargoOperations: 15
        }
      ];

      operationPlanServiceMock.getVvnsWithoutOperationPlan.mockResolvedValue({
        isSuccess: true,
        getValue: () => mockVvns
      });

      // Act
      const res = await request(app)
        .get("/operation-plans/missing")
        .expect(200);

      // Assert
      expect(res.body).toEqual(mockVvns);
      expect(operationPlanServiceMock.getVvnsWithoutOperationPlan).toHaveBeenCalledTimes(1);
    });

    it("should return 200 with empty array when all VVNs have plans", async () => {
      // Arrange
      operationPlanServiceMock.getVvnsWithoutOperationPlan.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      // Act
      const res = await request(app)
        .get("/operation-plans/missing")
        .expect(200);

      // Assert
      expect(res.body).toEqual([]);
    });

    it("should return 500 when service fails", async () => {
      // Arrange
      operationPlanServiceMock.getVvnsWithoutOperationPlan.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: "Service Error",
        errorValue: () => "Service Error"
      });

      // Act
      const res = await request(app)
        .get("/operation-plans/missing")
        .expect(500);

      // Assert
      expect(res.body).toHaveProperty("error", "Service Error");
    });

    it("should pass authorization header to service", async () => {
      // Arrange
      const authToken = "Bearer test-token";
      operationPlanServiceMock.getVvnsWithoutOperationPlan.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      // Act
      await request(app)
        .get("/operation-plans/missing")
        .set("Authorization", authToken)
        .expect(200);

      // Assert
      expect(operationPlanServiceMock.getVvnsWithoutOperationPlan).toHaveBeenCalledWith(authToken);
    });
  });

  // =========================================
  // POST /operation-plans/regenerate
  // =========================================
  describe("POST /operation-plans/regenerate", () => {
    it("should return 200 and regenerate plans successfully", async () => {
      // Arrange
      const payload = {
        targetDay: "2026-01-15",
        author: "logistics-operator-1",
        algorithm: "genetic"
      };

      const mockRegeneratedPlans = [
        { id: "plan-1", vvn: "2026-PA-000001", algorithm: "genetic" },
        { id: "plan-2", vvn: "2026-PA-000002", algorithm: "genetic" }
      ];

      operationPlanServiceMock.regenerateOperationPlansForDay.mockResolvedValue({
        isSuccess: true,
        getValue: () => mockRegeneratedPlans
      });

      // Act
      const res = await request(app)
        .post("/operation-plans/regenerate")
        .send(payload)
        .expect(200);

      // Assert
      expect(res.body).toHaveProperty("message", "Successfully regenerated 2 operation plans");
      expect(res.body).toHaveProperty("plans", mockRegeneratedPlans);
      expect(operationPlanServiceMock.regenerateOperationPlansForDay).toHaveBeenCalledWith(
        expect.any(Date),
        payload.author,
        payload.algorithm,
        undefined
      );
    });

    it("should return 400 when targetDay is missing", async () => {
      // Arrange
      const payload = {
        author: "user-123",
        algorithm: "default"
      };

      // Act
      const res = await request(app)
        .post("/operation-plans/regenerate")
        .send(payload)
        .expect(400);

      // Assert - Celebrate/Joi validation returns "Bad Request"
      expect(res.body).toHaveProperty("error", "Bad Request");
      expect(operationPlanServiceMock.regenerateOperationPlansForDay).not.toHaveBeenCalled();
    });

    it("should return 400 when author is missing", async () => {
      // Arrange
      const payload = {
        targetDay: "2026-01-15",
        algorithm: "improved"
      };

      // Act
      const res = await request(app)
        .post("/operation-plans/regenerate")
        .send(payload)
        .expect(400);

      // Assert - Celebrate/Joi validation returns "Bad Request"
      expect(res.body).toHaveProperty("error", "Bad Request");
    });

    it("should return 400 when algorithm is missing", async () => {
      // Arrange
      const payload = {
        targetDay: "2026-01-15",
        author: "user-123"
      };

      // Act
      const res = await request(app)
        .post("/operation-plans/regenerate")
        .send(payload)
        .expect(400);

      // Assert - Celebrate/Joi validation returns "Bad Request"
      expect(res.body).toHaveProperty("error", "Bad Request");
    });

    it("should return 500 when service fails", async () => {
      // Arrange
      const payload = {
        targetDay: "2026-01-15",
        author: "user-123",
        algorithm: "automatic"
      };

      operationPlanServiceMock.regenerateOperationPlansForDay.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: "Failed to regenerate plans",
        errorValue: () => "Failed to regenerate plans"
      });

      // Act
      const res = await request(app)
        .post("/operation-plans/regenerate")
        .send(payload)
        .expect(500);

      // Assert
      expect(res.body).toHaveProperty("error", "Failed to regenerate plans");
    });

    it("should parse targetDay as Date correctly", async () => {
      // Arrange
      const payload = {
        targetDay: "2026-01-15T10:00:00.000Z",
        author: "user-123",
        algorithm: "default"
      };

      operationPlanServiceMock.regenerateOperationPlansForDay.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      // Act
      await request(app)
        .post("/operation-plans/regenerate")
        .send(payload)
        .expect(200);

      // Assert
      const callArgs = operationPlanServiceMock.regenerateOperationPlansForDay.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Date);
      expect(callArgs[0].toISOString()).toBe("2026-01-15T10:00:00.000Z");
    });

    it("should pass authorization header to service", async () => {
      // Arrange
      const payload = {
        targetDay: "2026-01-15",
        author: "user-123",
        algorithm: "genetic"
      };
      const authToken = "Bearer test-token";

      operationPlanServiceMock.regenerateOperationPlansForDay.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      // Act
      await request(app)
        .post("/operation-plans/regenerate")
        .set("Authorization", authToken)
        .send(payload)
        .expect(200);

      // Assert
      const callArgs = operationPlanServiceMock.regenerateOperationPlansForDay.mock.calls[0];
      expect(callArgs[3]).toBe(authToken);
    });

    it("should handle different algorithm values", async () => {
      // Arrange
      const algorithms = ["automatic", "default", "improved", "genetic"];
      
      operationPlanServiceMock.regenerateOperationPlansForDay.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      // Act & Assert
      for (const algorithm of algorithms) {
        const payload = {
          targetDay: "2026-01-15",
          author: "user-123",
          algorithm: algorithm
        };

        await request(app)
          .post("/operation-plans/regenerate")
          .send(payload)
          .expect(200);

        expect(operationPlanServiceMock.regenerateOperationPlansForDay).toHaveBeenCalledWith(
          expect.any(Date),
          "user-123",
          algorithm,
          undefined
        );
      }
    });

    it("should return success message with count", async () => {
      // Arrange
      const payload = {
        targetDay: "2026-01-15",
        author: "user-123",
        algorithm: "improved"
      };

      const mockPlans = [
        { id: "1" },
        { id: "2" },
        { id: "3" }
      ];

      operationPlanServiceMock.regenerateOperationPlansForDay.mockResolvedValue({
        isSuccess: true,
        getValue: () => mockPlans
      });

      // Act
      const res = await request(app)
        .post("/operation-plans/regenerate")
        .send(payload)
        .expect(200);

      // Assert
      expect(res.body.message).toBe("Successfully regenerated 3 operation plans");
      expect(res.body.plans).toHaveLength(3);
    });
  });
});
