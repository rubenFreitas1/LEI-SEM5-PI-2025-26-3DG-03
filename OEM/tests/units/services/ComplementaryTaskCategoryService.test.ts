import { Result } from "../../../src/core/logic/Result";
import { ComplementaryTaskCategory } from "../../../src/domain/ComplementaryTaskCategory";

// --- MOCKS ---
jest.mock("../../../src/mappers/ComplementaryTaskCategoryMap", () => ({
    ComplementaryTaskCategoryMap: {
        toDTO: jest.fn(),
        toDomain: jest.fn(),
        toPersistence: jest.fn()
    }
}));

import ComplementaryTaskCategoryService from "../../../src/services/ComplementaryTaskCategoryService";
import { ComplementaryTaskCategoryMap } from "../../../src/mappers/ComplementaryTaskCategoryMap";

describe("ComplementaryTaskCategoryService (unit tests)", () => {

    let complementaryTaskCategoryRepo: any;
    let logger: any;
    let service: ComplementaryTaskCategoryService;

    beforeEach(() => {
        complementaryTaskCategoryRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            findByName: jest.fn(),
            findWithParent: jest.fn(),
            findByParent: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findByIds: jest.fn()
        };

        logger = { error: jest.fn(), info: jest.fn() };

        service = new ComplementaryTaskCategoryService(complementaryTaskCategoryRepo, logger);
    });

    // ---------------------------------------------------
    // getAllComplementaryTaskCategories
    // ---------------------------------------------------

    it("should return DTO list when getAllComplementaryTaskCategories succeeds", async () => {
        const domainObj = new ComplementaryTaskCategory("1", "CAT1", "Category1", "Description for 1", "60", new Date());

        complementaryTaskCategoryRepo.findAll.mockResolvedValue([domainObj]);
        complementaryTaskCategoryRepo.findByIds.mockResolvedValue([]);

        (ComplementaryTaskCategoryMap.toDTO as jest.Mock).mockReturnValue({
            id: "1",
            code: "CAT1"
        });

        const result = await service.getAllComplementaryTaskCategories();

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([{ id: "1", code: "CAT1" }]);
        expect(complementaryTaskCategoryRepo.findAll).toHaveBeenCalled();
    });

    it("should return fail() when getAllComplementaryTaskCategories throws error", async () => {
        complementaryTaskCategoryRepo.findAll.mockRejectedValue(new Error("DB error"));

        const result = await service.getAllComplementaryTaskCategories();

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Error getting all complementary task categories");
        expect(logger.error).toHaveBeenCalled();
    });

    // ---------------------------------------------------
    // getComplementaryTaskCategoryById
    // ---------------------------------------------------

    it("should return DTO when complementary task category exists", async () => {
        const domainObj = new ComplementaryTaskCategory("2", "CAT2", "Category2", "Description for 2", "90", new Date());

        complementaryTaskCategoryRepo.findById.mockResolvedValue(domainObj);

        (ComplementaryTaskCategoryMap.toDTO as jest.Mock).mockReturnValue({
            id: "2",
            code: "CAT2"
        });

        const result = await service.getComplementaryTaskCategoryById("2");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "2", code: "CAT2" });
    });

    it("should fail when complementary task category is not found by ID", async () => {
        complementaryTaskCategoryRepo.findById.mockResolvedValue(null);

        const result = await service.getComplementaryTaskCategoryById("999");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Incident type not found");
    });

    // ---------------------------------------------------
    // getComplementaryTaskCategoryByCode
    // ---------------------------------------------------

    it("should return DTO when complementary task category exists by code", async () => {
        const domainObj = new ComplementaryTaskCategory("5", "CAT5", "Category5", "Description for 5", "45", new Date());

        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(domainObj);

        (ComplementaryTaskCategoryMap.toDTO as jest.Mock).mockReturnValue({
            id: "5",
            code: "CAT5"
        });

        const result = await service.getComplementaryTaskCategoryByCode("CAT5");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "5", code: "CAT5" });
    });

    it("should fail when code does not exist", async () => {
        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(null);

        const result = await service.getComplementaryTaskCategoryByCode("XXX");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Complementary task category not found");
    });

    // ---------------------------------------------------
    // getComplementaryTaskCategoryByName
    // ---------------------------------------------------

    it("should return DTO when complementary task category exists by name", async () => {
        const domainObj = new ComplementaryTaskCategory("6", "CAT6", "MyCategory", "Description for 6", "120", new Date());

        complementaryTaskCategoryRepo.findByName.mockResolvedValue(domainObj);

        (ComplementaryTaskCategoryMap.toDTO as jest.Mock).mockReturnValue({
            id: "6",
            code: "CAT6"
        });

        const result = await service.getComplementaryTaskCategoryByName("MyCategory");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "6", code: "CAT6" });
    });

    it("should fail when name does not exist", async () => {
        complementaryTaskCategoryRepo.findByName.mockResolvedValue(null);

        const result = await service.getComplementaryTaskCategoryByName("UnknownName");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Complementary task category not found");
    });

    // ---------------------------------------------------
    // getComplementaryTaskCategoriesWithParent
    // ---------------------------------------------------

    it("should return categories filtered by parent existence", async () => {
        const domainObj = new ComplementaryTaskCategory("7", "CAT7", "Category7", "Description for 7", "30", new Date(), "PARENT1");

        complementaryTaskCategoryRepo.findWithParent.mockResolvedValue([domainObj]);

        (ComplementaryTaskCategoryMap.toDTO as jest.Mock).mockReturnValue({
            id: "7",
            code: "CAT7",
            parentComplementaryTaskCategoryCode: "PCODE"
        });

        complementaryTaskCategoryRepo.findByIds.mockResolvedValue([{ id: "PARENT1", code: "PCODE" }]);
        const result = await service.getComplementaryTaskCategoriesWithParent(true);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([
            { id: "7", code: "CAT7", parentComplementaryTaskCategoryCode: "PCODE" }
        ]);
    });

    it("should fail when repo throws in findWithParent", async () => {
        complementaryTaskCategoryRepo.findWithParent.mockRejectedValue(new Error("Repo fail"));

        const result = await service.getComplementaryTaskCategoriesWithParent(true);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Error getting complementary task categories with parent filter");
    });

    // ---------------------------------------------------
    // getComplementaryTaskCategoryByParent
    // ---------------------------------------------------

    it("should return children when parent exists", async () => {
        const parent = new ComplementaryTaskCategory("P1", "PARENT", "ParentCategory", "Parent category desc", "60", new Date());

        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(parent);

        const child = new ComplementaryTaskCategory("9", "CAT9", "Child", "Description for 9", "45", new Date(), "P1");

        complementaryTaskCategoryRepo.findByParent.mockResolvedValue([child]);

        (ComplementaryTaskCategoryMap.toDTO as jest.Mock).mockReturnValue({
            id: "9",
            code: "CAT9",
            parentComplementaryTaskCategoryCode: "PARENT"
        });

        const result = await service.getComplementaryTaskCategoryByParent("PARENT");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([
            { id: "9", code: "CAT9", parentComplementaryTaskCategoryCode: "PARENT" }
        ]);
    });

    it("should fail when parent code does not exist", async () => {
        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(null);

        const result = await service.getComplementaryTaskCategoryByParent("UNKNOWN");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Parent complementary task category not found");
    });

    it("should fail when repo throws in getComplementaryTaskCategoryByParent", async () => {
        complementaryTaskCategoryRepo.findByCode.mockRejectedValue(new Error("DB error"));

        const result = await service.getComplementaryTaskCategoryByParent("PARENT");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Error getting complementary task categories by parent code");
    });

    // ---------------------------------------------------
    // create
    // ---------------------------------------------------

    it("should create a complementary task category successfully", async () => {
        const dto = { code: "CAT3", name: "New Category", description: "New Description", duration: 60 };

        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(null); // no conflict
        complementaryTaskCategoryRepo.findByName.mockResolvedValue(null); // no conflict

        const domainCreated = new ComplementaryTaskCategory("3", "CAT3", "New Category", "New Description", "60", new Date());

        (ComplementaryTaskCategoryMap.toDomain as jest.Mock).mockReturnValue(domainCreated);

        complementaryTaskCategoryRepo.save.mockResolvedValue(domainCreated);

        (ComplementaryTaskCategoryMap.toDTO as jest.Mock).mockReturnValue({
            id: "3",
            code: "CAT3"
        });

        const result = await service.create(dto as any);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "3", code: "CAT3" });
    });

    it("should fail when creating a duplicated code", async () => {
        complementaryTaskCategoryRepo.findByCode.mockResolvedValue({ id: "99" });

        const dto = { code: "CAT99", name: "Dup", description: "Duplicate", duration: 30 };

        const result = await service.create(dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("already exists");
    });

    it("should fail when creating with duplicated name", async () => {
        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(null);
        complementaryTaskCategoryRepo.findByName.mockResolvedValue({ id: "88", name: "ExistingName" });

        const dto = { code: "CAT88", name: "ExistingName", description: "Category desc", duration: 30 };

        const result = await service.create(dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("already in use");
    });

    it("should fail when parent code not found", async () => {
        complementaryTaskCategoryRepo.findByCode.mockResolvedValueOnce(null); // check code
        complementaryTaskCategoryRepo.findByName.mockResolvedValue(null);
        complementaryTaskCategoryRepo.findByCode.mockResolvedValueOnce(null); // parent not found

        const dto = { code: "CAT10", name: "Child", description: "Category desc", duration: 30, parentComplementaryTaskCategoryCode: "UNKNOWN" };

        const result = await service.create(dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("not found");
    });

    // ---------------------------------------------------
    // update
    // ---------------------------------------------------

    it("should update a valid complementary task category", async () => {
        const existing = new ComplementaryTaskCategory("10", "U1", "Old", "Old category desc", "60", new Date());

        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(existing);
        complementaryTaskCategoryRepo.findByName.mockResolvedValue(null);
        complementaryTaskCategoryRepo.update.mockResolvedValue(existing);

        (ComplementaryTaskCategoryMap.toDTO as jest.Mock).mockReturnValue({
            id: "10",
            code: "U1",
            name: "Updated"
        });

        const dto = {
            code: "U1",
            name: "Updated",
            description: "Updated desc",
            duration: 90
        };

        const result = await service.update("U1", dto as any);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "10", code: "U1", name: "Updated" });
    });

    it("should fail update if code does not exist", async () => {
        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(null);

        const dto = { code: "X1", name: "A", description: "B", duration: 30 };

        const result = await service.update("X1", dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("not found");
    });

    it("should fail update if trying to change code", async () => {
        const existing = new ComplementaryTaskCategory("11", "U2", "Name", "Category desc", "60", new Date());

        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(existing);

        const dto = { code: "NEWCODE", name: "Name", description: "Category desc", duration: 60 };

        const result = await service.update("U2", dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("cannot be changed");
    });

    it("should fail update if name conflicts with another category", async () => {
        const existing = new ComplementaryTaskCategory("12", "U3", "OldName", "Category desc", "60", new Date());
        const conflict = new ComplementaryTaskCategory("13", "U4", "ConflictName", "Category desc", "60", new Date());

        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(existing);
        complementaryTaskCategoryRepo.findByName.mockResolvedValue(conflict);

        const dto = { code: "U3", name: "ConflictName", description: "Category desc", duration: 60 };

        const result = await service.update("U3", dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("already in use");
    });

    it("should fail update if category tries to be its own parent", async () => {
        const existing = new ComplementaryTaskCategory("14", "U5", "Name", "Category desc", "60", new Date());

        complementaryTaskCategoryRepo.findByCode.mockResolvedValue(existing);
        complementaryTaskCategoryRepo.findByName.mockResolvedValue(null);

        const dto = { code: "U5", name: "Name", description: "Category desc", duration: 60, parentComplementaryTaskCategoryCode: "U5" };

        const result = await service.update("U5", dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("cannot be its own parent");
    });

    it("should fail update when parent code not found", async () => {
        const existing = new ComplementaryTaskCategory("15", "U6", "Name", "Category desc", "60", new Date());

        complementaryTaskCategoryRepo.findByCode.mockResolvedValueOnce(existing);
        complementaryTaskCategoryRepo.findByName.mockResolvedValue(null);
        complementaryTaskCategoryRepo.findByCode.mockResolvedValueOnce(null); // parent not found

        const dto = { code: "U6", name: "Name", description: "Category desc", duration: 60, parentComplementaryTaskCategoryCode: "UNKNOWN" };

        const result = await service.update("U6", dto as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("not found");
    });
});
