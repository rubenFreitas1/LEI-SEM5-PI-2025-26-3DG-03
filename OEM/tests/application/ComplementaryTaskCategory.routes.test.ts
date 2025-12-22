import "reflect-metadata";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { Container } from "typedi";
import { errors as celebrateErrors } from "celebrate";

import complementaryTaskCategoryRoutes from "../../src/api/routes/ComplementaryTaskCategory";
import ComplementaryTaskCategoryController from "../../src/controllers/ComplementaryTaskCategoryController";
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
    complementaryTaskCategory: {
      name: "complementaryTaskCategoryController"
    }
  },
  services: {
    complementaryTaskCategory: {
      name: "complementaryTaskCategoryService"
    }
  }
}));


// ----------------------------------------------------
// Mock do Service (SUT = Routes + Controller + Validação)
// O Controller é REAL, apenas o Service é mockado
// ----------------------------------------------------
const complementaryTaskCategoryServiceMock = {
  getAllComplementaryTaskCategories: jest.fn(),
  getComplementaryTaskCategoryById: jest.fn(),
  getComplementaryTaskCategoryByCode: jest.fn(),
  getComplementaryTaskCategoryByName: jest.fn(),
  getComplementaryTaskCategoryByParent: jest.fn(),
  getComplementaryTaskCategoriesWithParent: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
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
    config.services.complementaryTaskCategory.name,
    complementaryTaskCategoryServiceMock
  );

  // CONTROLLER REAL (instância real do controller)
  const controllerInstance = new ComplementaryTaskCategoryController(
    complementaryTaskCategoryServiceMock,
    Container.get("logger")
  );
  Container.set(
    config.controllers.complementaryTaskCategory.name,
    controllerInstance
  );

  // Carregar routes reais
  complementaryTaskCategoryRoutes(app);

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
describe("ComplementaryTaskCategory Routes (Application Tests)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET /complementary-task-categories
  // -----------------------------
  it("GET /complementary-task-categories → 200", async () => {
    complementaryTaskCategoryServiceMock.getAllComplementaryTaskCategories.mockResolvedValue({
      isSuccess: true,
      getValue: () => [{ code: "CTC1" }]
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-task-categories");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ code: "CTC1" }]);
  });

  // -----------------------------
  // GET /complementary-task-categories/code/:code
  // -----------------------------
  it("GET /complementary-task-categories/code/:code → 404 when not found", async () => {
    complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByCode.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Complementary task category not found",
      errorValue: () => "Complementary task category not found"
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-task-categories/code/CTC999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("GET /complementary-task-categories/code/:code → 200 when found", async () => {
    complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByCode.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "CTC1", name: "Cleaning" })
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-task-categories/code/CTC1");

    expect(res.status).toBe(200);
    expect(res.body.code).toBe("CTC1");
  });

  // -----------------------------
  // PUT /complementary-task-categories/update/:code
  // -----------------------------
  it("PUT /complementary-task-categories/update/:code → 404 when code does not exist", async () => {
    complementaryTaskCategoryServiceMock.update.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "ComplementaryTaskCategory with code 'CTC2' not found.",
      errorValue: () => "ComplementaryTaskCategory with code 'CTC2' not found."
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/complementary-task-categories/update/CTC2")
      .send({
        code: "CTC2",
        name: "Cleaning",
        description: "Cleaning tasks",
        duration: "2h"
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("PUT /complementary-task-categories/update/:code → 200 when updated", async () => {
    complementaryTaskCategoryServiceMock.update.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "CTC1", name: "Updated" })
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/complementary-task-categories/update/CTC1")
      .send({
        code: "CTC1",
        name: "Updated",
        description: "Updated desc",
        duration: "3h"
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
  });

  // -----------------------------
  // POST /complementary-task-categories
  // -----------------------------
  it("POST /complementary-task-categories → 201 when created", async () => {
    complementaryTaskCategoryServiceMock.create.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ code: "CTC10" })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-task-categories")
      .send({
        code: "CTC10",
        name: "New",
        description: "New Desc",
        duration: "1h"
      });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe("CTC10");
  });

  it("POST /complementary-task-categories → 400 when validation fails (missing required fields)", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-task-categories")
      .send({
        name: "Invalid" // missing code, description
      });

    expect(res.status).toBe(400);
  });

  it("POST /complementary-task-categories → 201 with optional parentComplementaryTaskCategoryCode", async () => {
    complementaryTaskCategoryServiceMock.create.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ 
        code: "CTC11", 
        name: "Child Category",
        parentComplementaryTaskCategoryCode: "CTC1" 
      })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-task-categories")
      .send({
        code: "CTC11",
        name: "Child Category",
        description: "A child category",
        duration: "2h",
        parentComplementaryTaskCategoryCode: "CTC1"
      });

    expect(res.status).toBe(201);
    expect(res.body.parentComplementaryTaskCategoryCode).toBe("CTC1");
    expect(complementaryTaskCategoryServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parentComplementaryTaskCategoryCode: "CTC1"
      })
    );
  });

  it("POST /complementary-task-categories → 400 when parent not found", async () => {
    complementaryTaskCategoryServiceMock.create.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Parent ComplementaryTaskCategory with code 'NONEXISTENT' not found.",
      errorValue: () => "Parent ComplementaryTaskCategory with code 'NONEXISTENT' not found."
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-task-categories")
      .send({
        code: "CTC12",
        name: "Test",
        description: "Test",
        duration: null,
        parentComplementaryTaskCategoryCode: "NONEXISTENT"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("not found");
  });

  it("POST /complementary-task-categories → 400 when code already exists", async () => {
    complementaryTaskCategoryServiceMock.create.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "ComplementaryTaskCategory with code 'CTC1' already exists.",
      errorValue: () => "ComplementaryTaskCategory with code 'CTC1' already exists."
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-task-categories")
      .send({
        code: "CTC1",
        name: "Duplicate",
        description: "Duplicate code",
        duration: "1h"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("already exists");
  });

  it("POST /complementary-task-categories → 201 with null duration", async () => {
    complementaryTaskCategoryServiceMock.create.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ code: "CTC13", name: "No Duration", duration: null })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-task-categories")
      .send({
        code: "CTC13",
        name: "No Duration",
        description: "Category without duration",
        duration: null
      });

    expect(res.status).toBe(201);
  });

  it("POST /complementary-task-categories → 201 with null parentComplementaryTaskCategoryCode", async () => {
    complementaryTaskCategoryServiceMock.create.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ code: "CTC14", name: "Root Category" })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/complementary-task-categories")
      .send({
        code: "CTC14",
        name: "Root Category",
        description: "A root category",
        duration: "3h",
        parentComplementaryTaskCategoryCode: null
      });

    expect(res.status).toBe(201);
  });

  // -----------------------------
  // PUT /complementary-task-categories/update/:code - Mais testes
  // -----------------------------
  it("PUT /complementary-task-categories/update/:code → 400 when trying to change code", async () => {
    complementaryTaskCategoryServiceMock.update.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "ComplementaryTaskCategory code cannot be changed.",
      errorValue: () => "ComplementaryTaskCategory code cannot be changed."
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/complementary-task-categories/update/CTC1")
      .send({
        code: "CTC999", // tentando mudar o código
        name: "Updated",
        description: "Updated desc",
        duration: "2h"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("cannot be changed");
  });

  it("PUT /complementary-task-categories/update/:code → 400 when validation fails", async () => {
    const app = createTestApp();

    const res = await request(app)
      .put("/complementary-task-categories/update/CTC1")
      .send({
        name: "Only name" // missing required fields
      });

    expect(res.status).toBe(400);
  });

  it("PUT /complementary-task-categories/update/:code → 400 when name already in use by another category", async () => {
    complementaryTaskCategoryServiceMock.update.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Complementary Task Category name 'Cleaning' is already in use.",
      errorValue: () => "Complementary Task Category name 'Cleaning' is already in use."
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/complementary-task-categories/update/CTC1")
      .send({
        code: "CTC1",
        name: "Cleaning", // nome já usado por outra categoria
        description: "Updated",
        duration: "1h"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("already in use");
  });

  it("PUT /complementary-task-categories/update/:code → 200 when updating with valid parent", async () => {
    complementaryTaskCategoryServiceMock.update.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ 
        code: "CTC2", 
        name: "Updated",
        parentComplementaryTaskCategoryCode: "CTC1"
      })
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/complementary-task-categories/update/CTC2")
      .send({
        code: "CTC2",
        name: "Updated",
        description: "With parent",
        duration: "2h",
        parentComplementaryTaskCategoryCode: "CTC1"
      });

    expect(res.status).toBe(200);
    expect(res.body.parentComplementaryTaskCategoryCode).toBe("CTC1");
  });

  // -----------------------------
  // GET /complementary-task-categories - Mais testes
  // -----------------------------
  it("GET /complementary-task-categories → 200 with empty array when no categories exist", async () => {
    complementaryTaskCategoryServiceMock.getAllComplementaryTaskCategories.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => []
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-task-categories");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /complementary-task-categories → 200 with multiple categories", async () => {
    complementaryTaskCategoryServiceMock.getAllComplementaryTaskCategories.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => [
        { code: "CTC1", name: "Cleaning", duration: "1h" },
        { code: "CTC2", name: "Maintenance", duration: "2h" },
        { code: "CTC3", name: "Inspection", duration: null }
      ]
    });

    const app = createTestApp();

    const res = await request(app).get("/complementary-task-categories");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].code).toBe("CTC1");
    expect(res.body[1].code).toBe("CTC2");
    expect(res.body[2].code).toBe("CTC3");
  });

  // -----------------------------
  // Testes de Edge Cases
  // -----------------------------
  it("GET /complementary-task-categories/code/:code → verifica que o service é chamado com o parâmetro correto", async () => {
    complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByCode.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "TEST123" })
    });

    const app = createTestApp();

    await request(app).get("/complementary-task-categories/code/TEST123");

    expect(complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByCode).toHaveBeenCalledWith("TEST123");
  });

  it("PUT /complementary-task-categories/update/:code → verifica que o service é chamado com parâmetros corretos", async () => {
    complementaryTaskCategoryServiceMock.update.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "CTC1" })
    });

    const app = createTestApp();

    const payload = {
      code: "CTC1",
      name: "Updated Name",
      description: "Updated Description",
      duration: "3h"
    };

    await request(app)
      .put("/complementary-task-categories/update/CTC1")
      .send(payload);

    expect(complementaryTaskCategoryServiceMock.update).toHaveBeenCalledWith("CTC1", payload);
  });

  it("POST /complementary-task-categories → verifica que o service é chamado com o payload correto", async () => {
    complementaryTaskCategoryServiceMock.create.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "CTC20" })
    });

    const app = createTestApp();

    const payload = {
      code: "CTC20",
      name: "New Category",
      description: "Description",
      duration: "1h30m"
    };

    await request(app)
      .post("/complementary-task-categories")
      .send(payload);

    expect(complementaryTaskCategoryServiceMock.create).toHaveBeenCalledWith(payload);
  });

  // -----------------------------
  // GET /complementary-task-categories/id/:id
  // -----------------------------
  describe("GET /complementary-task-categories/id/:id", () => {
    it("should return 200 when category found by ID", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryById.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => ({ 
          id: "123e4567-e89b-12d3-a456-426614174000",
          code: "CTC1", 
          name: "Cleaning" 
        })
      });

      const app = createTestApp();

      const res = await request(app).get("/complementary-task-categories/id/123e4567-e89b-12d3-a456-426614174000");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(res.body.code).toBe("CTC1");
    });

    it("should return 404 when category not found by ID", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryById.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: "Incident type not found",
        errorValue: () => "Incident type not found"
      });

      const app = createTestApp();

      const res = await request(app).get("/complementary-task-categories/id/nonexistent-id");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });

    it("should call service with correct ID parameter", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryById.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ id: "test-id" })
      });

      const app = createTestApp();

      await request(app).get("/complementary-task-categories/id/test-id-123");

      expect(complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryById).toHaveBeenCalledWith("test-id-123");
    });
  });

  // -----------------------------
  // GET /complementary-task-categories/name/:name
  // -----------------------------
  describe("GET /complementary-task-categories/name/:name", () => {
    it("should return 200 when category found by name", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByName.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => ({ 
          code: "CTC1", 
          name: "Cleaning",
          description: "Cleaning tasks" 
        })
      });

      const app = createTestApp();

      const res = await request(app).get("/complementary-task-categories/name/Cleaning");

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Cleaning");
    });

    it("should return 404 when category not found by name", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByName.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: "Complementary task category not found",
        errorValue: () => "Complementary task category not found"
      });

      const app = createTestApp();

      const res = await request(app).get("/complementary-task-categories/name/NonExistent");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });

    it("should call service with correct name parameter", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByName.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ name: "Test" })
      });

      const app = createTestApp();

      await request(app).get("/complementary-task-categories/name/Test");

      expect(complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByName).toHaveBeenCalledWith("Test");
    });
  });

  // -----------------------------
  // GET /complementary-task-categories/parent/:parentCode
  // -----------------------------
  describe("GET /complementary-task-categories/parent/:parentCode", () => {
    it("should return 200 with list of child categories", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { code: "CTC2", name: "Floor Cleaning", parentComplementaryTaskCategoryCode: "CTC1" },
          { code: "CTC3", name: "Window Cleaning", parentComplementaryTaskCategoryCode: "CTC1" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/complementary-task-categories/parent/CTC1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].parentComplementaryTaskCategoryCode).toBe("CTC1");
      expect(res.body[1].parentComplementaryTaskCategoryCode).toBe("CTC1");
    });

    it("should return 200 with empty array when parent has no children", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => []
      });

      const app = createTestApp();

      const res = await request(app).get("/complementary-task-categories/parent/CTC99");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should call service with correct parent code", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByParent.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/complementary-task-categories/parent/PARENT123");

      expect(complementaryTaskCategoryServiceMock.getComplementaryTaskCategoryByParent).toHaveBeenCalledWith("PARENT123");
    });
  });

  // -----------------------------
  // GET /complementary-task-categories/hasParent/:value
  // -----------------------------
  describe("GET /complementary-task-categories/hasParent/:value", () => {
    it("should return 200 with categories that have parent (true)", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoriesWithParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { code: "CTC2", name: "Floor Cleaning", parentComplementaryTaskCategoryCode: "CTC1" },
          { code: "CTC3", name: "Window Cleaning", parentComplementaryTaskCategoryCode: "CTC1" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/complementary-task-categories/hasParent/true");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].parentComplementaryTaskCategoryCode).toBeTruthy();
    });

    it("should return 200 with categories that have no parent (false)", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoriesWithParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { code: "CTC1", name: "Cleaning", parentComplementaryTaskCategoryCode: null },
          { code: "CTC5", name: "Maintenance", parentComplementaryTaskCategoryCode: null }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/complementary-task-categories/hasParent/false");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("should call service with true when value is 'true'", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoriesWithParent.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/complementary-task-categories/hasParent/true");

      expect(complementaryTaskCategoryServiceMock.getComplementaryTaskCategoriesWithParent).toHaveBeenCalledWith(true);
    });

    it("should call service with false when value is 'false'", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoriesWithParent.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/complementary-task-categories/hasParent/false");

      expect(complementaryTaskCategoryServiceMock.getComplementaryTaskCategoriesWithParent).toHaveBeenCalledWith(false);
    });

    it("should return 200 with empty array when no categories match filter", async () => {
      complementaryTaskCategoryServiceMock.getComplementaryTaskCategoriesWithParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => []
      });

      const app = createTestApp();

      const res = await request(app).get("/complementary-task-categories/hasParent/true");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});

