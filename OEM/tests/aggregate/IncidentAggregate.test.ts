import IncidentService from "../../src/services/IncidentService";
import { Incident } from "../../src/domain/Incident";
import { IncidentStatus } from "../../src/domain/IncidentStatus";
import { IncidentType } from "../../src/domain/IncidentType";
import { IncidentClassification } from "../../src/domain/IncidentQualification";
import { VesselVisitExecution } from "../../src/domain/VesselVisitExecution";
import { VesselVisitExecutionStatus } from "../../src/domain/VesselVisitExecutionStatus";
import { Result } from "../../src/core/logic/Result";
import { IncidentDTO } from "../../src/dto/IncidentDTO";

class IncidentRepoFake {
  private data: Incident[] = [];
  async findAll() { return this.data; }
  async findById(id: string) { return this.data.find(x => x.id === id) ?? null; }
  async findByVesselIMO(vesselIMO: string) { return this.data.filter(x => x.vesselVisitExecutions?.some(vve => vve.vesselIMO === vesselIMO)); }
  async findByDateRange(startDate: Date, endDate: Date) { return this.data.filter(x => { const incStart = x.startDate.getTime(); const incEnd = x.endDate ? x.endDate.getTime() : incStart; const rangeStart = startDate.getTime(); const rangeEnd = endDate.getTime(); return (incStart <= rangeEnd && incEnd >= rangeStart); }); }
  async findBySeverity(severity: string) { return this.data.filter(x => x.incidentType?.classification === severity); }
  async findByStatus(status: IncidentStatus) { return this.data.filter(x => x.status === status); }
  async save(incident: Incident) { this.data.push(incident); return incident; }
  async update(incident: Incident) { const index = this.data.findIndex(x => x.id === incident.id); if (index !== -1) { this.data[index] = incident; return incident; } return null; }
  addIncident(incident: Incident) { this.data.push(incident); }
}

class IncidentTypeRepoFake {
  private data: IncidentType[] = [];
  async findByCode(code: string) { return this.data.find(x => x.code === code) ?? null; }
  addIncidentType(incidentType: IncidentType) { this.data.push(incidentType); }
}

class VesselVisitExecutionRepoFake {
  private data: VesselVisitExecution[] = [];
  async findByCodes(codes: string[]) { return this.data.filter(x => codes.includes(x.code)); }
  addVesselVisitExecution(vve: VesselVisitExecution) { this.data.push(vve); }
}

jest.mock("../../src/services/clients/SystemUserClient");
const mockSystemUserClient = { getMyIsFirstTime: jest.fn(), getByEmail: jest.fn(), };
const SystemUserClient = require("../../src/services/clients/SystemUserClient").default as jest.Mock;
SystemUserClient.mockImplementation(() => mockSystemUserClient);

// -----------------------------------------
// Test Suite
// -----------------------------------------
describe("IncidentService – Aggregate Tests", () => {
  let incidentRepo: IncidentRepoFake;
  let incidentTypeRepo: IncidentTypeRepoFake;
  let vesselVisitExecutionRepo: VesselVisitExecutionRepoFake;
  let service: IncidentService;

  const loggerFake = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(() => {
    incidentRepo = new IncidentRepoFake();
    incidentTypeRepo = new IncidentTypeRepoFake();
    vesselVisitExecutionRepo = new VesselVisitExecutionRepoFake();
    service = new IncidentService(incidentRepo as any, incidentTypeRepo as any, vesselVisitExecutionRepo as any, loggerFake);

    jest.clearAllMocks();

    // Default mock implementations
    mockSystemUserClient.getMyIsFirstTime.mockResolvedValue({ email: 'test@example.com' });
    mockSystemUserClient.getByEmail.mockResolvedValue({ id: 'user123', email: 'test@example.com' });
  });

  // -----------------------------------------
  // GET Tests
  // -----------------------------------------
  describe("GET Operations", () => {
    it("should get all incidents", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const result = await service.getAllIncidents();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(1);
      expect(result.getValue()[0].id).toBe("INC1");
    });

    it("should get incident by ID", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const result = await service.getIncidentById("INC1");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().id).toBe("INC1");
    });

    it("should fail when incident ID not found", async () => {
      const result = await service.getIncidentById("NONEXISTENT");

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("Incident not found");
    });

    it("should get incidents by vessel IMO", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const vveArrival = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
      const vveDeparture = new Date(now.getTime() - 0 * 24 * 60 * 60 * 1000); // today
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const vve = new VesselVisitExecution("VVE1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.Completed, vveArrival, new Date(), "user1", vveDeparture);
      vesselVisitExecutionRepo.addVesselVisitExecution(vve);

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        [vve]
      );
      incidentRepo.addIncident(incident);

      const result = await service.getIncidentsByVessel("IMO1234567");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(1);
    });

    it("should get incidents by date range", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const result = await service.getIncidentsByDateRange(
        new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        new Date(now.getTime())
      );

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(1);
    });

    it("should get incidents by severity", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const result = await service.getIncidentsBySeverity(IncidentClassification.Critical);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(1);
    });

    it("should get incidents by status", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const result = await service.getIncidentsByStatus(IncidentStatus.Active);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().length).toBe(1);
    });
  });

  // -----------------------------------------
  // CREATE Tests
  // -----------------------------------------
  describe("CREATE Operations", () => {
    it("should create incident successfully", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const dto: IncidentDTO = {
        id: "",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.createIncident(dto, "http://localhost", "Bearer token");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().description).toBe("Test description one");
      expect(result.getValue().status).toBe(IncidentStatus.Active);
    });

    it("should fail if no email found in Auth0 token", async () => {
      mockSystemUserClient.getMyIsFirstTime.mockResolvedValue({ email: undefined });

      const dto: IncidentDTO = {
        id: "",
        incidentTypeByCode: "CODE1",
        startDate: new Date("2025-12-20"),
        endDate: new Date("2025-12-21"),
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.createIncident(dto, "http://localhost", "Bearer token");

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("No email claim");
    });

    it("should fail if authenticated user not found", async () => {
      mockSystemUserClient.getByEmail.mockResolvedValue(null);

      const dto: IncidentDTO = {
        id: "",
        incidentTypeByCode: "CODE1",
        startDate: new Date("2025-12-20"),
        endDate: new Date("2025-12-21"),
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.createIncident(dto, "http://localhost", "Bearer token");

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("Authenticated user not found");
    });

    it("should fail if incident type code not provided", async () => {
      const dto: IncidentDTO = {
        id: "",
        incidentTypeByCode: "",
        startDate: new Date("2025-12-20"),
        endDate: new Date("2025-12-21"),
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.createIncident(dto, "http://localhost", "Bearer token");

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("Incident type code is required");
    });

    it("should fail if incident type not found", async () => {
      const dto: IncidentDTO = {
        id: "",
        incidentTypeByCode: "NONEXISTENT",
        startDate: new Date("2025-12-20"),
        endDate: new Date("2025-12-21"),
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.createIncident(dto, "http://localhost", "Bearer token");

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("not found");
    });

    it("should create with associated vessel visit executions", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const vveArrival = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
      const vveDeparture = new Date(now.getTime()); // today
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const vve = new VesselVisitExecution("VVE1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.Completed, vveArrival, new Date(), "user1", vveDeparture);
      vesselVisitExecutionRepo.addVesselVisitExecution(vve);

      const dto: IncidentDTO = {
        id: "",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: ["2025-PA-000001"]
      };

      const result = await service.createIncident(dto, "http://localhost", "Bearer token");

      expect(result.isSuccess).toBe(true);
    });

    it("should fail if VVE code not found", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const dto: IncidentDTO = {
        id: "",
        incidentTypeByCode: "CODE1",
        startDate: new Date("2025-12-20"),
        endDate: new Date("2025-12-21"),
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: ["NONEXISTENT"]
      };

      const result = await service.createIncident(dto, "http://localhost", "Bearer token");

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("not found");
    });

    it("should fail if VVE does not overlap with incident time range", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const vveArrival = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago
      const vveDeparture = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const vve = new VesselVisitExecution("VVE1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.Completed, vveArrival, new Date(), "user1", vveDeparture);
      vesselVisitExecutionRepo.addVesselVisitExecution(vve);

      const dto: IncidentDTO = {
        id: "",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: ["2025-PA-000001"]
      };

      const result = await service.createIncident(dto, "http://localhost", "Bearer token");

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("not affected");
    });

    it("should calculate duration from start and end dates", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      startDate.setHours(10, 0, 0, 0);
      const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 hours later

      const dto: IncidentDTO = {
        id: "",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.createIncident(dto, "http://localhost", "Bearer token");

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().duration).toBe(4);
    });
  });

  // -----------------------------------------
  // UPDATE Tests
  // -----------------------------------------
  describe("UPDATE Operations", () => {
    it("should update incident end date", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        null,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        null,
        null
      );
      incidentRepo.addIncident(incident);

      const dto: IncidentDTO = {
        id: "INC1",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "user1",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.updateIncident("INC1", dto);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().duration).toBe(24);
    });

    it("should fail if incident not found", async () => {
      const dto: IncidentDTO = {
        id: "NONEXISTENT",
        incidentTypeByCode: "CODE1",
        startDate: new Date("2025-12-20"),
        endDate: new Date("2025-12-21"),
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: null,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.updateIncident("NONEXISTENT", dto);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("Incident not found");
    });

    it("should fail if incident ID in DTO differs from path parameter", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const dto: IncidentDTO = {
        id: "INC2",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "user1",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: 24,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.updateIncident("INC1", dto);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("cannot be changed");
    });

    it("should fail if end date is already set and cannot be modified", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      const newEndDate = new Date(now.getTime()); // today

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const dto: IncidentDTO = {
        id: "INC1",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: newEndDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "user1",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: 24,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.updateIncident("INC1", dto);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("End date is already set");
    });

    it("should update incident status", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const dto: IncidentDTO = {
        id: "INC1",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Resolved,
        description: "Test description one",
        systemUserID: "user1",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: 24,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.updateIncident("INC1", dto);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().status).toBe(IncidentStatus.Resolved);
    });

    it("should update incident description", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const dto: IncidentDTO = {
        id: "INC1",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Updated description one",
        systemUserID: "user1",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: 24,
        vesselVisitExecutionsCodes: []
      };

      const result = await service.updateIncident("INC1", dto);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().description).toBe("Updated description one");
    });

    it("should fail if VVEs are unchanged", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const vveArrival = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
      const vveDeparture = new Date(now.getTime()); // today
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const vve = new VesselVisitExecution("VVE1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.Completed, vveArrival, new Date(), "user1", vveDeparture);
      vesselVisitExecutionRepo.addVesselVisitExecution(vve);

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        [vve]
      );
      incidentRepo.addIncident(incident);

      const dto: IncidentDTO = {
        id: "INC1",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "user1",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: 24,
        vesselVisitExecutionsCodes: ["2025-PA-000001"]
      };

      const result = await service.updateIncident("INC1", dto);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("unchanged");
    });

    it("should update incident vessel visit executions", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const vveArrival1 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000); // 4 days ago
      const vveArrival2 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const vveDeparture = new Date(now.getTime()); // today
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const vve1 = new VesselVisitExecution("VVE1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.Completed, vveArrival1, new Date(), "user1", vveDeparture);
      const vve2 = new VesselVisitExecution("VVE2", "2025-PA-000002", "IMO7654321", VesselVisitExecutionStatus.Completed, vveArrival2, new Date(), "user1", vveDeparture);
      vesselVisitExecutionRepo.addVesselVisitExecution(vve1);
      vesselVisitExecutionRepo.addVesselVisitExecution(vve2);

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        [vve1]
      );
      incidentRepo.addIncident(incident);

      const dto: IncidentDTO = {
        id: "INC1",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "user1",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: 24,
        vesselVisitExecutionsCodes: ["2025-PA-000002"]
      };

      const result = await service.updateIncident("INC1", dto);

      expect(result.isSuccess).toBe(true);
    });

    it("should fail if new VVE does not overlap with incident time range", async () => {
      const incidentType = new IncidentType("IT1", "CODE1", "Type1", "Description1", IncidentClassification.Critical);
      incidentTypeRepo.addIncidentType(incidentType);

      const now = new Date();
      const vveArrival = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); // 6 days ago
      const vveDeparture = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      const startDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const endDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const vve = new VesselVisitExecution("VVE1", "2025-PA-000001", "IMO1234567", VesselVisitExecutionStatus.Completed, vveArrival, new Date(), "user1", vveDeparture);
      vesselVisitExecutionRepo.addVesselVisitExecution(vve);

      const incident = new Incident(
        "INC1",
        incidentType,
        startDate,
        endDate,
        IncidentStatus.Active,
        "Test description one",
        "user1",
        new Date(),
        IncidentClassification.Critical,
        24,
        null
      );
      incidentRepo.addIncident(incident);

      const dto: IncidentDTO = {
        id: "INC1",
        incidentTypeByCode: "CODE1",
        startDate: startDate,
        endDate: endDate,
        status: IncidentStatus.Active,
        description: "Test description one",
        systemUserID: "user1",
        lastUpdated: new Date(),
        classification: IncidentClassification.Critical,
        duration: 24,
        vesselVisitExecutionsCodes: ["2025-PA-000001"]
      };

      const result = await service.updateIncident("INC1", dto);

      expect(result.isFailure).toBe(true);
      expect(result.errorValue()).toContain("not affected");
    });
  });
});





