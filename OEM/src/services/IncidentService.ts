import { Service, Inject } from "typedi";
import IIncidentRepo from "./IRepos/IIncidentRepo";
import IIncidentTypeRepo from "./IRepos/IIncidentTypeRepo";
import IVesselVisitExecutionRepo from "./IRepos/IVesselVisitExecutionRepo";
import { IncidentStatus } from "../domain/IncidentStatus";
import { Incident } from "../domain/Incident";
import { IncidentDTO } from "../dto/IncidentDTO";
import { IncidentMap } from "../mappers/IncidentMap";
import { Result } from "../core/logic/Result";
import IIncidentService from "./IServices/IIncidentService";
import SystemUserClient from "./clients/SystemUserClient";

@Service()
export default class IncidentService implements IIncidentService {
    private sysClient: SystemUserClient;

    constructor(
        @Inject("incidentRepo") private incidentRepo: IIncidentRepo,
        @Inject("incidentTypeRepo") private incidentTypeRepo: IIncidentTypeRepo,
        @Inject("vesselVisitExecutionRepo") private vesselVisitExecutionRepo: IVesselVisitExecutionRepo,
        @Inject("logger") private logger: any
    ) {
        const apiBaseUrl = process.env.API_URL || 'http://localhost:5000/api';
        this.sysClient = new SystemUserClient(apiBaseUrl);
    }

    public async getAllIncidents(): Promise<Result<IncidentDTO[]>> {
        try {
            const incidents = await this.incidentRepo.findAll();
            if (!incidents) {
                return Result.fail("No incidents found.");
            }
            const dtoList = incidents.map(inc => IncidentMap.toDTO(inc));
            return Result.ok(dtoList);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting all incidents.");
        }
    }

    public async getIncidentById(id: string): Promise<Result<IncidentDTO>> {
        try {
            const incident = await this.incidentRepo.findById(id);
            if (!incident) {
                return Result.fail("Incident not found.");
            }
            const dto = IncidentMap.toDTO(incident);
            return Result.ok(dto);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting incident by ID.");
        }
    }

    public async getIncidentsByVessel(vesselIMO: string): Promise<Result<IncidentDTO[]>> {
        try {
            const incidents = await this.incidentRepo.findByVesselIMO(vesselIMO);
            if (!incidents || incidents.length === 0) {
                return Result.fail("No incidents found for the specified vessel.");
            }
            const dtoList = incidents.map(inc => IncidentMap.toDTO(inc));
            return Result.ok(dtoList);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting incidents by vessel.");
        }
    }

    public async getIncidentsByDateRange(startDate: Date, endDate: Date | null): Promise<Result<IncidentDTO[]>> {
        try {
            const effectiveEndDate = endDate ?? new Date();
            const incidents = await this.incidentRepo.findByDateRange(startDate, effectiveEndDate);
            if (!incidents || incidents.length === 0) {
                return Result.fail("No incidents found in the specified date range.");
            }
            const dtoList = incidents.map(inc => IncidentMap.toDTO(inc));
            return Result.ok(dtoList);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting incidents by date range.");
        }
    }

    public async getIncidentsBySeverity(severity: string): Promise<Result<IncidentDTO[]>> {
        try {
            const incidents = await this.incidentRepo.findBySeverity(severity); 
            if (!incidents || incidents.length === 0) {
                return Result.fail("No incidents found for the specified severity.");
            }
            const dtoList = incidents.map(inc => IncidentMap.toDTO(inc));
            return Result.ok(dtoList);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting incidents by severity.");
        }
    }

    public async getIncidentsByStatus(status: IncidentStatus): Promise<Result<IncidentDTO[]>> {
        try {
            const incidents = await this.incidentRepo.findByStatus(status);
            if (!incidents || incidents.length === 0) {
                return Result.fail("No incidents found for the specified status.");
            }
            const dtoList = incidents.map(inc => IncidentMap.toDTO(inc));
            return Result.ok(dtoList);
        } catch (error) {
            this.logger.error(error);
            return Result.fail("Error getting incidents by status.");
        }
    }

    public async createIncident(incidentDTO: IncidentDTO, authHeader?: string): Promise<Result<IncidentDTO>> {
        try {
            const myInfo = await this.sysClient.getMyIsFirstTime(authHeader);
            const email = myInfo?.email;
            if (!email) {
                return Result.fail("No email claim found in Auth0 token.");
            }
            const currentUser = await this.sysClient.getByEmail(email, authHeader);
            if (!currentUser) {
                return Result.fail("Authenticated user not found.");
            }
            incidentDTO.systemUserID = String(currentUser.id);    

            if (!incidentDTO.incidentTypeByCode) {
                return Result.fail("Incident type code is required.");
            }
            const incidentType = await this.incidentTypeRepo.findByCode(incidentDTO.incidentTypeByCode);
            if (!incidentType) {
                return Result.fail(`IncidentType with code '${incidentDTO.incidentTypeByCode}' not found.`);
            }
            
            const startDate = new Date(incidentDTO.startDate);
            const rawEndDate = incidentDTO.endDate;
            let durationHours: number | null = null;
            let effectiveEndDate: Date | null = null;

            if (rawEndDate !== null && rawEndDate !== undefined) {
                const endDateAsDate = new Date(rawEndDate);
                durationHours = (endDateAsDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
                effectiveEndDate = endDateAsDate;
            }
            

            let associatedVVEs = null;
            if (incidentDTO.vesselVisitExecutionsCodes != null && incidentDTO.vesselVisitExecutionsCodes.length > 0) {
                const vveCodes = incidentDTO.vesselVisitExecutionsCodes;
                associatedVVEs = await this.vesselVisitExecutionRepo.findByCodes(vveCodes);
                
                if (!associatedVVEs || associatedVVEs.length !== vveCodes.length) {
                    return Result.fail("One or more VesselVisitExecution codes not found.");
                }

                const incidentStartTime = startDate.getTime();
                const incidentEndTime = effectiveEndDate ? effectiveEndDate.getTime() : new Date().getTime();

                const affectedVVEs = associatedVVEs.filter(vve => {
                    const arrivalTime = vve.arrivalDate.getTime();
                    const departureTime = vve.departureDate
                        ? vve.departureDate.getTime()
                        : new Date().getTime();

                    return (
                        arrivalTime <= incidentEndTime &&
                        departureTime >= incidentStartTime
                    );
                });

                if (affectedVVEs.length !== associatedVVEs.length) {
                    const affectedCodes = new Set(affectedVVEs.map(vve => vve.code));
                    const unaffectedVVEs = associatedVVEs.filter(vve => !affectedCodes.has(vve.code));
                    const unaffectedCodes = unaffectedVVEs.map(vve => vve.code).join(', ');
                    return Result.fail(`The following VesselVisitExecutions are not affected by the incident time range: ${unaffectedCodes}`);
                }

                associatedVVEs = affectedVVEs;
            }

            const domain = IncidentMap.toDomain({
                incidentType: incidentType,
                startDate: startDate,
                endDate: effectiveEndDate,
                status: incidentDTO.status,
                description: incidentDTO.description,
                systemUserID: incidentDTO.systemUserID,
                lastUpdated: new Date(),
                classification: incidentDTO.classification,
                duration: durationHours,
                vesselVisitExecutions: associatedVVEs
            });
            const saved = await this.incidentRepo.save(domain);
            if (!saved) {
                return Result.fail("Failed to create incident.");
            }

            const dto = IncidentMap.toDTO(saved);
            return Result.ok(dto);
        } catch (error) {
            this.logger.error(error);
            const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Error creating incident.');
            return Result.fail(message);
        }
    }

    public async updateIncident(id: string, incidentDTO: IncidentDTO): Promise<Result<IncidentDTO>> {
        try {
            const incident = await this.incidentRepo.findById(id);
            if (!incident) {
                return Result.fail("Incident not found.");
            }

            if (incidentDTO.id && incidentDTO.id !== id) {
                return Result.fail("Incident ID cannot be changed.");
            }

            const requestedEndDate = incidentDTO.endDate ? new Date(incidentDTO.endDate) : null;

            if (incident.endDate && requestedEndDate && incident.endDate.getTime() !== requestedEndDate.getTime()) {
                return Result.fail("End date is already set and cannot be modified.");
            }

            if (!incident.endDate && requestedEndDate) {
                incident.updateEndDate(requestedEndDate);
                const hours = (requestedEndDate.getTime() - incident.startDate.getTime()) / (1000 * 60 * 60);
                incident.updateDuration(hours);
            }

            if (incidentDTO.status) {
                if (incidentDTO.status !== incident.status) {
                    incident.updateStatus(incidentDTO.status);
                }
            }

            if (incidentDTO.description) {
                if (incidentDTO.description !== incident.description) {
                    incident.updateDescription(incidentDTO.description);
                }
            }

            const currentCodes = incident.vesselVisitExecutions ? incident.vesselVisitExecutions.map(v => v.code) : [];
            const newCodes = incidentDTO.vesselVisitExecutionsCodes || [];
            
            const currentEmpty = currentCodes.length === 0;
            const newEmpty = newCodes.length === 0;
            const sameVVEs = currentCodes.length === newCodes.length && newCodes.every(code => currentCodes.includes(code));
            
            if (!currentEmpty && !newEmpty && sameVVEs) {
                return Result.fail("VesselVisitExecutions are unchanged and cannot be updated.");
            }

            if (currentEmpty && newEmpty) {
            } else {
                let newVves = null;
                if (newCodes.length > 0) {
                    const vveInput = await this.vesselVisitExecutionRepo.findByCodes(newCodes);
                    if (!vveInput || vveInput.length !== newCodes.length) {
                        return Result.fail("One or more VesselVisitExecution codes not found.");
                    }

                    const incidentStartTime = incident.startDate.getTime();
                    const incidentEndTime = incident.endDate ? incident.endDate.getTime() : new Date().getTime();

                    const affectedVVEs = vveInput.filter(vve => {
                        const arrivalTime = vve.arrivalDate.getTime();
                        const departureTime = vve.departureDate
                            ? vve.departureDate.getTime()
                            : new Date().getTime();

                        return (
                            arrivalTime <= incidentEndTime &&
                            departureTime >= incidentStartTime
                        );
                    });

                    if (affectedVVEs.length !== vveInput.length) {
                        const affectedCodes = new Set(affectedVVEs.map(vve => vve.code));
                        const unaffectedVVEs = vveInput.filter(vve => !affectedCodes.has(vve.code));
                        const unaffectedCodes = unaffectedVVEs.map(vve => vve.code).join(', ');
                        return Result.fail(`The following VesselVisitExecutions are not affected by the incident time range: ${unaffectedCodes}`);
                    }

                    newVves = affectedVVEs;
                }

                incident.updateVesselVisitExecutions(newVves || []);
            }
            incident.updateClassification(incidentDTO.classification);
            const updated = await this.incidentRepo.update(incident);

            if (!updated) {
                return Result.fail("Failed to update incident.");
            }
            const dto = IncidentMap.toDTO(incident);
            return Result.ok(dto);
        } catch (error) {
            this.logger.error(error);
            const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Error updating incident.');
            return Result.fail(message);
        }
    }
}