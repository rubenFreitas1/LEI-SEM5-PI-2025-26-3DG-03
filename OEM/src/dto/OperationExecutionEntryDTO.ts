import { OperationExecutionStatus } from "../domain/OperationExecutionEntry";

/**
 * @swagger
 * components:
 *   schemas:
 *     OperationExecutionEntryDTO:
 *       type: object
 *       required:
 *         - id
 *         - operationType
 *         - container
 *         - plannedStart
 *         - plannedEnd
 *         - craneUsed
 *         - status
 *       properties:
 *         id:
 *           type: string
 *           description: Operation execution entry identifier
 *           example: "OP001"
 *         operationType:
 *           type: string
 *           description: Type of operation (LOAD, UNLOAD, etc.)
 *           example: "LOAD"
 *         container:
 *           type: string
 *           description: Container identifier
 *           example: "CONT1234567"
 *         plannedStart:
 *           type: string
 *           format: date-time
 *           description: Planned start time from the OperationPlan
 *           example: "2025-01-10T08:00:00Z"
 *         plannedEnd:
 *           type: string
 *           format: date-time
 *           description: Planned end time from the OperationPlan
 *           example: "2025-01-10T09:00:00Z"
 *         craneUsed:
 *           type: string
 *           description: Crane assigned to this operation
 *           example: "CRANE_01"
 *         status:
 *           type: string
 *           enum: [Pending, InProgress, Completed]
 *           description: Current execution status of the operation
 *           example: "Pending"
 *         actualStart:
 *           type: string
 *           format: date-time
 *           description: Actual start time of the operation (optional, set when started)
 *           example: "2025-01-10T08:05:00Z"
 *         actualEnd:
 *           type: string
 *           format: date-time
 *           description: Actual end time of the operation (optional, set when completed)
 *           example: "2025-01-10T09:15:00Z"
 */
export interface OperationExecutionEntryDTO {
  id: string;
  operationType: string;
  container: string;
  plannedStart: Date | string;
  plannedEnd: Date | string;
  craneUsed: string;
  status: OperationExecutionStatus | string;
  actualStart?: Date | string;
  actualEnd?: Date | string;
}
