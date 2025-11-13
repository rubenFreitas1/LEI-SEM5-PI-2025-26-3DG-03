export interface DocksModel {
  id?: number;
  name?: string;
  location?: string;
  length?: number;
  depth?: number;
  maxDraft?: number;
  vesselTypesAllowed?: string[];
}
