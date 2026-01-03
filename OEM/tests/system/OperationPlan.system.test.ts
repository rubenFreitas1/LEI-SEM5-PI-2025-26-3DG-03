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

// Mock do VesselVisitNotificationClient para evitar chamadas HTTP externas
jest.mock("../../src/services/clients/VesselVisitNotificationClient", () => {
  return jest.fn().mockImplementation(() => ({
    getAll: jest.fn().mockResolvedValue([
      {
        code: "2026-PA-000001",
        vessel: { vesselName: "Test Vessel A" },
        eta: "2026-01-15T10:00:00Z",
        etd: "2026-01-15T18:00:00Z",
        visitStatus: "Approved",
        cargoManifests: []
      },
      {
        code: "2026-PA-000002",
        vessel: { vesselName: "Test Vessel B" },
        eta: "2026-01-15T14:00:00Z",
        etd: "2026-01-15T22:00:00Z",
        visitStatus: "Approved",
        cargoManifests: []
      },
      {
        code: "2026-PA-000003",
        vessel: { vesselName: "Test Vessel C" },
        eta: "2026-01-16T09:00:00Z",
        etd: "2026-01-16T17:00:00Z",
        visitStatus: "Approved",
        cargoManifests: []
      }
    ]),
    getByCode: jest.fn().mockImplementation((code: string) => {
      const mockVvns: any = {
        "2026-PA-000001": {
          code: "2026-PA-000001",
          vessel: { vesselName: "Test Vessel A" },
          eta: "2026-01-15T10:00:00Z",
          etd: "2026-01-15T18:00:00Z",
          visitStatus: "Approved"
        },
        "2026-PA-000002": {
          code: "2026-PA-000002",
          vessel: { vesselName: "Test Vessel B" },
          eta: "2026-01-15T14:00:00Z",
          etd: "2026-01-15T22:00:00Z",
          visitStatus: "Approved"
        }
      };
      return Promise.resolve(mockVvns[code]);
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

describe("OperationPlan – System Tests (MongoDB Atlas)", () => {
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
  // GET /operation-plans/missing
  // =========================================
  describe("GET /operation-plans/missing", () => {
    it("should return VVNs without operation plans from real database", async () => {
      // Act - Neste momento não há operation plans, então todos os VVNs devem ser retornados
      const res = await request(app)
        .get("/api/operation-plans/missing")
        .expect(200);

      // Assert
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3); // Pelo menos os 3 VVNs mockados
      expect(res.body[0]).toHaveProperty("code");
      expect(res.body[0]).toHaveProperty("vessel");
    });

    it("should return empty array when all VVNs have operation plans", async () => {
      // Arrange - Criar operation plans para os VVNs mockados (apenas 2 dos 3 são retornados pelo mock)
      const createPayload = {
        vvns: ["2026-PA-000001", "2026-PA-000002"],
        assignedCranes: [["CRANE-1"], ["CRANE-2"]],
        arrivalTimes: ["2026-01-15T10:00:00Z", "2026-01-15T14:00:00Z"],
        departureTimes: ["2026-01-15T18:00:00Z", "2026-01-15T22:00:00Z"],
        targetDays: ["2026-01-15", "2026-01-15"],
        author: "test-user",
        algorithm: "automatic"
      };

      const createRes = await request(app)
        .post("/api/operation-plans")
        .send(createPayload)
        .expect(201);

      // Verificar que os plans foram criados
      expect(createRes.body.length).toBe(2);

      // Act
      const res = await request(app)
        .get("/api/operation-plans/missing")
        .expect(200);

      // Assert - Deve retornar apenas o VVN-000003 que não tem plan
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].code).toBe("2026-PA-000003");
    });

    it("should return only VVNs without plans when some have plans", async () => {
      // Arrange - Criar operation plan apenas para um VVN
      const createPayload = {
        vvns: ["2026-PA-000001"],
        assignedCranes: [["CRANE-1"]],
        arrivalTimes: ["2026-01-15T10:00:00Z"],
        departureTimes: ["2026-01-15T18:00:00Z"],
        targetDays: ["2026-01-15"],
        author: "test-user",
        algorithm: "default"
      };

      await request(app)
        .post("/api/operation-plans")
        .send(createPayload)
        .expect(201);

      // Act
      const res = await request(app)
        .get("/api/operation-plans/missing")
        .expect(200);

      // Assert
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2); // VVN-000002 and VVN-000003
      expect(res.body.find((v: any) => v.code === "2026-PA-000001")).toBeUndefined();
      expect(res.body.find((v: any) => v.code === "2026-PA-000002")).toBeDefined();
      expect(res.body.find((v: any) => v.code === "2026-PA-000003")).toBeDefined();
    });
  });

  // =========================================
  // POST /operation-plans/regenerate
  // =========================================
  describe("POST /operation-plans/regenerate", () => {
    it("should regenerate all plans for a specific day in real database", async () => {
      // Arrange - Criar alguns operation plans existentes
      const createPayload = {
        vvns: ["2026-PA-000001", "2026-PA-000002"],
        assignedCranes: [["CRANE-1"], ["CRANE-2"]],
        arrivalTimes: ["2026-01-15T10:00:00Z", "2026-01-15T14:00:00Z"],
        departureTimes: ["2026-01-15T18:00:00Z", "2026-01-15T22:00:00Z"],
        targetDays: ["2026-01-15", "2026-01-15"],
        author: "initial-user",
        algorithm: "default"
      };

      const createRes = await request(app)
        .post("/api/operation-plans")
        .send(createPayload)
        .expect(201);

      expect(createRes.body).toHaveLength(2);

      // Act - Regenerar planos para o mesmo dia com algoritmo diferente
      const regeneratePayload = {
        targetDay: "2026-01-15",
        author: "regenerate-user",
        algorithm: "genetic"
      };

      const res = await request(app)
        .post("/api/operation-plans/regenerate")
        .send(regeneratePayload)
        .expect(200);

      // Assert
      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Successfully regenerated");
      expect(res.body).toHaveProperty("plans");
      expect(Array.isArray(res.body.plans)).toBe(true);
      expect(res.body.plans.length).toBe(2);

      // Verificar que os novos planos têm o algoritmo correto
      res.body.plans.forEach((plan: any) => {
        expect(plan.algorithm).toBe("genetic");
        expect(plan.author).toBe("regenerate-user");
      });
    });

    it("should delete old plans and create new ones with new metadata", async () => {
      // Arrange - Criar plan inicial
      const createPayload = {
        vvns: ["2026-PA-000001"],
        assignedCranes: [["CRANE-1"]],
        arrivalTimes: ["2026-01-15T10:00:00Z"],
        departureTimes: ["2026-01-15T18:00:00Z"],
        targetDays: ["2026-01-15"],
        author: "old-author",
        algorithm: "default"
      };

      const createRes = await request(app)
        .post("/api/operation-plans")
        .send(createPayload)
        .expect(201);

      const oldPlanId = createRes.body[0].id;

      // Act - Regenerar
      const regeneratePayload = {
        targetDay: "2026-01-15",
        author: "new-author",
        algorithm: "improved"
      };

      await request(app)
        .post("/api/operation-plans/regenerate")
        .send(regeneratePayload)
        .expect(200);

      // Assert - Verificar que o plan antigo não existe mais
      const oldPlanRes = await request(app)
        .get(`/api/operation-plans/${oldPlanId}`)
        .expect(404);

      // Verificar que existem novos plans
      const allPlansRes = await request(app)
        .get("/api/operation-plans")
        .expect(200);

      const plansForDate = allPlansRes.body.filter((p: any) => 
        p.author === "new-author" && p.algorithm === "improved"
      );

      expect(plansForDate.length).toBeGreaterThan(0);
    });

    it("should only regenerate plans for the specified day", async () => {
      // Arrange - Criar plans para diferentes dias
      const createPayload1 = {
        vvns: ["2026-PA-000001", "2026-PA-000002"],
        assignedCranes: [["CRANE-1"], ["CRANE-2"]],
        arrivalTimes: ["2026-01-15T10:00:00Z", "2026-01-15T14:00:00Z"],
        departureTimes: ["2026-01-15T18:00:00Z", "2026-01-15T22:00:00Z"],
        targetDays: ["2026-01-15", "2026-01-15"],
        author: "user-1",
        algorithm: "default"
      };

      const createPayload2 = {
        vvns: ["2026-PA-000003"],
        assignedCranes: [["CRANE-3"]],
        arrivalTimes: ["2026-01-16T09:00:00Z"],
        departureTimes: ["2026-01-16T17:00:00Z"],
        targetDays: ["2026-01-16"],
        author: "user-1",
        algorithm: "default"
      };

      await request(app).post("/api/operation-plans").send(createPayload1).expect(201);
      const day2Result = await request(app).post("/api/operation-plans").send(createPayload2).expect(201);

      // Act - Regenerar apenas dia 15
      const regeneratePayload = {
        targetDay: "2026-01-15",
        author: "regenerate-user",
        algorithm: "genetic"
      };

      await request(app)
        .post("/api/operation-plans/regenerate")
        .send(regeneratePayload)
        .expect(200);

      // Assert - Plan do dia 16 deve continuar intacto
      const allPlansRes = await request(app)
        .get("/api/operation-plans")
        .expect(200);

      const day16Plans = allPlansRes.body.filter((p: any) => 
        p.author === "user-1" && p.algorithm === "default"
      );

      expect(day16Plans.length).toBe(1);
      expect(day16Plans[0].vvn).toBe("2026-PA-000003");
    });

    it("should return empty array when no VVNs exist for the day", async () => {
      // Act - Tentar regenerar para um dia sem VVNs
      const regeneratePayload = {
        targetDay: "2026-12-31", // Dia sem VVNs
        author: "test-user",
        algorithm: "automatic"
      };

      const res = await request(app)
        .post("/api/operation-plans/regenerate")
        .send(regeneratePayload)
        .expect(200);

      // Assert
      expect(res.body.plans).toEqual([]);
      expect(res.body.message).toContain("Successfully regenerated 0");
    });

    it("should validate required fields", async () => {
      // Act & Assert - Sem targetDay
      await request(app)
        .post("/api/operation-plans/regenerate")
        .send({ author: "user", algorithm: "default" })
        .expect(400);

      // Sem author
      await request(app)
        .post("/api/operation-plans/regenerate")
        .send({ targetDay: "2026-01-15", algorithm: "default" })
        .expect(400);

      // Sem algorithm
      await request(app)
        .post("/api/operation-plans/regenerate")
        .send({ targetDay: "2026-01-15", author: "user" })
        .expect(400);
    });

    it("should handle multiple regenerations for the same day", async () => {
      // Arrange - Criar plans iniciais
      const createPayload = {
        vvns: ["2026-PA-000001"],
        assignedCranes: [["CRANE-1"]],
        arrivalTimes: ["2026-01-15T10:00:00Z"],
        departureTimes: ["2026-01-15T18:00:00Z"],
        targetDays: ["2026-01-15"],
        author: "initial",
        algorithm: "default"
      };

      await request(app).post("/api/operation-plans").send(createPayload).expect(201);

      // Act - Regenerar múltiplas vezes
      const regenerate1 = {
        targetDay: "2026-01-15",
        author: "user-1",
        algorithm: "improved"
      };

      await request(app)
        .post("/api/operation-plans/regenerate")
        .send(regenerate1)
        .expect(200);

      const regenerate2 = {
        targetDay: "2026-01-15",
        author: "user-2",
        algorithm: "genetic"
      };

      const res2 = await request(app)
        .post("/api/operation-plans/regenerate")
        .send(regenerate2)
        .expect(200);

      // Assert - Última regeneração deve prevalecer
      const allPlansRes = await request(app)
        .get("/api/operation-plans")
        .expect(200);

      const activePlans = allPlansRes.body.filter((p: any) => 
        p.algorithm === "genetic" && p.author === "user-2"
      );

      expect(activePlans.length).toBeGreaterThan(0);

      // Não devem existir plans com algoritmos anteriores para este dia
      const oldPlans = allPlansRes.body.filter((p: any) => 
        (p.algorithm === "default" && p.author === "initial") ||
        (p.algorithm === "improved" && p.author === "user-1")
      );

      expect(oldPlans.length).toBe(0);
    });
  });
});
