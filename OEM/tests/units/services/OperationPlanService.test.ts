import { Result } from "../../../src/core/logic/Result";

// --- MOCKS ---
jest.mock("../../../src/mappers/OperationPlanMap", () => ({
    OperationPlanMap: {
        toDTO: jest.fn(),
        toDomain: jest.fn(),
        toPersistence: jest.fn()
    }
}));

jest.mock("../../../src/services/clients/VesselVisitNotificationClient");

import OperationPlanService from "../../../src/services/OperationPlanService";
import { OperationPlanMap } from "../../../src/mappers/OperationPlanMap";
import VesselVisitNotificationClient from "../../../src/services/clients/VesselVisitNotificationClient";

describe("OperationPlanService - Missing Plans Tests (unit tests)", () => {

    let operationPlanRepo: any;
    let logger: any;
    let service: OperationPlanService;
    let vvnClientMock: jest.Mocked<VesselVisitNotificationClient>;

    beforeEach(() => {
        operationPlanRepo = {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByVvn: jest.fn(),
            findByTargetDay: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };

        logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };

        service = new OperationPlanService(operationPlanRepo, logger);

        // Mock VesselVisitNotificationClient instance
        vvnClientMock = service['vvnClient'] as jest.Mocked<VesselVisitNotificationClient>;
        vvnClientMock.getAll = jest.fn();

        // Reset mocks
        jest.clearAllMocks();
    });

    // ---------------------------------------------------
    // getVvnsWithoutOperationPlan
    // ---------------------------------------------------

    describe("getVvnsWithoutOperationPlan", () => {
        it("should return VVNs that don't have operation plans", async () => {
            // Arrange: Mock VVN client to return 3 VVNs
            const mockVvns = [
                { code: "2026-PA-000001", vessel: { vesselName: "Vessel A" }, eta: "2026-01-15T10:00:00Z", visitStatus: "Approved" },
                { code: "2026-PA-000002", vessel: { vesselName: "Vessel B" }, eta: "2026-01-15T14:00:00Z", visitStatus: "Approved" },
                { code: "2026-PA-000003", vessel: { vesselName: "Vessel C" }, eta: "2026-01-16T09:00:00Z", visitStatus: "Approved" }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);

            // Mock repository to return only one existing plan for VVN-001
            const mockOperationPlans = [
                {
                    id: "plan-1",
                    vvn: "2026-PA-000001",
                    TargetDay: new Date("2026-01-15"),
                    operations: []
                }
            ];

            operationPlanRepo.findAll.mockResolvedValue(mockOperationPlans);

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(2);
            expect(result.getValue()[0].code).toBe("2026-PA-000002");
            expect(result.getValue()[1].code).toBe("2026-PA-000003");
            expect(logger.info).toHaveBeenCalledWith('Fetched 3 VVNs from API');
            expect(logger.info).toHaveBeenCalledWith('Found 2 approved VVNs without operation plans');
        });

        it("should return all VVNs when no operation plans exist", async () => {
            // Arrange
            const mockVvns = [
                { code: "2026-PA-000001", vessel: { vesselName: "Vessel A" }, eta: "2026-01-15T10:00:00Z", visitStatus: "Approved" },
                { code: "2026-PA-000002", vessel: { vesselName: "Vessel B" }, eta: "2026-01-15T14:00:00Z", visitStatus: "Approved" }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue([]);

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(2);
        });

        it("should return empty array when all VVNs have operation plans", async () => {
            // Arrange
            const mockVvns = [
                { code: "2026-PA-000001", vessel: { vesselName: "Vessel A" }, eta: "2026-01-15T10:00:00Z", visitStatus: "Approved" }
            ];

            const mockOperationPlans = [
                { id: "plan-1", vvn: "2026-PA-000001", operations: [] }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue(mockOperationPlans);

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(0);
        });

        it("should handle errors when fetching VVNs fails", async () => {
            // Arrange
            vvnClientMock.getAll.mockRejectedValue(new Error("API Error"));

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isFailure).toBe(true);
            expect(result.errorValue()).toBe("Error retrieving VVNs without operation plans.");
            expect(logger.error).toHaveBeenCalled();
        });

        it("should handle errors when fetching operation plans fails", async () => {
            // Arrange
            const mockVvns = [
                { code: "2026-PA-000001", vessel: { vesselName: "Vessel A" }, eta: "2026-01-15T10:00:00Z", visitStatus: "Approved" }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockRejectedValue(new Error("Database Error"));

            // Act
            const result = await service.getVvnsWithoutOperationPlan();

            // Assert
            expect(result.isFailure).toBe(true);
            expect(logger.error).toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------
    // regenerateOperationPlansForDay
    // ---------------------------------------------------

    describe("regenerateOperationPlansForDay", () => {
        it("should regenerate plans for all VVNs on a specific date", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "genetic";
            const author = "user-123";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-15T10:00:00Z",
                    etd: "2026-01-15T18:00:00Z",
                    cargoManifests: []
                },
                {
                    code: "2026-PA-000002",
                    vessel: { vesselName: "Vessel B" },
                    eta: "2026-01-15T14:00:00Z",
                    etd: "2026-01-15T22:00:00Z",
                    cargoManifests: []
                }
            ];

            const mockExistingPlans = [
                { id: "plan-1", vvn: "2026-PA-000001", operations: [] }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue(mockExistingPlans);
            operationPlanRepo.delete.mockResolvedValue(true);

            const mockDomainPlan = {
                id: "new-plan-1",
                vvn: "2026-PA-000001",
                TargetDay: targetDate,
                operations: []
            };

            (OperationPlanMap.toDomain as jest.Mock).mockReturnValue(mockDomainPlan);
            operationPlanRepo.save.mockResolvedValue(mockDomainPlan);

            (OperationPlanMap.toDTO as jest.Mock).mockImplementation((plan) => ({
                id: plan.id,
                vvn: plan.vvn,
                targetDay: plan.TargetDay,
                operations: plan.operations
            }));

            // Act
            const result = await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(operationPlanRepo.delete).toHaveBeenCalledWith("plan-1");
            expect(logger.info).toHaveBeenCalledWith('Regenerating operation plans for day: 2026-01-15T00:00:00.000Z');
            expect(logger.info).toHaveBeenCalledWith('Found 2 VVNs for day 2026-01-15T00:00:00.000Z');
        });

        it("should return empty array when no VVNs exist for the day", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "default";
            const author = "user-123";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-16T10:00:00Z", // Different day
                    etd: "2026-01-16T18:00:00Z",
                    cargoManifests: []
                }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue([]);

            // Act
            const result = await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(result.getValue()).toHaveLength(0);
            expect(logger.info).toHaveBeenCalledWith('Found 0 VVNs for day 2026-01-15T00:00:00.000Z');
        });

        it("should delete existing plans before creating new ones", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "improved";
            const author = "user-123";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-15T10:00:00Z",
                    etd: "2026-01-15T18:00:00Z",
                    cargoManifests: []
                }
            ];

            const mockExistingPlans = [
                { id: "old-plan-1", vvn: "2026-PA-000001", operations: [] },
                { id: "other-plan", vvn: "2026-PA-000099", operations: [] } // Different VVN
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue(mockExistingPlans);
            operationPlanRepo.delete.mockResolvedValue(true);

            const mockDomainPlan = {
                id: "new-plan-1",
                vvn: "2026-PA-000001",
                TargetDay: targetDate,
                operations: []
            };

            (OperationPlanMap.toDomain as jest.Mock).mockReturnValue(mockDomainPlan);
            operationPlanRepo.save.mockResolvedValue(mockDomainPlan);
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "new-plan-1" });

            // Act
            const result = await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(result.isSuccess).toBe(true);
            expect(operationPlanRepo.delete).toHaveBeenCalledTimes(1);
            expect(operationPlanRepo.delete).toHaveBeenCalledWith("old-plan-1");
            expect(operationPlanRepo.delete).not.toHaveBeenCalledWith("other-plan");
            expect(logger.info).toHaveBeenCalledWith('Deleted existing operation plan old-plan-1 for VVN 2026-PA-000001');
        });

        it("should handle errors when deleting plans fails", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "automatic";
            const author = "user-123";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-15T10:00:00Z",
                    etd: "2026-01-15T18:00:00Z",
                    cargoManifests: []
                }
            ];

            const mockExistingPlans = [
                { id: "plan-1", vvn: "2026-PA-000001", operations: [] }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue(mockExistingPlans);
            operationPlanRepo.delete.mockRejectedValue(new Error("Delete failed"));

            // Act
            const result = await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(result.isFailure).toBe(true);
            expect(logger.error).toHaveBeenCalled();
        });

        it("should create plans with correct metadata", async () => {
            // Arrange
            const targetDate = new Date("2026-01-15");
            const algorithm = "genetic";
            const author = "logistics-operator-1";

            const mockVvns = [
                {
                    code: "2026-PA-000001",
                    vessel: { vesselName: "Vessel A" },
                    eta: "2026-01-15T10:00:00Z",
                    etd: "2026-01-15T18:00:00Z",
                    cargoManifests: []
                }
            ];

            vvnClientMock.getAll.mockResolvedValue(mockVvns as any);
            operationPlanRepo.findAll.mockResolvedValue([]);

            let capturedDomainArg: any;
            (OperationPlanMap.toDomain as jest.Mock).mockImplementation((arg) => {
                capturedDomainArg = arg;
                return {
                    id: "new-plan",
                    vvn: arg.vvn,
                    TargetDay: arg.TargetDay,
                    operations: arg.operations,
                    author: arg.author,
                    algorithm: arg.algorithm
                };
            });

            operationPlanRepo.save.mockResolvedValue({ id: "new-plan" });
            (OperationPlanMap.toDTO as jest.Mock).mockReturnValue({ id: "new-plan" });

            // Act
            await service.regenerateOperationPlansForDay(
                targetDate,
                author,
                algorithm
            );

            // Assert
            expect(capturedDomainArg).toBeDefined();
            expect(capturedDomainArg.author).toBe(author);
            expect(capturedDomainArg.algorithm).toBe(algorithm);
            expect(capturedDomainArg.createdAt).toBeInstanceOf(Date);
        });
    });
});
