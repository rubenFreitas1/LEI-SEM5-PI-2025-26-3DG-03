import { Repo } from "../../core/infra/Repo";
import { VesselVisitExecution } from '../../domain/VesselVisitExecution';
import { VesselVisitExecutionStatus } from "../../domain/VesselVisitExecutionStatus";

export default interface IVesselVisitExecutionRepo extends Repo<VesselVisitExecution> {
    findAll(): Promise<VesselVisitExecution[]>;
    findById(id: string): Promise<VesselVisitExecution | null>;
    findByCode(code: string): Promise<VesselVisitExecution | null>;
    findByStatus(status: VesselVisitExecutionStatus): Promise<VesselVisitExecution[]>;
    findByVesselIMO(vesselIMO: string): Promise<VesselVisitExecution[]>;
    findByFilters(filters: { from?: Date; to?: Date; vesselIMO?: string; status?: VesselVisitExecutionStatus }): Promise<VesselVisitExecution[]>;
    update(vve: VesselVisitExecution): Promise<boolean>;
}