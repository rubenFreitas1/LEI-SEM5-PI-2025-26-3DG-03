import { Service, Inject } from "typedi";
import IVesselVisitExecutionRepo from "../services/IRepos/IVesselVisitExecutionRepo";
import { VesselVisitExecutionStatus } from "../domain/VesselVisitExecutionStatus";
import { VesselVisitExecution } from "../domain/VesselVisitExecution";
import { VesselVisitExecutionDTO } from "../dto/VesselVisitExecutionDTO";
import { VesselVisitExecutionMap } from "../mappers/VesselVisitExecutionMap";
import { Result } from "../core/logic/Result";
import IVesselVisitExecutionService from "./IServices/IVesselVisitExecutionService";
import { stat } from "fs";
import { generateKey } from "crypto";
import SystemUserClient from "./clients/SystemUserClient";
import VesselVisitNotificationClient from "./clients/VesselVisitNotificationClient";

@Service()
export default class VesselVisitExecutionService implements IVesselVisitExecutionService {

    constructor(
        @Inject("vesselVisitExecutionRepo") private vesselVisitExecutionRepo: IVesselVisitExecutionRepo,
        @Inject("logger") private logger: any
    ) {}

    public async getAllVesselVisitExecutions(): Promise<Result<VesselVisitExecutionDTO[]>> {
        try {
            const vesselVisitExecutions = await this.vesselVisitExecutionRepo.findAll();
            const dtoList = vesselVisitExecutions.map(vve => VesselVisitExecutionMap.toDTO(vve));
            return Result.ok(dtoList);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting all vessel visit executions.");
        }
    }

    public async getVesselVisitExecutionById(id: string): Promise<Result<VesselVisitExecutionDTO>> {
        try {
            const vesselVisitExecution = await this.vesselVisitExecutionRepo.findById(id);
            if (!vesselVisitExecution) {
                return Result.fail("Vessel Visit Execution not found.");
            }
            const dto = VesselVisitExecutionMap.toDTO(vesselVisitExecution);
            return Result.ok(dto);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting vessel visit execution by ID.");
        }
    }

    public async getVesselVisitExecutionByCode(code: string): Promise<Result<VesselVisitExecutionDTO>> {
        try {
            const vesselVisitExecution = await this.vesselVisitExecutionRepo.findByCode(code);
            if (!vesselVisitExecution) {
                return Result.fail("Vessel Visit Execution not found.");
            }
            const dto = VesselVisitExecutionMap.toDTO(vesselVisitExecution);
            return Result.ok(dto);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting vessel visit execution by code.");
        }
    }

    public async getVesselVisitExecutionsByStatus(status: VesselVisitExecutionStatus): Promise<Result<VesselVisitExecutionDTO[]>> {
        try {
            const enumValue = VesselVisitExecutionStatus[status as keyof typeof VesselVisitExecutionStatus];
            if (enumValue === undefined) {
                return Result.fail(`Invalid status value: ${status}.`);
            }
            const vesselVisitExecutions = await this.vesselVisitExecutionRepo.findByStatus(enumValue);
            if (!vesselVisitExecutions || vesselVisitExecutions.length === 0) {
                return Result.fail(`No Vessel Visit Executions found for the status ${status}.`);
            }
            const dtoList = vesselVisitExecutions.map(vve => VesselVisitExecutionMap.toDTO(vve));
            return Result.ok(dtoList);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting vessel visit executions by status.");
        }
    }

    public async getVesselVisitExecutionsByVesselIMO(vesselIMO: string): Promise<Result<VesselVisitExecutionDTO[]>> {
        try {
            const vesselVisitExecutions = await this.vesselVisitExecutionRepo.findByVesselIMO(vesselIMO);
            if (!vesselVisitExecutions || vesselVisitExecutions.length === 0) {
                return Result.fail(`No Vessel Visit Executions found for the vessel IMO ${vesselIMO}.`);
            }
            const dtoList = vesselVisitExecutions.map(vve => VesselVisitExecutionMap.toDTO(vve));
            return Result.ok(dtoList);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting vessel visit executions by vessel IMO.");
        }
    }

    public async getVesselVisitExecutions(filters: { from?: string; to?: string; vesselIMO?: string; status?: string }): Promise<Result<VesselVisitExecutionDTO[]>> {
        try {
            const parsed: any = {};
            if (filters.vesselIMO) parsed.vesselIMO = filters.vesselIMO;
            if (filters.status) {
                const enumValue = VesselVisitExecutionStatus[filters.status as keyof typeof VesselVisitExecutionStatus];
                if (enumValue === undefined) {
                    return Result.fail(`Invalid status value: ${filters.status}.`);
                }
                parsed.status = enumValue;
            }
            if (filters.from) parsed.from = new Date(filters.from);
            if (filters.to) parsed.to = new Date(filters.to);

            const vesselVisitExecutions = await this.vesselVisitExecutionRepo.findByFilters(parsed);
            if (!vesselVisitExecutions || vesselVisitExecutions.length === 0) {
                return Result.fail('No Vessel Visit Executions found for the given filters.');
            }
            const dtoList = vesselVisitExecutions.map(vve => VesselVisitExecutionMap.toDTO(vve));
            return Result.ok(dtoList);
        } catch (error) {
            this.logger.error(error);
            return Result.fail('Error getting vessel visit executions with filters.');
        }
    }

    private async generateVesselVisitExecutionCode(): Promise<string> {
        const portCode = "PA";
        const year = new Date().getFullYear();

        const existingExecutions = await this.vesselVisitExecutionRepo.findAll();

        const relevantCodes = existingExecutions
            .map(vve => vve.code)
            .filter(code => code.startsWith(`${year}-${portCode}-`));

        let nextSeq = 1;
        if (relevantCodes.length > 0) {
            const seqNumbers = relevantCodes
                .map(code => {
                    const parts = code.split('-');
                    if (parts.length === 3) {
                        const seq = parseInt(parts[2], 10);
                        return isNaN(seq) ? 0 : seq;
                    }
                    return 0;
                });

            nextSeq = Math.max(...seqNumbers) + 1;
        }

        const sequentialNumber = nextSeq.toString().padStart(6, '0');
        const code = `${year}-${portCode}-${sequentialNumber}`;

        return code;
    }

    public async createVesselVisitExecution(dto: VesselVisitExecutionDTO, apiBaseUrl?: string, authHeader?: string): Promise<Result<VesselVisitExecutionDTO>> {
        try {
            // Fetch current system user if API base URL is provided
            const sysClient = new SystemUserClient(apiBaseUrl);
            const myInfo = await sysClient.getMyIsFirstTime(authHeader);
            const email = myInfo?.email;
            if (!email) {
                return Result.fail("No email claim found in Auth0 token.");
            }
            const currentUser = await sysClient.getByEmail(email, authHeader);
            if (!currentUser) {
                return Result.fail("Authenticated user not found.");
            }
            dto.systemUserID = String(currentUser.id);

            // Validate Vessel Visit Notification by code
            if (!dto.vesselVisitNotificationCode || typeof dto.vesselVisitNotificationCode !== 'string') {
                return Result.fail("vesselVisitNotificationCode is required.");
            }
            const vvnClient = new VesselVisitNotificationClient(apiBaseUrl);
            const vvn = await vvnClient.getByCode(dto.vesselVisitNotificationCode, authHeader);
            if (!vvn) {
                return Result.fail("Vessel Visit Notification not found for provided code.");
            }

            // Verify Vessel Visit Notification status is Approved
            if (vvn.visitStatus !== "Approved") {
                return Result.fail(`Vessel Visit Notification status must be 'Approved', but is '${vvn.visitStatus}'.`);
            }

            const vesselIMO = vvn.vesselIMO;
            if (!vesselIMO) {
                return Result.fail("Vessel IMO is missing in the Vessel Visit Notification.");
            }
            const vveByVesselIMO = await this.vesselVisitExecutionRepo.findByVesselIMO(vesselIMO);
            if (vveByVesselIMO && vveByVesselIMO.length > 0) {
                return Result.fail(`A Vessel Visit Execution already exists for vessel IMO ${vesselIMO}.`);
            }
            const vesselVisitExecutionCode = await this.generateVesselVisitExecutionCode();
            const domain = VesselVisitExecutionMap.toDomain({
                code: vesselVisitExecutionCode,
                vesselIMO: vesselIMO,
                status: VesselVisitExecutionStatus.InProgress,
                arrivalDate: dto.arrivalDate,
                lastUpdated: new Date(),
                systemUserID: dto.systemUserID,
            } as any);
            const saved = await this.vesselVisitExecutionRepo.save(domain);
            if (!saved) {
                return Result.fail("Failed to create Vessel Visit Execution.");
            }
            const dtoResult = VesselVisitExecutionMap.toDTO(saved);
            return Result.ok(dtoResult);
        } catch (error: any) {
            this.logger.error(error);
            return Result.fail("Error creating vessel visit execution: " + error.message);
        }
    }

    public async updateVesselVisitExecution(code: string, payload: any): Promise<Result<VesselVisitExecutionDTO>> {
        try {
            const vesselVisitExecution = await this.vesselVisitExecutionRepo.findByCode(code);
            if (!vesselVisitExecution) {
                return Result.fail('Vessel Visit Execution not found.');
            }

            if (payload.status) {
                const enumValue = VesselVisitExecutionStatus[payload.status as keyof typeof VesselVisitExecutionStatus];
                if (enumValue === undefined) {
                    return Result.fail(`Invalid status value: ${payload.status}.`);
                }
                vesselVisitExecution.updateStatus(enumValue);
            }

            if (payload.departureDate) {
                const d = new Date(payload.departureDate);
                if (isNaN(d.getTime())) {
                    return Result.fail('Invalid departureDate format.');
                }
                (vesselVisitExecution as any).departureDate = d;
            }

            vesselVisitExecution.lastUpdated = new Date();

            const updated = await this.vesselVisitExecutionRepo.update(vesselVisitExecution);
            if (!updated) {
                return Result.fail('Failed to update Vessel Visit Execution.');
            }

            const dto = VesselVisitExecutionMap.toDTO(vesselVisitExecution);
            return Result.ok(dto);
        } catch (error: any) {
            this.logger.error(error);
            return Result.fail('Error updating vessel visit execution: ' + (error.message || error));
        }
    }
}