export enum OperationExecutionStatus {
    Pending = "Pending",
    Started = "Started",
    Completed = "Completed",
    Delayed = "Delayed"
}

/**
 * OperationExecutionEntry represents the execution state of a planned operation within a VesselVisitExecution.
 * It tracks the status, actual start and end times of operations originally defined in the OperationPlan.
 */
export class OperationExecutionEntry {

    constructor(
        public id: string,
        public operationType: string,
        public container: string,
        public plannedStart: Date,
        public plannedEnd: Date,
        public craneUsed: string,
        public status: OperationExecutionStatus = OperationExecutionStatus.Pending,
        public actualStart?: Date,
        public actualEnd?: Date
    ) {
        this.validateOperationType(operationType);
        this.validateCraneUsed(craneUsed);
        this.validateContainer(container);
        this.validateStatus(status);
        this.validateActualTimes(actualStart, actualEnd);
    }

    private validateOperationType(operationType: string) {
        if (!operationType || operationType.trim().length === 0) {
            throw new Error("Operation Type cannot be null or empty.");
        }
    }

    private validateCraneUsed(craneUsed: string) {
        if (!craneUsed || craneUsed.trim().length === 0) {
            throw new Error("Crane Used cannot be null or empty.");
        }
    }

    private validateContainer(container: string) {
        if (!container || container.trim().length === 0) {
            throw new Error("Container cannot be null or empty.");
        }
    }

    private validateStatus(status: OperationExecutionStatus) {
        if (!Object.values(OperationExecutionStatus).includes(status)) {
            throw new Error("Invalid Operation Execution status.");
        }
    }

    private validateActualTimes(actualStart?: Date, actualEnd?: Date) {
        if (actualStart && actualEnd) {
            if (actualStart.getTime() > actualEnd.getTime()) {
                throw new Error("Actual start time cannot be after actual end time.");
            }
        }
    }

    /**
     * Mark operation as in progress with actual start time
     */
    startOperation(actualStart: Date): void {
        if (this.status === OperationExecutionStatus.Completed) {
            throw new Error("Cannot start a completed operation.");
        }
        this.actualStart = actualStart;
        this.status = OperationExecutionStatus.Started;
    }

    /**
     * Mark operation as completed with actual end time
     */
    completeOperation(actualEnd: Date): void {
        if (this.status === OperationExecutionStatus.Pending) {
            throw new Error("Cannot complete an operation that has not been started.");
        }
        if (!this.actualStart) {
            throw new Error("Cannot complete operation without an actual start time.");
        }
        if (actualEnd.getTime() < this.actualStart.getTime()) {
            throw new Error("Actual end time cannot be before actual start time.");
        }
        this.actualEnd = actualEnd;
        this.status = OperationExecutionStatus.Completed;
    }

    /**
     * Update the status manually (for more flexible workflows)
     */
    updateStatus(status: OperationExecutionStatus): void {
        this.validateStatus(status);
        this.status = status;
    }

    /**
     * Update actual start time
     */
    updateActualStart(actualStart: Date): void {
        if (this.actualEnd && actualStart.getTime() > this.actualEnd.getTime()) {
            throw new Error("Actual start time cannot be after actual end time.");
        }
        this.actualStart = actualStart;
    }

    /**
     * Update actual end time
     */
    updateActualEnd(actualEnd: Date): void {
        if (this.actualStart && actualEnd.getTime() < this.actualStart.getTime()) {
            throw new Error("Actual end time cannot be before actual start time.");
        }
        this.actualEnd = actualEnd;
    }
}
