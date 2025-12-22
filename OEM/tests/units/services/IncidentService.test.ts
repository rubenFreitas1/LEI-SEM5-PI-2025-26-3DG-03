import { Result } from "../../../src/core/logic/Result";
import { IncidentStatus } from "../../../src/domain/IncidentStatus";
import { Incident } from "../../../src/domain/Incident";
import { IncidentType } from "../../../src/domain/IncidentType";
import { IncidentClassification } from "../../../src/domain/IncidentQualification";

// --- MOCKS ---
jest.mock("../../../src/mappers/IncidentMap", () => ({
  IncidentMap: {
    toDTO: jest.fn(),
    toDomain: jest.fn(),
    toPersistence: jest.fn()
  }
}));

jest.mock("../../../src/services/clients/SystemUserClient");

import IncidentService from "../../../src/services/IncidentService";
import { IncidentMap } from "../../../src/mappers/IncidentMap";
import SystemUserClient from "../../../src/services/clients/SystemUserClient";

describe("IncidentService (unit tests)", () => {

  let incidentRepo: any;
  let incidentTypeRepo: any;
  let vesselVisitExecutionRepo: any;
  let logger: any;
  let service: IncidentService;

  const mockIncidentType = new IncidentType(
    "1",
    "TYPE001",
    "Test Type",
    "Test incident type",
    IncidentClassification.Minor
  );

  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  beforeEach(() => {
    incidentRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByVesselIMO: jest.fn(),
      findByDateRange: jest.fn(),
      findBySeverity: jest.fn(),
      findByStatus: jest.fn(),
      save: jest.fn(),
      update: jest.fn()
    };

    incidentTypeRepo = {
      findByCode: jest.fn()
    };

    vesselVisitExecutionRepo = {
      findByCodes: jest.fn()
    };

    logger = { error: jest.fn(), info: jest.fn() };

    service = new IncidentService(
      incidentRepo,
      incidentTypeRepo,
      vesselVisitExecutionRepo,
      logger
    );

    // Clear all mocks
    jest.clearAllMocks();
  });

  // ---------------------------------------------------
  // getAllIncidents
  // ---------------------------------------------------

  it("should return DTO list when getAllIncidents succeeds", async () => {
    const domainObj = new Incident(
      "1",
      mockIncidentType,
      yesterday,
      null,
      IncidentStatus.Active,
      "Test incident description",
      "user123",
      new Date(),
      null,
      null
    );

    incidentRepo.findAll.mockResolvedValue([domainObj]);

    (IncidentMap.toDTO as jest.Mock).mockReturnValue({
      id: "1",
      description: "Test incident description"
    });

    const result = await service.getAllIncidents();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([{ id: "1", description: "Test incident description" }]);
    expect(incidentRepo.findAll).toHaveBeenCalled();
  });

  it("should return fail() when getAllIncidents returns null", async () => {
    incidentRepo.findAll.mockResolvedValue(null);

    const result = await service.getAllIncidents();

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("No incidents found.");
  });

  it("should return fail() when getAllIncidents throws error", async () => {
    incidentRepo.findAll.mockRejectedValue(new Error("DB error"));

    const result = await service.getAllIncidents();

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Error getting all incidents.");
    expect(logger.error).toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // getIncidentById
  // ---------------------------------------------------

  it("should return DTO when incident exists", async () => {
    const domainObj = new Incident(
      "2",
      mockIncidentType,
      yesterday,
      null,
      IncidentStatus.Active,
      "Another incident",
      "user456",
      new Date(),
      null,
      null
    );

    incidentRepo.findById.mockResolvedValue(domainObj);

    (IncidentMap.toDTO as jest.Mock).mockReturnValue({
      id: "2",
      description: "Another incident"
    });

    const result = await service.getIncidentById("2");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual({ id: "2", description: "Another incident" });
  });

  it("should fail when incident is not found by ID", async () => {
    incidentRepo.findById.mockResolvedValue(null);

    const result = await service.getIncidentById("999");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Incident not found.");
  });

  it("should fail when getIncidentById throws error", async () => {
    incidentRepo.findById.mockRejectedValue(new Error("DB error"));

    const result = await service.getIncidentById("123");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Error getting incident by ID.");
    expect(logger.error).toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // getIncidentsByVessel
  // ---------------------------------------------------

  it("should return incidents by vessel IMO", async () => {
    const domainObj = new Incident(
      "3",
      mockIncidentType,
      yesterday,
      null,
      IncidentStatus.Active,
      "Vessel incident",
      "user789",
      new Date(),
      null,
      null
    );

    incidentRepo.findByVesselIMO.mockResolvedValue([domainObj]);

    (IncidentMap.toDTO as jest.Mock).mockReturnValue({
      id: "3",
      description: "Vessel incident"
    });

    const result = await service.getIncidentsByVessel("9074729");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([{ id: "3", description: "Vessel incident" }]);
  });

  it("should fail when no incidents found for vessel", async () => {
    incidentRepo.findByVesselIMO.mockResolvedValue([]);

    const result = await service.getIncidentsByVessel("0000000");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("No incidents found for the specified vessel.");
  });

  it("should fail when getIncidentsByVessel throws error", async () => {
    incidentRepo.findByVesselIMO.mockRejectedValue(new Error("DB error"));

    const result = await service.getIncidentsByVessel("9074729");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Error getting incidents by vessel.");
    expect(logger.error).toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // getIncidentsByDateRange
  // ---------------------------------------------------

  it("should return incidents by date range", async () => {
    const domainObj = new Incident(
      "4",
      mockIncidentType,
      yesterday,
      today,
      IncidentStatus.Resolved,
      "Date range incident",
      "user111",
      new Date(),
      null,
      null
    );

    incidentRepo.findByDateRange.mockResolvedValue([domainObj]);

    (IncidentMap.toDTO as jest.Mock).mockReturnValue({
      id: "4",
      description: "Date range incident"
    });

    const result = await service.getIncidentsByDateRange(yesterday, today);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([{ id: "4", description: "Date range incident" }]);
  });

  it("should use current date when endDate is null", async () => {
    const domainObj = new Incident(
      "5",
      mockIncidentType,
      yesterday,
      null,
      IncidentStatus.Active,
      "Open incident",
      "user222",
      new Date(),
      null,
      null
    );

    incidentRepo.findByDateRange.mockResolvedValue([domainObj]);

    (IncidentMap.toDTO as jest.Mock).mockReturnValue({
      id: "5",
      description: "Open incident"
    });

    const result = await service.getIncidentsByDateRange(yesterday, null);

    expect(result.isSuccess).toBe(true);
    expect(incidentRepo.findByDateRange).toHaveBeenCalledWith(yesterday, expect.any(Date));
  });

  it("should fail when no incidents found in date range", async () => {
    incidentRepo.findByDateRange.mockResolvedValue([]);

    const result = await service.getIncidentsByDateRange(yesterday, today);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("No incidents found in the specified date range.");
  });

  it("should fail when getIncidentsByDateRange throws error", async () => {
    incidentRepo.findByDateRange.mockRejectedValue(new Error("DB error"));

    const result = await service.getIncidentsByDateRange(yesterday, today);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Error getting incidents by date range.");
    expect(logger.error).toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // getIncidentsBySeverity
  // ---------------------------------------------------

  it("should return incidents by severity", async () => {
    const domainObj = new Incident(
      "6",
      mockIncidentType,
      yesterday,
      null,
      IncidentStatus.Active,
      "Critical severity incident",
      "user333",
      new Date(),
      null,
      null
    );

    incidentRepo.findBySeverity.mockResolvedValue([domainObj]);

    (IncidentMap.toDTO as jest.Mock).mockReturnValue({
      id: "6",
      description: "Critical severity incident"
    });

    const result = await service.getIncidentsBySeverity("Critical");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([{ id: "6", description: "Critical severity incident" }]);
  });

  it("should fail when no incidents found for severity", async () => {
    incidentRepo.findBySeverity.mockResolvedValue([]);

    const result = await service.getIncidentsBySeverity("Minor");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("No incidents found for the specified severity.");
  });

  it("should fail when getIncidentsBySeverity throws error", async () => {
    incidentRepo.findBySeverity.mockRejectedValue(new Error("DB error"));

    const result = await service.getIncidentsBySeverity("Major");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Error getting incidents by severity.");
    expect(logger.error).toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // getIncidentsByStatus
  // ---------------------------------------------------

  it("should return incidents by status", async () => {
    const domainObj = new Incident(
      "7",
      mockIncidentType,
      yesterday,
      today,
      IncidentStatus.Resolved,
      "Resolved incident",
      "user444",
      new Date(),
      null,
      null
    );

    incidentRepo.findByStatus.mockResolvedValue([domainObj]);

    (IncidentMap.toDTO as jest.Mock).mockReturnValue({
      id: "7",
      description: "Resolved incident"
    });

    const result = await service.getIncidentsByStatus(IncidentStatus.Resolved);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual([{ id: "7", description: "Resolved incident" }]);
  });

  it("should fail when no incidents found for status", async () => {
    incidentRepo.findByStatus.mockResolvedValue([]);

    const result = await service.getIncidentsByStatus(IncidentStatus.Active);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("No incidents found for the specified status.");
  });

  it("should fail when getIncidentsByStatus throws error", async () => {
    incidentRepo.findByStatus.mockRejectedValue(new Error("DB error"));

    const result = await service.getIncidentsByStatus(IncidentStatus.Active);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Error getting incidents by status.");
    expect(logger.error).toHaveBeenCalled();
  });

  // ---------------------------------------------------
  // createIncident
  // ---------------------------------------------------

  it("should create an incident successfully", async () => {
    const mockSystemUser = {
      getMyIsFirstTime: jest.fn().mockResolvedValue({ email: "test@example.com" }),
      getByEmail: jest.fn().mockResolvedValue({ id: "user123", email: "test@example.com" })
    };

    (SystemUserClient as jest.Mock).mockImplementation(() => mockSystemUser);

    const dto = {
      incidentTypeByCode: "TYPE001",
      startDate: yesterday,
      endDate: null,
      status: IncidentStatus.Active,
      description: "New incident description",
      vesselVisitExecutionsCodes: null
    };

    incidentTypeRepo.findByCode.mockResolvedValue(mockIncidentType);

    const domainCreated = new Incident(
      "8",
      mockIncidentType,
      yesterday,
      null,
      IncidentStatus.Active,
      "New incident description",
      "user123",
      new Date(),
      null,
      null
    );

    (IncidentMap.toDomain as jest.Mock).mockReturnValue(domainCreated);

    incidentRepo.save.mockResolvedValue(domainCreated);

    (IncidentMap.toDTO as jest.Mock).mockReturnValue({
      id: "8",
      description: "New incident description"
    });

    const result = await service.createIncident(dto as any, "http://test.com", "Bearer token");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual({ id: "8", description: "New incident description" });
  });

  it("should fail when no email claim found", async () => {
    const mockSystemUser = {
      getMyIsFirstTime: jest.fn().mockResolvedValue(null)
    };

    (SystemUserClient as jest.Mock).mockImplementation(() => mockSystemUser);

    const dto = {
      incidentTypeByCode: "TYPE001",
      startDate: yesterday,
      endDate: null,
      status: IncidentStatus.Active,
      description: "Test incident"
    };

    const result = await service.createIncident(dto as any, "http://test.com", "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("No email claim found in Auth0 token.");
  });

  it("should fail when authenticated user not found", async () => {
    const mockSystemUser = {
      getMyIsFirstTime: jest.fn().mockResolvedValue({ email: "test@example.com" }),
      getByEmail: jest.fn().mockResolvedValue(null)
    };

    (SystemUserClient as jest.Mock).mockImplementation(() => mockSystemUser);

    const dto = {
      incidentTypeByCode: "TYPE001",
      startDate: yesterday,
      endDate: null,
      status: IncidentStatus.Active,
      description: "Test incident"
    };

    const result = await service.createIncident(dto as any, "http://test.com", "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Authenticated user not found.");
  });

  it("should fail when incident type code is missing", async () => {
    const mockSystemUser = {
      getMyIsFirstTime: jest.fn().mockResolvedValue({ email: "test@example.com" }),
      getByEmail: jest.fn().mockResolvedValue({ id: "user123" })
    };

    (SystemUserClient as jest.Mock).mockImplementation(() => mockSystemUser);

    const dto = {
      startDate: yesterday,
      endDate: null,
      status: IncidentStatus.Active,
      description: "Test incident"
    };

    const result = await service.createIncident(dto as any, "http://test.com", "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Incident type code is required.");
  });

  it("should fail when incident type not found", async () => {
    const mockSystemUser = {
      getMyIsFirstTime: jest.fn().mockResolvedValue({ email: "test@example.com" }),
      getByEmail: jest.fn().mockResolvedValue({ id: "user123" })
    };

    (SystemUserClient as jest.Mock).mockImplementation(() => mockSystemUser);

    const dto = {
      incidentTypeByCode: "UNKNOWN",
      startDate: yesterday,
      endDate: null,
      status: IncidentStatus.Active,
      description: "Test incident"
    };

    incidentTypeRepo.findByCode.mockResolvedValue(null);

    const result = await service.createIncident(dto as any, "http://test.com", "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  it("should fail when VesselVisitExecution codes not found", async () => {
    const mockSystemUser = {
      getMyIsFirstTime: jest.fn().mockResolvedValue({ email: "test@example.com" }),
      getByEmail: jest.fn().mockResolvedValue({ id: "user123" })
    };

    (SystemUserClient as jest.Mock).mockImplementation(() => mockSystemUser);

    const dto = {
      incidentTypeByCode: "TYPE001",
      startDate: yesterday,
      endDate: null,
      status: IncidentStatus.Active,
      description: "Test incident",
      vesselVisitExecutionsCodes: ["VVE001", "VVE002"]
    };

    incidentTypeRepo.findByCode.mockResolvedValue(mockIncidentType);
    vesselVisitExecutionRepo.findByCodes.mockResolvedValue([]);

    const result = await service.createIncident(dto as any, "http://test.com", "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("not found");
  });

  // ---------------------------------------------------
  // updateIncident
  // ---------------------------------------------------

  it("should update an incident successfully", async () => {
    const existing = new Incident(
      "9",
      mockIncidentType,
      yesterday,
      null,
      IncidentStatus.Active,
      "Old description",
      "user123",
      new Date(),
      null,
      null
    );

    incidentRepo.findById.mockResolvedValue(existing);
    incidentRepo.update.mockResolvedValue(existing);

    (IncidentMap.toDTO as jest.Mock).mockReturnValue({
      id: "9",
      description: "Updated description"
    });

    const dto = {
      id: "9",
      description: "Updated description",
      status: IncidentStatus.Resolved
    };

    const result = await service.updateIncident("9", dto as any);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual({ id: "9", description: "Updated description" });
  });

  it("should fail update if incident not found", async () => {
    incidentRepo.findById.mockResolvedValue(null);

    const dto = {
      description: "Updated description"
    };

    const result = await service.updateIncident("999", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Incident not found.");
  });

  it("should fail when trying to change incident ID", async () => {
    const existing = new Incident(
      "10",
      mockIncidentType,
      yesterday,
      null,
      IncidentStatus.Active,
      "Test incident",
      "user123",
      new Date(),
      null,
      null
    );

    incidentRepo.findById.mockResolvedValue(existing);

    const dto = {
      id: "999",
      description: "Updated description"
    };

    const result = await service.updateIncident("10", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Incident ID cannot be changed.");
  });

  it("should fail when trying to modify existing end date", async () => {
    const existing = new Incident(
      "11",
      mockIncidentType,
      yesterday,
      today,
      IncidentStatus.Resolved,
      "Test incident",
      "user123",
      new Date(),
      24,
      null
    );

    incidentRepo.findById.mockResolvedValue(existing);

    const newEndDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dto = {
      endDate: newEndDate
    };

    const result = await service.updateIncident("11", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("End date is already set and cannot be modified.");
  });

  it("should fail when repo throws in updateIncident", async () => {
    incidentRepo.findById.mockRejectedValue(new Error("DB error"));

    const dto = {
      description: "Updated"
    };

    const result = await service.updateIncident("123", dto as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("DB error");
    expect(logger.error).toHaveBeenCalled();
  });

});
