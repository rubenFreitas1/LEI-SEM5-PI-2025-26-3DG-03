import "reflect-metadata";
import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { Container } from "typedi";
import { errors as celebrateErrors } from "celebrate";

import incidentTypeRoutes from "../../src/api/routes/IncidentTypeRoute";
import IncidentTypeController from "../../src/controllers/IncidentTypeController";
import config from "../../config";

jest.mock("../../config", () => ({
  controllers: {
    incidentType: {
      name: "incidentTypeController"
    }
  },
  services: {
    incidentType: {
      name: "incidentTypeService"
    }
  }
}));


// ----------------------------------------------------
// Mock do Service (SUT = Routes + Controller + Validação)
// O Controller é REAL, apenas o Service é mockado
// ----------------------------------------------------
const incidentTypeServiceMock = {
  getAllIncidentTypes: jest.fn(),
  getIncidentTypeById: jest.fn(),
  getIncidentTypeByCode: jest.fn(),
  getIncidentTypeByName: jest.fn(),
  getIncidentTypesByParent: jest.fn(),
  getIncidentTypesByClassification: jest.fn(),
  getIncidentTypesWithParent: jest.fn(),
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
    config.services.incidentType.name,
    incidentTypeServiceMock
  );

  // CONTROLLER REAL (instância real do controller)
  const controllerInstance = new IncidentTypeController(
    incidentTypeServiceMock,
    Container.get("logger")
  );
  Container.set(
    config.controllers.incidentType.name,
    controllerInstance
  );

  // Carregar routes reais
  incidentTypeRoutes(app);

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
describe("IncidentType Routes (Application Tests)", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------
  // GET /incident-types
  // -----------------------------
  it("GET /incident-types → 200", async () => {
    incidentTypeServiceMock.getAllIncidentTypes.mockResolvedValue({
      isSuccess: true,
      getValue: () => [{ code: "INC1" }]
    });

    const app = createTestApp();

    const res = await request(app).get("/incident-types");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ code: "INC1" }]);
  });

  // -----------------------------
  // GET /incident-types/code/:code
  // -----------------------------
  it("GET /incident-types/code/:code → 404 when not found", async () => {
    incidentTypeServiceMock.getIncidentTypeByCode.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Incident type not found",
      errorValue: () => "Incident type not found"
    });

    const app = createTestApp();

    const res = await request(app).get("/incident-types/code/INC999");

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("GET /incident-types/code/:code → 200 when found", async () => {
    incidentTypeServiceMock.getIncidentTypeByCode.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "INC1", name: "Fire" })
    });

    const app = createTestApp();

    const res = await request(app).get("/incident-types/code/INC1");

    expect(res.status).toBe(200);
    expect(res.body.code).toBe("INC1");
  });

  // -----------------------------
  // PUT /incident-types/update/:code
  // -----------------------------
  it("PUT /incident-types/update/:code → 404 when code does not exist", async () => {
    incidentTypeServiceMock.update.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "IncidentType with code 'INC2' not found.",
      errorValue: () => "IncidentType with code 'INC2' not found."
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/incident-types/update/INC2")
      .send({
        code: "INC2",
        name: "Fire",
        description: "Desc",
        classification: "Critical"
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain("not found");
  });

  it("PUT /incident-types/update/:code → 200 when updated", async () => {
    incidentTypeServiceMock.update.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "INC1", name: "Updated" })
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/incident-types/update/INC1")
      .send({
        code: "INC1",
        name: "Updated",
        description: "Updated desc",
        classification: "Major"
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
  });

  // -----------------------------
  // POST /incident-types
  // -----------------------------
  it("POST /incident-types → 201 when created", async () => {
    incidentTypeServiceMock.create.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ code: "INC10" })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/incident-types")
      .send({
        code: "INC10",
        name: "New",
        description: "Desc",
        classification: "Minor"
      });

    expect(res.status).toBe(201);
    expect(res.body.code).toBe("INC10");
  });

  it("POST /incident-types → 400 when validation fails (missing required fields)", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/incident-types")
      .send({
        name: "Invalid" // missing code, description, classification
      });

    expect(res.status).toBe(400);
  });

  it("POST /incident-types → 400 when classification is invalid", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/incident-types")
      .send({
        code: "INC11",
        name: "Test",
        description: "Test desc",
        classification: "InvalidClassification" // deve ser Minor, Major ou Critical
      });

    expect(res.status).toBe(400);
  });

  it("POST /incident-types → 201 with optional parentIncidentTypeCode", async () => {
    incidentTypeServiceMock.create.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ 
        code: "INC11", 
        name: "Child Type",
        parentIncidentTypeCode: "INC1" 
      })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/incident-types")
      .send({
        code: "INC11",
        name: "Child Type",
        description: "A child incident type",
        classification: "Minor",
        parentIncidentTypeCode: "INC1"
      });

    expect(res.status).toBe(201);
    expect(res.body.parentIncidentTypeCode).toBe("INC1");
    expect(incidentTypeServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        parentIncidentTypeCode: "INC1"
      })
    );
  });

  it("POST /incident-types → 400 when parent not found", async () => {
    incidentTypeServiceMock.create.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Parent IncidentType with code 'NONEXISTENT' not found.",
      errorValue: () => "Parent IncidentType with code 'NONEXISTENT' not found."
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/incident-types")
      .send({
        code: "INC12",
        name: "Test",
        description: "Test",
        classification: "Minor",
        parentIncidentTypeCode: "NONEXISTENT"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("not found");
  });

  it("POST /incident-types → 400 when code already exists", async () => {
    incidentTypeServiceMock.create.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "IncidentType with code 'INC1' already exists.",
      errorValue: () => "IncidentType with code 'INC1' already exists."
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/incident-types")
      .send({
        code: "INC1",
        name: "Duplicate",
        description: "Duplicate code",
        classification: "Minor"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("already exists");
  });

  it("POST /incident-types → 201 with null parentIncidentTypeCode", async () => {
    incidentTypeServiceMock.create.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ code: "INC13", name: "Root Type" })
    });

    const app = createTestApp();

    const res = await request(app)
      .post("/incident-types")
      .send({
        code: "INC13",
        name: "Root Type",
        description: "A root type",
        classification: "Critical",
        parentIncidentTypeCode: null
      });

    expect(res.status).toBe(201);
  });

  // -----------------------------
  // PUT /incident-types/update/:code - Mais testes
  // -----------------------------
  it("PUT /incident-types/update/:code → 400 when trying to change code", async () => {
    incidentTypeServiceMock.update.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "IncidentType code cannot be changed.",
      errorValue: () => "IncidentType code cannot be changed."
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/incident-types/update/INC1")
      .send({
        code: "INC999", // tentando mudar o código
        name: "Updated",
        description: "Updated desc",
        classification: "Major"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("cannot be changed");
  });

  it("PUT /incident-types/update/:code → 400 when validation fails", async () => {
    const app = createTestApp();

    const res = await request(app)
      .put("/incident-types/update/INC1")
      .send({
        name: "Only name" // missing required fields
      });

    expect(res.status).toBe(400);
  });

  it("PUT /incident-types/update/:code → 400 when classification is invalid", async () => {
    const app = createTestApp();

    const res = await request(app)
      .put("/incident-types/update/INC1")
      .send({
        code: "INC1",
        name: "Test",
        description: "Test",
        classification: "SuperCritical" // inválido
      });

    expect(res.status).toBe(400);
  });

  it("PUT /incident-types/update/:code → 400 when name already in use by another type", async () => {
    incidentTypeServiceMock.update.mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: "Incident Type name 'Fire' is already in use.",
      errorValue: () => "Incident Type name 'Fire' is already in use."
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/incident-types/update/INC1")
      .send({
        code: "INC1",
        name: "Fire", // nome já usado por outro tipo
        description: "Updated",
        classification: "Major"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("already in use");
  });

  it("PUT /incident-types/update/:code → 200 when updating with valid parent", async () => {
    incidentTypeServiceMock.update.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => ({ 
        code: "INC2", 
        name: "Updated",
        parentIncidentTypeCode: "INC1"
      })
    });

    const app = createTestApp();

    const res = await request(app)
      .put("/incident-types/update/INC2")
      .send({
        code: "INC2",
        name: "Updated",
        description: "With parent",
        classification: "Minor",
        parentIncidentTypeCode: "INC1"
      });

    expect(res.status).toBe(200);
    expect(res.body.parentIncidentTypeCode).toBe("INC1");
  });

  // -----------------------------
  // GET /incident-types - Mais testes
  // -----------------------------
  it("GET /incident-types → 200 with empty array when no types exist", async () => {
    incidentTypeServiceMock.getAllIncidentTypes.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => []
    });

    const app = createTestApp();

    const res = await request(app).get("/incident-types");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /incident-types → 200 with multiple types", async () => {
    incidentTypeServiceMock.getAllIncidentTypes.mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      error: null,
      getValue: () => [
        { code: "INC1", name: "Fire", classification: "Critical" },
        { code: "INC2", name: "Flood", classification: "Major" },
        { code: "INC3", name: "Vandalism", classification: "Minor" }
      ]
    });

    const app = createTestApp();

    const res = await request(app).get("/incident-types");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].code).toBe("INC1");
    expect(res.body[1].code).toBe("INC2");
    expect(res.body[2].code).toBe("INC3");
  });

  // -----------------------------
  // Testes de Edge Cases
  // -----------------------------
  it("GET /incident-types/code/:code → verifica que o service é chamado com o parâmetro correto", async () => {
    incidentTypeServiceMock.getIncidentTypeByCode.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "TEST123" })
    });

    const app = createTestApp();

    await request(app).get("/incident-types/code/TEST123");

    expect(incidentTypeServiceMock.getIncidentTypeByCode).toHaveBeenCalledWith("TEST123");
  });

  it("PUT /incident-types/update/:code → verifica que o service é chamado com parâmetros corretos", async () => {
    incidentTypeServiceMock.update.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "INC1" })
    });

    const app = createTestApp();

    const payload = {
      code: "INC1",
      name: "Updated Name",
      description: "Updated Description",
      classification: "Major"
    };

    await request(app)
      .put("/incident-types/update/INC1")
      .send(payload);

    expect(incidentTypeServiceMock.update).toHaveBeenCalledWith("INC1", payload);
  });

  it("POST /incident-types → verifica que o service é chamado com o payload correto", async () => {
    incidentTypeServiceMock.create.mockResolvedValue({
      isSuccess: true,
      getValue: () => ({ code: "INC20" })
    });

    const app = createTestApp();

    const payload = {
      code: "INC20",
      name: "New Type",
      description: "Description",
      classification: "Minor"
    };

    await request(app)
      .post("/incident-types")
      .send(payload);

    expect(incidentTypeServiceMock.create).toHaveBeenCalledWith(payload);
  });

  // -----------------------------
  // GET /incident-types/id/:id
  // -----------------------------
  describe("GET /incident-types/id/:id", () => {
    it("should return 200 when incident type found by ID", async () => {
      incidentTypeServiceMock.getIncidentTypeById.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => ({ 
          id: "123e4567-e89b-12d3-a456-426614174000",
          code: "INC1", 
          name: "Fire" 
        })
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/id/123e4567-e89b-12d3-a456-426614174000");

      expect(res.status).toBe(200);
      expect(res.body.id).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(res.body.code).toBe("INC1");
    });

    it("should return 404 when incident type not found by ID", async () => {
      incidentTypeServiceMock.getIncidentTypeById.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: "Incident type not found",
        errorValue: () => "Incident type not found"
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/id/nonexistent-id");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });

    it("should call service with correct ID parameter", async () => {
      incidentTypeServiceMock.getIncidentTypeById.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ id: "test-id" })
      });

      const app = createTestApp();

      await request(app).get("/incident-types/id/test-id-123");

      expect(incidentTypeServiceMock.getIncidentTypeById).toHaveBeenCalledWith("test-id-123");
    });
  });

  // -----------------------------
  // GET /incident-types/name/:name
  // -----------------------------
  describe("GET /incident-types/name/:name", () => {
    it("should return 200 when incident type found by name", async () => {
      incidentTypeServiceMock.getIncidentTypeByName.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => ({ 
          code: "INC1", 
          name: "Fire",
          description: "Fire incidents" 
        })
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/name/Fire");

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Fire");
    });

    it("should return 404 when incident type not found by name", async () => {
      incidentTypeServiceMock.getIncidentTypeByName.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: "Incident type not found",
        errorValue: () => "Incident type not found"
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/name/NonExistent");

      expect(res.status).toBe(404);
      expect(res.body.error).toContain("not found");
    });

    it("should call service with correct name parameter", async () => {
      incidentTypeServiceMock.getIncidentTypeByName.mockResolvedValue({
        isSuccess: true,
        getValue: () => ({ name: "Test" })
      });

      const app = createTestApp();

      await request(app).get("/incident-types/name/Test");

      expect(incidentTypeServiceMock.getIncidentTypeByName).toHaveBeenCalledWith("Test");
    });
  });

  // -----------------------------
  // GET /incident-types/parent/:parentCode
  // -----------------------------
  describe("GET /incident-types/parent/:parentCode", () => {
    it("should return 200 with list of child incident types", async () => {
      incidentTypeServiceMock.getIncidentTypesByParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { code: "INC2", name: "Building Fire", parentIncidentTypeCode: "INC1" },
          { code: "INC3", name: "Forest Fire", parentIncidentTypeCode: "INC1" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/parent/INC1");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].parentIncidentTypeCode).toBe("INC1");
      expect(res.body[1].parentIncidentTypeCode).toBe("INC1");
    });

    it("should return 200 with empty array when parent has no children", async () => {
      incidentTypeServiceMock.getIncidentTypesByParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => []
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/parent/INC99");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should call service with correct parent code", async () => {
      incidentTypeServiceMock.getIncidentTypesByParent.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/incident-types/parent/PARENT123");

      expect(incidentTypeServiceMock.getIncidentTypesByParent).toHaveBeenCalledWith("PARENT123");
    });
  });

  // -----------------------------
  // GET /incident-types/classification/:classification
  // -----------------------------
  describe("GET /incident-types/classification/:classification", () => {
    it("should return 200 with incident types filtered by Minor classification", async () => {
      incidentTypeServiceMock.getIncidentTypesByClassification.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { code: "INC1", name: "Vandalism", classification: "Minor" },
          { code: "INC2", name: "Graffiti", classification: "Minor" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/classification/Minor");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].classification).toBe("Minor");
    });

    it("should return 200 with incident types filtered by Major classification", async () => {
      incidentTypeServiceMock.getIncidentTypesByClassification.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { code: "INC3", name: "Flood", classification: "Major" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/classification/Major");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].classification).toBe("Major");
    });

    it("should return 200 with incident types filtered by Critical classification", async () => {
      incidentTypeServiceMock.getIncidentTypesByClassification.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { code: "INC4", name: "Fire", classification: "Critical" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/classification/Critical");

      expect(res.status).toBe(200);
      expect(res.body[0].classification).toBe("Critical");
    });

    it("should return 200 with empty array when no types match classification", async () => {
      incidentTypeServiceMock.getIncidentTypesByClassification.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => []
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/classification/Minor");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("should call service with correct classification parameter", async () => {
      incidentTypeServiceMock.getIncidentTypesByClassification.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/incident-types/classification/Critical");

      expect(incidentTypeServiceMock.getIncidentTypesByClassification).toHaveBeenCalledWith("Critical");
    });
  });

  // -----------------------------
  // GET /incident-types/hasParent/:value
  // -----------------------------
  describe("GET /incident-types/hasParent/:value", () => {
    it("should return 200 with types that have parent (true)", async () => {
      incidentTypeServiceMock.getIncidentTypesWithParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { code: "INC2", name: "Building Fire", parentIncidentTypeCode: "INC1" },
          { code: "INC3", name: "Car Fire", parentIncidentTypeCode: "INC1" }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/hasParent/true");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].parentIncidentTypeCode).toBeTruthy();
    });

    it("should return 200 with types that have no parent (false)", async () => {
      incidentTypeServiceMock.getIncidentTypesWithParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => [
          { code: "INC1", name: "Fire", parentIncidentTypeCode: null },
          { code: "INC5", name: "Flood", parentIncidentTypeCode: null }
        ]
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/hasParent/false");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("should call service with true when value is 'true'", async () => {
      incidentTypeServiceMock.getIncidentTypesWithParent.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/incident-types/hasParent/true");

      expect(incidentTypeServiceMock.getIncidentTypesWithParent).toHaveBeenCalledWith(true);
    });

    it("should call service with false when value is 'false'", async () => {
      incidentTypeServiceMock.getIncidentTypesWithParent.mockResolvedValue({
        isSuccess: true,
        getValue: () => []
      });

      const app = createTestApp();

      await request(app).get("/incident-types/hasParent/false");

      expect(incidentTypeServiceMock.getIncidentTypesWithParent).toHaveBeenCalledWith(false);
    });

    it("should return 200 with empty array when no types match filter", async () => {
      incidentTypeServiceMock.getIncidentTypesWithParent.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        error: null,
        getValue: () => []
      });

      const app = createTestApp();

      const res = await request(app).get("/incident-types/hasParent/true");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
