import { VesselVisitExecution } from "../../../src/domain/VesselVisitExecution";
import { VesselVisitExecutionStatus } from "../../../src/domain/VesselVisitExecutionStatus";

describe("VesselVisitExecution (unit tests)", () => {

  const pastDate = new Date("2025-01-15");
  const validData = {
    id: "1",
    code: "2025-PA-000001",
    vesselIMO: "9074729",
    status: VesselVisitExecutionStatus.InProgress,
    arrivalDate: pastDate,
    lastUpdated: new Date(),
    systemUserID: "user123"
  };

  // ------------------------------------------------------------
  // Constructor validation
  // ------------------------------------------------------------

  it("should create a VesselVisitExecution with valid data", () => {
    const execution = new VesselVisitExecution(
      validData.id,
      validData.code,
      validData.vesselIMO,
      validData.status,
      validData.arrivalDate,
      validData.lastUpdated,
      validData.systemUserID
    );

    expect(execution.id).toBe("1");
    expect(execution.code).toBe("2025-PA-000001");
    expect(execution.vesselIMO).toBe("9074729");
    expect(execution.status).toBe(VesselVisitExecutionStatus.InProgress);
    expect(execution.arrivalDate).toBe(pastDate);
    expect(execution.systemUserID).toBe("user123");
    expect(execution.departureDate).toBeUndefined();
  });

  it("should create a VesselVisitExecution with departure date", () => {
    const departureDatePast = new Date("2025-01-20");
    const execution = new VesselVisitExecution(
      validData.id,
      validData.code,
      validData.vesselIMO,
      validData.status,
      validData.arrivalDate,
      validData.lastUpdated,
      validData.systemUserID,
      departureDatePast
    );

    expect(execution.departureDate).toBe(departureDatePast);
  });

  it("should throw error if code is empty", () => {
    expect(() =>
      new VesselVisitExecution(
        validData.id,
        "",
        validData.vesselIMO,
        validData.status,
        validData.arrivalDate,
        validData.lastUpdated,
        validData.systemUserID
      )
    ).toThrow("Vessel Visit Execution code cannot be null or empty.");
  });

  it("should throw error if code does not match pattern", () => {
    expect(() =>
      new VesselVisitExecution(
        validData.id,
        "INVALID-CODE",
        validData.vesselIMO,
        validData.status,
        validData.arrivalDate,
        validData.lastUpdated,
        validData.systemUserID
      )
    ).toThrow("Vessel Visit Execution code must match pattern 'YYYY-PA-XXXXXX'.");
  });

  it("should throw error if code pattern is incorrect (wrong year format)", () => {
    expect(() =>
      new VesselVisitExecution(
        validData.id,
        "25-PA-000001",
        validData.vesselIMO,
        validData.status,
        validData.arrivalDate,
        validData.lastUpdated,
        validData.systemUserID
      )
    ).toThrow("Vessel Visit Execution code must match pattern 'YYYY-PA-XXXXXX'.");
  });

  it("should throw error if code pattern is incorrect (wrong suffix length)", () => {
    expect(() =>
      new VesselVisitExecution(
        validData.id,
        "2025-PA-123",
        validData.vesselIMO,
        validData.status,
        validData.arrivalDate,
        validData.lastUpdated,
        validData.systemUserID
      )
    ).toThrow("Vessel Visit Execution code must match pattern 'YYYY-PA-XXXXXX'.");
  });

  it("should throw error if vesselIMO is empty", () => {
    expect(() =>
      new VesselVisitExecution(
        validData.id,
        validData.code,
        "",
        validData.status,
        validData.arrivalDate,
        validData.lastUpdated,
        validData.systemUserID
      )
    ).toThrow("Vessel IMO cannot be null or empty.");
  });

  it("should throw error if status is invalid", () => {
    expect(() =>
      new VesselVisitExecution(
        validData.id,
        validData.code,
        validData.vesselIMO,
        "InvalidStatus" as VesselVisitExecutionStatus,
        validData.arrivalDate,
        validData.lastUpdated,
        validData.systemUserID
      )
    ).toThrow("Invalid Vessel Visit Execution status.");
  });

  it("should throw error if arrival date is not a valid date", () => {
    expect(() =>
      new VesselVisitExecution(
        validData.id,
        validData.code,
        validData.vesselIMO,
        validData.status,
        new Date("invalid"),
        validData.lastUpdated,
        validData.systemUserID
      )
    ).toThrow("Arrival date must be a valid date.");
  });

  it("should throw error if arrival date is in the future", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    expect(() =>
      new VesselVisitExecution(
        validData.id,
        validData.code,
        validData.vesselIMO,
        validData.status,
        futureDate,
        validData.lastUpdated,
        validData.systemUserID
      )
    ).toThrow("Arrival date cannot be in the future.");
  });

  it("should throw error if departure date is not a valid date", () => {
    expect(() =>
      new VesselVisitExecution(
        validData.id,
        validData.code,
        validData.vesselIMO,
        validData.status,
        validData.arrivalDate,
        validData.lastUpdated,
        validData.systemUserID,
        new Date("invalid")
      )
    ).toThrow("Departure date must be a valid date.");
  });

  it("should throw error if departure date is in the future", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    expect(() =>
      new VesselVisitExecution(
        validData.id,
        validData.code,
        validData.vesselIMO,
        validData.status,
        validData.arrivalDate,
        validData.lastUpdated,
        validData.systemUserID,
        futureDate
      )
    ).toThrow("Departure date cannot be in the future.");
  });

  it("should throw error if departure date is before arrival date", () => {
    const arrivalDate = new Date("2025-01-20");
    const departureDate = new Date("2025-01-15");

    expect(() =>
      new VesselVisitExecution(
        validData.id,
        validData.code,
        validData.vesselIMO,
        validData.status,
        arrivalDate,
        validData.lastUpdated,
        validData.systemUserID,
        departureDate
      )
    ).toThrow("Departure date cannot be before arrival date.");
  });

  // ------------------------------------------------------------
  // updateStatus()
  // ------------------------------------------------------------

  it("should update status to Completed", () => {
    const execution = new VesselVisitExecution(
      validData.id,
      validData.code,
      validData.vesselIMO,
      validData.status,
      validData.arrivalDate,
      validData.lastUpdated,
      validData.systemUserID
    );

    const beforeUpdate = execution.lastUpdated;
    
    // Small delay to ensure lastUpdated changes
    setTimeout(() => {}, 10);
    
    execution.updateStatus(VesselVisitExecutionStatus.Completed);

    expect(execution.status).toBe(VesselVisitExecutionStatus.Completed);
    expect(execution.departureDate).toBeDefined();
    expect(execution.departureDate).toBeInstanceOf(Date);
  });

  it("should update status to InProgress", () => {
    const execution = new VesselVisitExecution(
      validData.id,
      validData.code,
      validData.vesselIMO,
      VesselVisitExecutionStatus.Completed,
      validData.arrivalDate,
      validData.lastUpdated,
      validData.systemUserID,
      new Date("2025-01-20")
    );

    execution.updateStatus(VesselVisitExecutionStatus.InProgress);

    expect(execution.status).toBe(VesselVisitExecutionStatus.InProgress);
  });

  it("should set departure date when updating to Completed", () => {
    const execution = new VesselVisitExecution(
      validData.id,
      validData.code,
      validData.vesselIMO,
      validData.status,
      validData.arrivalDate,
      validData.lastUpdated,
      validData.systemUserID
    );

    expect(execution.departureDate).toBeUndefined();

    execution.updateStatus(VesselVisitExecutionStatus.Completed);

    expect(execution.departureDate).toBeDefined();
    expect(execution.departureDate).toBeInstanceOf(Date);
  });

  it("should keep existing departure date when updating to Completed", () => {
    const existingDepartureDate = new Date("2025-01-20");
    const execution = new VesselVisitExecution(
      validData.id,
      validData.code,
      validData.vesselIMO,
      validData.status,
      validData.arrivalDate,
      validData.lastUpdated,
      validData.systemUserID,
      existingDepartureDate
    );

    execution.updateStatus(VesselVisitExecutionStatus.Completed);

    expect(execution.departureDate).toBe(existingDepartureDate);
  });

  it("should update lastUpdated when status changes", () => {
    const execution = new VesselVisitExecution(
      validData.id,
      validData.code,
      validData.vesselIMO,
      validData.status,
      validData.arrivalDate,
      new Date("2025-01-10"),
      validData.systemUserID
    );

    const originalLastUpdated = execution.lastUpdated;

    execution.updateStatus(VesselVisitExecutionStatus.Completed);

    expect(execution.lastUpdated).not.toBe(originalLastUpdated);
    expect(execution.lastUpdated.getTime()).toBeGreaterThan(originalLastUpdated.getTime());
  });

  it("should throw error when updating to invalid status", () => {
    const execution = new VesselVisitExecution(
      validData.id,
      validData.code,
      validData.vesselIMO,
      validData.status,
      validData.arrivalDate,
      validData.lastUpdated,
      validData.systemUserID
    );

    expect(() =>
      execution.updateStatus("InvalidStatus" as VesselVisitExecutionStatus)
    ).toThrow("Invalid Vessel Visit Execution status.");
  });

});
