import { VesselVisitExecution } from "../domain/VesselVisitExecution";
import { IVesselVisitExecutionPersistence } from "../dataschema/IVesselVisitExecutionPersistence";
import { VesselVisitExecutionDTO } from "../dto/VesselVisitExecutionDTO";
import { OperationExecutionEntryMap } from "./OperationExecutionEntryMap";

export class VesselVisitExecutionMap {

    public static toDomain(raw: IVesselVisitExecutionPersistence | any): VesselVisitExecution {
        const operations = raw.operations && Array.isArray(raw.operations)
            ? raw.operations.map((op: any) => OperationExecutionEntryMap.toDomain(op))
            : [];

        return new VesselVisitExecution(
            raw._id ? raw._id.toString() : "",
            raw.code,
            raw.vesselIMO,
            raw.status,
            raw.arrivalDate,
            raw.lastUpdated,
            raw.systemUserID,
            operations,
            raw.DockAssigned || "",
            raw.departureDate
        );
    }

    public static toPersistence(vve: VesselVisitExecution): IVesselVisitExecutionPersistence {
        const persistence: any = {
            code: vve.code,
            vesselIMO: vve.vesselIMO,
            status: vve.status,
            arrivalDate: vve.arrivalDate,
            departureDate: vve.departureDate,
            lastUpdated: vve.lastUpdated,
            systemUserID: vve.systemUserID,
            DockAssigned: vve.DockAssigned,
            operations: vve.operations.map(op => OperationExecutionEntryMap.toPersistence(op))
        };

        if (vve.id && vve.id !== "") {
            persistence._id = vve.id;
        }
        return persistence;
    }

    public static toDTO(vve: VesselVisitExecution): VesselVisitExecutionDTO {
        return {
            id: vve.id,
            code: vve.code,
            vesselIMO: vve.vesselIMO,
            status: vve.status,
            arrivalDate: vve.arrivalDate,
            departureDate: vve.departureDate,
            lastUpdated: vve.lastUpdated,
            systemUserID: vve.systemUserID,
            DockAssigned: vve.DockAssigned,
            operations: vve.operations.map(op => OperationExecutionEntryMap.toDTO(op))
        };
    }
}