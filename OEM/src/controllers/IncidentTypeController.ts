import { Request, Response, NextFunction } from 'express';
import { Inject, Service } from 'typedi';
import IIncidentTypeController from './IControllers/IIncidentTypeController';
import { IncidentTypeDTO } from '../dto/IncidentTypeDTO';
import { Result } from '../core/logic/Result';


@Service()
export default class IncidentTypeController  implements IIncidentTypeController {

    constructor(
        @Inject('incidentTypeService') private incidentTypeService,
        @Inject('logger') private logger : any
    ){}

    public async getAllIncidentTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting all incident types');
            const result = await this.incidentTypeService.getAllIncidentTypes();
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                // Erro genérico do serviço
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getIncidentTypeById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incident type by ID');
            const result = await this.incidentTypeService.getIncidentTypeById(req.params.id);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getIncidentTypeByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incident type by code');
            const result = await this.incidentTypeService.getIncidentTypeByCode(req.params.code);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getIncidentTypeByName(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incident type by name');
            const result = await this.incidentTypeService.getIncidentTypeByName(req.params.name);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getIncidentTypesWithParent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incident types with parent filter');
            const hasParent = req.params.value === 'true';
            const result = await this.incidentTypeService.getIncidentTypesWithParent(hasParent);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getIncidentTypesByClassification(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incident types by classification');
            const classification = req.params.classification;
            const result = await this.incidentTypeService.getIncidentTypesByClassification(classification);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            }else {
                res.status(404).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getIncidentTypesByParent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incident types by parent code');
            const parentCode = req.params.parentCode;
            const result = await this.incidentTypeService.getIncidentTypesByParent(parentCode);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(404).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async createIncidentType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Creating incident type');
            const dto: IncidentTypeDTO = req.body;
            const result = await this.incidentTypeService.create(dto);
            if (result.isSuccess) {
                res.status(201).json(result.getValue());
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (e: any) {
            this.logger.error('Error creating incident type:', e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async updateIncidentType(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Updating incident type');
            const code: string = req.params.code;
            const dto: IncidentTypeDTO = req.body;
            const result = await this.incidentTypeService.update(code, dto);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                const statusCode = result.error && typeof result.error === 'string' && result.error.includes('not found') ? 404 : 400;
                res.status(statusCode).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

}