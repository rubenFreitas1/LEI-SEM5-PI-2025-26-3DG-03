import { get } from "http";
import { Result } from "../../core/logic/Result";
import { VesselVisitExecutionDTO } from "../../dto/VesselVisitExecutionDTO";

export default interface IVesselVisitExecutionService {
    getAllVesselVisitExecutions(): Promise<Result<VesselVisitExecutionDTO[]>>;
    getVesselVisitExecutionById(id: string): Promise<Result<VesselVisitExecutionDTO>>;
    getVesselVisitExecutionByCode(code: string): Promise<Result<VesselVisitExecutionDTO>>;
    getVesselVisitExecutionsByStatus(status: string): Promise<Result<VesselVisitExecutionDTO[]>>;
    getVesselVisitExecutionsByVesselIMO(vesselIMO: string): Promise<Result<VesselVisitExecutionDTO[]>>;
    getVesselVisitExecutions(filters: { from?: string; to?: string; vesselIMO?: string; status?: string }): Promise<Result<VesselVisitExecutionDTO[]>>;
    createVesselVisitExecution(dto: VesselVisitExecutionDTO, apiBaseUrl?: string, authHeader?: string): Promise<Result<VesselVisitExecutionDTO>>;
    updateVesselVisitExecution(code: string, payload: any): Promise<Result<VesselVisitExecutionDTO>>;
}