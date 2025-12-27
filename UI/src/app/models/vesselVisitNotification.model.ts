// Enums from backend
export enum CargoType {
  Container = 'Container',
  Bulk = 'Bulk',
  Liquid = 'Liquid',
  General = 'General',
  Refrigerated = 'Refrigerated',
  Hazardous = 'Hazardous'
}

export enum VisitStatus {
  Submitted = 'Submitted',
  Approved = 'Approved',
  Rejected = 'Rejected',
  InProgress = 'InProgress'
}

export enum CrewRank {
  Captain = 'Captain',
  SafetyOfficer = 'SafetyOfficer',
  Officer = 'Officer'
}

export enum ManifestType {
  Loading = 'Loading',
  Unloading = 'Unloading'
}

// Models
export interface CrewMemberModel {
  name?: string;
  citizenID?: string;
  rank?: CrewRank;
  nationality?: string;
}

export interface CargoManifestEntryModel {
  containerNumber?: string;
  row?: number;
  tier?: number;
  bay?: number;
  storageAreaCode?: string;
}

export interface CargoManifestModel {
  manifestType?: ManifestType;
  entries?: CargoManifestEntryModel[];
}

export interface VesselVisitNotificationModel {
  id?: number;
  code?: string;
  vessel?: any; // Full vessel object
  vesselId?: number;
  vesselIMO?: string;
  representativeCitizenID?: string;
  eta?: Date | string;
  etd?: Date | string;
  cargoManifests?: CargoManifestModel[];
  cargoType?: CargoType;
  volume?: number;
  crewMembers?: CrewMemberModel[];
  visitStatus?: VisitStatus | string;
  lastModifiedAt?: Date | string;
  numberOfCrewMembers?: number;
}
