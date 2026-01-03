import { OperationExecutionEntry, OperationExecutionStatus } from "../domain/OperationExecutionEntry";
import { OperationExecutionEntryDTO } from "../dto/OperationExecutionEntryDTO";

export class OperationExecutionEntryMap {

    public static toDomain(raw: any): OperationExecutionEntry {
        const status = raw.status as OperationExecutionStatus || OperationExecutionStatus.Pending;
        
        return new OperationExecutionEntry(
            raw.id || raw._id?.toString() || "",
            raw.operationType,
            raw.container,
            raw.plannedStart instanceof Date ? raw.plannedStart : new Date(raw.plannedStart),
            raw.plannedEnd instanceof Date ? raw.plannedEnd : new Date(raw.plannedEnd),
            raw.craneUsed,
            status,
            raw.actualStart ? (raw.actualStart instanceof Date ? raw.actualStart : new Date(raw.actualStart)) : undefined,
            raw.actualEnd ? (raw.actualEnd instanceof Date ? raw.actualEnd : new Date(raw.actualEnd)) : undefined
        );
    }

    public static toPersistence(entry: OperationExecutionEntry): any {
        return {
            id: entry.id,
            operationType: entry.operationType,
            container: entry.container,
            plannedStart: entry.plannedStart,
            plannedEnd: entry.plannedEnd,
            craneUsed: entry.craneUsed,
            status: entry.status,
            actualStart: entry.actualStart || null,
            actualEnd: entry.actualEnd || null
        };
    }

    public static toDTO(entry: OperationExecutionEntry): OperationExecutionEntryDTO {
        return {
            id: entry.id,
            operationType: entry.operationType,
            container: entry.container,
            plannedStart: entry.plannedStart,
            plannedEnd: entry.plannedEnd,
            craneUsed: entry.craneUsed,
            status: entry.status,
            actualStart: entry.actualStart,
            actualEnd: entry.actualEnd
        };
    }

    /**
     * Convert from OperationPlan's OperationEntry to OperationExecutionEntry
     * Sets initial status to Pending and no actual times
     */
    public static fromOperationEntry(operationEntry: any): OperationExecutionEntry {
        return new OperationExecutionEntry(
            operationEntry.id,
            operationEntry.operationType,
            operationEntry.container,
            operationEntry.operationStart instanceof Date ? operationEntry.operationStart : new Date(operationEntry.operationStart),
            operationEntry.operationEnd instanceof Date ? operationEntry.operationEnd : new Date(operationEntry.operationEnd),
            operationEntry.craneUsed,
            OperationExecutionStatus.Pending
        );
    }
}
