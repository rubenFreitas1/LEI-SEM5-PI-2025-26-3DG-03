import { Service, Inject } from "typedi";
import IIncidentTypeRepo from "./IRepos/IIncidentTypeRepo";
import { IncidentClassification } from "../domain/IncidentQualification";
import { IncidentType } from "../domain/IncidentType";
import { IncidentTypeDTO } from "../dto/IncidentTypeDTO";
import { IncidentTypeMap } from "../mappers/IncidentTypeMap";
import { Result } from "../core/logic/Result";
import IIncidentTypeService from "./IServices/IIncidentTypeService";


@Service()
export default class IncidentTypeService implements IIncidentTypeService {

    constructor(
        @Inject('incidentTypeRepo') private incidentTypeRepo: IIncidentTypeRepo,
        @Inject('logger') private logger: any
    ){}

    private async resolveParentCodes(incidentTypes: IncidentType[]): Promise<Map<string, string>> {
        const parentIds = [...new Set(
            incidentTypes.map(i => i.parentIncidentTypeId)
            .filter((id): id is string => id !== undefined)
        )];
        if (parentIds.length === 0) {
            return new Map<string, string>();
        }
        const parents = await this.incidentTypeRepo.findByIds(parentIds);
        return new Map<string, string>(parents.map((p: IncidentType) => [p.id, p.code]));
    }

    private async getSingleParentCode(parentId?: string): Promise<string | undefined> {
        if (!parentId) return undefined;

        const parent = await this.incidentTypeRepo.findById(parentId);
        return parent ? parent.code : undefined;
    }

    public async getAllIncidentTypes(): Promise<Result<IncidentTypeDTO[]>> {
        try {
            const incidentTypes = await this.incidentTypeRepo.findAll();
            const parentMap = await this.resolveParentCodes(incidentTypes);
            const dtos = incidentTypes.map(i => {
                const parentCode = i.parentIncidentTypeId
                    ? parentMap.get(i.parentIncidentTypeId)
                    : undefined;

                return IncidentTypeMap.toDTO(i, parentCode);
            });
            return Result.ok(dtos);
        } catch (err) {
            this.logger.error(err);
            return Result.fail("Error getting all incident types");
        }
    }

    public async getIncidentTypeById(id: string): Promise<Result<IncidentTypeDTO>> {
        try{
            const incidentType = await this.incidentTypeRepo.findById(id);
            if(!incidentType){
                return Result.fail<IncidentTypeDTO>("Incident type not found");
            }
            const parentCode = await this.getSingleParentCode(incidentType.parentIncidentTypeId);
            const dto = IncidentTypeMap.toDTO(incidentType, parentCode);
            return Result.ok<IncidentTypeDTO>(dto);
        }catch(err){
            this.logger.error(err);
            return Result.fail<IncidentTypeDTO>("Error getting incident type by ID");
        }
    }

    public async getIncidentTypeByCode(code: string): Promise<Result<IncidentTypeDTO>> {
        try{
            const incidentType = await this.incidentTypeRepo.findByCode(code);
            if(!incidentType){
                return Result.fail<IncidentTypeDTO>("Incident type not found");
            }
            const parentCode = await this.getSingleParentCode(incidentType.parentIncidentTypeId);
            const dto = IncidentTypeMap.toDTO(incidentType, parentCode);
            return Result.ok<IncidentTypeDTO>(dto);
        }catch(err){
            this.logger.error(err);
            return Result.fail<IncidentTypeDTO>("Error getting incident type by code");
        }
    }

    public async getIncidentTypeByName(name: string): Promise<Result<IncidentTypeDTO>> {
        try{
            const incidentType = await this.incidentTypeRepo.findByName(name);
            if(!incidentType){
                return Result.fail<IncidentTypeDTO>("Incident type not found");
            }
            const parentCode = await this.getSingleParentCode(incidentType.parentIncidentTypeId);
            const dto = IncidentTypeMap.toDTO(incidentType, parentCode);
            return Result.ok<IncidentTypeDTO>(dto);
        }catch(err){
            this.logger.error(err);
            return Result.fail<IncidentTypeDTO>("Error getting incident type by name");
        }
    }


    public async getIncidentTypesWithParent(hasParent: boolean): Promise<Result<IncidentTypeDTO[]>> {
        try {
            const incidentTypes = await this.incidentTypeRepo.findWithParent(hasParent);
            const parentMap = await this.resolveParentCodes(incidentTypes);
            const dtos = incidentTypes.map(i => {
                const parentCode = i.parentIncidentTypeId
                    ? parentMap.get(i.parentIncidentTypeId)
                    : undefined;
                return IncidentTypeMap.toDTO(i, parentCode);
            });
            return Result.ok(dtos);
        } catch (err) {
            this.logger.error(err);
            return Result.fail("Error getting incident types with parent filter");
        }
    }

    public async getIncidentTypesByClassification(classification: string): Promise<Result<IncidentTypeDTO[]>> {
        try {
            const enumValue = IncidentClassification[classification as keyof typeof IncidentClassification];
            if (enumValue === undefined) {
                return Result.fail("Invalid classification value");
            }
            const incidentTypes = await this.incidentTypeRepo.findByClassification(enumValue);
            const parentMap = await this.resolveParentCodes(incidentTypes);
            const dtos = incidentTypes.map(i => {
                const parentCode = i.parentIncidentTypeId
                    ? parentMap.get(i.parentIncidentTypeId)
                    : undefined;
                return IncidentTypeMap.toDTO(i, parentCode);
            });
            return Result.ok(dtos);
        } catch (err) {
            this.logger.error(err);
            return Result.fail("Error getting incident types by classification");
        }
    }

    public async getIncidentTypesByParent(parentCode: string): Promise<Result<IncidentTypeDTO[]>> {
        try {
            const parent = await this.incidentTypeRepo.findByCode(parentCode);
            if (!parent) {
                return Result.fail("Parent incident type not found");
            }
            const incidentTypes = await this.incidentTypeRepo.findByParent(parent.id);
            const dtos = incidentTypes.map(i =>
                IncidentTypeMap.toDTO(i, parent.code)
            );
            return Result.ok(dtos);
        } catch (err) {
            this.logger.error(err);
            return Result.fail("Error getting incident types by parent code");
        }
    }

    public async create(dto: IncidentTypeDTO): Promise<Result<IncidentTypeDTO>> {
        try {
            const exists = await this.incidentTypeRepo.findByCode(dto.code);
            if (exists) {
                return Result.fail(`IncidentType with code '${dto.code}' already exists.`);
            }
            let parentId: string | undefined = undefined;
            if (dto.parentIncidentTypeCode) {
                const parentIncidentType = await this.incidentTypeRepo.findByCode(dto.parentIncidentTypeCode);
                if (parentIncidentType) {
                parentId = parentIncidentType.id;
                } else {
                return Result.fail(`Parent IncidentType with code '${dto.parentIncidentTypeCode}' not found.`);
                }
            }
            const domain = IncidentTypeMap.toDomain({
                code: dto.code,
                name: dto.name,
                description: dto.description,
                classification: dto.classification,
                parentIncidentTypeId: parentId,
            } as any);
            const saved = await this.incidentTypeRepo.save(domain);
            if (!saved) {
                return Result.fail("Failed to create IncidentType.");
            }
            let parentCode: string | undefined = undefined;
            if(saved.parentIncidentTypeId){
                const parentIncidentType = await this.incidentTypeRepo.findById(saved.parentIncidentTypeId);
                if(parentIncidentType){
                parentCode = parentIncidentType.code;
                }
            }
            const dtoResult = IncidentTypeMap.toDTO(saved, parentCode);
            return Result.ok(dtoResult);
        } catch (e: any) {
            this.logger.error('Error in create service:', e);
            return Result.fail("Unexpected error creating IncidentType: " + e.message);
        }
    }

    public async update(code: string,dto: IncidentTypeDTO): Promise<Result<IncidentTypeDTO>> {
        try {
            const existing = await this.incidentTypeRepo.findByCode(code);
            if (!existing) {
                this.logger.error(`IncidentType with code '${code}' not found.`);
                return Result.fail(`IncidentType with code '${code}' not found.`);
            }

            if(dto.code !== code){
                return Result.fail("IncidentType code cannot be changed.");        
            }

            const conflictWithName = await this.incidentTypeRepo.findByName(dto.name);
            if (conflictWithName && conflictWithName.id !== existing.id) {
                return Result.fail<IncidentTypeDTO>(`Incident Type name '${dto.name}' is already in use.`);
            }

            let parentId: string | undefined = undefined;
            if (dto.parentIncidentTypeCode) {
                const parentIncidentType = await this.incidentTypeRepo.findByCode(dto.parentIncidentTypeCode);
                if(!parentIncidentType){
                    return Result.fail(`Parent IncidentType with code '${dto.parentIncidentTypeCode}' not found.`);
                }
                parentId = parentIncidentType.id;
            }
            
            try{
                existing.updateName(dto.name);
                existing.updateDescription(dto.description);
                existing.updateClassification(dto.classification);
                existing.updateParentIncidentType(parentId);
            }catch(err: any){
                return Result.fail<IncidentTypeDTO>("Error: " + err.message);
            }

            const updated = await this.incidentTypeRepo.update(existing);
            if (!updated) {
                return Result.fail("Failed to update IncidentType.");
            }
            let parentCode: string | undefined = undefined;
            if(existing.parentIncidentTypeId){
                const parentIncidentType = await this.incidentTypeRepo.findById(existing.parentIncidentTypeId);
                if(parentIncidentType){
                parentCode = parentIncidentType.code;
                }
            }
            const dtoResult = IncidentTypeMap.toDTO(existing, parentCode);
            return Result.ok(dtoResult);
        } catch (e) {
            this.logger.error(e);
            return Result.fail("Unexpected error updating IncidentType.");
        }
    }
}