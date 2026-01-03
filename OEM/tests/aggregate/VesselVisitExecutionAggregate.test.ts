import VesselVisitExecutionService from "../../src/services/VesselVisitExecutionService";
import { VesselVisitExecution } from "../../src/domain/VesselVisitExecution";
import { VesselVisitExecutionStatus } from "../../src/domain/VesselVisitExecutionStatus";
import { Incident } from "../../src/domain/Incident";
import { IncidentStatus } from "../../src/domain/IncidentStatus";
import { IncidentClassification } from "../../src/domain/IncidentQualification";
import { Result } from "../../src/core/logic/Result";
import { OperationPlan } from "../../src/domain/OperationPlan";
import { OperationEntry } from "../../src/domain/OperationEntry";

// -----------------------------------------
// Fake Repositories
// -----------------------------------------
class VesselVisitExecutionRepoFake {
  private data: VesselVisitExecution[] = [];

  async findAll() {
    return this.data;
  }

  async findById(id: string) {
    return this.data.find(x => x.id === id) ?? null;
  }

  async findByCode(code: string) {
    return this.data.find(x => x.code === code) ?? null;
  }

  async findByStatus(status: VesselVisitExecutionStatus) {
    return this.data.filter(x => x.status === status);
  }

  async findByVesselIMO(vesselIMO: string) {
    return this.data.find(x => x.vesselIMO === vesselIMO) ?? null;
  }

  async findByVesselIMOs(vesselIMO: string) {
    return this.data.filter(x => x.vesselIMO === vesselIMO);
  }

  async findByFilters(filters: any) {
    let result = [...this.data];
    
    if (filters.vesselIMO) {
      result = result.filter(x => x.vesselIMO === filters.vesselIMO);
    }
    if (filters.status !== undefined) {
      result = result.filter(x => x.status === filters.status);
    }
    if (filters.from) {
      result = result.filter(x => new Date(x.arrivalDate) >= new Date(filters.from));
    }
    if (filters.to) {
      result = result.filter(x => new Date(x.arrivalDate) <= new Date(filters.to));
    }
    
    return result;
  }

  async save(domain: VesselVisitExecution) {
    this.data.push(domain);
    return domain;
  }

  async update(domain: VesselVisitExecution) {
    const index = this.data.findIndex(x => x.id === domain.id);
    if (index === -1) return null;
    this.data[index] = domain;
    return domain;
  }
}

class IncidentRepoFake {
  private data: Incident[] = [];

  async findByIDs(ids: string[]) {
    return this.data.filter(i => ids.includes(i.id));
  }

  async update(incident: Incident) {
    const index = this.data.findIndex(i => i.id === incident.id);
    if (index === -1) return null;
    this.data[index] = incident;
    return incident;
  }

  // Helper method to add incidents for testing
  addIncident(incident: Incident) {
    this.data.push(incident);
  }
}

class OperationPlanRepoFake {
  private data: OperationPlan[] = [];

  async findByVvn(vvn: string) {
    return this.data.find(x => x.vvn === vvn) ?? null;
  }

  // Helper method to add operation plans for testing
  addOperationPlan(operationPlan: OperationPlan) {
    this.data.push(operationPlan);
  }
}

// Mock clients
jest.mock("../../src/services/clients/SystemUserClient");
jest.mock("../../src/services/clients/VesselVisitNotificationClient");

import SystemUserClient from "../../src/services/clients/SystemUserClient";
import VesselVisitNotificationClient from "../../src/services/clients/VesselVisitNotificationClient";

// Logger Fake
const loggerFake = {
  error: jest.fn(),
  info: jest.fn(),
  silly: jest.fn(),
};

describe("VesselVisitExecutionService – Aggregate Tests", () => {

  let vveRepo: VesselVisitExecutionRepoFake;
  let incidentRepo: IncidentRepoFake;
  let operationPlanRepo: OperationPlanRepoFake;
  let service: VesselVisitExecutionService;
  let mockSystemUserClient: jest.Mocked<SystemUserClient>;
  let mockVVNClient: jest.Mocked<VesselVisitNotificationClient>;

  beforeEach(() => {
    vveRepo = new VesselVisitExecutionRepoFake();
    incidentRepo = new IncidentRepoFake();
    operationPlanRepo = new OperationPlanRepoFake();
    service = new VesselVisitExecutionService(vveRepo as any, incidentRepo as any, operationPlanRepo as any, loggerFake);

    // Setup mocks
    mockSystemUserClient = new SystemUserClient("http://localhost") as jest.Mocked<SystemUserClient>;
    mockVVNClient = new VesselVisitNotificationClient("http://localhost") as jest.Mocked<VesselVisitNotificationClient>;

    (SystemUserClient as jest.Mock).mockImplementation(() => mockSystemUserClient);
    (VesselVisitNotificationClient as jest.Mock).mockImplementation(() => mockVVNClient);

    // Default mock implementations
    mockSystemUserClient.getMyIsFirstTime = jest.fn().mockResolvedValue({ email: 'test@example.com' });
    mockSystemUserClient.getByEmail = jest.fn().mockResolvedValue({ id: 'user123', email: 'test@example.com' });
    mockVVNClient.getByCode = jest.fn().mockResolvedValue({ 
      id: 1,
      code: 'VVN001', 
      visitStatus: 'Approved', 
      vesselIMO: 'IMO1234567' 
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------
  // GET ALL
  // ---------------------------------------------
  it("should get all vessel visit executions", async () => {
    const vve1 = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    const vve2 = new VesselVisitExecution("2", "2025-PA-000002", "IMO7654321", VesselVisitExecutionStatus.Completed, new Date(), new Date(), "user2");
    
    await vveRepo.save(vve1);
    await vveRepo.save(vve2);

    const result = await service.getAllVesselVisitExecutions();

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(2);
  });

  // ---------------------------------------------
  // GET BY ID
  // ---------------------------------------------
  it("should get vessel visit execution by ID", async () => {
    const vve = new VesselVisitExecution("VVE1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const result = await service.getVesselVisitExecutionById("VVE1");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().id).toBe("VVE1");
    expect(result.getValue().vesselIMO).toBe("IMO1234567");
  });

  it("should fail when ID not found", async () => {
    const result = await service.getVesselVisitExecutionById("NONEXISTENT");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Vessel Visit Execution not found.");
  });

  // ---------------------------------------------
  // GET BY CODE
  // ---------------------------------------------
  it("should get vessel visit execution by code", async () => {
    const vve = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const result = await service.getVesselVisitExecutionByCode("2025-PA-000001");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().code).toBe("2025-PA-000001");
  });

  it("should fail when code not found", async () => {
    const result = await service.getVesselVisitExecutionByCode("NOPE");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Vessel Visit Execution not found.");
  });

  // ---------------------------------------------
  // GET BY STATUS
  // ---------------------------------------------
  it("should get vessel visit executions by status", async () => {
    const vve1 = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    const vve2 = new VesselVisitExecution("2", "2025-PA-000002", "IMO7654321", VesselVisitExecutionStatus.Completed, new Date(), new Date(), "user2");
    
    await vveRepo.save(vve1);
    await vveRepo.save(vve2);

    const result = await service.getVesselVisitExecutionsByStatus(VesselVisitExecutionStatus.InProgress);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(1);
    expect(result.getValue()[0].status).toBe(VesselVisitExecutionStatus.InProgress);
  });

  it("should fail with invalid status", async () => {
    const result = await service.getVesselVisitExecutionsByStatus("InvalidStatus" as any);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("Invalid status value");
  });

  it("should fail when no executions found for status", async () => {
    const result = await service.getVesselVisitExecutionsByStatus(VesselVisitExecutionStatus.Completed);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("No Vessel Visit Executions found");
  });

  // ---------------------------------------------
  // GET BY VESSEL IMO
  // ---------------------------------------------
  it("should get vessel visit executions by vessel IMO", async () => {
    const vve1 = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    const vve2 = new VesselVisitExecution("2", "2025-PA-000002", "IMO1234567", VesselVisitExecutionStatus.Completed, new Date(), new Date(), "user2");
    
    await vveRepo.save(vve1);
    await vveRepo.save(vve2);

    const result = await service.getVesselVisitExecutionsByVesselIMO("IMO1234567");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(2);
  });

  it("should fail when no executions found for vessel IMO", async () => {
    const result = await service.getVesselVisitExecutionsByVesselIMO("IMO9999999");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("No Vessel Visit Executions found");
  });

  // ---------------------------------------------
  // GET WITH FILTERS
  // ---------------------------------------------
  it("should get vessel visit executions with filters", async () => {
    const date1 = new Date("2025-01-15");
    const date2 = new Date("2025-02-15");
    
    const vve1 = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, date1, new Date(), "user1");
    const vve2 = new VesselVisitExecution("2", "2025-PA-000002", "IMO7654321", VesselVisitExecutionStatus.Completed, date2, new Date(), "user2");
    
    await vveRepo.save(vve1);
    await vveRepo.save(vve2);

    const result = await service.getVesselVisitExecutions({ 
      vesselIMO: "IMO1234567",
      status: "InProgress"
    });

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().length).toBe(1);
    expect(result.getValue()[0].vesselIMO).toBe("IMO1234567");
  });

  it("should fail with invalid status in filters", async () => {
    const result = await service.getVesselVisitExecutions({ status: "InvalidStatus" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("Invalid status value");
  });

  it("should fail when no results match filters", async () => {
    const result = await service.getVesselVisitExecutions({ vesselIMO: "IMO9999999" });

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("No Vessel Visit Executions found for the given filters.");
  });

  // ---------------------------------------------
  // CREATE – robust tests
  // ---------------------------------------------
  it("should create a new vessel visit execution", async () => {
    // Setup an operation plan for the VVN
    const operations = [
      new OperationEntry("OP1", "LOAD", "CONT123", new Date("2025-01-15T08:00:00Z"), new Date("2025-01-15T09:00:00Z"), "CRANE-1")
    ];
    const operationPlan = new OperationPlan(
      "1",
      "VVN001",
      new Date("2025-01-15"),
      new Date("2025-01-15T06:00:00Z"),
      new Date("2025-01-15T18:00:00Z"),
      operations,
      "test-author",
      "default",
      new Date()
    );
    operationPlanRepo.addOperationPlan(operationPlan);

    const dto = {
      vesselVisitNotificationCode: "VVN001",
      arrivalDate: new Date(),
      incidentIDs: []
    };

    const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().vesselIMO).toBe("IMO1234567");
    expect(result.getValue().systemUserID).toBe("user123");
    expect(result.getValue().status).toBe(VesselVisitExecutionStatus.InProgress);
    expect(result.getValue().operations).toBeDefined();
    expect(result.getValue().operations?.length).toBe(1);
  });

  it("should fail if vesselVisitNotificationCode is missing", async () => {
    const dto = {
      arrivalDate: new Date(),
      incidentIDs: []
    };

    const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("vesselVisitNotificationCode is required");
  });

  it("should fail if authenticated user not found", async () => {
    mockSystemUserClient.getMyIsFirstTime.mockResolvedValue({ email: 'test@example.com' });
    mockSystemUserClient.getByEmail.mockResolvedValue(null);

    const dto = {
      vesselVisitNotificationCode: "VVN001",
      arrivalDate: new Date(),
      incidentIDs: []
    };

    const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Authenticated user not found.");
  });

  it("should fail if vessel visit notification not found", async () => {
    mockVVNClient.getByCode.mockResolvedValue(null);

    const dto = {
      vesselVisitNotificationCode: "VVN999",
      arrivalDate: new Date(),
      incidentIDs: []
    };

    const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Vessel Visit Notification not found for provided code.");
  });

  it("should fail if vessel visit notification status is not Approved", async () => {
    mockVVNClient.getByCode.mockResolvedValue({ 
      id: 1,
      code: 'VVN001', 
      visitStatus: 'Pending', 
      vesselIMO: 'IMO1234567' 
    });

    const dto = {
      vesselVisitNotificationCode: "VVN001",
      arrivalDate: new Date(),
      incidentIDs: []
    };

    const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("status must be 'Approved'");
  });

  it("should fail if execution already exists for vessel IMO", async () => {
    const existing = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(existing);

    const dto = {
      vesselVisitNotificationCode: "VVN001",
      arrivalDate: new Date(),
      incidentIDs: []
    };

    const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("already exists for vessel IMO");
  });

  it("should fail if incident IDs not found", async () => {
    // Setup an operation plan for the VVN
    const operations = [
      new OperationEntry("OP1", "LOAD", "CONT123", new Date("2025-01-15T08:00:00Z"), new Date("2025-01-15T09:00:00Z"), "CRANE-1")
    ];
    const operationPlan = new OperationPlan(
      "1",
      "VVN001",
      new Date("2025-01-15"),
      new Date("2025-01-15T06:00:00Z"),
      new Date("2025-01-15T18:00:00Z"),
      operations,
      "test-author",
      "default",
      new Date()
    );
    operationPlanRepo.addOperationPlan(operationPlan);

    const dto = {
      vesselVisitNotificationCode: "VVN001",
      arrivalDate: new Date(),
      incidentIDs: ["INC1", "INC2"]
    };

    const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("One or more Incident IDs not found.");
  });

  it("should fail if incidents do not overlap with execution time range", async () => {
    // Setup an operation plan for the VVN
    const operations = [
      new OperationEntry("OP1", "LOAD", "CONT123", new Date("2025-01-15T08:00:00Z"), new Date("2025-01-15T09:00:00Z"), "CRANE-1")
    ];
    const operationPlan = new OperationPlan(
      "1",
      "VVN001",
      new Date("2025-01-15"),
      new Date("2025-01-15T06:00:00Z"),
      new Date("2025-01-15T18:00:00Z"),
      operations,
      "test-author",
      "default",
      new Date()
    );
    operationPlanRepo.addOperationPlan(operationPlan);

    const now = new Date();
    const arrivalDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const departureDate = new Date(now.getTime()); // today

    // Incident outside the time range (6-5 days ago, doesn't overlap with 2 days ago - today)
    const incident = new Incident(
      "INC1", 
      {} as any,  // incidentType
      new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), 
      new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), 
      IncidentStatus.Active,  // status
      "Description test", 
      "user1",   // systemUserID
      new Date(),  // lastUpdated
      IncidentClassification.Critical,
      null,  // duration
      null   // vesselVisitExecutions
    );
    incidentRepo.addIncident(incident);

    const dto = {
      vesselVisitNotificationCode: "VVN001",
      arrivalDate: arrivalDate,
      departureDate: departureDate,
      incidentIDs: ["INC1"]
    };

    const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("do not overlap with the VesselVisitExecution time range");
  });

  it("should create with incidents that overlap time range", async () => {
    // Setup an operation plan for the VVN
    const operations = [
      new OperationEntry("OP1", "LOAD", "CONT123", new Date("2025-01-15T08:00:00Z"), new Date("2025-01-15T09:00:00Z"), "CRANE-1")
    ];
    const operationPlan = new OperationPlan(
      "1",
      "VVN001",
      new Date("2025-01-15"),
      new Date("2025-01-15T06:00:00Z"),
      new Date("2025-01-15T18:00:00Z"),
      operations,
      "test-author",
      "default",
      new Date()
    );
    operationPlanRepo.addOperationPlan(operationPlan);

    const now = new Date();
    const arrivalDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
    const departureDate = new Date(now.getTime()); // today

    // Incident overlapping with the time range (3-1 days ago, overlaps with 4 days ago - today)
    const incident = new Incident(
      "INC1", 
      {} as any,  // incidentType
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), 
      new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), 
      IncidentStatus.Active,  // status
      "Description test", 
      "user1",   // systemUserID
      new Date(),  // lastUpdated
      IncidentClassification.Critical,
      null,  // duration
      null   // vesselVisitExecutions
    );
    incidentRepo.addIncident(incident);

    const dto = {
      vesselVisitNotificationCode: "VVN001",
      arrivalDate: arrivalDate,
      departureDate: departureDate,
      incidentIDs: ["INC1"]
    };

    const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

    expect(result.isSuccess).toBe(true);
  });

  // ---------------------------------------------
  // UPDATE – robust tests
  // ---------------------------------------------
  it("should update vessel visit execution status", async () => {
    const vve = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const payload = {
      status: "Completed"
    };

    const result = await service.updateVesselVisitExecution("2025-PA-000001", payload);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe(VesselVisitExecutionStatus.Completed);
  });

  it("should update departure date", async () => {
    const vve = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const departureDate = new Date("2025-06-15");
    const payload = {
      departureDate: departureDate.toISOString()
    };

    const result = await service.updateVesselVisitExecution("2025-PA-000001", payload);

    expect(result.isSuccess).toBe(true);
  });

  it("should fail update when code not found", async () => {
    const payload = {
      status: "Completed"
    };

    const result = await service.updateVesselVisitExecution("NONEXISTENT", payload);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Vessel Visit Execution not found.");
  });

  it("should fail update with invalid status", async () => {
    const vve = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const payload = {
      status: "InvalidStatus"
    };

    const result = await service.updateVesselVisitExecution("2025-PA-000001", payload);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toContain("Invalid status value");
  });

  it("should fail update with invalid departure date format", async () => {
    const vve = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const payload = {
      departureDate: "invalid-date"
    };

    const result = await service.updateVesselVisitExecution("2025-PA-000001", payload);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Invalid departureDate format.");
  });

  // ---------------------------------------------
  // UPDATE DOCK
  // ---------------------------------------------

  it("should update DockAssigned successfully", async () => {
    const vve = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const payload = {
      DockAssigned: "DOCK-A1"
    };

    const result = await service.updateVesselVisitExecution("2025-PA-000001", payload);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().DockAssigned).toBe("DOCK-A1");
  });

  it("should update arrivalDate and DockAssigned together", async () => {
    const vve = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const arrivalDate = new Date("2025-06-10T10:30:00Z");
    const payload = {
      arrivalDate: arrivalDate.toISOString(),
      DockAssigned: "DOCK-B2"
    };

    const result = await service.updateVesselVisitExecution("2025-PA-000001", payload);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().DockAssigned).toBe("DOCK-B2");
  });

  it("should fail update with invalid arrivalDate format", async () => {
    const vve = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const payload = {
      arrivalDate: "invalid-date"
    };

    const result = await service.updateVesselVisitExecution("2025-PA-000001", payload);

    expect(result.isFailure).toBe(true);
    expect(result.errorValue()).toBe("Invalid arrivalDate format.");
  });

  it("should update status, arrivalDate and DockAssigned all together", async () => {
    const vve = new VesselVisitExecution("1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.InProgress, new Date(), new Date(), "user1");
    await vveRepo.save(vve);

    const arrivalDate = new Date("2025-06-10T10:30:00Z");
    const payload = {
      status: "Completed",
      arrivalDate: arrivalDate.toISOString(),
      DockAssigned: "DOCK-C3",
      departureDate: new Date("2025-06-15T18:00:00Z").toISOString()
    };

    const result = await service.updateVesselVisitExecution("2025-PA-000001", payload);

    expect(result.isSuccess).toBe(true);
    expect(result.getValue().status).toBe(VesselVisitExecutionStatus.Completed);
    expect(result.getValue().DockAssigned).toBe("DOCK-C3");
    expect(result.getValue().departureDate).toBeDefined();
  });
});
