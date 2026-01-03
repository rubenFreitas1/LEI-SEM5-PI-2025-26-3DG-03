import { Service, Inject } from "typedi";
import { Document, Model } from "mongoose";
import IOperationPlanRepo from "../services/IRepos/IOperationPlanRepo";
import { OperationPlan } from "../domain/OperationPlan";
import { IOperationPlanPersistence } from "../dataschema/IOperationPlanPersistence";
import { OperationPlanMap } from "../mappers/OperationPlanMap";

@Service()
export default class OperationPlanRepo implements IOperationPlanRepo {

  constructor(
    @Inject("operationPlanSchema")
    private operationPlanSchema: Model<IOperationPlanPersistence & Document>
  ) {}

  async exists(plan: OperationPlan): Promise<boolean> {
    const record = await this.operationPlanSchema.findOne({ vvn: plan.vvn });
    return !!record;
  }

  async save(plan: OperationPlan): Promise<OperationPlan> {
    const existing = await this.operationPlanSchema.findOne({ vvn: plan.vvn });

    const raw = OperationPlanMap.toPersistence(plan);

    if (!existing) {
      const created = await this.operationPlanSchema.create(raw);
      return OperationPlanMap.toDomain(created);
    } else {
      return null;
    }
  }

  async findByIds(ids: string[]): Promise<OperationPlan[]> {
    const models = await this.operationPlanSchema.find({
      _id: { $in: ids },
    });

    return models.map(m => OperationPlanMap.toDomain(m));
  }

  async findAll(): Promise<OperationPlan[]> {
    const records = await this.operationPlanSchema.find();
    return records.map(record => OperationPlanMap.toDomain(record));
  }

  async findById(id: string): Promise<OperationPlan | null> {
    const record = await this.operationPlanSchema.findById(id);
    return record ? OperationPlanMap.toDomain(record) : null;
  }

  async findByVvn(vvn: string): Promise<OperationPlan | null> {
    const record = await this.operationPlanSchema.findOne({ vvn });
    return record ? OperationPlanMap.toDomain(record) : null;
  }

  async findByTargetDay(targetDay: Date): Promise<OperationPlan | null> {
    const record = await this.operationPlanSchema.findOne({ TargetDay: targetDay });
    return record ? OperationPlanMap.toDomain(record) : null;
  }

  async findByArrivalTime(arrivalTime: Date): Promise<OperationPlan[]> {
    const records = await this.operationPlanSchema.find({ arrivalTime });
    return records.map(r => OperationPlanMap.toDomain(r));
  }

  async findByDepartureTime(departureTime: Date): Promise<OperationPlan[]> {
    const records = await this.operationPlanSchema.find({ departureTime });
    return records.map(r => OperationPlanMap.toDomain(r));
  }

  async findByAuthor(author: string): Promise<OperationPlan[]> {
    const records = await this.operationPlanSchema.find({ author });
    return records.map(r => OperationPlanMap.toDomain(r));
  }

  async findByAlgorithm(algorithm: string): Promise<OperationPlan[]> {
    const records = await this.operationPlanSchema.find({ algorithm });
    return records.map(r => OperationPlanMap.toDomain(r));
  }

  async update(plan: OperationPlan): Promise<boolean> {
    const raw = OperationPlanMap.toPersistence(plan);

    const result = await this.operationPlanSchema.updateOne(
      { _id: plan.id },
      raw
    );

    return result.modifiedCount > 0;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.operationPlanSchema.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
