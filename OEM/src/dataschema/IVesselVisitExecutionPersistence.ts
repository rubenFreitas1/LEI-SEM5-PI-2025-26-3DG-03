import { VesselVisitExecutionStatus } from "../domain/VesselVisitExecutionStatus";

export interface IVesselVisitExecutionPersistence {
    _id: string;
    code: string;
    vesselIMO: string;
    status: VesselVisitExecutionStatus;
    arrivalDate: Date;
    departureDate?: Date;
    lastUpdated: Date;
    systemUserID: string;
    DockAssigned?: string;
    operations: any[];
}
