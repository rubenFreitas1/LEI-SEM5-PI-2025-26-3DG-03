import ComplementaryTaskCategoryService from "../../src/services/ComplementaryTaskCategoryService";
import { ComplementaryTaskCategory } from "../../src/domain/ComplementaryTaskCategory";
import { ComplementaryTaskCategoryMap } from "../../src/mappers/ComplementaryTaskCategoryMap";
import { Result } from "../../src/core/logic/Result";

// -----------------------------------------
// Fake Repository (Aggregated test style)
// -----------------------------------------
class ComplementaryTaskCategoryRepoFake {
  private data: ComplementaryTaskCategory[] = [];

  async findAll() {
    return this.data;
  }

  async findById(id: string) {
    return this.data.find(x => x.id === id) ?? null;
  }

  async findByCode(code: string) {
    return this.data.find(x => x.code === code) ?? null;
  }

  async findByName(name: string) {
    return this.data.find(x => x.name === name) ?? null;
  }

  async findWithParent(hasParent: boolean) {
    return this.data.filter(x => hasParent ? x.parentComplementaryTaskCategoryId != null : x.parentComplementaryTaskCategoryId == null);
  }

  async findByParent(parentId: string) {
    return this.data.filter(x => x.parentComplementaryTaskCategoryId === parentId);
  }

  async save(domain: ComplementaryTaskCategory) {
    this.data.push(domain);
    return domain;
  }

  async update(domain: ComplementaryTaskCategory) {
    const index = this.data.findIndex(x => x.id === domain.id);
    if (index === -1) return null;
    this.data[index] = domain;
    return domain;
  }

  async findByIds(ids: string[]): Promise<ComplementaryTaskCategory[]> {
    return this.data.filter(i => ids.includes(i.id));
  } 
}

// Logger Fake
const loggerFake = {
  error: jest.fn(),
  info: jest.fn(),
};

describe("ComplementaryTaskCategoryService – Aggregate Tests", () => {

  let repo: ComplementaryTaskCategoryRepoFake;
  let service: ComplementaryTaskCategoryService;

  beforeEach(() => {
    repo = new ComplementaryTaskCategoryRepoFake();
    service = new ComplementaryTaskCategoryService(repo as any, loggerFake);
  });

  // ---------------------------------------------
  // CREATE – robust tests
  // ---------------------------------------------
  it("should create a new ComplementaryTaskCategory (full aggregate flow)", async () => {
    const dto = { code: "C100", name: "AAA", description: "DESC AAA", duration: "2h" };

    const result = await service.create(dto as any);

    expect(result.isSuccess).toBe(true);

    const domain = await repo.findByCode("C100");
    expect(domain).not.toBeNull();
    expect(domain!.name).toBe("AAA");
  });

  it("should create with null duration", async () => {
    const dto = { code: "C101", name: "BBB", description: "DESC BBB", duration: null };

    const result = await service.create(dto as any);

    expect(result.isSuccess).toBe(true);

    const domain = await repo.findByCode("C101");
    expect(domain).not.toBeNull();
    expect(domain!.duration).toBeNull();
  });

  it("should fail to create if code already exists", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "C100", "AAA", "DESC AAA", "1h", new Date()));

    const dto = { code: "C100", name: "BBB", description: "DESC BBB", duration: "2h" };

    const result = await service.create(dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("already exists");
  });

  it("should fail to create if name already exists", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "C100", "AAA", "DESC AAA", null, new Date()));

    const dto = { code: "C200", name: "AAA", description: "DESC BBB", duration: null };

    const result = await service.create(dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("already in use");
  });

  it("should fail if parent code does not exist", async () => {
    const dto = {
      code: "C200",
      name: "Test",
      description: "Desc Test",
      duration: null,
      parentComplementaryTaskCategoryCode: "NOPE"
    };

    const result = await service.create(dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  it("should create with parent properly stored", async () => {
    await repo.save(new ComplementaryTaskCategory("P1", "PCODE", "Parent", "Parent Desc", null, new Date()));

    const dto = {
      code: "C201",
      name: "Child",
      description: "Child Desc",
      duration: "3h",
      parentComplementaryTaskCategoryCode: "PCODE"
    };

    const result = await service.create(dto as any);

    expect(result.isSuccess).toBe(true);

    const created = await repo.findByCode("C201");
    expect(created?.parentComplementaryTaskCategoryId).toBe("P1");
  });

  it("should fail to create with invalid code (empty)", async () => {
    const dto = {
      code: "",
      name: "Test Name",
      description: "Test Desc",
      duration: null
    };

    const result = await service.create(dto as any);

    expect(result.isFailure).toBe(true);
  });

  it("should fail to create with invalid code (too long)", async () => {
    const dto = {
      code: "THISCODETOOLONG",
      name: "Test Name",
      description: "Test Desc",
      duration: null
    };

    const result = await service.create(dto as any);

    expect(result.isFailure).toBe(true);
  });

  it("should fail to create with invalid name (empty)", async () => {
    const dto = {
      code: "VALID",
      name: "",
      description: "Test Desc",
      duration: null
    };

    const result = await service.create(dto as any);

    expect(result.isFailure).toBe(true);
  });

  it("should fail to create with invalid description (less than 2 words)", async () => {
    const dto = {
      code: "VALID",
      name: "Valid Name",
      description: "Oneword",
      duration: null
    };

    const result = await service.create(dto as any);

    expect(result.isFailure).toBe(true);
  });

  // ---------------------------------------------
  // GET by ID / CODE / NAME
  // ---------------------------------------------
  it("should get by ID including parent code resolution", async () => {
    const parent = new ComplementaryTaskCategory("P1", "PCODE", "Parent", "Parent desc", null, new Date());
    const child = new ComplementaryTaskCategory("C1", "CCODE", "Child", "Child desc", "2h", new Date(), "P1");

    await repo.save(parent);
    await repo.save(child);

    const result = await service.getComplementaryTaskCategoryById("C1");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().parentComplementaryTaskCategoryCode).toBe("PCODE");
  });

  it("should return failure when ID not found", async () => {
    const result = await service.getComplementaryTaskCategoryById("X1");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  it("should get by code", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "CX", "Name", "Name desc", "1h", new Date()));

    const result = await service.getComplementaryTaskCategoryByCode("CX");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().code).toBe("CX");
  });

  it("should get by name", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "C10", "HELLO", "Hello desc", null, new Date()));

    const result = await service.getComplementaryTaskCategoryByName("HELLO");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().name).toBe("HELLO");
  });

  it("should fail when getting by non-existent code", async () => {
    const result = await service.getComplementaryTaskCategoryByCode("NOPE");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  it("should fail when getting by non-existent name", async () => {
    const result = await service.getComplementaryTaskCategoryByName("NOPE");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  // ---------------------------------------------
  // GET With Parent
  // ---------------------------------------------
  it("should get categories with parent", async () => {
    await repo.save(new ComplementaryTaskCategory("P1", "PX", "Parent", "Parent desc", null, new Date()));
    await repo.save(new ComplementaryTaskCategory("C1", "CX", "Child", "Child desc", "2h", new Date(), "P1"));

    const result = await service.getComplementaryTaskCategoriesWithParent(true);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(1);
  });

  it("should get categories without parent", async () => {
    await repo.save(new ComplementaryTaskCategory("P1", "PX", "Parent", "Parent desc", null, new Date()));
    await repo.save(new ComplementaryTaskCategory("C1", "CX", "Child", "Child desc", "2h", new Date(), "P1"));

    const result = await service.getComplementaryTaskCategoriesWithParent(false);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(1);
  });

  // ---------------------------------------------
  // GET by Parent Code
  // ---------------------------------------------
  it("should return children for a valid parent code", async () => {
    const parent = new ComplementaryTaskCategory("P1", "PCD", "Parent", "Parent desc", null, new Date());
    const child = new ComplementaryTaskCategory("C1", "CX", "C", "C desc", "1h", new Date(), "P1");

    await repo.save(parent);
    await repo.save(child);

    const result = await service.getComplementaryTaskCategoryByParent("PCD");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(1);
  });

  it("should fail if parent code does not exist", async () => {
    const result = await service.getComplementaryTaskCategoryByParent("NOPE");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  // ---------------------------------------------
  // GET All
  // ---------------------------------------------
  it("should get all complementary task categories", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "C1", "Cat1", "Cat1 desc", "1h", new Date()));
    await repo.save(new ComplementaryTaskCategory("2", "C2", "Cat2", "Cat2 desc", null, new Date()));

    const result = await service.getAllComplementaryTaskCategories();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(2);
  });

  // ---------------------------------------------
  // UPDATE – robust testing
  // ---------------------------------------------
  it("should update complementary task category fully", async () => {
    await repo.save(new ComplementaryTaskCategory("U1", "UCODE", "Old", "Old desc", "1h", new Date()));

    const dto = {
      code: "UCODE",
      name: "New Name",
      description: "New Desc",
      duration: "3h"
    };

    const result = await service.update("UCODE", dto as any);

    expect(result.isSuccess).toBe(true);

    const updated = await repo.findByCode("UCODE");
    expect(updated?.name).toBe("New Name");
    expect(updated?.duration).toBe("3h");
  });

  it("should update duration to null", async () => {
    await repo.save(new ComplementaryTaskCategory("U1", "UCODE", "Name", "Name desc", "2h", new Date()));

    const dto = {
      code: "UCODE",
      name: "Name",
      description: "Name desc",
      duration: null
    };

    const result = await service.update("UCODE", dto as any);

    expect(result.isSuccess).toBe(true);

    const updated = await repo.findByCode("UCODE");
    expect(updated?.duration).toBeNull();
  });

  it("should block update when name already in use by another item", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "A", "AAA", "AAA desc", null, new Date()));
    await repo.save(new ComplementaryTaskCategory("2", "B", "BBB", "BBB desc", null, new Date()));

    const dto = {
      code: "A",
      name: "BBB", // conflict
      description: "AAA desc",
      duration: null
    };

    const result = await service.update("A", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("already in use");
  });

  it("should block updating to a different conflicting code", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "A", "AAA", "AAA desc", null, new Date()));
    await repo.save(new ComplementaryTaskCategory("2", "B", "BBB", "BBB desc", null, new Date()));

    const dto = {
      code: "B", // conflicting code
      name: "AAA",
      description: "AAA desc",
      duration: null
    };

    const result = await service.update("A", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("code cannot be changed");
  });

  it("should fail if update throws domain validation error", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "AAA", "Name", "Name Desc", null, new Date()));

    const dto = {
      code: "AAA",
      name: "", // invalid name => domain validation should fail
      description: "New",
      duration: null
    };

    const result = await service.update("AAA", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("Error:");
  });

  it("should fail to update non-existent category", async () => {
    const dto = {
      code: "NOPE",
      name: "Name",
      description: "Name Desc",
      duration: null
    };

    const result = await service.update("NOPE", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  it("should fail to update with self as parent", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "CODE1", "Name", "Name desc", null, new Date()));

    const dto = {
      code: "CODE1",
      name: "Name",
      description: "Name desc",
      duration: null,
      parentComplementaryTaskCategoryCode: "CODE1"
    };

    const result = await service.update("CODE1", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("own parent");
  });

  it("should fail to update with non-existent parent", async () => {
    await repo.save(new ComplementaryTaskCategory("1", "CODE1", "Name", "Name desc", null, new Date()));

    const dto = {
      code: "CODE1",
      name: "Name",
      description: "Name desc",
      duration: null,
      parentComplementaryTaskCategoryCode: "NONEXISTENT"
    };

    const result = await service.update("CODE1", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  it("should update parent successfully", async () => {
    const parent1 = new ComplementaryTaskCategory("P1", "PAR1", "Parent1", "Parent1 desc", null, new Date());
    const parent2 = new ComplementaryTaskCategory("P2", "PAR2", "Parent2", "Parent2 desc", null, new Date());
    const cat = new ComplementaryTaskCategory("C1", "CAT1", "Cat", "Cat desc", null, new Date(), "P1");

    await repo.save(parent1);
    await repo.save(parent2);
    await repo.save(cat);

    const dto = {
      code: "CAT1",
      name: "Cat",
      description: "Cat desc",
      duration: null,
      parentComplementaryTaskCategoryCode: "PAR2"
    };

    const result = await service.update("CAT1", dto as any);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().parentComplementaryTaskCategoryCode).toBe("PAR2");
  });

  it("should remove parent successfully", async () => {
    const parent = new ComplementaryTaskCategory("P1", "PAR1", "Parent", "Parent desc", null, new Date());
    const cat = new ComplementaryTaskCategory("C1", "CAT1", "Cat", "Cat desc", null, new Date(), "P1");

    await repo.save(parent);
    await repo.save(cat);

    const dto = {
      code: "CAT1",
      name: "Cat",
      description: "Cat desc",
      duration: null
    };

    const result = await service.update("CAT1", dto as any);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().parentComplementaryTaskCategoryCode).toBeUndefined();
  });
});
