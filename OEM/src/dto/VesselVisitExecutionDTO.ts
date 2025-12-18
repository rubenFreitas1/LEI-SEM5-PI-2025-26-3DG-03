import { VesselVisitExecutionStatus } from "../domain/VesselVisitExecutionStatus";

/**
 * components:
 *   schemas:
 *     VesselVisitExecutionDTO:
 *       type: object
 *       required:
 *         - arrivalDate
 *         - vesselVisitNotificationCode
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated ID of the Vessel Visit Execution
 *           example: "1"
 *         code:
 *           type: string
 *           description: Auto-generated code in the format "YYYY-PA-XXXXXX"
 *           example: "2025-PA-000123"
 *         vesselIMO:
 *           type: string
 *           description: International Maritime Organization (IMO) number of the vessel
 *           example: "9074729"
 *         vesselVisitNotificationCode:
 *           type: string
 *           description: Code of the related Vessel Visit Notification (format "YYYY-PA-XXXXXX")
 *           example: "2025-PA-000123"
 *         status:
 *           type: string
 *           enum: [InProgress, Completed]
 *           description: Current status of the vessel visit execution
 *           example: "InProgress"
 *         arrivalDate:
 *           type: string
 *           format: date-time
 *           description: Actual date and time when the vessel arrived at the port
 *           example: "2025-12-17T08:45:00Z"
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the last update to this record
 *           example: "2025-12-17T09:00:00Z"
 *         departureDate:
 *           type: string
 *           format: date-time
 *           description: Actual date and time when the vessel departed the port
 *           example: "2025-12-18T18:30:00Z"
 *         systemUserID:
 *           type: string
 *           description: Identifier of the system user who created this VVE
 *           example: "1"
 */

export interface VesselVisitExecutionDTO {
    id: string;
    code: string;
    vesselIMO: string;
    vesselVisitNotificationCode?: string;
    status: VesselVisitExecutionStatus;
    arrivalDate: Date; 
    lastUpdated: Date; 
    departureDate?: Date;
    systemUserID: string;
}