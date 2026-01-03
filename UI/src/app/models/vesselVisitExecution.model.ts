export interface VesselVisitExecutionModel {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  vesselIMO?: string;
  vesselVisitNotificationCode?: string;
  departureDate?: string | Date;
  arrivalDate?: string;
  status?: string;
  lastUpdated?: string | Date;
  systemUserID?: string;
  DockAssigned?: string;
  operations?: OperationExecutionEntry[];
}

export interface OperationExecutionEntry {
  operationType?: string;
  container?: string;
  plannedStart?: string | Date;
  plannedEnd?: string | Date;
  craneUsed?: string;
  status?: string;
  actualStart?: string | Date | null;
  actualEnd?: string | Date | null;
}
