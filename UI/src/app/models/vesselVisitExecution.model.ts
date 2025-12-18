export interface VesselVisitExecutionModel {
  id?: number;
  code?: string;
  name?: string;
  description?: string;
  vesselVisitNotificationCode?: string;
  departureDate?: string | Date;
  arrivalDate?: string;
  status?: string;
  lastUpdated?: string | Date;
  systemUserID?: string;
}
