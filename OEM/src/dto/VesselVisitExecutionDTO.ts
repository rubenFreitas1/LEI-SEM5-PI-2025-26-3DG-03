import { VesselVisitExecutionStatus } from "../domain/VesselVisitExecutionStatus";
import { OperationExecutionEntryDTO } from "./OperationExecutionEntryDTO";

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
 *         incidentIDs:
 *           type: array
 *           description: List of incident IDs associated with this vessel visit execution
 *           items:
 *             type: string
 *           nullable: true
 *           example: ["INC-001", "INC-002"]
 *         operations:
 *           type: array
 *           description: List of operations from the associated OperationPlan with execution tracking
 *           items:
 *             $ref: '#/components/schemas/OperationExecutionEntryDTO'
 *           example: []
 *        berthTime:
 *          type: string
 *          format: date-time
 *         description: Actual date and time when the vessel was berthed at the dock
 *        example: "2025-12-17T09:15:00Z"
 *        DockAssigned:
 *          type: string
 *         description: Name of the dock assigned to the vessel
 *        example: "Dock A"
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
    incidentIDs?: string[] | null;
    operations?: OperationExecutionEntryDTO[];
    DockAssigned?: string;
}