import { Service, Inject } from 'typedi';
import IIncidentTypeRepo from '../services/IRepos/IIncidentTypeRepo';
import { IncidentType } from '../domain/IncidentType';
import { Document, Model } from 'mongoose';
import { IIncidentTypePersistence } from '../dataschema/IIncidentTypePersistence';
import { IncidentTypeMap } from "../mappers/IncidentTypeMap";



@Service()
export default class IncidentTypeRepo implements IIncidentTypeRepo {

    constructor(
        @Inject('incidentTypeSchema') private incidentTypeSchema: Model<IIncidentTypePersistence & Document>,  
    ){}

    async exists(type: IncidentType): Promise<boolean> {
    const record = await this.incidentTypeSchema.findOne({ code: type.code });
    return !!record;
  }

  async save(type: IncidentType): Promise<IncidentType> {
    const existing = await this.incidentTypeSchema.findOne({ code: type.code });

    const raw = IncidentTypeMap.toPersistence(type);

    if (!existing) {
      const created = await this.incidentTypeSchema.create(raw);
      return IncidentTypeMap.toDomain(created);
    } else {
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<IncidentType[]> {
    const models = await this.incidentTypeSchema.find({ _id: { $in: ids } });
    return models.map(m => IncidentTypeMap.toDomain(m));
  }

  async findAll(): Promise<IncidentType[]> {
    const records = await this.incidentTypeSchema.find();
    return records.map(record => IncidentTypeMap.toDomain(record));
  }

  async findById(id: string): Promise<IncidentType | null> {
    const record = await this.incidentTypeSchema.findById(id);
    return record ? IncidentTypeMap.toDomain(record) : null;
  }

  async findByCode(code: string): Promise<IncidentType | null> {
    const record = await this.incidentTypeSchema.findOne({ code });
    return record ? IncidentTypeMap.toDomain(record) : null;
  }

  async findByName(name: string): Promise<IncidentType | null> {
    const record = await this.incidentTypeSchema.findOne({ name });
    return record ? IncidentTypeMap.toDomain(record) : null;
  }

  async findWithParent(hasParent: boolean): Promise<IncidentType[]> {
    const filter = hasParent
      ? { parentIncidentTypeId: { $ne: null } }
      : { parentIncidentTypeId: null };

    const records = await this.incidentTypeSchema.find(filter);
    return records.map(r => IncidentTypeMap.toDomain(r));
  }

  async findByClassification(classification): Promise<IncidentType[]> {
    const records = await this.incidentTypeSchema.find({ classification });
    return records.map(r => IncidentTypeMap.toDomain(r));
  }

  async findByParent(parentId: string): Promise<IncidentType[]> {
    const records = await this.incidentTypeSchema.find({
      parentIncidentTypeId: parentId,
    });
    return records.map(r => IncidentTypeMap.toDomain(r));
  }

  async update(type: IncidentType): Promise<boolean> {
    const raw = IncidentTypeMap.toPersistence(type);
    const result = await this.incidentTypeSchema.updateOne(
      { code: type.code },
      raw
    );
    return result.modifiedCount > 0;
  }
}