import { Request, Response, NextFunction } from 'express';
import { Inject, Service } from 'typedi';
import IIncidentController from './IControllers/IIncidentController';
import { IncidentDTO } from '../dto/IncidentDTO';
import { Result } from '../core/logic/Result';
import config from '../../config';

@Service()
export default class IncidentController  implements IIncidentController {

    constructor(
        @Inject('incidentService') private incidentService,
        @Inject('logger') private logger : any
    ){}

    public async getAllIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting all incidents');
            const result = await this.incidentService.getAllIncidents();
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getIncidentById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incident by ID');
            const result = await this.incidentService.getIncidentById(req.params.id);
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

    public async getIncidentByVessel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incidents by vessel IMO');
            const result = await this.incidentService.getIncidentsByVessel(req.params.vesselIMO);
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

    public async getIncidentsByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incidents by date range');
            const { startDate, endDate } = req.query;
            const result = await this.incidentService.getIncidentsByDateRange(new Date(startDate as string), new Date(endDate as string));  
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

    public async getIncidentsBySeverity(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incidents by severity');
            const result = await this.incidentService.getIncidentsBySeverity(req.params.severity);
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

    public async getIncidentsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting incidents by status');
            const result = await this.incidentService.getIncidentsByStatus(req.params.status);
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

    public async createIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Creating incident');
            const incidentDTO: IncidentDTO = req.body;
            const authHeader = req.headers.authorization;

            const result = await this.incidentService.createIncident(incidentDTO, authHeader);
            if (result.isSuccess) {
                res.status(201).json(result.getValue());
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async updateIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Updating incident');
            const id: string = req.params.id;
            const incidentDTO: IncidentDTO = req.body;
            const result = await this.incidentService.updateIncident(id, incidentDTO);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}