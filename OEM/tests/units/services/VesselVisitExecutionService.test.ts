import { Result } from "../../../src/core/logic/Result";
import { VesselVisitExecution } from "../../../src/domain/VesselVisitExecution";
import { VesselVisitExecutionStatus } from "../../../src/domain/VesselVisitExecutionStatus";

// --- MOCKS ---
jest.mock("../../../src/mappers/VesselVisitExecutionMap", () => ({
    VesselVisitExecutionMap: {
        toDTO: jest.fn(),
        toDomain: jest.fn(),
        toPersistence: jest.fn()
    }
}));

jest.mock("../../../src/services/clients/SystemUserClient");
jest.mock("../../../src/services/clients/VesselVisitNotificationClient");

import VesselVisitExecutionService from "../../../src/services/VesselVisitExecutionService";
import { VesselVisitExecutionMap } from "../../../src/mappers/VesselVisitExecutionMap";
import SystemUserClient from "../../../src/services/clients/SystemUserClient";
import VesselVisitNotificationClient from "../../../src/services/clients/VesselVisitNotificationClient";

describe("VesselVisitExecutionService (unit tests)", () => {

    let vesselVisitExecutionRepo: any;
    let incidentRepo: any;
    let operationPlanRepo: any;
    let logger: any;
    let service: VesselVisitExecutionService;
    let mockSystemUserClient: any;
    let mockVvnClient: any;

    beforeEach(() => {
        // Setup mock instances for clients
        mockSystemUserClient = {
            getMyIsFirstTime: jest.fn(),
            getByEmail: jest.fn()
        };

        mockVvnClient = {
            getByCode: jest.fn()
        };

        // Mock the constructors to return our mock instances
        (SystemUserClient as jest.Mock).mockImplementation(() => mockSystemUserClient);
        (VesselVisitNotificationClient as jest.Mock).mockImplementation(() => mockVvnClient);

        vesselVisitExecutionRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            findByStatus: jest.fn(),
            findByVesselIMOs: jest.fn(),
            findByVesselIMO: jest.fn(),
            findByFilters: jest.fn(),
            save: jest.fn(),
            update: jest.fn()
        };

        incidentRepo = {
            findByIDs: jest.fn(),
            update: jest.fn()
        };

        operationPlanRepo = {
            findByVvn: jest.fn()
        };

        logger = { error: jest.fn(), info: jest.fn() };

        service = new VesselVisitExecutionService(vesselVisitExecutionRepo, incidentRepo, operationPlanRepo, logger);

        // Reset mocks
        jest.clearAllMocks();
    });

    // ---------------------------------------------------
    // getAllVesselVisitExecutions
    // ---------------------------------------------------

    it("should return DTO list when getAllVesselVisitExecutions succeeds", async () => {
        const domainObj = new VesselVisitExecution(
            "1",
            "2024-PA-000001",
            "IMO1234567",
            VesselVisitExecutionStatus.InProgress,
            new Date("2024-01-01"),
            new Date(),
            "user1",
            []
        );

        vesselVisitExecutionRepo.findAll.mockResolvedValue([domainObj]);

        (VesselVisitExecutionMap.toDTO as jest.Mock).mockReturnValue({
            id: "1",
            code: "2024-PA-000001"
        });

        const result = await service.getAllVesselVisitExecutions();

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([{ id: "1", code: "2024-PA-000001" }]);
        expect(vesselVisitExecutionRepo.findAll).toHaveBeenCalled();
    });

    it("should return fail() when getAllVesselVisitExecutions throws error", async () => {
        vesselVisitExecutionRepo.findAll.mockRejectedValue(new Error("DB error"));

        const result = await service.getAllVesselVisitExecutions();

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Error getting all vessel visit executions.");
        expect(logger.error).toHaveBeenCalled();
    });

    // ---------------------------------------------------
    // getVesselVisitExecutionById
    // ---------------------------------------------------

    it("should return DTO when vessel visit execution exists", async () => {
        const domainObj = new VesselVisitExecution(
            "2",
            "2024-PA-000002",
            "IMO7654321",
            VesselVisitExecutionStatus.Completed,
            new Date("2024-02-01"),
            new Date(),
            "user2",
            [],
            "",
            new Date("2024-02-05")
        );

        vesselVisitExecutionRepo.findById.mockResolvedValue(domainObj);

        (VesselVisitExecutionMap.toDTO as jest.Mock).mockReturnValue({
            id: "2",
            code: "2024-PA-000002"
        });

        const result = await service.getVesselVisitExecutionById("2");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "2", code: "2024-PA-000002" });
    });

    it("should fail when vessel visit execution is not found by ID", async () => {
        vesselVisitExecutionRepo.findById.mockResolvedValue(null);

        const result = await service.getVesselVisitExecutionById("999");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Vessel Visit Execution not found.");
    });

    // ---------------------------------------------------
    // getVesselVisitExecutionByCode
    // ---------------------------------------------------

    it("should return DTO when vessel visit execution exists by code", async () => {
        const domainObj = new VesselVisitExecution(
            "3",
            "2024-PA-000003",
            "IMO1111111",
            VesselVisitExecutionStatus.InProgress,
            new Date("2024-03-01"),
            new Date(),
            "user3",
            []
        );

        vesselVisitExecutionRepo.findByCode.mockResolvedValue(domainObj);

        (VesselVisitExecutionMap.toDTO as jest.Mock).mockReturnValue({
            id: "3",
            code: "2024-PA-000003"
        });

        const result = await service.getVesselVisitExecutionByCode("2024-PA-000003");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "3", code: "2024-PA-000003" });
    });

    it("should fail when code does not exist", async () => {
        vesselVisitExecutionRepo.findByCode.mockResolvedValue(null);

        const result = await service.getVesselVisitExecutionByCode("XXX");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toBe("Vessel Visit Execution not found.");
    });

    // ---------------------------------------------------
    // getVesselVisitExecutionsByStatus
    // ---------------------------------------------------

    it("should return executions by status", async () => {
        const domainObj = new VesselVisitExecution(
            "4",
            "2024-PA-000004",
            "IMO2222222",
            VesselVisitExecutionStatus.Completed,
            new Date("2024-04-01"),
            new Date(),
            "user4",
            [],
            "",
            new Date("2024-04-05")
        );

        vesselVisitExecutionRepo.findByStatus.mockResolvedValue([domainObj]);

        (VesselVisitExecutionMap.toDTO as jest.Mock).mockReturnValue({
            id: "4",
            code: "2024-PA-000004"
        });

        const result = await service.getVesselVisitExecutionsByStatus(VesselVisitExecutionStatus.Completed);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([{ id: "4", code: "2024-PA-000004" }]);
    });

    it("should fail when status is invalid", async () => {
        const result = await service.getVesselVisitExecutionsByStatus("INVALID_STATUS" as any);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Invalid status value");
    });

    it("should fail when no executions found for status", async () => {
        vesselVisitExecutionRepo.findByStatus.mockResolvedValue([]);

        const result = await service.getVesselVisitExecutionsByStatus(VesselVisitExecutionStatus.InProgress);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("No Vessel Visit Executions found");
    });

    // ---------------------------------------------------
    // getVesselVisitExecutionsByVesselIMO
    // ---------------------------------------------------

    it("should return executions by vessel IMO", async () => {
        const domainObj = new VesselVisitExecution(
            "5",
            "2024-PA-000005",
            "IMO3333333",
            VesselVisitExecutionStatus.InProgress,
            new Date("2024-05-01"),
            new Date(),
            "user5",
            []
        );

        vesselVisitExecutionRepo.findByVesselIMOs.mockResolvedValue([domainObj]);

        (VesselVisitExecutionMap.toDTO as jest.Mock).mockReturnValue({
            id: "5",
            code: "2024-PA-000005"
        });

        const result = await service.getVesselVisitExecutionsByVesselIMO("IMO3333333");

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([{ id: "5", code: "2024-PA-000005" }]);
    });

    it("should fail when no executions found for vessel IMO", async () => {
        vesselVisitExecutionRepo.findByVesselIMOs.mockResolvedValue([]);

        const result = await service.getVesselVisitExecutionsByVesselIMO("IMO9999999");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("No Vessel Visit Executions found");
    });

    // ---------------------------------------------------
    // getVesselVisitExecutions (with filters)
    // ---------------------------------------------------

    it("should return executions with filters", async () => {
        const domainObj = new VesselVisitExecution(
            "6",
            "2024-PA-000006",
            "IMO4444444",
            VesselVisitExecutionStatus.InProgress,
            new Date("2024-06-01"),
            new Date(),
            "user6",
            []
        );

        vesselVisitExecutionRepo.findByFilters.mockResolvedValue([domainObj]);

        (VesselVisitExecutionMap.toDTO as jest.Mock).mockReturnValue({
            id: "6",
            code: "2024-PA-000006"
        });

        const result = await service.getVesselVisitExecutions({ vesselIMO: "IMO4444444", status: "InProgress" });

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual([{ id: "6", code: "2024-PA-000006" }]);
    });

    it("should fail when invalid status in filters", async () => {
        const result = await service.getVesselVisitExecutions({ status: "INVALID" });

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Invalid status value");
    });

    it("should fail when no executions found for filters", async () => {
        vesselVisitExecutionRepo.findByFilters.mockResolvedValue([]);

        const result = await service.getVesselVisitExecutions({ vesselIMO: "IMO9999999" });

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("No Vessel Visit Executions found");
    });

    // ---------------------------------------------------
    // createVesselVisitExecution
    // ---------------------------------------------------

    it("should create a vessel visit execution successfully", async () => {
        const dto = {
            vesselVisitNotificationCode: "VVN001",
            arrivalDate: new Date("2024-07-01"),
            incidentIDs: []
        };

        const mockUser = { id: 1, email: "user@test.com" };
        const mockVVN = { vesselIMO: "IMO5555555", visitStatus: "Approved" };
        const mockOperationPlan = { 
            vesselVisitNotificationCode: "VVN001",
            operations: []
        };

        mockSystemUserClient.getMyIsFirstTime.mockResolvedValue({ email: "user@test.com" });
        mockSystemUserClient.getByEmail.mockResolvedValue(mockUser);
        mockVvnClient.getByCode.mockResolvedValue(mockVVN);

        operationPlanRepo.findByVvn.mockResolvedValue(mockOperationPlan);
        vesselVisitExecutionRepo.findByVesselIMO.mockResolvedValue(null);
        vesselVisitExecutionRepo.findAll.mockResolvedValue([]);

        const domainCreated = new VesselVisitExecution(
            "7",
            "2024-PA-000001",
            "IMO5555555",
            VesselVisitExecutionStatus.InProgress,
            new Date("2024-07-01"),
            new Date(),
            "1",
            []
        );

        (VesselVisitExecutionMap.toDomain as jest.Mock).mockReturnValue(domainCreated);
        vesselVisitExecutionRepo.save.mockResolvedValue(domainCreated);

        (VesselVisitExecutionMap.toDTO as jest.Mock).mockReturnValue({
            id: "7",
            code: "2024-PA-000001"
        });

        const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

        if (result.isFailure) {
            console.log("Failure reason:", result.errorValue());
        }

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "7", code: "2024-PA-000001" });
    });

    it("should fail when no email claim found", async () => {
        const dto = {
            vesselVisitNotificationCode: "VVN001",
            arrivalDate: new Date("2024-07-01")
        };

        mockSystemUserClient.getMyIsFirstTime.mockResolvedValue(null);

        const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("No email claim found");
    });

    it("should fail when user not found", async () => {
        const dto = {
            vesselVisitNotificationCode: "VVN001",
            arrivalDate: new Date("2024-07-01")
        };

        mockSystemUserClient.getMyIsFirstTime.mockResolvedValue({ email: "user@test.com" });
        mockSystemUserClient.getByEmail.mockResolvedValue(null);

        const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Authenticated user not found");
    });

    it("should fail when vessel visit notification not found", async () => {
        const dto = {
            vesselVisitNotificationCode: "VVN001",
            arrivalDate: new Date("2024-07-01")
        };

        const mockUser = { id: 1, email: "user@test.com" };

        mockSystemUserClient.getMyIsFirstTime.mockResolvedValue({ email: "user@test.com" });
        mockSystemUserClient.getByEmail.mockResolvedValue(mockUser);
        mockVvnClient.getByCode.mockResolvedValue(null);

        const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Vessel Visit Notification not found");
    });

    it("should fail when VVN status is not Approved", async () => {
        const dto = {
            vesselVisitNotificationCode: "VVN001",
            arrivalDate: new Date("2024-07-01")
        };

        const mockUser = { id: 1, email: "user@test.com" };
        const mockVVN = { vesselIMO: "IMO5555555", visitStatus: "Pending" };

        mockSystemUserClient.getMyIsFirstTime.mockResolvedValue({ email: "user@test.com" });
        mockSystemUserClient.getByEmail.mockResolvedValue(mockUser);
        mockVvnClient.getByCode.mockResolvedValue(mockVVN);

        const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("must be 'Approved'");
    });

    it("should fail when vessel IMO already has execution", async () => {
        const dto = {
            vesselVisitNotificationCode: "VVN001",
            arrivalDate: new Date("2024-07-01")
        };

        const mockUser = { id: 1, email: "user@test.com" };
        const mockVVN = { vesselIMO: "IMO5555555", visitStatus: "Approved" };

        mockSystemUserClient.getMyIsFirstTime.mockResolvedValue({ email: "user@test.com" });
        mockSystemUserClient.getByEmail.mockResolvedValue(mockUser);
        mockVvnClient.getByCode.mockResolvedValue(mockVVN);

        vesselVisitExecutionRepo.findByVesselIMO.mockResolvedValue({ id: "existing" });

        const result = await service.createVesselVisitExecution(dto as any, "Bearer token");

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("already exists");
    });

    // ---------------------------------------------------
    // updateVesselVisitExecution
    // ---------------------------------------------------

    it("should update a vessel visit execution successfully", async () => {
        const existing = new VesselVisitExecution(
            "8",
            "2024-PA-000008",
            "IMO6666666",
            VesselVisitExecutionStatus.InProgress,
            new Date("2024-08-01"),
            new Date(),
            "user8",
            []
        );

        vesselVisitExecutionRepo.findByCode.mockResolvedValue(existing);
        vesselVisitExecutionRepo.update.mockResolvedValue(existing);

        (VesselVisitExecutionMap.toDTO as jest.Mock).mockReturnValue({
            id: "8",
            code: "2024-PA-000008",
            status: "Completed"
        });

        const payload = {
            status: "Completed",
            departureDate: "2024-08-05"
        };

        const result = await service.updateVesselVisitExecution("2024-PA-000008", payload);

        expect(result.isSuccess).toBe(true);
        expect(result.getValue()).toEqual({ id: "8", code: "2024-PA-000008", status: "Completed" });
    });

    it("should fail when vessel visit execution not found", async () => {
        vesselVisitExecutionRepo.findByCode.mockResolvedValue(null);

        const result = await service.updateVesselVisitExecution("XXX", { status: "Completed" });

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("not found");
    });

    it("should fail when status is invalid", async () => {
        const existing = new VesselVisitExecution(
            "9",
            "2024-PA-000009",
            "IMO7777777",
            VesselVisitExecutionStatus.InProgress,
            new Date("2024-09-01"),
            new Date(),
            "user9",
            []
        );

        vesselVisitExecutionRepo.findByCode.mockResolvedValue(existing);

        const payload = { status: "INVALID" };

        const result = await service.updateVesselVisitExecution("2024-PA-000009", payload);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Invalid status value");
    });

    it("should fail when departure date is invalid", async () => {
        const existing = new VesselVisitExecution(
            "10",
            "2024-PA-000010",
            "IMO8888888",
            VesselVisitExecutionStatus.InProgress,
            new Date("2024-10-01"),
            new Date(),
            "user10",
            []
        );

        vesselVisitExecutionRepo.findByCode.mockResolvedValue(existing);

        const payload = { departureDate: "invalid-date" };

        const result = await service.updateVesselVisitExecution("2024-PA-000010", payload);

        expect(result.isFailure).toBe(true);
        expect(result.errorValue()).toContain("Invalid departureDate format");
    });
});
