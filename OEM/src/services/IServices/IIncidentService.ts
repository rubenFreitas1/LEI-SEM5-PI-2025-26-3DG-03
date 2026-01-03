import { Result } from "../../core/logic/Result";
import { IncidentDTO } from "../../dto/IncidentDTO";

export default interface IIncidentService {

    getAllIncidents(): Promise<Result<IncidentDTO[]>>;

    getIncidentById(id: string): Promise<Result<IncidentDTO>>;

    getIncidentsByVessel(vesselIMO: string): Promise<Result<IncidentDTO[]>>;

    getIncidentsByDateRange(startDate: Date, endDate: Date): Promise<Result<IncidentDTO[]>>;

    getIncidentsBySeverity(severity: string): Promise<Result<IncidentDTO[]>>;

    getIncidentsByStatus(status: string): Promise<Result<IncidentDTO[]>>;

    createIncident(incidentDTO: IncidentDTO, authHeader?: string): Promise<Result<IncidentDTO>>;

    updateIncident(id: string, incidentDTO: IncidentDTO): Promise<Result<IncidentDTO>>;
}