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

describe("ComplementaryTaskCategory – System Tests (MongoDB Atlas)", () => {
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

  // =========================================
  // TESTES DE CRIAÇÃO (POST)
  // =========================================
  describe("POST /complementary-task-categories", () => {
    it("should create and retrieve a complementary task category from real database", async () => {
      const payload = {
        code: "SYS1",
        name: "System Test Category",
        description: "Created in system test",
        duration: "PT2H"
      };

      const createRes = await request(app)
        .post("/api/complementary-task-categories")
        .send(payload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.code).toBe("SYS1");
      expect(createRes.body.name).toBe("System Test Category");

      // Verificar que foi realmente salvo na BD
      const getRes = await request(app).get("/api/complementary-task-categories/code/SYS1");

      expect(getRes.status).toBe(200);
      expect(getRes.body.name).toBe("System Test Category");
    });

    it("should fail when creating duplicate code in database", async () => {
      const payload = {
        code: "DUP001",
        name: "Duplicate Test",
        description: "Testing duplicates",
        duration: "PT1H"
      };

      // Primeira criação
      await request(app).post("/api/complementary-task-categories").send(payload);

      // Segunda criação com mesmo código deve falhar
      const res = await request(app).post("/api/complementary-task-categories").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already exists");
    });

    it("should create complementary task category with parent relationship in database", async () => {
      // Criar parent
      await request(app).post("/api/complementary-task-categories").send({
        code: "PARENT_SYS",
        name: "Parent Category",
        description: "Parent category",
        duration: "PT3H"
      });

      // Criar child
      const childRes = await request(app).post("/api/complementary-task-categories").send({
        code: "CHILD_SYS",
        name: "Child Category",
        description: "Child category",
        duration: "PT1H",
        parentComplementaryTaskCategoryCode: "PARENT_SYS"
      });

      expect(childRes.status).toBe(201);
      expect(childRes.body.parentComplementaryTaskCategoryCode).toBe("PARENT_SYS");
    });

    it("should fail when parent does not exist in database", async () => {
      const res = await request(app).post("/api/complementary-task-categories").send({
        code: "ORPHAN",
        name: "Orphan Category",
        description: "No parent category",
        duration: "PT2H",
        parentComplementaryTaskCategoryCode: "NONEXISTENT"
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("not found");
    });

    it("should create complementary task category without duration", async () => {
      const payload = {
        code: "NODUR",
        name: "No Duration",
        description: "Category without duration",
        duration: null
      };

      const createRes = await request(app)
        .post("/api/complementary-task-categories")
        .send(payload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.duration).toBeNull();
    });
  });

  // =========================================
  // TESTES DE LEITURA (GET)
  // =========================================
  describe("GET /complementary-task-categories", () => {
    it("should return empty array when database is empty", async () => {
      const res = await request(app).get("/api/complementary-task-categories");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all complementary task categories from database", async () => {
      // Criar várias categorias
      await request(app).post("/api/complementary-task-categories").send({
        code: "CAT1",
        name: "Category One",
        description: "First category",
        duration: "PT1H"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "CAT2",
        name: "Category Two",
        description: "Second category",
        duration: "PT2H"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "CAT3",
        name: "Category Three",
        description: "Third category",
        duration: "PT3H"
      });

      // Buscar todos
      const res = await request(app).get("/api/complementary-task-categories");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      const codes = res.body.map((c: any) => c.code);
      expect(codes).toContain("CAT1");
      expect(codes).toContain("CAT2");
      expect(codes).toContain("CAT3");
    });
  });

  describe("GET /complementary-task-categories/code/:code", () => {
    it("should find complementary task category by code in database", async () => {
      await request(app).post("/api/complementary-task-categories").send({
        code: "FIND_ME",
        name: "Findable Category",
        description: "Can be found",
        duration: "PT4H"
      });

      const res = await request(app).get("/api/complementary-task-categories/code/FIND_ME");

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("FIND_ME");
      expect(res.body.name).toBe("Findable Category");
    });

    it("should return 404 when code does not exist in database", async () => {
      const res = await request(app).get("/api/complementary-task-categories/code/GHOST");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /complementary-task-categories/name/:name", () => {
    it("should find complementary task category by name in database", async () => {
      await request(app).post("/api/complementary-task-categories").send({
        code: "NAME_TEST",
        name: "Unique Name",
        description: "Testing name search",
        duration: "PT2H"
      });

      const res = await request(app).get("/api/complementary-task-categories/name/Unique Name");

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("NAME_TEST");
      expect(res.body.name).toBe("Unique Name");
    });

    it("should return 404 when name does not exist in database", async () => {
      const res = await request(app).get("/api/complementary-task-categories/name/Nonexistent");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /complementary-task-categories/hasParent/:value", () => {
    beforeEach(async () => {
      // Criar parent
      await request(app).post("/api/complementary-task-categories").send({
        code: "ROOT1",
        name: "Root Category 1",
        description: "Root category",
        duration: "PT5H"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "ROOT2",
        name: "Root Category 2",
        description: "Another root",
        duration: "PT4H"
      });

      // Criar children
      await request(app).post("/api/complementary-task-categories").send({
        code: "CHILD1",
        name: "Child Category 1",
        description: "Has parent",
        duration: "PT2H",
        parentComplementaryTaskCategoryCode: "ROOT1"
      });
    });

    it("should return only categories with parent from database", async () => {
      const res = await request(app).get("/api/complementary-task-categories/hasParent/true");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].code).toBe("CHILD1");
    });

    it("should return only categories without parent from database", async () => {
      const res = await request(app).get("/api/complementary-task-categories/hasParent/false");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      const codes = res.body.map((c: any) => c.code);
      expect(codes).toContain("ROOT1");
      expect(codes).toContain("ROOT2");
    });
  });

  describe("GET /complementary-task-categories/parent/:parentCode", () => {
    beforeEach(async () => {
      // Criar parent
      await request(app).post("/api/complementary-task-categories").send({
        code: "MAIN",
        name: "Main Category",
        description: "Main category",
        duration: "PT6H"
      });

      // Criar children
      await request(app).post("/api/complementary-task-categories").send({
        code: "SUB1",
        name: "Subcategory 1",
        description: "First subcategory",
        duration: "PT2H",
        parentComplementaryTaskCategoryCode: "MAIN"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "SUB2",
        name: "Subcategory 2",
        description: "Second subcategory",
        duration: "PT3H",
        parentComplementaryTaskCategoryCode: "MAIN"
      });
    });

    it("should return children of specific parent from database", async () => {
      const res = await request(app).get("/api/complementary-task-categories/parent/MAIN");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      const codes = res.body.map((c: any) => c.code);
      expect(codes).toContain("SUB1");
      expect(codes).toContain("SUB2");
    });

    it("should return empty array when parent has no children", async () => {
      await request(app).post("/api/complementary-task-categories").send({
        code: "LONELY",
        name: "Lonely Category",
        description: "No children",
        duration: "PT1H"
      });

      const res = await request(app).get("/api/complementary-task-categories/parent/LONELY");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  // =========================================
  // TESTES DE ATUALIZAÇÃO (PUT)
  // =========================================
  describe("PUT /complementary-task-categories/update/:code", () => {
    it("should update existing complementary task category in database", async () => {
      // Criar categoria
      await request(app).post("/api/complementary-task-categories").send({
        code: "UPD001",
        name: "Original Name",
        description: "Original description",
        duration: "PT2H"
      });

      // Atualizar
      const res = await request(app)
        .put("/api/complementary-task-categories/update/UPD001")
        .send({
          code: "UPD001",
          name: "Updated Name",
          description: "Updated description",
          duration: "PT5H"
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
      expect(res.body.duration).toBe("PT5H");

      // Verificar persistência na BD
      const getRes = await request(app).get("/api/complementary-task-categories/code/UPD001");
      expect(getRes.body.name).toBe("Updated Name");
      expect(getRes.body.duration).toBe("PT5H");
    });

    it("should return 404 when updating non-existing complementary task category", async () => {
      const res = await request(app)
        .put("/api/complementary-task-categories/update/NOPE")
        .send({
          code: "NOPE",
          name: "X",
          description: "Y Z",
          duration: "PT1H"
        });

      expect(res.status).toBe(404);
    });

    it("should fail when trying to change code in database", async () => {
      await request(app).post("/api/complementary-task-categories").send({
        code: "ORIG",
        name: "Original",
        description: "Original description",
        duration: "PT3H"
      });

      const res = await request(app)
        .put("/api/complementary-task-categories/update/ORIG")
        .send({
          code: "CHANGED",
          name: "Changed",
          description: "Changed description",
          duration: "PT3H"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("cannot be changed");
    });

    it("should fail when name conflicts with existing category in database", async () => {
      // Criar duas categorias
      await request(app).post("/api/complementary-task-categories").send({
        code: "FIRST",
        name: "First Name",
        description: "First description",
        duration: "PT2H"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "SECOND",
        name: "Second Name",
        description: "Second description",
        duration: "PT3H"
      });

      // Tentar atualizar SECOND com nome de FIRST
      const res = await request(app)
        .put("/api/complementary-task-categories/update/SECOND")
        .send({
          code: "SECOND",
          name: "First Name", // conflito!
          description: "Updated description",
          duration: "PT3H"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already in use");
    });
  });

  // =========================================
  // TESTES DE INTEGRAÇÃO COMPLEXOS
  // =========================================
  describe("Complex Integration Scenarios", () => {
    it("should handle complete CRUD workflow with real database", async () => {
      // 1. CREATE
      const createRes = await request(app).post("/api/complementary-task-categories").send({
        code: "CRUD_TEST",
        name: "CRUD Workflow",
        description: "Testing complete CRUD",
        duration: "PT2H"
      });
      expect(createRes.status).toBe(201);

      // 2. READ
      const readRes = await request(app).get("/api/complementary-task-categories/code/CRUD_TEST");
      expect(readRes.status).toBe(200);
      expect(readRes.body.name).toBe("CRUD Workflow");

      // 3. UPDATE
      const updateRes = await request(app)
        .put("/api/complementary-task-categories/update/CRUD_TEST")
        .send({
          code: "CRUD_TEST",
          name: "Updated CRUD",
          description: "Updated workflow",
          duration: "PT4H"
        });
      expect(updateRes.status).toBe(200);

      // 4. VERIFY UPDATE
      const verifyRes = await request(app).get("/api/complementary-task-categories/code/CRUD_TEST");
      expect(verifyRes.body.name).toBe("Updated CRUD");
      expect(verifyRes.body.duration).toBe("PT4H");
    });

    it("should handle parent-child hierarchy in real database", async () => {
      // Criar hierarquia
      await request(app).post("/api/complementary-task-categories").send({
        code: "MAINT",
        name: "Maintenance",
        description: "General maintenance",
        duration: "PT8H"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "MAINT_ELEC",
        name: "Electrical Maintenance",
        description: "Electrical maintenance tasks",
        duration: "PT4H",
        parentComplementaryTaskCategoryCode: "MAINT"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "MAINT_MECH",
        name: "Mechanical Maintenance",
        description: "Mechanical maintenance tasks",
        duration: "PT5H",
        parentComplementaryTaskCategoryCode: "MAINT"
      });

      // Verificar children de MAINT
      const children = await request(app).get("/api/complementary-task-categories/parent/MAINT");
      expect(children.body).toHaveLength(2);
      const childCodes = children.body.map((c: any) => c.code);
      expect(childCodes).toContain("MAINT_ELEC");
      expect(childCodes).toContain("MAINT_MECH");
    });

    it("should persist data between requests (real database test)", async () => {
      // Criar múltiplas categorias em requests separados
      await request(app).post("/api/complementary-task-categories").send({
        code: "PERSIST1",
        name: "Persist 1",
        description: "First category",
        duration: "PT1H"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "PERSIST2",
        name: "Persist 2",
        description: "Second category",
        duration: "PT2H"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "PERSIST3",
        name: "Persist 3",
        description: "Third category",
        duration: "PT3H"
      });

      // Verificar que todos foram persistidos
      const allCategories = await request(app).get("/api/complementary-task-categories");
      expect(allCategories.body).toHaveLength(3);

      // Verificar cada um individualmente
      const cat1 = await request(app).get("/api/complementary-task-categories/code/PERSIST1");
      expect(cat1.body.name).toBe("Persist 1");

      const cat2 = await request(app).get("/api/complementary-task-categories/code/PERSIST2");
      expect(cat2.body.name).toBe("Persist 2");

      const cat3 = await request(app).get("/api/complementary-task-categories/code/PERSIST3");
      expect(cat3.body.name).toBe("Persist 3");
    });

    it("should handle categories with and without duration", async () => {
      await request(app).post("/api/complementary-task-categories").send({
        code: "WITH_DUR",
        name: "With Duration",
        description: "Has duration",
        duration: "PT3H"
      });

      await request(app).post("/api/complementary-task-categories").send({
        code: "NO_DUR",
        name: "Without Duration",
        description: "No duration",
        duration: null
      });

      const allCategories = await request(app).get("/api/complementary-task-categories");
      expect(allCategories.body).toHaveLength(2);

      const withDur = allCategories.body.find((c: any) => c.code === "WITH_DUR");
      expect(withDur.duration).toBe("PT3H");

      const noDur = allCategories.body.find((c: any) => c.code === "NO_DUR");
      expect(noDur.duration).toBeNull();
    });
  });
});
