import { ComplementaryTaskCategory } from "../../../src/domain/ComplementaryTaskCategory";

describe("ComplementaryTaskCategory (unit tests)", () => {

  const validData = {
    id: "1",
    code: "CODE1",
    name: "Test Category",
    description: "Valid category description",
    duration: "PT2H",
    lastUpdated: new Date()
  };

  // ------------------------------------------------------------
  // Constructor validation
  // ------------------------------------------------------------

  it("should create a ComplementaryTaskCategory with valid data", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      validData.lastUpdated
    );

    expect(category.id).toBe("1");
    expect(category.code).toBe("CODE1");
    expect(category.name).toBe("Test Category");
    expect(category.description).toBe("Valid category description");
    expect(category.duration).toBe("PT2H");
  });

  it("should create a ComplementaryTaskCategory with null duration", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      null,
      validData.lastUpdated
    );

    expect(category.duration).toBeNull();
  });

  it("should create a ComplementaryTaskCategory with parent", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      validData.lastUpdated,
      "parent123"
    );

    expect(category.parentComplementaryTaskCategoryId).toBe("parent123");
  });

  it("should throw error if code is empty", () => {
    expect(() =>
      new ComplementaryTaskCategory(
        validData.id,
        "",
        validData.name,
        validData.description,
        validData.duration,
        validData.lastUpdated
      )
    ).toThrow("Complementary task category code cannot be null or empty.");
  });

  it("should throw error if code exceeds 10 characters", () => {
    expect(() =>
      new ComplementaryTaskCategory(
        validData.id,
        "12345678901", // 11 chars
        validData.name,
        validData.description,
        validData.duration,
        validData.lastUpdated
      )
    ).toThrow("Complementary task category code cannot exceed 10 characters.");
  });

  it("should throw error if name is empty", () => {
    expect(() =>
      new ComplementaryTaskCategory(
        validData.id,
        validData.code,
        "",
        validData.description,
        validData.duration,
        validData.lastUpdated
      )
    ).toThrow("Complementary task category name cannot be null or empty.");
  });

  it("should throw error if description is empty", () => {
    expect(() =>
      new ComplementaryTaskCategory(
        validData.id,
        validData.code,
        validData.name,
        "",
        validData.duration,
        validData.lastUpdated
      )
    ).toThrow("Complementary task category description cannot be null or empty.");
  });

  it("should throw error if description has less than two words", () => {
    expect(() =>
      new ComplementaryTaskCategory(
        validData.id,
        validData.code,
        validData.name,
        "OneWord",
        validData.duration,
        validData.lastUpdated
      )
    ).toThrow("Complementary task category description must contain at least two words.");
  });

  // ------------------------------------------------------------
  // updateName()
  // ------------------------------------------------------------

  it("should update name with a valid value", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      new Date("2025-01-01")
    );

    category.updateName("Updated Name");
    expect(category.name).toBe("Updated Name");
    expect(category.lastUpdated.getTime()).toBeGreaterThan(new Date("2025-01-01").getTime());
  });

  it("should throw error when updating name with empty value", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      validData.lastUpdated
    );

    expect(() => category.updateName("")).toThrow(
      "Complementary task category name cannot be null or empty."
    );
  });

  // ------------------------------------------------------------
  // updateDescription()
  // ------------------------------------------------------------

  it("should update description with a valid value", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      new Date("2025-01-01")
    );

    category.updateDescription("Updated category description");
    expect(category.description).toBe("Updated category description");
    expect(category.lastUpdated.getTime()).toBeGreaterThan(new Date("2025-01-01").getTime());
  });

  it("should throw error when updating description with empty value", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      validData.lastUpdated
    );

    expect(() => category.updateDescription("")).toThrow(
      "Complementary task category description cannot be null or empty."
    );
  });

  it("should throw error when updating description with less than two words", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      validData.lastUpdated
    );

    expect(() => category.updateDescription("OneWord")).toThrow(
      "Complementary task category description must contain at least two words."
    );
  });

  // ------------------------------------------------------------
  // updateDuration()
  // ------------------------------------------------------------

  it("should update duration with a valid value", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      new Date("2025-01-01")
    );

    category.updateDuration("PT3H");
    expect(category.duration).toBe("PT3H");
    expect(category.lastUpdated.getTime()).toBeGreaterThan(new Date("2025-01-01").getTime());
  });

  it("should update duration to null", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      validData.lastUpdated
    );

    category.updateDuration(null);
    expect(category.duration).toBeNull();
  });

  // ------------------------------------------------------------
  // updateParentComplementaryTaskCategory()
  // ------------------------------------------------------------

  it("should update parent complementary task category id", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      new Date("2025-01-01")
    );

    category.updateParentComplementaryTaskCategory("PARENT1");
    expect(category.parentComplementaryTaskCategoryId).toBe("PARENT1");
    expect(category.lastUpdated.getTime()).toBeGreaterThan(new Date("2025-01-01").getTime());
  });

  it("should allow clearing the parent complementary task category id", () => {
    const category = new ComplementaryTaskCategory(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.duration,
      validData.lastUpdated,
      "PARENT1"
    );

    category.updateParentComplementaryTaskCategory(undefined);
    expect(category.parentComplementaryTaskCategoryId).toBeUndefined();
  });

});
