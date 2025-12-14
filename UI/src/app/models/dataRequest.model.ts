export interface DataRequestModel {
  id?: number;
  systemUserEmail: string;
  requestType: string;
  details?: string;
  requestedAt?: string;
  status?: string;
}
