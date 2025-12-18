import { Service, Inject } from 'typedi';
import IVesselVisitExecutionRepo from '../services/IRepos/IVesselVisitExecutionRepo';
import { VesselVisitExecution } from '../domain/VesselVisitExecution';
import { Document, Model } from 'mongoose';
import { IVesselVisitExecutionPersistence } from '../dataschema/IVesselVisitExecutionPersistence';
import { VesselVisitExecutionMap } from "../mappers/VesselVisitExecutionMap";
import { VesselVisitExecutionStatus } from '../domain/VesselVisitExecutionStatus';

@Service()
export default class VesselVisitExecutionRepo implements IVesselVisitExecutionRepo {

    constructor(
        @Inject('vesselVisitExecutionSchema') private vesselVisitExecutionSchema: Model<IVesselVisitExecutionPersistence & Document>,  
    ){}

    async exists(vve: VesselVisitExecution): Promise<boolean> {
        const record = await this.vesselVisitExecutionSchema.findOne({ code: vve.code });
        return !!record;
    }

    async save(vve: VesselVisitExecution): Promise<VesselVisitExecution> {
        const existing = await this.vesselVisitExecutionSchema.findOne({ code: vve.code });
        const raw = VesselVisitExecutionMap.toPersistence(vve);

        if (!existing) {
            const created = await this.vesselVisitExecutionSchema.create(raw);
            return VesselVisitExecutionMap.toDomain(created);
        } else {
            return null;
        }
    }

    async findAll(): Promise<VesselVisitExecution[]> {
        const records = await this.vesselVisitExecutionSchema.find();
        return records.map(record => VesselVisitExecutionMap.toDomain(record));
    }

    async findById(id: string): Promise<VesselVisitExecution | null> {
        const record = await this.vesselVisitExecutionSchema.findById(id);
        return record ? VesselVisitExecutionMap.toDomain(record) : null;
    }

    async findByCode(code: string): Promise<VesselVisitExecution | null> {
        const record = await this.vesselVisitExecutionSchema.findOne({ code });
        return record ? VesselVisitExecutionMap.toDomain(record) : null;
    }
    
    async findByStatus(status: VesselVisitExecutionStatus): Promise<VesselVisitExecution[]> {
        const records = await this.vesselVisitExecutionSchema.find({ status });
        return records.map(record => VesselVisitExecutionMap.toDomain(record));
    }

    async findByVesselIMO(vesselIMO: string): Promise<VesselVisitExecution[]> {
        const records = await this.vesselVisitExecutionSchema.find({ vesselIMO });
        return records.map(record => VesselVisitExecutionMap.toDomain(record));
        
    }
    
    async findByFilters(filters: { from?: Date; to?: Date; vesselIMO?: string; status?: VesselVisitExecutionStatus }): Promise<VesselVisitExecution[]> {
        const query: any = {};
        if (filters.vesselIMO) query.vesselIMO = filters.vesselIMO;
        if (filters.status) query.status = filters.status;
        if (filters.from || filters.to) {
            query.arrivalDate = {} as any;
            if (filters.from) query.arrivalDate.$gte = filters.from;
            if (filters.to) query.arrivalDate.$lte = filters.to;
        }

        const records = await this.vesselVisitExecutionSchema.find(query);
        return records.map(record => VesselVisitExecutionMap.toDomain(record));
    }
    async update(vve: VesselVisitExecution): Promise<boolean> {
        const raw = VesselVisitExecutionMap.toPersistence(vve);
        const result = await this.vesselVisitExecutionSchema.updateOne({ code: vve.code }, raw);
        return result.modifiedCount > 0;
    }
}