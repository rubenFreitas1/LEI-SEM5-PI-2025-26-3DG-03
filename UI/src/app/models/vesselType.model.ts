export interface VesselTypeModel {
  id?: number;
  name?: string;
  description?: string;
  capacity?: number;
  maxRows?: number;
  maxBays?: number;
  maxTiers?: number;
  lastModifiedAt?: Date | string;
}
