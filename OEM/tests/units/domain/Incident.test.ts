import { Incident } from "../../../src/domain/Incident";
import { IncidentStatus } from "../../../src/domain/IncidentStatus";
import { IncidentType } from "../../../src/domain/IncidentType";
import { IncidentClassification } from "../../../src/domain/IncidentQualification";

describe("Incident (unit tests)", () => {

  const mockIncidentType = new IncidentType(
    "1",
    "TYPE001",
    "Test Type",
    "Test incident type",
    IncidentClassification.Minor
  );

  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const validData = {
    id: "1",
    incidentType: mockIncidentType,
    startDate: yesterday,
    endDate: null,
    status: IncidentStatus.Active,
    description: "Valid incident description",
    systemUserID: "user123",
    lastUpdated: new Date(),
    duration: null,
    vesselVisitExecutions: null
  };

  // ------------------------------------------------------------
  // Constructor validation
  // ------------------------------------------------------------

  it("should create an Incident with valid data", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      validData.duration,
      validData.vesselVisitExecutions
    );

    expect(incident.id).toBe("1");
    expect(incident.incidentType).toBe(mockIncidentType);
    expect(incident.startDate).toBe(yesterday);
    expect(incident.endDate).toBeNull();
    expect(incident.status).toBe(IncidentStatus.Active);
    expect(incident.description).toBe("Valid incident description");
    expect(incident.duration).toBeNull();
  });

  it("should create an Incident with end date", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      today,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      validData.duration,
      validData.vesselVisitExecutions
    );

    expect(incident.endDate).toBe(today);
  });

  it("should create an Incident with duration", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      120,
      validData.vesselVisitExecutions
    );

    expect(incident.duration).toBe(120);
  });

  it("should throw error if start date is not a valid date", () => {
    expect(() =>
      new Incident(
        validData.id,
        validData.incidentType,
        new Date("invalid"),
        validData.endDate,
        validData.status,
        validData.description,
        validData.systemUserID,
        validData.lastUpdated,
        validData.duration,
        validData.vesselVisitExecutions
      )
    ).toThrow("Start date must be a valid date.");
  });

  it("should throw error if start date is more than one week in the past", () => {
    const oldDate = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);

    expect(() =>
      new Incident(
        validData.id,
        validData.incidentType,
        oldDate,
        validData.endDate,
        validData.status,
        validData.description,
        validData.systemUserID,
        validData.lastUpdated,
        validData.duration,
        validData.vesselVisitExecutions
      )
    ).toThrow("Start date cannot be more than one week before today.");
  });

  it("should throw error if end date is not a valid date", () => {
    expect(() =>
      new Incident(
        validData.id,
        validData.incidentType,
        validData.startDate,
        new Date("invalid"),
        validData.status,
        validData.description,
        validData.systemUserID,
        validData.lastUpdated,
        validData.duration,
        validData.vesselVisitExecutions
      )
    ).toThrow("End date must be a valid date or null.");
  });

  it("should throw error if end date is before start date", () => {
    const startDate = today;
    const endDate = yesterday;

    expect(() =>
      new Incident(
        validData.id,
        validData.incidentType,
        startDate,
        endDate,
        validData.status,
        validData.description,
        validData.systemUserID,
        validData.lastUpdated,
        validData.duration,
        validData.vesselVisitExecutions
      )
    ).toThrow("End date cannot be earlier than start date.");
  });

  it("should throw error if status is invalid", () => {
    expect(() =>
      new Incident(
        validData.id,
        validData.incidentType,
        validData.startDate,
        validData.endDate,
        "InvalidStatus" as IncidentStatus,
        validData.description,
        validData.systemUserID,
        validData.lastUpdated,
        validData.duration,
        validData.vesselVisitExecutions
      )
    ).toThrow("Invalid incident status.");
  });

  it("should throw error if description is empty", () => {
    expect(() =>
      new Incident(
        validData.id,
        validData.incidentType,
        validData.startDate,
        validData.endDate,
        validData.status,
        "",
        validData.systemUserID,
        validData.lastUpdated,
        validData.duration,
        validData.vesselVisitExecutions
      )
    ).toThrow("Incident description cannot be null or empty.");
  });

  it("should throw error if description has less than two words", () => {
    expect(() =>
      new Incident(
        validData.id,
        validData.incidentType,
        validData.startDate,
        validData.endDate,
        validData.status,
        "OneWord",
        validData.systemUserID,
        validData.lastUpdated,
        validData.duration,
        validData.vesselVisitExecutions
      )
    ).toThrow("Incident description must contain at least two words.");
  });

  it("should throw error if duration is negative", () => {
    expect(() =>
      new Incident(
        validData.id,
        validData.incidentType,
        validData.startDate,
        validData.endDate,
        validData.status,
        validData.description,
        validData.systemUserID,
        validData.lastUpdated,
        -10,
        validData.vesselVisitExecutions
      )
    ).toThrow("Incident duration must be a non-negative number or null.");
  });

  it("should throw error if duration is not a number", () => {
    expect(() =>
      new Incident(
        validData.id,
        validData.incidentType,
        validData.startDate,
        validData.endDate,
        validData.status,
        validData.description,
        validData.systemUserID,
        validData.lastUpdated,
        NaN,
        validData.vesselVisitExecutions
      )
    ).toThrow("Incident duration must be a non-negative number or null.");
  });

  // ------------------------------------------------------------
  // updateEndDate()
  // ------------------------------------------------------------

  it("should update end date with a valid value", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      new Date("2025-01-01"),
      validData.duration,
      validData.vesselVisitExecutions
    );

    incident.updateEndDate(today);
    expect(incident.endDate).toBe(today);
    expect(incident.lastUpdated.getTime()).toBeGreaterThan(new Date("2025-01-01").getTime());
  });

  it("should throw error when updating end date with invalid date", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      validData.duration,
      validData.vesselVisitExecutions
    );

    expect(() => incident.updateEndDate(new Date("invalid"))).toThrow(
      "End date must be a valid date or null."
    );
  });

  it("should throw error when updating end date before start date", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      today,
      null,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      validData.duration,
      validData.vesselVisitExecutions
    );

    expect(() => incident.updateEndDate(yesterday)).toThrow(
      "End date cannot be earlier than start date."
    );
  });

  // ------------------------------------------------------------
  // updateStatus()
  // ------------------------------------------------------------

  it("should update status with a valid value", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      new Date("2025-01-01"),
      validData.duration,
      validData.vesselVisitExecutions
    );

    incident.updateStatus(IncidentStatus.Resolved);
    expect(incident.status).toBe(IncidentStatus.Resolved);
    expect(incident.lastUpdated.getTime()).toBeGreaterThan(new Date("2025-01-01").getTime());
  });

  it("should throw error when updating status with invalid value", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      validData.duration,
      validData.vesselVisitExecutions
    );

    expect(() => incident.updateStatus("InvalidStatus" as IncidentStatus)).toThrow(
      "Invalid incident status."
    );
  });

  // ------------------------------------------------------------
  // updateDescription()
  // ------------------------------------------------------------

  it("should update description with a valid value", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      new Date("2025-01-01"),
      validData.duration,
      validData.vesselVisitExecutions
    );

    incident.updateDescription("Updated incident description");
    expect(incident.description).toBe("Updated incident description");
    expect(incident.lastUpdated.getTime()).toBeGreaterThan(new Date("2025-01-01").getTime());
  });

  it("should throw error when updating description with empty value", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      validData.duration,
      validData.vesselVisitExecutions
    );

    expect(() => incident.updateDescription("")).toThrow(
      "Incident description cannot be null or empty."
    );
  });

  it("should throw error when updating description with less than two words", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      validData.duration,
      validData.vesselVisitExecutions
    );

    expect(() => incident.updateDescription("OneWord")).toThrow(
      "Incident description must contain at least two words."
    );
  });

  // ------------------------------------------------------------
  // updateDuration()
  // ------------------------------------------------------------

  it("should update duration with a valid value", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      new Date("2025-01-01"),
      validData.duration,
      validData.vesselVisitExecutions
    );

    incident.updateDuration(180);
    expect(incident.duration).toBe(180);
    expect(incident.lastUpdated.getTime()).toBeGreaterThan(new Date("2025-01-01").getTime());
  });

  it("should update duration to null", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      120,
      validData.vesselVisitExecutions
    );

    incident.updateDuration(null);
    expect(incident.duration).toBeNull();
  });

  it("should throw error when updating duration with negative value", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      validData.lastUpdated,
      validData.duration,
      validData.vesselVisitExecutions
    );

    expect(() => incident.updateDuration(-5)).toThrow(
      "Incident duration must be a non-negative number or null."
    );
  });

  // ------------------------------------------------------------
  // updateVesselVisitExecutions()
  // ------------------------------------------------------------

  it("should update vessel visit executions", () => {
    const incident = new Incident(
      validData.id,
      validData.incidentType,
      validData.startDate,
      validData.endDate,
      validData.status,
      validData.description,
      validData.systemUserID,
      new Date("2025-01-01"),
      validData.duration,
      validData.vesselVisitExecutions
    );

    const mockVVE: any[] = [];
    incident.updateVesselVisitExecutions(mockVVE);
    expect(incident.vesselVisitExecutions).toBe(mockVVE);
    expect(incident.lastUpdated.getTime()).toBeGreaterThan(new Date("2025-01-01").getTime());
  });

});
