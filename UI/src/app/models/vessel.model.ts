import { VesselTypeModel } from './vesselType.model';

export interface VesselRecordModel {
  id?: number;
  imoNumber?: string;
  vesselName?: string;
  vesselType?: VesselTypeModel;
  vesselTypeName?: string;
  operator?: string;
  lastModifiedAt?: Date;
}
