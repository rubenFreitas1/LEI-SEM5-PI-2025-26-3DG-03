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
            raw.departureDate,
            raw.vvnCode
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
            operations: vve.operations.map(op => OperationExecutionEntryMap.toPersistence(op)),
            vvnCode: vve.vvnCode
        };

        if (vve.id && vve.id !== "") {
            persistence._id = vve.id;
        }
        return persistence;
    }

    public static toDTO(vve: VesselVisitExecution): VesselVisitExecutionDTO {
        // Extract dock from first operation if DockAssigned is not set
        let dockAssigned = vve.DockAssigned || "";

        console.log(`🔍 VVE ${vve.code} - DockAssigned field: "${dockAssigned}", operations count: ${vve.operations?.length || 0}`);

        if (!dockAssigned && vve.operations && vve.operations.length > 0) {
            // Map cranes to docks based on known crane assignments
            // STS Cranes 1-3 are on Dock A, 4-6 on Dock B, etc.
            const craneToDockMap: { [key: string]: string } = {
                'STS Crane 1': 'Dock A',
                'STS Crane 2': 'Dock A',
                'STS Crane 3': 'Dock A',
                'STS Crane 4': 'Dock B',
                'STS Crane 5': 'Dock B',
                'STS Crane 6': 'Dock B',
                'STS Crane 7': 'Dock C',
                'STS Crane 8': 'Dock C',
                'STS Crane 9': 'Dock D',
                'STS Crane 10': 'Dock D'
            };

            // Try to get dock from first operation's crane
            const firstOp = vve.operations[0];
            console.log(`🔧 First operation crane: "${firstOp?.craneUsed}", type: "${firstOp?.operationType}"`);

            if (firstOp && firstOp.craneUsed) {
                dockAssigned = craneToDockMap[firstOp.craneUsed] || "";
                if (dockAssigned) {
                    console.log(`✅ Extracted dock "${dockAssigned}" from crane "${firstOp.craneUsed}"`);
                } else {
                    console.log(`⚠️ Crane "${firstOp.craneUsed}" not found in mapping. Available cranes:`, Object.keys(craneToDockMap));
                }
            }
        }

        // Infer status from operations if status is InProgress
        let status = vve.status;
        if (status === 'InProgress' && vve.operations && vve.operations.length > 0) {
            const firstOp = vve.operations[0];
            if (firstOp && firstOp.operationType) {
                const opType = firstOp.operationType.toUpperCase();
                
                if (opType.includes('UNLOAD')) {
                    status = 'Unloading' as any;
                    console.log(`📦 Inferred status: Unloading (from operation type: ${firstOp.operationType})`);
                } else if (opType.includes('LOAD')) {
                    status = 'Loading' as any;
                    console.log(`📦 Inferred status: Loading (from operation type: ${firstOp.operationType})`);
                }
            }
        }

        return {
            id: vve.id,
            code: vve.code,
            vesselIMO: vve.vesselIMO,
            vesselVisitNotificationCode: vve.vvnCode,
            status: status,
            arrivalDate: vve.arrivalDate,
            departureDate: vve.departureDate,
            lastUpdated: vve.lastUpdated,
            systemUserID: vve.systemUserID,
            DockAssigned: dockAssigned,
            operations: vve.operations.map(op => OperationExecutionEntryMap.toDTO(op))
        };
    }
}