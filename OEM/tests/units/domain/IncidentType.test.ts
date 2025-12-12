import { IncidentType } from "../../../src/domain/IncidentType";
import { IncidentClassification } from "../../../src/domain/IncidentQualification";

describe("IncidentType (unit tests)", () => {

  const validData = {
    id: "1",
    code: "CODE1",
    name: "Test Incident",
    description: "A valid incident",
    classification: IncidentClassification.Minor
  };

  // ------------------------------------------------------------
  // Constructor validation
  // ------------------------------------------------------------

  it("should create an IncidentType with valid data", () => {
    const incident = new IncidentType(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.classification
    );

    expect(incident.id).toBe("1");
    expect(incident.code).toBe("CODE1");
    expect(incident.name).toBe("Test Incident");
    expect(incident.description).toBe("A valid incident");
    expect(incident.classification).toBe(IncidentClassification.Minor);
  });

  it("should throw error if name is empty", () => {
    expect(() =>
      new IncidentType(
        validData.id,
        validData.code,
        "",
        validData.description,
        validData.classification
      )
    ).toThrow("Incident type name cannot be null or empty.");
  });

  it("should throw error if code is empty", () => {
    expect(() =>
      new IncidentType(
        validData.id,
        "",
        validData.name,
        validData.description,
        validData.classification
      )
    ).toThrow("Incident type code cannot be null or empty.");
  });

  it("should throw error if code exceeds 10 characters", () => {
    expect(() =>
      new IncidentType(
        validData.id,
        "12345678901", // 11 chars
        validData.name,
        validData.description,
        validData.classification
      )
    ).toThrow("Incident type code cannot exceed 10 characters.");
  });

  it("should throw error if description is empty", () => {
    expect(() =>
      new IncidentType(
        validData.id,
        validData.code,
        validData.name,
        "",
        validData.classification
      )
    ).toThrow("Incident type description cannot be null or empty.");
  });

  // ------------------------------------------------------------
  // updateName()
  // ------------------------------------------------------------
  
  it("should update name with a valid value", () => {
    const incident = new IncidentType(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.classification
    );

    incident.updateName("Updated Name");
    expect(incident.name).toBe("Updated Name");
  });

  it("should throw error when updating name with empty value", () => {
    const incident = new IncidentType(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.classification
    );

    expect(() => incident.updateName("")).toThrow(
      "Incident type name cannot be null or empty."
    );
  });

  // ------------------------------------------------------------
  // updateDescription()
  // ------------------------------------------------------------

  it("should update description with a valid value", () => {
    const incident = new IncidentType(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.classification
    );

    incident.updateDescription("Updated description");
    expect(incident.description).toBe("Updated description");
  });

  it("should throw error when updating description with empty value", () => {
    const incident = new IncidentType(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.classification
    );

    expect(() => incident.updateDescription("")).toThrow(
      "Incident type description cannot be null or empty."
    );
  });

  // ------------------------------------------------------------
  // updateClassification()
  // ------------------------------------------------------------

  it("should update classification", () => {
    const incident = new IncidentType(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.classification
    );

    incident.updateClassification(IncidentClassification.Critical);
    expect(incident.classification).toBe(IncidentClassification.Critical);
  });

  // ------------------------------------------------------------
  // updateParentIncidentType()
  // ------------------------------------------------------------

  it("should update parent incident type id", () => {
    const incident = new IncidentType(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.classification
    );

    incident.updateParentIncidentType("PARENT1");
    expect(incident.parentIncidentTypeId).toBe("PARENT1");
  });

  it("should allow clearing the parent incident type id", () => {
    const incident = new IncidentType(
      validData.id,
      validData.code,
      validData.name,
      validData.description,
      validData.classification,
      "PARENT1"
    );

    incident.updateParentIncidentType(undefined);
    expect(incident.parentIncidentTypeId).toBeUndefined();
  });

});
