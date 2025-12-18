import { VesselVisitExecutionStatus } from "./VesselVisitExecutionStatus";

export class VesselVisitExecution {

    constructor(
        public id: string,
        public code: string,
        public vesselIMO: string,
        public status: VesselVisitExecutionStatus,
        public arrivalDate: Date,
        public lastUpdated: Date,
        public systemUserID: string,
        public departureDate?: Date
    ) {
        this.validateCode(code);
        this.validateVesselIMO(vesselIMO);
        this.validateStatus(status);
        this.validateArrivalDate(arrivalDate);
        this.validateDepartureDate(departureDate);
    }

    private validateCode(code: string) {
        if (!code || code.trim().length === 0) {
            throw new Error("Vessel Visit Execution code cannot be null or empty.");
        }
        const pattern = /^\d{4}-PA-\d{6}$/;
        if (!pattern.test(code)) {
            throw new Error("Vessel Visit Execution code must match pattern 'YYYY-PA-XXXXXX'.");
        }
    }

    private validateVesselIMO(vesselIMO: string) {
        if (!vesselIMO || vesselIMO.trim().length === 0) {
            throw new Error("Vessel IMO cannot be null or empty.");
        }
    }

    private validateStatus(status: VesselVisitExecutionStatus) {
        if (!Object.values(VesselVisitExecutionStatus).includes(status)) {
            throw new Error("Invalid Vessel Visit Execution status.");
        }
    }

    private validateArrivalDate(arrivalDate: Date) {
        if (!(arrivalDate instanceof Date) || isNaN(arrivalDate.getTime())) {
            throw new Error("Arrival date must be a valid date.");
        }
        const now = new Date();
        if (arrivalDate.getTime() > now.getTime()) {
            throw new Error("Arrival date cannot be in the future.");
        }
    }

    private validateDepartureDate(departureDate?: Date) {
        if (departureDate === undefined || departureDate === null) return;
        if (!(departureDate instanceof Date) || isNaN(departureDate.getTime())) {
            throw new Error("Departure date must be a valid date.");
        }
        const now = new Date();
        if (departureDate.getTime() > now.getTime()) {
            throw new Error("Departure date cannot be in the future.");
        }
        if (this.arrivalDate && departureDate.getTime() < this.arrivalDate.getTime()) {
            throw new Error("Departure date cannot be before arrival date.");
        }
    }


    updateStatus(status: VesselVisitExecutionStatus) {
        this.validateStatus(status);
        this.status = status;
        if (status === VesselVisitExecutionStatus.Completed) {
            if (!this.departureDate) {
                this.departureDate = new Date();
            }
            this.validateDepartureDate(this.departureDate);
        }
        this.lastUpdated = new Date();
    }
}