import { Result } from "../../../src/core/logic/Result";
import { IncidentClassification } from "../../../src/domain/IncidentQualification";
import { IncidentType } from "../../../src/domain/IncidentType";

// --- MOCKS ---
jest.mock("../../../src/mappers/IncidentTypeMap", () => ({
  IncidentTypeMap: {
    toDTO: jest.fn(),
    toDomain: jest.fn(),
    toPersistence: jest.fn()
  }
}));

import IncidentTypeService from "../../../src/services/IncidentTypeService";
import { IncidentTypeMap } from "../../../src/mappers/IncidentTypeMap";

describe("IncidentTypeService (unit tests)", () => {

  let incidentTypeRepo: any;
  let logger: any;
  let service: IncidentTypeService;

  beforeEach(() => {
    incidentTypeRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByName: jest.fn(),
      findWithParent: jest.fn(),
      findByClassification: jest.fn(),
      findByParent: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findByIds: jest.fn()
    };

    logger = { error: jest.fn(), info: jest.fn() };

    service = new IncidentTypeService(incidentTypeRepo, logger);
  });

    // ---------------------------------------------------
    // getAllIncidentTypes
    // ---------------------------------------------------

    it("should return DTO list when getAllIncidentTypes succeeds", async () => {
        const domainObj = new IncidentType("1", "C1", "Name1", "Desc1", IncidentClassification.Minor, undefined);

        incidentTypeRepo.findAll.mockResolvedValue([domainObj]);

        (IncidentTypeMap.toDTO as jest.Mock).mockReturnValue({
        id: "1",
        code: "C1"
        });

        const result = await service.getAllIncidentTypes();

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([{ id: "1", code: "C1" }]);
        expect(incidentTypeRepo.findAll).toHaveBeenCalled();
    });

    it("should return fail() when getAllIncidentTypes throws error", async () => {
        incidentTypeRepo.findAll.mockRejectedValue(new Error("DB error"));

        const result = await service.getAllIncidentTypes();

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Error getting all incident types");
        expect(logger.error).toHaveBeenCalled();
    });

    // ---------------------------------------------------
    // getIncidentTypeById
    // ---------------------------------------------------

    it("should return DTO when incident type exists", async () => {
        const domainObj = new IncidentType("2", "C2", "Name2", "Desc2", IncidentClassification.Major);

        incidentTypeRepo.findById.mockResolvedValue(domainObj);

        (IncidentTypeMap.toDTO as jest.Mock).mockReturnValue({
        id: "2",
        code: "C2"
        });

        const result = await service.getIncidentTypeById("2");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "2", code: "C2" });
    });

    it("should fail when incident type is not found by ID", async () => {
        incidentTypeRepo.findById.mockResolvedValue(null);

        const result = await service.getIncidentTypeById("999");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Incident type not found");
    });

    // ---------------------------------------------------
    // getIncidentTypeByCode
    // ---------------------------------------------------

    it("should return DTO when incident type exists by code", async () => {
        const domainObj = new IncidentType("5", "C5", "Name5", "Desc5", IncidentClassification.Minor);

        incidentTypeRepo.findByCode.mockResolvedValue(domainObj);

        (IncidentTypeMap.toDTO as jest.Mock).mockReturnValue({
            id: "5",
            code: "C5"
        });

        const result = await service.getIncidentTypeByCode("C5");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "5", code: "C5" });
    });

    it("should fail when code does not exist", async () => {
        incidentTypeRepo.findByCode.mockResolvedValue(null);

        const result = await service.getIncidentTypeByCode("XXX");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Incident type not found");
    });

    // ---------------------------------------------------
    // getIncidentTypeByName
    // ---------------------------------------------------

    it("should return DTO when incident type exists by name", async () => {
        const domainObj = new IncidentType("6", "C6", "MyName", "Desc6", IncidentClassification.Major);

        incidentTypeRepo.findByName.mockResolvedValue(domainObj);

        (IncidentTypeMap.toDTO as jest.Mock).mockReturnValue({
            id: "6",
            code: "C6"
        });

        const result = await service.getIncidentTypeByName("MyName");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "6", code: "C6" });
    });

    it("should fail when name does not exist", async () => {
        incidentTypeRepo.findByName.mockResolvedValue(null);

        const result = await service.getIncidentTypeByName("UnknownName");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Incident type not found");
    });

    // ---------------------------------------------------
    // getIncidentTypesWithParent
    // ---------------------------------------------------

    it("should return types filtered by parent existence", async () => {
        const domainObj = new IncidentType("7", "C7", "Name7", "Desc7", IncidentClassification.Minor, "PARENT1");

        incidentTypeRepo.findWithParent.mockResolvedValue([domainObj]);

        (IncidentTypeMap.toDTO as jest.Mock).mockReturnValue({
            id: "7",
            code: "C7",
            parentIncidentTypeCode: "PCODE"
        });

        incidentTypeRepo.findByIds.mockResolvedValue([{ id: "PARENT1", code: "PCODE" }]);
        const result = await service.getIncidentTypesWithParent(true);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([
            { id: "7", code: "C7", parentIncidentTypeCode: "PCODE" }
        ]);
    });

    it("should fail when repo throws in findWithParent", async () => {
        incidentTypeRepo.findWithParent.mockRejectedValue(new Error("Repo fail"));

        const result = await service.getIncidentTypesWithParent(true);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Error getting incident types with parent filter");
    });

    // ---------------------------------------------------
    // getIncidentTypesByClassification
    // ---------------------------------------------------

    it("should return types by classification", async () => {
        const domainObj = new IncidentType("8", "C8", "Name8", "Desc8", IncidentClassification.Critical);

        incidentTypeRepo.findByClassification.mockResolvedValue([domainObj]);

        (IncidentTypeMap.toDTO as jest.Mock).mockReturnValue({ id: "8", code: "C8" });

        const result = await service.getIncidentTypesByClassification("Critical");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([{ id: "8", code: "C8" }]);
    });

    it("should fail when classification string is invalid", async () => {
        const result = await service.getIncidentTypesByClassification("INVALID_TYPE");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Invalid classification value");
    });

    it("should fail when repo throws in findByClassification", async () => {
        incidentTypeRepo.findByClassification.mockRejectedValue(new Error("DB fail"));

        const result = await service.getIncidentTypesByClassification("Minor");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Error getting incident types by classification");
    });

    // ---------------------------------------------------
    // getIncidentTypesByParent
    // ---------------------------------------------------

    it("should return children when parent exists", async () => {
        const parent = new IncidentType("P1", "PARENT", "ParentName", "DescP", IncidentClassification.Minor);

        incidentTypeRepo.findByCode.mockResolvedValue(parent);

        const child = new IncidentType("9", "C9", "Child", "Desc9", IncidentClassification.Minor, "P1");

        incidentTypeRepo.findByParent.mockResolvedValue([child]);

        incidentTypeRepo.findById.mockResolvedValue(parent);

        (IncidentTypeMap.toDTO as jest.Mock).mockReturnValue({
            id: "9",
            code: "C9",
            parentIncidentTypeCode: "PARENT"
        });

        const result = await service.getIncidentTypesByParent("PARENT");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([
            { id: "9", code: "C9", parentIncidentTypeCode: "PARENT" }
        ]);
    });

    it("should fail when parent code does not exist", async () => {
        incidentTypeRepo.findByCode.mockResolvedValue(null);

        const result = await service.getIncidentTypesByParent("UNKNOWN");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Parent incident type not found");
    });

    it("should fail when repo throws in getIncidentTypesByParent", async () => {
        incidentTypeRepo.findByCode.mockRejectedValue(new Error("DB error"));

        const result = await service.getIncidentTypesByParent("PARENT");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Error getting incident types by parent code");
    });

    // ---------------------------------------------------
    // create
    // ---------------------------------------------------

    it("should create an incident type successfully", async () => {
        const dto = { code: "C3", name: "New", description: "Desc", classification: IncidentClassification.Minor };

        incidentTypeRepo.findByCode.mockResolvedValue(null); // no conflict

        const domainCreated = new IncidentType("3", "C3", "New", "Desc", IncidentClassification.Minor);

        (IncidentTypeMap.toDomain as jest.Mock).mockReturnValue(domainCreated);

        incidentTypeRepo.save.mockResolvedValue(domainCreated);

        (IncidentTypeMap.toDTO as jest.Mock).mockReturnValue({
        id: "3",
        code: "C3"
        });

        const result = await service.create(dto as any);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "3", code: "C3" });
    });

    it("should fail when creating a duplicated code", async () => {
        incidentTypeRepo.findByCode.mockResolvedValue({ id: "99" });

        const dto = { code: "C99", name: "Dup", description: "Dup", classification: IncidentClassification.Major };

        const result = await service.create(dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("already exists");
    });

    // ---------------------------------------------------
    // update
    // ---------------------------------------------------

    it("should update a valid incident type", async () => {
        const existing = new IncidentType("10", "U1", "Old", "Old desc", IncidentClassification.Minor);

        incidentTypeRepo.findByCode.mockResolvedValue(existing);
        incidentTypeRepo.findByName.mockResolvedValue(null);
        incidentTypeRepo.update.mockResolvedValue(existing);

        (IncidentTypeMap.toDTO as jest.Mock).mockReturnValue({
        id: "10",
        code: "U1",
        name: "Updated"
        });

        const dto = {
        code: "U1",
        name: "Updated",
        description: "Updated desc",
        classification: IncidentClassification.Critical
        };

        const result = await service.update("U1", dto as any);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "10", code: "U1", name: "Updated" });
    });

    it("should fail update if code does not exist", async () => {
        incidentTypeRepo.findByCode.mockResolvedValue(null);

        const dto = { code: "X1", name: "A", description: "B", classification: IncidentClassification.Minor };

        const result = await service.update("X1", dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("not found");
    });

});
