import IncidentTypeService from "../../src/services/IncidentTypeService";
import { IncidentType } from "../../src/domain/IncidentType";
import { IncidentClassification } from "../../src/domain/IncidentQualification";
import { IncidentTypeMap } from "../../src/mappers/IncidentTypeMap";
import { Result } from "../../src/core/logic/Result";

// -----------------------------------------
// Fake Repository (Aggregated test style)
// -----------------------------------------
class IncidentTypeRepoFake {
  private data: IncidentType[] = [];

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
    return this.data.filter(x => hasParent ? x.parentIncidentTypeId != null : x.parentIncidentTypeId == null);
  }

  async findByClassification(classification: IncidentClassification) {
    return this.data.filter(x => x.classification === classification);
  }

  async findByParent(parentId: string) {
    return this.data.filter(x => x.parentIncidentTypeId === parentId);
  }

  async save(domain: IncidentType) {
    this.data.push(domain);
    return domain;
  }

  async update(domain: IncidentType) {
    const index = this.data.findIndex(x => x.id === domain.id);
    if (index === -1) return null;
    this.data[index] = domain;
    return domain;
  }

  async findByIds(ids: string[]): Promise<IncidentType[]> {
    return this.data.filter(i => ids.includes(i.id));
  } 
}

// Logger Fake
const loggerFake = {
  error: jest.fn(),
  info: jest.fn(),
};

describe("IncidentTypeService – Aggregate Tests", () => {

  let repo: IncidentTypeRepoFake;
  let service: IncidentTypeService;

  beforeEach(() => {
    repo = new IncidentTypeRepoFake();
    service = new IncidentTypeService(repo as any, loggerFake);
  });

  // ---------------------------------------------
  // CREATE – robust tests
  // ---------------------------------------------
  it("should create a new IncidentType (full aggregate flow)", async () => {
    const dto = { code: "C100", name: "AAA", description: "DESC", classification: IncidentClassification.Minor };

    const result = await service.create(dto as any);

    expect(result.isSuccess).toBe(true);

    const domain = await repo.findByCode("C100");
    expect(domain).not.toBeNull();
    expect(domain!.name).toBe("AAA");
  });

  it("should fail to create if code already exists", async () => {
    await repo.save(new IncidentType("1", "C100", "AAA", "D", IncidentClassification.Minor));

    const dto = { code: "C100", name: "BBB", description: "D", classification: IncidentClassification.Major };

    const result = await service.create(dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("already exists");
  });

  it("should fail if parent code does not exist", async () => {
    const dto = {
      code: "C200",
      name: "Test",
      description: "Desc",
      classification: IncidentClassification.Minor,
      parentIncidentTypeCode: "NOPE"
    };

    const result = await service.create(dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  it("should create with parent properly stored", async () => {
    await repo.save(new IncidentType("P1", "PCODE", "Parent", "Desc", IncidentClassification.Major));

    const dto = {
      code: "C201",
      name: "Child",
      description: "Desc",
      classification: IncidentClassification.Minor,
      parentIncidentTypeCode: "PCODE"
    };

    const result = await service.create(dto as any);

    expect(result.isSuccess).toBe(true);

    const created = await repo.findByCode("C201");
    expect(created?.parentIncidentTypeId).toBe("P1");
  });

  // ---------------------------------------------
  // GET by ID / CODE / NAME
  // ---------------------------------------------
  it("should get by ID including parent code resolution", async () => {
    const parent = new IncidentType("P1", "PCODE", "Parent", "desc", IncidentClassification.Major);
    const child = new IncidentType("C1", "CCODE", "Child", "desc", IncidentClassification.Minor, "P1");

    await repo.save(parent);
    await repo.save(child);

    const result = await service.getIncidentTypeById("C1");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().parentIncidentTypeCode).toBe("PCODE");
  });

  it("should return failure when ID not found", async () => {
    const result = await service.getIncidentTypeById("X1");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Incident type not found");
  });

  it("should get by code", async () => {
    await repo.save(new IncidentType("1", "CX", "Name", "desc", IncidentClassification.Minor));

    const result = await service.getIncidentTypeByCode("CX");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().code).toBe("CX");
  });

  it("should get by name", async () => {
    await repo.save(new IncidentType("1", "C10", "HELLO", "desc", IncidentClassification.Minor));

    const result = await service.getIncidentTypeByName("HELLO");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().name).toBe("HELLO");
  });

  // ---------------------------------------------
  // GET With Parent / Classification
  // ---------------------------------------------
  it("should get types with parent", async () => {
    await repo.save(new IncidentType("P1", "PX", "Parent", "desc", IncidentClassification.Minor));
    await repo.save(new IncidentType("C1", "CX", "Child", "desc", IncidentClassification.Minor, "P1"));

    const result = await service.getIncidentTypesWithParent(true);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(1);
  });

  it("should return error for invalid classification", async () => {
    const result = await service.getIncidentTypesByClassification("INVALID");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Invalid classification value");
  });

  it("should get types by classification", async () => {
    await repo.save(new IncidentType("1", "A", "Name1", "desc", IncidentClassification.Minor));
    await repo.save(new IncidentType("2", "B", "Name2", "desc", IncidentClassification.Major));

    const result = await service.getIncidentTypesByClassification("Minor");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(1);
  });

  // ---------------------------------------------
  // GET by Parent Code
  // ---------------------------------------------
  it("should return children for a valid parent code", async () => {
    const parent = new IncidentType("P1", "PCD", "Parent", "desc", IncidentClassification.Major);
    const child = new IncidentType("C1", "CX", "C", "desc", IncidentClassification.Minor, "P1");

    await repo.save(parent);
    await repo.save(child);

    const result = await service.getIncidentTypesByParent("PCD");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(1);
  });

  it("should fail if parent code does not exist", async () => {
    const result = await service.getIncidentTypesByParent("NOPE");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Parent incident type not found");
  });

  // ---------------------------------------------
  // UPDATE – robust testing
  // ---------------------------------------------
  it("should update incident type fully", async () => {
    await repo.save(new IncidentType("U1", "UCODE", "Old", "Old desc", IncidentClassification.Minor));

    const dto = {
      code: "UCODE",
      name: "New Name",
      description: "New Desc",
      classification: IncidentClassification.Critical
    };

    const result = await service.update("UCODE", dto as any);

    expect(result.isSuccess).toBe(true);

    const updated = await repo.findByCode("UCODE");
    expect(updated?.name).toBe("New Name");
    expect(updated?.classification).toBe(IncidentClassification.Critical);
  });

  it("should block update when name already in use by another item", async () => {
    await repo.save(new IncidentType("1", "A", "AAA", "desc", IncidentClassification.Minor));
    await repo.save(new IncidentType("2", "B", "BBB", "desc", IncidentClassification.Minor));

    const dto = {
      code: "A",
      name: "BBB", // conflict
      description: "x",
      classification: IncidentClassification.Minor
    };

    const result = await service.update("A", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("already in use");
  });

  it("should block updating to a different conflicting code", async () => {
    await repo.save(new IncidentType("1", "A", "AAA", "desc", IncidentClassification.Minor));
    await repo.save(new IncidentType("2", "B", "BBB", "desc", IncidentClassification.Minor));

    const dto = {
      code: "B", // conflicting code
      name: "AAA",
      description: "x",
      classification: IncidentClassification.Minor
    };

    const result = await service.update("A", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("IncidentType code cannot be changed.");
  });

  it("should fail if update throws domain validation error", async () => {
    await repo.save(new IncidentType("1", "AAA", "Name", "Desc", IncidentClassification.Minor));

    const dto = {
      code: "AAA",
      name: "", // invalid name => domain validation should fail
      description: "New",
      classification: IncidentClassification.Minor
    };

    const result = await service.update("AAA", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("Error: Incident type name cannot be null or empty.");
  });
});
