import { VesselVisitExecution } from "../domain/VesselVisitExecution";
import { IVesselVisitExecutionPersistence } from "../dataschema/IVesselVisitExecutionPersistence";
import { VesselVisitExecutionDTO } from "../dto/VesselVisitExecutionDTO";

export class VesselVisitExecutionMap {

    public static toDomain(raw: IVesselVisitExecutionPersistence | any): VesselVisitExecution {
        return new VesselVisitExecution(
            raw._id ? raw._id.toString() : "",
            raw.code,
            raw.vesselIMO,
            raw.status,
            raw.arrivalDate,
            raw.lastUpdated,
            raw.systemUserID,
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
            systemUserID: vve.systemUserID
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
            systemUserID: vve.systemUserID
        };
    }
}