import { Service, Inject } from "typedi";
import IVesselVisitExecutionRepo from "../services/IRepos/IVesselVisitExecutionRepo";
import IIncidentRepo from "./IRepos/IIncidentRepo";
import IOperationPlanRepo from "./IRepos/IOperationPlanRepo";
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
import { OperationExecutionEntryMap } from "../mappers/OperationExecutionEntryMap";
import { OperationPlanMap } from "../mappers/OperationPlanMap";

@Service()
export default class VesselVisitExecutionService implements IVesselVisitExecutionService {
    private sysClient: SystemUserClient;
    private vvnClient: VesselVisitNotificationClient;

    constructor(
        @Inject("vesselVisitExecutionRepo") private vesselVisitExecutionRepo: IVesselVisitExecutionRepo,
        @Inject("incidentRepo") private incidentRepo: IIncidentRepo,
        @Inject("operationPlanRepo") private operationPlanRepo: IOperationPlanRepo,
        @Inject("logger") private logger: any
    ) {
        const apiBaseUrl = process.env.API_URL || 'http://localhost:5000/api';
        this.sysClient = new SystemUserClient(apiBaseUrl);
        this.vvnClient = new VesselVisitNotificationClient(apiBaseUrl);
    }

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
            const vesselVisitExecutions = await this.vesselVisitExecutionRepo.findByVesselIMOs(vesselIMO);
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

    public async createVesselVisitExecution(dto: VesselVisitExecutionDTO, authHeader?: string): Promise<Result<VesselVisitExecutionDTO>> {
        try {
            // Fetch current system user
            const myInfo = await this.sysClient.getMyIsFirstTime(authHeader);
            const email = myInfo?.email;
            if (!email) {
                return Result.fail("No email claim found in Auth0 token.");
            }
            const currentUser = await this.sysClient.getByEmail(email, authHeader);
            if (!currentUser) {
                return Result.fail("Authenticated user not found.");
            }
            dto.systemUserID = String(currentUser.id);

            // Validate Vessel Visit Notification by code
            if (!dto.vesselVisitNotificationCode || typeof dto.vesselVisitNotificationCode !== 'string') {
                return Result.fail("vesselVisitNotificationCode is required.");
            }
            const vvn = await this.vvnClient.getByCode(dto.vesselVisitNotificationCode, authHeader);
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
            if (vveByVesselIMO) {
                return Result.fail(`A Vessel Visit Execution already exists for vessel IMO ${vesselIMO}.`);
            }

            // Validate that an OperationPlan exists for this VVN
            const operationPlan = await this.operationPlanRepo.findByVvn(dto.vesselVisitNotificationCode);
            if (!operationPlan) {
                return Result.fail(`Cannot create Vessel Visit Execution: No Operation Plan exists for VVN ${dto.vesselVisitNotificationCode}. Please create an Operation Plan first.`);
            }

            // Copy operations from OperationPlan to OperationExecutionEntries
            const operationExecutions = operationPlan.operations.map(op => 
                OperationExecutionEntryMap.fromOperationEntry(op)
            );

            const incidentIDs = dto.incidentIDs;
            if (incidentIDs !== null && incidentIDs !== undefined && incidentIDs.length > 0) {
                const incidents = await this.incidentRepo.findByIDs(incidentIDs);
                
                if (!incidents || incidents.length !== incidentIDs.length) {
                    return Result.fail("One or more Incident IDs not found.");
                }

                const vveArrivalTime = new Date(dto.arrivalDate).getTime();
                const vveDepartureTime = dto.departureDate ? new Date(dto.departureDate).getTime() : new Date().getTime();

                const affectedIncidents = incidents.filter(incident => {
                    const incidentStartTime = incident.startDate.getTime();
                    const incidentEndTime = incident.endDate ? incident.endDate.getTime() : new Date().getTime();

                    return (
                        vveArrivalTime <= incidentEndTime &&
                        vveDepartureTime >= incidentStartTime
                    );
                });

                if (affectedIncidents.length !== incidents.length) {
                    const affectedIds = new Set(affectedIncidents.map(inc => inc.id));
                    const unaffectedIncidents = incidents.filter(inc => !affectedIds.has(inc.id));
                    const unaffectedIds = unaffectedIncidents.map(inc => inc.id).join(', ');
                    return Result.fail(`The following Incidents do not overlap with the VesselVisitExecution time range: ${unaffectedIds}`);
                }
            }

            const vesselVisitExecutionCode = await this.generateVesselVisitExecutionCode();
            const domain = VesselVisitExecutionMap.toDomain({
                code: vesselVisitExecutionCode,
                vesselIMO: vesselIMO,
                status: VesselVisitExecutionStatus.InProgress,
                arrivalDate: dto.arrivalDate,
                lastUpdated: new Date(),
                systemUserID: dto.systemUserID,
                operations: operationExecutions,
            } as any);
            const saved = await this.vesselVisitExecutionRepo.save(domain);
            if (!saved) {
                return Result.fail("Failed to create Vessel Visit Execution.");
            }

            if (incidentIDs !== null && incidentIDs !== undefined && incidentIDs.length > 0) {
                const incidents = await this.incidentRepo.findByIDs(incidentIDs);
                
                for (const incident of incidents) {
                    const currentVVEs = incident.vesselVisitExecutions || [];
                    
                    const currentCodes = currentVVEs.map((vve: any) => 
                        typeof vve === 'string' ? vve : vve.code
                    );
                    
                    if (!currentCodes.includes(saved.code)) {
                        const updatedCodes = [...currentCodes, saved.code];
                        
                        const updatedVVEs = updatedCodes.map(code => ({ code } as any));
                        
                        incident.updateVesselVisitExecutions(updatedVVEs);
                        await this.incidentRepo.update(incident);
                    }
                }
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
                
                // If setting status to Completed, verify all operations are completed
                if (enumValue === VesselVisitExecutionStatus.Completed) {
                    const operations = payload.operations || vesselVisitExecution.operations;
                    if (operations && operations.length > 0) {
                        const incompleteOps = operations.filter((op: any) => op.status !== 'Completed');
                        if (incompleteOps.length > 0) {
                            return Result.fail(`Cannot set VVE status to Completed: ${incompleteOps.length} operation(s) are not yet completed.`);
                        }
                    }
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

            // Update DockAssigned if provided
            if (payload.DockAssigned !== undefined) {
                (vesselVisitExecution as any).DockAssigned = payload.DockAssigned;
            }

            // Update arrivalDate if provided
            if (payload.arrivalDate) {
                const a = new Date(payload.arrivalDate);
                if (isNaN(a.getTime())) {
                    return Result.fail('Invalid arrivalDate format.');
                }
                (vesselVisitExecution as any).arrivalDate = a;
            }

            // Update operations if provided
            if (payload.operations && Array.isArray(payload.operations)) {
                try {
                    // Get the arrival date (use updated one if provided, otherwise use existing)
                    const arrivalDate = payload.arrivalDate 
                        ? new Date(payload.arrivalDate) 
                        : vesselVisitExecution.arrivalDate;
                    
                    // Validate each operation
                    for (const op of payload.operations) {
                        // Validate: if status is Pending, actualStart and actualEnd must be null
                        if (op.status === 'Pending') {
                            if (op.actualStart || op.actualEnd) {
                                return Result.fail(`Operation with status 'Pending' cannot have actual start or end times.`);
                            }
                        }
                        
                        // Validate: if status is Started, actualStart must be provided
                        if (op.status === 'Started') {
                            if (!op.actualStart) {
                                return Result.fail(`Operation with status 'Started' must have actual start time.`);
                            }
                        }
                        
                        // Validate: if status is Completed, both actualStart and actualEnd must be provided
                        if (op.status === 'Completed') {
                            if (!op.actualStart || !op.actualEnd) {
                                return Result.fail(`Operation with status 'Completed' must have both actual start and end times.`);
                            }
                        }
                        
                        // Validate: actualEnd must be after actualStart
                        if (op.actualStart && op.actualEnd) {
                            const start = new Date(op.actualStart);
                            const end = new Date(op.actualEnd);
                            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                                return Result.fail('Invalid date format for operation actual times.');
                            }
                            if (end.getTime() <= start.getTime()) {
                                return Result.fail('Operation actual end time must be after actual start time.');
                            }
                            
                            // Validate: actualStart cannot be before arrivalDate
                            if (start.getTime() < arrivalDate.getTime()) {
                                return Result.fail('Operation actual start time cannot be before vessel arrival date.');
                            }
                        }
                    }
                    
                    // Validate: operations using the same crane cannot overlap in time
                    for (let i = 0; i < payload.operations.length; i++) {
                        const op1 = payload.operations[i];
                        if (!op1.actualStart || !op1.actualEnd || !op1.craneUsed) continue;
                        
                        const start1 = new Date(op1.actualStart).getTime();
                        const end1 = new Date(op1.actualEnd).getTime();
                        
                        for (let j = i + 1; j < payload.operations.length; j++) {
                            const op2 = payload.operations[j];
                            if (!op2.actualStart || !op2.actualEnd || !op2.craneUsed) continue;
                            
                            // Check if same crane
                            if (op1.craneUsed === op2.craneUsed) {
                                const start2 = new Date(op2.actualStart).getTime();
                                const end2 = new Date(op2.actualEnd).getTime();
                                
                                // Check for overlap: start1 < end2 AND start2 < end1
                                if (start1 < end2 && start2 < end1) {
                                    return Result.fail(`Operations using crane "${op1.craneUsed}" have overlapping time ranges and cannot be executed simultaneously.`);
                                }
                            }
                        }
                    }
                    
                    const updatedOperations = payload.operations.map((op: any) => 
                        OperationExecutionEntryMap.toDomain(op)
                    );
                    vesselVisitExecution.updateOperations(updatedOperations);
                } catch (error: any) {
                    return Result.fail(`Invalid operations data: ${error.message}`);
                }
            }

            // Update individual operation if operationId and operation data is provided
            if (payload.operationId && payload.operation) {
                try {
                    const updatedOperation = OperationExecutionEntryMap.toDomain(payload.operation);
                    vesselVisitExecution.updateOperation(payload.operationId, updatedOperation);
                } catch (error: any) {
                    return Result.fail(`Error updating operation: ${error.message}`);
                }
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