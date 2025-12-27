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
}
