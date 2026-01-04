import { Service, Inject } from "typedi";
import IOperationPlanRepo from "./IRepos/IOperationPlanRepo";
import { OperationPlan } from "../domain/OperationPlan";
import IOperationPlanService from "./IServices/IOperationPlanService";

import { Result } from "../core/logic/Result";
import { OperationPlanDTO } from "../dto/OperationPlanDTO";
import { AuthMechanism } from "mongodb";
import { OperationPlanMap } from "../mappers/OperationPlanMap";
import { OperationEntryMap } from "../mappers/OperationEntryMap";
import VesselVisitNotificationClient, { VesselVisitNotificationDTO } from "./clients/VesselVisitNotificationClient";
import ScheduleClient from "./clients/ScheduleClient";
import config from "../../config";


@Service()
export default class OperationPlanService implements IOperationPlanService {
    private vvnClient: VesselVisitNotificationClient;
    private scheduleClient: ScheduleClient;

    constructor(
        @Inject("operationPlanRepo") private operationPlanRepo: IOperationPlanRepo,
        @Inject("logger") private logger: any
    ){
        const apiBaseUrl = process.env.API_URL || 'http://localhost:5000/api';
        this.vvnClient = new VesselVisitNotificationClient(apiBaseUrl);
        
        const schedulingBaseUrl = process.env.SCHEDULING_API_URL || 'http://localhost:6000';
        this.scheduleClient = new ScheduleClient(schedulingBaseUrl);
    }

    public async getAllOperationPlans(): Promise<Result<OperationPlanDTO[]>> {
        try {
            const operationPlans = await this.operationPlanRepo.findAll();
            const operationPlanDTOs = operationPlans.map(op => OperationPlanMap.toDTO(op));
            return Result.ok(operationPlanDTOs);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error retrieving operation plans.");
        }
  
    }

    public async getOperationPlanById(id: string): Promise<Result<OperationPlanDTO>> {
        try {
            const operationPlan = await this.operationPlanRepo.findById(id);
            if (!operationPlan) {
                return Result.fail("Operation plan not found.");
            }
            const operationPlanDTO = OperationPlanMap.toDTO(operationPlan);
            return Result.ok(operationPlanDTO);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error retrieving operation plan.");
        }
    }


    public async getOperationPlansByVvn(vvn: string): Promise<Result<OperationPlanDTO[]>> {
        try {
            const operationPlan = await this.operationPlanRepo.findByVvn(vvn);
            if (!operationPlan) {
                return Result.ok([]);
            }
            const operationPlanDTOs = Array.isArray(operationPlan) 
                ? operationPlan.map(op => OperationPlanMap.toDTO(op))
                : [OperationPlanMap.toDTO(operationPlan)];
            return Result.ok(operationPlanDTOs);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error retrieving operation plans by VVN.");
        }

    }

    public async getOperationPlansByTargetDay(targetDay: Date): Promise<Result<OperationPlanDTO[]>> {
        try {
            const operationPlans = await this.operationPlanRepo.findByTargetDay(targetDay);
            if (!operationPlans) {
                return Result.ok([]);
            }
            const operationPlanDTOs = Array.isArray(operationPlans)
                ? operationPlans.map(op => OperationPlanMap.toDTO(op))
                : [OperationPlanMap.toDTO(operationPlans)];
            return Result.ok(operationPlanDTOs);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error retrieving operation plans by target day.");
        }
    }

    public async getOperationPlansByArrivalTime(arrivalTime: Date): Promise<Result<OperationPlanDTO[]>> {
        try {
            const operationPlans = await this.operationPlanRepo.findByArrivalTime(arrivalTime);
            const operationPlanDTOs = operationPlans.map(op => OperationPlanMap.toDTO(op));
            return Result.ok(operationPlanDTOs);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error retrieving operation plans by arrival time.");
        }

    }

    public async getOperationPlansByDepartureTime(departureTime: Date): Promise<Result<OperationPlanDTO[]>> {
        try {
            const operationPlans = await this.operationPlanRepo.findByDepartureTime(departureTime);
            const operationPlanDTOs = operationPlans.map(op => OperationPlanMap.toDTO(op));
            return Result.ok(operationPlanDTOs);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error retrieving operation plans by departure time.");
        }
    }

    public async getOperationPlansByAuthor(author: string): Promise<Result<OperationPlanDTO[]>> {
        try {
            const operationPlans = await this.operationPlanRepo.findByAuthor(author);
            const operationPlanDTOs = operationPlans.map(op => OperationPlanMap.toDTO(op));
            return Result.ok(operationPlanDTOs);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error retrieving operation plans by author.");
        }
    }

    public async getOperationPlansByAlgorithm(algorithm: string): Promise<Result<OperationPlanDTO[]>> {
        try {
            const operationPlans = await this.operationPlanRepo.findByAlgorithm(algorithm);
            const operationPlanDTOs = operationPlans.map(op => OperationPlanMap.toDTO(op));
            return Result.ok(operationPlanDTOs);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error retrieving operation plans by algorithm.");
        }
    }

    public async searchOperationPlans(startDate?: Date, endDate?: Date, vvn?: string): Promise<Result<OperationPlanDTO[]>> {
        try {
            let operationPlans: OperationPlan[];

            // If date range is provided, use findByDateRange
            if (startDate && endDate) {
                operationPlans = await this.operationPlanRepo.findByDateRange(startDate, endDate, vvn);
            } else if (vvn) {
                // If only vvn is provided
                const plan = await this.operationPlanRepo.findByVvn(vvn);
                operationPlans = plan ? [plan] : [];
            } else {
                // If no filters, return all
                operationPlans = await this.operationPlanRepo.findAll();
            }

            const operationPlanDTOs = operationPlans.map(op => OperationPlanMap.toDTO(op));
            return Result.ok(operationPlanDTOs);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error searching operation plans.");
        }
    }

    public async create(dto: OperationPlanDTO): Promise<Result<OperationPlanDTO>> {
        try {
            const exists = await this.operationPlanRepo.findByVvn(dto.vvn);
            if (exists) {
                return Result.fail("Operation plan with the same VVN already exists.");
            }

            const conflictWithTargetDay = await this.operationPlanRepo.findByTargetDay(dto.targetDay);
            if (conflictWithTargetDay) {
                return Result.fail("Operation plan for the same target day already exists.");
            }

            const domain = OperationPlanMap.toDomain({
                vvn: dto.vvn,
                TargetDay: dto.targetDay,
                arrivalTime: dto.arrivalTime,
                departureTime: dto.departureTime,
                operations: dto.operations,
                author: dto.author,
                algorithm: dto.algorithm,
                createdAt: new Date()
            } as any);
            const saved = await this.operationPlanRepo.save(domain);
            if (!saved) {
                return Result.fail("Failed to create operation plan.");
            }
            const createdDTO = OperationPlanMap.toDTO(saved);
            return Result.ok(createdDTO);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error creating operation plan.");
        }
    }

    public async update(vvn: string, dto: OperationPlanDTO): Promise<Result<OperationPlanDTO>> {
        try {
            const operationPlan = await this.operationPlanRepo.findByVvn(vvn);
            if (!operationPlan) {
                return Result.fail("Operation plan not found.");
            }

            if (dto.vvn !== vvn) {
                return Result.fail("Vessel Visit Notification number cannot be changed.");
            }

            // Validate that changeReason is provided for updates
            if (!dto.changeReason || dto.changeReason.trim().length === 0) {
                return Result.fail("Change reason is required for updates.");
            }

            // Validate that the last operation doesn't exceed departure time
            if (dto.operations && dto.operations.length > 0) {
                const lastOperation = dto.operations[dto.operations.length - 1];
                const lastOperationEnd = new Date(lastOperation.operationEnd);
                const departureTime = new Date(dto.departureTime);
                
                if (lastOperationEnd > departureTime) {
                    return Result.fail("The last operation cannot end after the departure time.");
                }
            }

            // Track changes made
            const changes: string[] = [];
            if (operationPlan.TargetDay.getTime() !== new Date(dto.targetDay).getTime()) {
                changes.push(`Target Day: ${operationPlan.TargetDay.toISOString()} -> ${new Date(dto.targetDay).toISOString()}`);
            }
            if (operationPlan.operations.length !== dto.operations.length) {
                changes.push(`Operations count: ${operationPlan.operations.length} -> ${dto.operations.length}`);
            } else {
                for (let i = 0; i < operationPlan.operations.length; i++) {
                    const oldOp = operationPlan.operations[i];
                    const newOp = dto.operations[i];
                    if (oldOp.operationStart.getTime() !== new Date(newOp.operationStart).getTime() ||
                        oldOp.operationEnd.getTime() !== new Date(newOp.operationEnd).getTime()) {
                        changes.push(`Operation ${i + 1} times updated`);
                    }
                }
            }

            // Validate operation times
            for (let i = 0; i < dto.operations.length; i++) {
                const op = dto.operations[i];
                if (new Date(op.operationStart) >= new Date(op.operationEnd)) {
                    return Result.fail(`Operation ${i + 1}: Start time must be before end time.`);
                }
            }

            try {
                operationPlan.updateTargetDay(dto.targetDay);
                operationPlan.updateArrivalTime(dto.arrivalTime);
                operationPlan.updateDepartureTime(dto.departureTime);
                operationPlan.updateAuthor(dto.author);
                operationPlan.updateAlgorithm(dto.algorithm);
                const operationEntries = dto.operations.map(opDTO => OperationEntryMap.toDomain(opDTO));
                operationPlan.updateOperations(operationEntries);

                // Add change log entry
                operationPlan.addChangeLogEntry(
                    dto.author,
                    dto.changeReason,
                    changes.length > 0 ? changes.join('; ') : 'No changes detected'
                );
            } catch (error: any) {
                return Result.fail(`Validation error: ${error.message}`);
            }

            const updated = await this.operationPlanRepo.update(operationPlan);
            if (!updated) {
                return Result.fail("Failed to update operation plan.");
            }
            const updatedDTO = OperationPlanMap.toDTO(operationPlan);
            return Result.ok(updatedDTO);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error updating operation plan.");
        }

    }


    private async createOperationEntries(
        vvn: string,
        assignedCranes: string[],
        arrivalTime: Date,
        departureTime: Date,
        authHeader?: string
    ): Promise<{ vvnCode: string | null; operations: any[] }> {
        const operations: any[] = [];
        
        try {
            // Buscar todas as VesselVisitNotifications
            this.logger.info(`Attempting to fetch VVN for vessel: ${vvn}`);
            this.logger.info(`Using authHeader: ${authHeader ? 'Present' : 'Missing'}`);
            
            const allVVNs = await this.vvnClient.getAll(authHeader);
            
            this.logger.info(`Fetched ${allVVNs.length} VVNs from API`);
            
            // Log dos nomes dos vessels disponíveis
            if (allVVNs.length > 0) {
                // Log detalhado do primeiro VVN para debug
                this.logger.info(`Sample VVN structure: ${JSON.stringify(allVVNs[0], null, 2)}`);
                
                const vesselNames = allVVNs.map(v => v.vessel?.vesselName || 'N/A');
                this.logger.info(`Available vessel names: ${JSON.stringify(vesselNames)}`);
            }
            
            // Filtrar pelo nome do vessel
            const vvnData = allVVNs.find(v => 
                v.vessel?.vesselName?.toLowerCase() === vvn.toLowerCase()
            );
            
            if (!vvnData) {
                this.logger.warn(`VVN for vessel ${vvn} not found, creating empty operation plan`);
                return { vvnCode: null, operations: [] };
            }

            this.logger.info(`VVN ${vvnData.code} found for vessel ${vvn} with ${vvnData.cargoManifests?.length || 0} manifests`);
            
            // Log detalhado dos manifests para debug
            if (vvnData.cargoManifests && vvnData.cargoManifests.length > 0) {
                vvnData.cargoManifests.forEach((manifest, idx) => {
                    this.logger.info(`  Manifest ${idx + 1}: ${manifest.manifestType}, ${manifest.entries?.length || 0} entries`);
                });
            }

            // Se não há manifests, o vessel está em manutenção
            if (!vvnData.cargoManifests || vvnData.cargoManifests.length === 0) {
                this.logger.info(`VVN ${vvn} has no cargo manifests (maintenance visit)`);
                
                // Criar uma operation entry de manutenção
                const maintenanceOperation = {
                    id: `${vvnData.code}-MAINTENANCE`,
                    operationType: 'MAINTENANCE',
                    container: 'N/A',
                    operationStart: new Date(arrivalTime),
                    operationEnd: new Date(departureTime),
                    craneUsed: 'N/A'
                };
                
                return { vvnCode: vvnData.code, operations: [maintenanceOperation] };
            }

            let operationIndex = 0;
            let currentStartTime = new Date(arrivalTime);
            let craneIndex = 0;

            // Iterar por cada cargo manifest
            for (const manifest of vvnData.cargoManifests) {
                if (!manifest.entries || manifest.entries.length === 0) {
                    continue;
                }

                // Determinar o tipo de operação baseado no manifest type
                const operationType = manifest.manifestType === 'Loading' ? 'LOADING' : 'UNLOADING';

                // Para cada entry no manifest, criar uma operation entry
                for (const entry of manifest.entries) {
                    const operationEnd = new Date(currentStartTime.getTime() + 10 * 60000); // +10 minutos

                    operations.push({
                        id: `${vvnData.code}-OP${operationIndex + 1}`,
                        operationType: operationType,
                        container: entry.containerNumber,
                        operationStart: new Date(currentStartTime),
                        operationEnd: operationEnd,
                        craneUsed: assignedCranes[craneIndex % assignedCranes.length]
                    });

                    // Próxima operação começa 1 minuto depois do fim da anterior
                    currentStartTime = new Date(operationEnd.getTime() + 1 * 60000);
                    operationIndex++;
                    craneIndex++; // Cycle para a próxima crane
                }
            }

            this.logger.info(`Created ${operations.length} operations for VVN ${vvn}`);
            return { vvnCode: vvnData.code, operations };

        } catch (error) {
            this.logger.error(`Error creating operation entries for VVN ${vvn}:`, error);
            return { vvnCode: null, operations: [] };
        }
    }

    public async createBatch(
        vvns: string[],
        assignedCranes: string[][],
        arrivalTimes: string[],
        departureTimes: string[],
        targetDays: string[],
        author: string,
        algorithm: string,
        authHeader?: string
    ): Promise<Result<OperationPlanDTO[]>> {
        try {
            
            const createdPlans: OperationPlanDTO[] = [];
            const skippedVvns: string[] = [];

            // Validar que todos os arrays têm o mesmo tamanho
            if (vvns.length !== assignedCranes.length ||
                vvns.length !== arrivalTimes.length ||
                vvns.length !== departureTimes.length ||
                vvns.length !== targetDays.length) {
                this.logger.error('Array length mismatch!');
                return Result.fail("All input arrays must have the same length.");
            }

            // Iterar por cada VVN e criar o operation plan correspondente
            for (let i = 0; i < vvns.length; i++) {
                const vvn = vvns[i];
                const arrivalTime = new Date(arrivalTimes[i]);
                const departureTime = new Date(departureTimes[i]);
                const targetDay = new Date(targetDays[i]);

                console.log(`=== Processing VVN ${i}: ${vvn} ===`);
                console.log('assignedCranes[i]:', assignedCranes[i]);

                // Criar as operation entries para este VVN baseadas nos cargo manifests
                const result = await this.createOperationEntries(
                    vvn,
                    assignedCranes[i],
                    arrivalTime,
                    departureTime,
                    authHeader
                );

                const vvnCode = result.vvnCode || vvn; // Fallback para vessel name se não encontrar VVN
                const operations = result.operations;

                console.log('Generated operations:', operations);

                // Verificar se já existe um operation plan para esta VVN
                const existingPlan = await this.operationPlanRepo.findByVvn(vvnCode);
                if (existingPlan) {
                    this.logger.info(`Operation plan for VVN ${vvnCode} already exists, skipping...`);
                    skippedVvns.push(vvnCode);
                    continue; // Pular para o próximo
                }

                // Criar o operation plan (ID será gerado automaticamente pelo MongoDB)
                const domain = OperationPlanMap.toDomain({
                    _id: undefined, // MongoDB gerará um ObjectId único automaticamente
                    vvn: vvnCode, // Usar o código da VVN em vez do vessel name
                    TargetDay: targetDay,
                    arrivalTime: arrivalTime,
                    departureTime: departureTime,
                    operations: operations,
                    author: author,
                    algorithm: algorithm,
                    createdAt: new Date()
                } as any);

                const saved = await this.operationPlanRepo.save(domain);
                if (!saved) {
                    this.logger.error(`Failed to create operation plan for VVN: ${vvn}`);
                    continue; // Continuar para o próximo
                }

                const createdDTO = OperationPlanMap.toDTO(saved);
                createdPlans.push(createdDTO);
            }

            if (createdPlans.length === 0) {
                if (skippedVvns.length > 0) {
                    return Result.fail(`All operation plans already exist for VVNs: ${skippedVvns.join(', ')}`);
                }
                return Result.fail("Failed to create any operation plans.");
            }

            // Se alguns foram criados e outros foram pulados, registar no log
            if (skippedVvns.length > 0) {
                this.logger.info(`Created ${createdPlans.length} new operation plans. Skipped ${skippedVvns.length} existing VVNs: ${skippedVvns.join(', ')}`);
            }

            return Result.ok(createdPlans);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error creating batch operation plans.");
        }
    }

    /**
     * Get all VVNs that don't have an associated Operation Plan
     */
    public async getVvnsWithoutOperationPlan(authHeader?: string): Promise<Result<VesselVisitNotificationDTO[]>> 
    {
        try {
            // Get all VVNs from the API
            const allVvns = await this.vvnClient.getAll(authHeader);
            this.logger.info(`Fetched ${allVvns.length} VVNs from API`);

            // Get all operation plans
            const operationPlans = await this.operationPlanRepo.findAll();
            const vvnCodesWithPlans = new Set(operationPlans.map(op => op.vvn));
            
            this.logger.info(`VVN codes with plans: ${Array.from(vvnCodesWithPlans).join(', ')}`);
            
            // Filter VVNs that don't have operation plans AND have status "Approved"
            const vvnsWithoutPlans = allVvns.filter(vvn => {
                const hasNoPlan = !vvnCodesWithPlans.has(vvn.code);
                const isApproved = vvn.visitStatus === 'Approved' || vvn.status === 'Approved';
                
                // Debug log for VVN 2025-PA-000003
                if (vvn.code === '2025-PA-000003') {
                    this.logger.info(`DEBUG VVN 2025-PA-000003: hasNoPlan=${hasNoPlan}, visitStatus=${vvn.visitStatus}, status=${vvn.status}, isApproved=${isApproved}`);
                }
                
                return hasNoPlan && isApproved;
            });
            
            this.logger.info(`Found ${vvnsWithoutPlans.length} approved VVNs without operation plans`);
            this.logger.info(`VVNs without plans: ${vvnsWithoutPlans.map(v => v.code).join(', ')}`);
            
            return Result.ok(vvnsWithoutPlans);
        } catch (error) {
            this.logger.error('Error getting VVNs without operation plans:', error);
            return Result.fail("Error retrieving VVNs without operation plans.");
        }
    }

    /**
     * Regenerate all operation plans for a specific day
     * This will delete all existing plans for that day and create new ones
     */
    public async regenerateOperationPlansForDay(
        targetDay: Date, 
        author: string, 
        algorithm: string, 
        authHeader?: string
    ): Promise<Result<OperationPlanDTO[]>> {
        try {
            this.logger.info(`Regenerating operation plans for day: ${targetDay.toISOString()}`);
            
            // Get all VVNs that should have plans for this day
            const allVvns = await this.vvnClient.getAll(authHeader);
            
            // Normalize target day to start of day (00:00:00) for comparison
            const targetDayStart = new Date(targetDay);
            targetDayStart.setHours(0, 0, 0, 0);
            const targetDayEnd = new Date(targetDay);
            targetDayEnd.setHours(23, 59, 59, 999);
            
            // Filter VVNs that fall on the target day
            const vvnsForDay = allVvns.filter(vvn => {
                const eta = new Date(vvn.eta);
                return eta >= targetDayStart && eta <= targetDayEnd;
            });
            
            this.logger.info(`Found ${vvnsForDay.length} VVNs for day ${targetDay.toISOString()}`);

            // Delete existing operation plans for all these VVNs
            const allPlans = await this.operationPlanRepo.findAll();
            for (const vvn of vvnsForDay) {
                const existingPlan = allPlans.find(p => p.vvn === vvn.code);
                if (existingPlan) {
                    await this.operationPlanRepo.delete(existingPlan.id);
                    this.logger.info(`Deleted existing operation plan ${existingPlan.id} for VVN ${vvn.code}`);
                }
            }

            if (vvnsForDay.length === 0) {
                return Result.ok([]);
            }

            // Call the scheduling algorithm (Prolog) for the target day at 00:00:00
            this.logger.info(`Calling scheduling algorithm: ${algorithm} for day: ${targetDayStart.toISOString()}`);
            const scheduleResponse = await this.scheduleClient.getScheduleByTargetDay(
                targetDayStart, // Use 00:00:00 of the target day
                algorithm,
                undefined, // no timeLimit
                authHeader
            );

            // Extract schedule entries from the response
            let scheduleEntries = scheduleResponse?.schedule?.schedule || scheduleResponse?.entries || scheduleResponse?.scheduleEntries || [];
            
            if (scheduleEntries.length === 0) {
                this.logger.warn('No schedule entries returned from scheduling algorithm');
                return Result.ok([]);
            }

            this.logger.info(`Received ${scheduleEntries.length} schedule entries from Prolog`);

            // Create a map of vessel -> schedule entry for quick lookup
            // Prolog returns vessel as IMO number (integer or string)
            const scheduleMap = new Map<string, any>();
            for (const entry of scheduleEntries) {
                const vesselKey = entry.vessel || entry.vesselName;
                if (vesselKey) {
                    // Add both string and number versions for matching
                    scheduleMap.set(String(vesselKey), entry);
                    scheduleMap.set(String(vesselKey).toLowerCase(), entry);
                }
            }

            this.logger.info(`Schedule map keys: ${Array.from(scheduleMap.keys()).join(', ')}`);

            // Create new operation plans for each VVN
            const createdPlans: OperationPlanDTO[] = [];
            
            for (const vvn of vvnsForDay) {
                const arrivalTime = new Date(vvn.eta);
                const departureTime = new Date(vvn.etd);
                
                // Try to find the schedule entry for this vessel
                // Prolog uses IMO number as vessel key
                const vesselName = vvn.vessel?.vesselName || vvn.vesselName;
                const vesselIMO = vvn.vesselIMO || vvn.vessel?.imoNumber;
                
                this.logger.info(`Looking for vessel: IMO=${vesselIMO}, Name=${vesselName}`);
                
                let scheduleEntry = scheduleMap.get(String(vesselIMO)) || 
                                   scheduleMap.get(String(vesselIMO)?.toLowerCase()) ||
                                   scheduleMap.get(String(vesselName)) ||
                                   scheduleMap.get(String(vesselName)?.toLowerCase());
                
                // Extract cranes from the schedule entry
                // Prolog returns craneNames as an array like ["STS Crane 1", "STS Crane 2", "STS Crane 3"]
                let assignedCranes: string[] = [];
                if (scheduleEntry) {
                    assignedCranes = scheduleEntry.craneNames || scheduleEntry.assignedCranes || scheduleEntry.assignedCrane || [];
                    this.logger.info(`✓ Found schedule entry for vessel ${vesselName} (IMO: ${vesselIMO}): ${JSON.stringify(assignedCranes)}`);
                } else {
                    this.logger.warn(`✗ No schedule entry found for vessel ${vesselName} (IMO: ${vesselIMO}), using default cranes`);
                    assignedCranes = ['CRANE-1', 'CRANE-2'];
                }
                
                // Create operation entries
                const result = await this.createOperationEntries(
                    vesselName,
                    assignedCranes,
                    arrivalTime,
                    departureTime,
                    authHeader
                );

                const operations = result.operations;

                // Create the operation plan
                const domain = OperationPlanMap.toDomain({
                    _id: undefined,
                    vvn: vvn.code,
                    TargetDay: targetDayStart, // Use 00:00:00 of the target day
                    arrivalTime: arrivalTime,
                    departureTime: departureTime,
                    operations: operations,
                    author: author,
                    algorithm: algorithm,
                    createdAt: new Date()
                } as any);

                const saved = await this.operationPlanRepo.save(domain);
                if (saved) {
                    const createdDTO = OperationPlanMap.toDTO(saved);
                    createdPlans.push(createdDTO);
                    this.logger.info(`Created operation plan for VVN ${vvn.code}`);
                }
            }

            this.logger.info(`Successfully regenerated ${createdPlans.length} operation plans`);
            return Result.ok(createdPlans);
        } catch (error) {
            this.logger.error('Error regenerating operation plans:', error);
            return Result.fail("Error regenerating operation plans for day.");
        }
    }
}
