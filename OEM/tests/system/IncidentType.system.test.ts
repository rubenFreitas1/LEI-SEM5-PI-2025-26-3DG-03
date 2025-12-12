import "reflect-metadata";
import request from "supertest";
import { Express } from "express";
import { createSystemApp, clearDatabase, closeDatabase } from "./setup";

/**
 * TESTES DE SISTEMA (System Tests)
 * 
 * SUT: Aplicação COMPLETA (Routes + Controllers + Services + Repos + MongoDB REAL)
 * Base de dados: MongoDB Atlas - oem_test
 * 
 * Estes testes:
 * - Usam uma base de dados REAL (MongoDB Atlas)
 * - Testam o fluxo completo end-to-end
 * - NÃO usam mocks
 * - Validam integração real entre todas as camadas
 */

describe("IncidentType – System Tests (MongoDB Atlas)", () => {
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
  describe("POST /incident-types", () => {
    it("should create and retrieve an incident type from real database", async () => {
      const payload = {
        code: "SYS1",
        name: "System Test",
        description: "Created in system test",
        classification: "Minor"
      };

      const createRes = await request(app)
        .post("/api/incident-types")
        .send(payload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.code).toBe("SYS1");
      expect(createRes.body.name).toBe("System Test");

      // Verificar que foi realmente salvo na BD
      const getRes = await request(app).get("/api/incident-types/code/SYS1");

      expect(getRes.status).toBe(200);
      expect(getRes.body.name).toBe("System Test");
    });

    it("should fail when creating duplicate code in database", async () => {
      const payload = {
        code: "DUP001",
        name: "Duplicate Test",
        description: "Testing duplicates",
        classification: "Minor"
      };

      // Primeira criação
      await request(app).post("/api/incident-types").send(payload);

      // Segunda criação com mesmo código deve falhar
      const res = await request(app).post("/api/incident-types").send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already exists");
    });

    it("should create incident type with parent relationship in database", async () => {
      // Criar parent
      await request(app).post("/api/incident-types").send({
        code: "PARENT_SYS",
        name: "Parent Type",
        description: "Parent",
        classification: "Critical"
      });

      // Criar child
      const childRes = await request(app).post("/api/incident-types").send({
        code: "CHILD_SYS",
        name: "Child Type",
        description: "Child",
        classification: "Minor",
        parentIncidentTypeCode: "PARENT_SYS"
      });

      expect(childRes.status).toBe(201);
      expect(childRes.body.parentIncidentTypeCode).toBe("PARENT_SYS");
    });

    it("should fail when parent does not exist in database", async () => {
      const res = await request(app).post("/api/incident-types").send({
        code: "ORPHAN",
        name: "Orphan",
        description: "No parent",
        classification: "Minor",
        parentIncidentTypeCode: "NONEXISTENT"
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("not found");
    });
  });

  // =========================================
  // TESTES DE LEITURA (GET)
  // =========================================
  describe("GET /incident-types", () => {
    it("should return empty array when database is empty", async () => {
      const res = await request(app).get("/api/incident-types");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should return all incident types from database", async () => {
      // Criar vários tipos
      await request(app).post("/api/incident-types").send({
        code: "TYPE1",
        name: "Type One",
        description: "First type",
        classification: "Minor"
      });

      await request(app).post("/api/incident-types").send({
        code: "TYPE2",
        name: "Type Two",
        description: "Second type",
        classification: "Major"
      });

      await request(app).post("/api/incident-types").send({
        code: "TYPE3",
        name: "Type Three",
        description: "Third type",
        classification: "Critical"
      });

      // Buscar todos
      const res = await request(app).get("/api/incident-types");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      const codes = res.body.map((t: any) => t.code);
      expect(codes).toContain("TYPE1");
      expect(codes).toContain("TYPE2");
      expect(codes).toContain("TYPE3");
    });
  });

  describe("GET /incident-types/code/:code", () => {
    it("should find incident type by code in database", async () => {
      await request(app).post("/api/incident-types").send({
        code: "FIND_ME",
        name: "Findable",
        description: "Can be found",
        classification: "Major"
      });

      const res = await request(app).get("/api/incident-types/code/FIND_ME");

      expect(res.status).toBe(200);
      expect(res.body.code).toBe("FIND_ME");
      expect(res.body.name).toBe("Findable");
    });

    it("should return 404 when code does not exist in database", async () => {
      const res = await request(app).get("/api/incident-types/code/GHOST");

      expect(res.status).toBe(404);
    });
  });

  describe("GET /incident-types/classification/:classification", () => {
    beforeEach(async () => {
      // Popular BD com tipos de diferentes classificações
      await request(app).post("/api/incident-types").send({
        code: "MINOR1",
        name: "Minor Type 1",
        description: "Minor incident",
        classification: "Minor"
      });

      await request(app).post("/api/incident-types").send({
        code: "MINOR2",
        name: "Minor Type 2",
        description: "Another minor",
        classification: "Minor"
      });

      await request(app).post("/api/incident-types").send({
        code: "MAJOR1",
        name: "Major Type",
        description: "Major incident",
        classification: "Major"
      });

      await request(app).post("/api/incident-types").send({
        code: "CRITICAL1",
        name: "Critical Type",
        description: "Critical incident",
        classification: "Critical"
      });
    });

    it("should filter by Minor classification from database", async () => {
      const res = await request(app).get("/api/incident-types/classification/Minor");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      res.body.forEach((type: any) => {
        expect(type.classification).toBe("Minor");
      });
    });

    it("should filter by Major classification from database", async () => {
      const res = await request(app).get("/api/incident-types/classification/Major");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].classification).toBe("Major");
    });

    it("should filter by Critical classification from database", async () => {
      const res = await request(app).get("/api/incident-types/classification/Critical");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].classification).toBe("Critical");
    });
  });

  describe("GET /incident-types/hasParent/:value", () => {
    beforeEach(async () => {
      // Criar parent
      await request(app).post("/api/incident-types").send({
        code: "ROOT1",
        name: "Root Type 1",
        description: "Root",
        classification: "Critical"
      });

      await request(app).post("/api/incident-types").send({
        code: "ROOT2",
        name: "Root Type 2",
        description: "Another root",
        classification: "Major"
      });

      // Criar children
      await request(app).post("/api/incident-types").send({
        code: "CHILD1",
        name: "Child Type 1",
        description: "Has parent",
        classification: "Minor",
        parentIncidentTypeCode: "ROOT1"
      });
    });

    it("should return only types with parent from database", async () => {
      const res = await request(app).get("/api/incident-types/hasParent/true");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].code).toBe("CHILD1");
    });

    it("should return only types without parent from database", async () => {
      const res = await request(app).get("/api/incident-types/hasParent/false");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      const codes = res.body.map((t: any) => t.code);
      expect(codes).toContain("ROOT1");
      expect(codes).toContain("ROOT2");
    });
  });

  // =========================================
  // TESTES DE ATUALIZAÇÃO (PUT)
  // =========================================
  describe("PUT /incident-types/update/:code", () => {
    it("should update existing incident type in database", async () => {
      // Criar tipo
      await request(app).post("/api/incident-types").send({
        code: "UPD001",
        name: "Original Name",
        description: "Original",
        classification: "Minor"
      });

      // Atualizar
      const res = await request(app)
        .put("/api/incident-types/update/UPD001")
        .send({
          code: "UPD001",
          name: "Updated Name",
          description: "Updated description",
          classification: "Critical"
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
      expect(res.body.classification).toBe("Critical");

      // Verificar persistência na BD
      const getRes = await request(app).get("/api/incident-types/code/UPD001");
      expect(getRes.body.name).toBe("Updated Name");
      expect(getRes.body.classification).toBe("Critical");
    });

    it("should return 404 when updating non-existing incident type", async () => {
      const res = await request(app)
        .put("/api/incident-types/update/NOPE")
        .send({
          code: "NOPE",
          name: "X",
          description: "Y",
          classification: "Minor"
        });

      expect(res.status).toBe(404);
    });

    it("should fail when trying to change code in database", async () => {
      await request(app).post("/api/incident-types").send({
        code: "ORIG",
        name: "Original",
        description: "Original",
        classification: "Minor"
      });

      const res = await request(app)
        .put("/api/incident-types/update/ORIG")
        .send({
          code: "CHANGED",
          name: "Changed",
          description: "Changed",
          classification: "Minor"
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("cannot be changed");
    });

    it("should fail when name conflicts with existing type in database", async () => {
      // Criar dois tipos
      await request(app).post("/api/incident-types").send({
        code: "FIRST",
        name: "First Name",
        description: "First",
        classification: "Minor"
      });

      await request(app).post("/api/incident-types").send({
        code: "SECOND",
        name: "Second Name",
        description: "Second",
        classification: "Minor"
      });

      // Tentar atualizar SECOND com nome de FIRST
      const res = await request(app)
        .put("/api/incident-types/update/SECOND")
        .send({
          code: "SECOND",
          name: "First Name", // conflito!
          description: "Updated",
          classification: "Minor"
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
      const createRes = await request(app).post("/api/incident-types").send({
        code: "CRUD_TEST",
        name: "CRUD Workflow",
        description: "Testing complete CRUD",
        classification: "Minor"
      });
      expect(createRes.status).toBe(201);

      // 2. READ
      const readRes = await request(app).get("/api/incident-types/code/CRUD_TEST");
      expect(readRes.status).toBe(200);
      expect(readRes.body.name).toBe("CRUD Workflow");

      // 3. UPDATE
      const updateRes = await request(app)
        .put("/api/incident-types/update/CRUD_TEST")
        .send({
          code: "CRUD_TEST",
          name: "Updated CRUD",
          description: "Updated workflow",
          classification: "Critical"
        });
      expect(updateRes.status).toBe(200);

      // 4. VERIFY UPDATE
      const verifyRes = await request(app).get("/api/incident-types/code/CRUD_TEST");
      expect(verifyRes.body.name).toBe("Updated CRUD");
      expect(verifyRes.body.classification).toBe("Critical");
    });

    it("should handle parent-child hierarchy in real database", async () => {
      // Criar hierarquia (códigos com máx 10 caracteres)
      await request(app).post("/api/incident-types").send({
        code: "FIRE",
        name: "Fire Incidents",
        description: "General fire category",
        classification: "Critical"
      });

      await request(app).post("/api/incident-types").send({
        code: "FIRE_BUILD",
        name: "Building Fire",
        description: "Fire in buildings",
        classification: "Critical",
        parentIncidentTypeCode: "FIRE"
      });

      await request(app).post("/api/incident-types").send({
        code: "FIRE_FOR",
        name: "Forest Fire",
        description: "Fire in forests",
        classification: "Critical",
        parentIncidentTypeCode: "FIRE"
      });

      // Verificar children de FIRE
      const children = await request(app).get("/api/incident-types/parent/FIRE");
      expect(children.body).toHaveLength(2);
      const childCodes = children.body.map((t: any) => t.code);
      expect(childCodes).toContain("FIRE_BUILD");
      expect(childCodes).toContain("FIRE_FOR");
    });

    it("should persist data between requests (real database test)", async () => {
      // Criar múltiplos tipos em requests separados
      await request(app).post("/api/incident-types").send({
        code: "PERSIST1",
        name: "Persist 1",
        description: "First",
        classification: "Minor"
      });

      await request(app).post("/api/incident-types").send({
        code: "PERSIST2",
        name: "Persist 2",
        description: "Second",
        classification: "Major"
      });

      await request(app).post("/api/incident-types").send({
        code: "PERSIST3",
        name: "Persist 3",
        description: "Third",
        classification: "Critical"
      });

      // Verificar que todos foram persistidos
      const allTypes = await request(app).get("/api/incident-types");
      expect(allTypes.body).toHaveLength(3);

      // Verificar cada um individualmente
      const type1 = await request(app).get("/api/incident-types/code/PERSIST1");
      expect(type1.body.name).toBe("Persist 1");

      const type2 = await request(app).get("/api/incident-types/code/PERSIST2");
      expect(type2.body.name).toBe("Persist 2");

      const type3 = await request(app).get("/api/incident-types/code/PERSIST3");
      expect(type3.body.name).toBe("Persist 3");
    });
  });
});

