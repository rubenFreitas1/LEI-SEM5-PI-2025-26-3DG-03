import { Repo } from "../../core/infra/Repo";
import { IncidentType } from "../../domain/IncidentType";
import { IncidentClassification } from "../../domain/IncidentQualification";

export default interface IIncidentTypeRepo extends Repo<IncidentType> {
  
  findAll(): Promise<IncidentType[]>;

  findById(id: string): Promise<IncidentType | null>;

  findByCode(code: string): Promise<IncidentType | null>;

  findByName(name: string): Promise<IncidentType | null>;

  findWithParent(hasParent: boolean): Promise<IncidentType[]>;

  findByClassification(classification: IncidentClassification): Promise<IncidentType[]>;

  findByParent(parentId: string): Promise<IncidentType[]>;

  update(incidentType: IncidentType): Promise<boolean>;

  findByIds(ids: string[]): Promise<IncidentType[]>;
}
