import { Request, Response, NextFunction } from "express";
import { Inject, Service } from 'typedi';
import IVesselVisitExecutionController from './IControllers/IVesselVisitExecutionController';
import { VesselVisitExecutionDTO } from '../dto/VesselVisitExecutionDTO';
import { Result } from '../core/logic/Result';
import SystemUserClient from '../services/clients/SystemUserClient';
import config from '../../config';
import { VesselVisitExecutionStatus } from '../domain/VesselVisitExecutionStatus';

@Service()
export default class VesselVisitExecutionController implements IVesselVisitExecutionController {

    constructor(
        @Inject('vesselVisitExecutionService') private vesselVisitExecutionService,
        @Inject('logger') private logger : any
    ){}

    public async getAllVesselVisitExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting all vessel visit executions');
            const result = await this.vesselVisitExecutionService.getAllVesselVisitExecutions();
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

    public async getVesselVisitExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting vessel visit executions with filters');
            const { from, to, vesselIMO, status } = req.query as any;

            const hasFilters = from || to || vesselIMO || status;
            if (!hasFilters) {
                const result = await this.vesselVisitExecutionService.getAllVesselVisitExecutions();
                if (result.isSuccess) {
                    res.status(200).json(result.getValue());
                } else {
                    res.status(500).json({ error: result.error });
                }
                return;
            }

            const result = await this.vesselVisitExecutionService.getVesselVisitExecutions({ from, to, vesselIMO, status });
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

    public async getVesselVisitExecutionById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting vessel visit execution by ID');
            const result = await this.vesselVisitExecutionService.getVesselVisitExecutionById(req.params.id);
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

    public async getVesselVisitExecutionByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting vessel visit execution by code');
            const result = await this.vesselVisitExecutionService.getVesselVisitExecutionByCode(req.params.code);
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

    public async getVesselVisitExecutionsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting vessel visit executions by status');
            const result = await this.vesselVisitExecutionService.getVesselVisitExecutionsByStatus(req.params.status);
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

    public async getVesselVisitExecutionsByVesselIMO(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting vessel visit executions by vessel IMO'); 
            const result = await this.vesselVisitExecutionService.getVesselVisitExecutionsByVesselIMO(req.params.vesselIMO);
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

    public async createVesselVisitExecution(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Creating vessel visit execution');

            const vesselVisitExecutionDTO: VesselVisitExecutionDTO = req.body;
            const authHeader = req.headers.authorization;
            
            const result = await this.vesselVisitExecutionService.createVesselVisitExecution(vesselVisitExecutionDTO, authHeader);
            if (result.isSuccess) {
                res.status(201).json(result.getValue());
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error('Error creating vessel visit execution:', e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async updateVesselVisitExecution(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Updating vessel visit execution');
            const code: string = req.params.code;
            
            // Build payload from request body
            const payload: any = {};
            
            // Validate and add status if provided
            if (req.body.status) {
                const allowedStatuses = Object.values(VesselVisitExecutionStatus) as string[];
                if (!allowedStatuses.includes(String(req.body.status))) {
                    res.status(400).json({ error: 'Invalid status value' });
                    return;
                }
                payload.status = req.body.status;
                
                // Auto-set departureDate if status is Completed
                if (String(req.body.status) === String(VesselVisitExecutionStatus.Completed)) {
                    payload.departureDate = payload.departureDate || new Date();
                }
            }
            
            // Add other optional fields if provided
            if (req.body.arrivalDate !== undefined) payload.arrivalDate = req.body.arrivalDate;
            if (req.body.departureDate !== undefined) payload.departureDate = req.body.departureDate;
            if (req.body.DockAssigned !== undefined) payload.DockAssigned = req.body.DockAssigned;
            if (req.body.operations !== undefined) payload.operations = req.body.operations;
            if (req.body.operationId !== undefined) payload.operationId = req.body.operationId;
            if (req.body.operation !== undefined) payload.operation = req.body.operation;

            const result = await this.vesselVisitExecutionService.updateVesselVisitExecution(code, payload);
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