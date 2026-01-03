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
      // Extract the last 3 digits from the code (e.g., "001" from "VVE_SYS001")
      const lastDigits = code.slice(-3).padStart(6, '0');
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
 * - NÃO usam mocks (exceto o middleware de autorização)
 * - Validam integração real entre todas as camadas
 */

describe("ComplementaryTask – System Tests (MongoDB Atlas)", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createSystemApp();
  }, 60000);

  beforeEach(async () => {
    await clearDatabase();
  }, 30000);

  afterAll(async () => {
    await closeDatabase();
  }, 30000);

  // =========================================
  // HELPER: Create Operation Plan
  // =========================================
  const createOperationPlan = async (vvnCode: string) => {
    const now = new Date();
    const response = await request(app)
      .post("/api/operation-plans")
      .send({
        vvns: [vvnCode],
        assignedCranes: [[]],
        arrivalTimes: [now.toISOString()],
        departureTimes: [new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()],
        targetDays: [now.toISOString()],
        author: "test-user",
        algorithm: "Manual"
      });
    
    return response;
  };

  // =========================================
  // HELPER: Create Vessel Visit Execution
  // =========================================
  const createVesselVisitExecution = async (code: string) => {
    // First create the OperationPlan
    await createOperationPlan(code);
    
    const response = await request(app)
      .post("/api/vessel-visit-executions")
      .send({
        vesselVisitNotificationCode: code,
        arrivalDate: new Date().toISOString()
      });
    
    return response;
  };

  // =========================================
  // TESTES DE CRIAÇÃO (POST)
  // =========================================
  describe("POST /complementary-tasks", () => {
    it("should create and retrieve a complementary task from real database", async () => {
      const vveRes = await createVesselVisitExecution("VVE_SYS001");
      expect(vveRes.status).toBe(201);
      const vveCode = vveRes.body.code;

      const payload = {
        category: "Maintenance",
        responsibleTeam: "Engineering Team",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false,
        description: "System test task"
      };

      const createRes = await request(app)
        .post("/api/complementary-tasks")
        .send(payload);
      
      expect(createRes.status).toBe(201);
      expect(createRes.body.category).toBe("Maintenance");
      expect(createRes.body.status).toBe("Ongoing");

      // Verificar que foi realmente salvo na BD
      const taskId = createRes.body.id;
      const getRes = await request(app).get(`/api/complementary-tasks/${taskId}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.responsibleTeam).toBe("Engineering Team");
    });

    it("should fail when vessel visit execution does not exist", async () => {
      const payload = {
        category: "Maintenance",
        responsibleTeam: "Engineering Team",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: "NONEXISTENT",
        suspendsOperations: false
      };

      const res = await request(app)
        .post("/api/complementary-tasks")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("not found");
    });

    it("should create task with optional fields", async () => {
      const vveRes = await createVesselVisitExecution("VVE_SYS002");
      const vveCode = vveRes.body.code;

      const payload = {
        category: "Inspection",
        responsibleTeam: "Safety Team",
        startTime: "2025-01-01T10:00:00Z",
        endTime: "2025-01-01T12:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: true,
        description: "Detailed inspection task"
      };

      const createRes = await request(app)
        .post("/api/complementary-tasks")
        .send(payload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.endTime).toBeDefined();
      expect(createRes.body.description).toBe("Detailed inspection task");
    });

    it("should fail with missing required fields", async () => {
      const res = await request(app)
        .post("/api/complementary-tasks")
        .send({
          category: "Maintenance",
          responsibleTeam: "Team A"
          // Missing startTime, vesselVisitExecutionCode, suspendsOperations
        });

      expect(res.status).toBe(400);
    });
  });

  // =========================================
  // TESTES DE ATUALIZAÇÃO (PUT)
  // =========================================
  describe("PUT /complementary-tasks/:id", () => {
    it("should update task status to Completed in database", async () => {
      const vveRes = await createVesselVisitExecution("VVE_SYS003");
      const vveCode = vveRes.body.code;

      const createRes = await request(app).post("/api/complementary-tasks").send({
        category: "Maintenance",
        responsibleTeam: "Team A",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false
      });

      const taskId = createRes.body.id;

      const updateRes = await request(app)
        .put(`/api/complementary-tasks/${taskId}`)
        .send({
          status: "Completed",
          endTime: "2025-01-01T14:00:00Z"
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.status).toBe("Completed");
      expect(updateRes.body.endTime).toBeDefined();

      // Verify in database
      const getRes = await request(app).get(`/api/complementary-tasks/${taskId}`);
      expect(getRes.body.status).toBe("Completed");
    });

    it("should update only endTime", async () => {
      const vveRes = await createVesselVisitExecution("VVE_SYS004");
      const vveCode = vveRes.body.code;

      const createRes = await request(app).post("/api/complementary-tasks").send({
        category: "Inspection",
        responsibleTeam: "Team B",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false
      });

      const taskId = createRes.body.id;

      const updateRes = await request(app)
        .put(`/api/complementary-tasks/${taskId}`)
        .send({
          endTime: "2025-01-01T15:00:00Z"
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.endTime).toBe("2025-01-01T15:00:00.000Z");
      expect(updateRes.body.status).toBe("Ongoing");
    });

    it("should fail when updating non-existent task", async () => {
      const res = await request(app)
        .put("/api/complementary-tasks/507f1f77bcf86cd799439011")
        .send({
          status: "Completed"
        });

      expect(res.status).toBe(404);
    });
  });

  // =========================================
  // TESTES DE LEITURA (GET)
  // =========================================
  describe("GET /complementary-tasks", () => {
    it("should return all tasks from database", async () => {
      const vveRes = await createVesselVisitExecution("VVE_SYS005");
      const vveCode = vveRes.body.code;

      await request(app).post("/api/complementary-tasks").send({
        category: "Maintenance",
        responsibleTeam: "Team A",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false
      });

      await request(app).post("/api/complementary-tasks").send({
        category: "Inspection",
        responsibleTeam: "Team B",
        startTime: "2025-01-01T11:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: true
      });

      const res = await request(app).get("/api/complementary-tasks");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("should return empty array when no tasks exist", async () => {
      const res = await request(app).get("/api/complementary-tasks");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("GET /complementary-tasks/vessel-visit/:code", () => {
    it("should return tasks for specific vessel visit", async () => {
      const vve1Res = await createVesselVisitExecution("VVE_SYS006");
      const vve1Code = vve1Res.body.code;
      const vve2Res = await createVesselVisitExecution("VVE_SYS007");
      const vve2Code = vve2Res.body.code;

      const create1 = await request(app).post("/api/complementary-tasks").send({
        category: "Maintenance",
        responsibleTeam: "Team A",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: vve1Code,
        suspendsOperations: false
      });
      expect(create1.status).toBe(201);

      const create2 = await request(app).post("/api/complementary-tasks").send({
        category: "Inspection",
        responsibleTeam: "Team B",
        startTime: "2025-01-01T11:00:00Z",
        vesselVisitExecutionCode: vve1Code,
        suspendsOperations: true
      });
      expect(create2.status).toBe(201);

      const create3 = await request(app).post("/api/complementary-tasks").send({
        category: "Repair",
        responsibleTeam: "Team C",
        startTime: "2025-01-01T12:00:00Z",
        vesselVisitExecutionCode: vve2Code,
        suspendsOperations: false
      });
      expect(create3.status).toBe(201);

      const res = await request(app).get(`/api/complementary-tasks/vessel-visit/${vve1Code}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      res.body.forEach((task: any) => {
        expect(task.vesselVisitExecutionCode).toBe(vve1Code);
      });
    });
  });

  describe("GET /complementary-tasks/status/:status", () => {
    it("should return tasks with specific status", async () => {
      const vveRes = await createVesselVisitExecution("VVE_SYS008");
      const vveCode = vveRes.body.code;

      const task1Res = await request(app).post("/api/complementary-tasks").send({
        category: "Maintenance",
        responsibleTeam: "Team A",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false
      });

      await request(app).post("/api/complementary-tasks").send({
        category: "Inspection",
        responsibleTeam: "Team B",
        startTime: "2025-01-01T11:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false
      });

      // Complete one task
      await request(app)
        .put(`/api/complementary-tasks/${task1Res.body.id}`)
        .send({
          status: "Completed",
          endTime: "2025-01-01T12:00:00Z"
        });

      const ongoingRes = await request(app).get("/api/complementary-tasks/status/Ongoing");
      expect(ongoingRes.status).toBe(200);
      expect(ongoingRes.body).toHaveLength(1);

      const completedRes = await request(app).get("/api/complementary-tasks/status/Completed");
      expect(completedRes.status).toBe(200);
      expect(completedRes.body).toHaveLength(1);
    });
  });

  describe("GET /complementary-tasks/date-range", () => {
    it("should return tasks within date range", async () => {
      const vveRes = await createVesselVisitExecution("VVE_SYS009");
      const vveCode = vveRes.body.code;

      await request(app).post("/api/complementary-tasks").send({
        category: "Maintenance",
        responsibleTeam: "Team A",
        startTime: "2025-01-05T10:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false
      });

      await request(app).post("/api/complementary-tasks").send({
        category: "Inspection",
        responsibleTeam: "Team B",
        startTime: "2025-01-15T11:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false
      });

      await request(app).post("/api/complementary-tasks").send({
        category: "Repair",
        responsibleTeam: "Team C",
        startTime: "2025-02-05T12:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false
      });

      const res = await request(app)
        .get("/api/complementary-tasks/date-range")
        .query({
          startDate: "2025-01-01",
          endDate: "2025-01-31"
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe("GET /complementary-tasks/impacting-operations", () => {
    it("should return only ongoing tasks that suspend operations", async () => {
      const vveRes = await createVesselVisitExecution("VVE_SYS010");
      const vveCode = vveRes.body.code;

      await request(app).post("/api/complementary-tasks").send({
        category: "Emergency Repair",
        responsibleTeam: "Team A",
        startTime: "2025-01-01T10:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: true
      });

      await request(app).post("/api/complementary-tasks").send({
        category: "Maintenance",
        responsibleTeam: "Team B",
        startTime: "2025-01-01T11:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: false
      });

      const task3Res = await request(app).post("/api/complementary-tasks").send({
        category: "Critical Inspection",
        responsibleTeam: "Team C",
        startTime: "2025-01-01T12:00:00Z",
        vesselVisitExecutionCode: vveCode,
        suspendsOperations: true
      });

      // Complete one impacting task
      await request(app)
        .put(`/api/complementary-tasks/${task3Res.body.id}`)
        .send({
          status: "Completed",
          endTime: "2025-01-01T13:00:00Z"
        });

      const res = await request(app).get("/api/complementary-tasks/impacting-operations");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].suspendsOperations).toBe(true);
      expect(res.body[0].status).toBe("Ongoing");
    });
  });
});
