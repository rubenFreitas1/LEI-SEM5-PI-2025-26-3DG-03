import { Request, Response, NextFunction } from 'express';
import { Inject, Service } from 'typedi';
import IOperationPlanController from './IControllers/IOperationPlanController';
import { OperationPlanDTO } from '../dto/OperationPlanDTO';
import { Result } from '../core/logic/Result';

@Service()
export default class OperationPlanController implements IOperationPlanController {
    constructor(
        @Inject('operationPlanService') private operationPlanService,
        @Inject('logger') private logger : any
    ){}

    public async getAllOperationPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting all operation plans');
            const result = await this.operationPlanService.getAllOperationPlans();
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

    public async getOperationPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting operation plan by ID');
            const result = await this.operationPlanService.getOperationPlanById(req.params.id);
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

    public async getOperationPlansByVvn(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting operation plans by VVN');
            const result = await this.operationPlanService.getOperationPlansByVvn(req.params.vvn);
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

    public async getOperationPlansByTargetDay(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting operation plans by target day');
            const targetDay = new Date(req.params.targetDay);
            const result = await this.operationPlanService.getOperationPlansByTargetDay(targetDay);
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

    public async getOperationPlansByArrivalTime(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting operation plans by arrival time');
            const arrivalTime = new Date(req.params.arrivalTime);
            const result = await this.operationPlanService.getOperationPlansByArrivalTime(arrivalTime);
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

    public async getOperationPlansByDepartureTime(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting operation plans by departure time');
            const departureTime = new Date(req.params.departureTime);
            const result = await this.operationPlanService.getOperationPlansByDepartureTime(departureTime);
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

    public async getOperationPlansByAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting operation plans by author');
            const result = await this.operationPlanService.getOperationPlansByAuthor(req.params.author);
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

    public async getOperationPlansByAlgorithm(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting operation plans by algorithm');
            const result = await this.operationPlanService.getOperationPlansByAlgorithm(req.params.algorithm);
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

    public async createOperationPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            console.log('=== CONTROLLER - createOperationPlan START ===');
            console.log('req.body in controller:', req.body);
            console.log('Type of req.body:', typeof req.body);
            console.log('Keys:', req.body ? Object.keys(req.body) : 'none');
            console.log('==============================================');
            
            const { vvns, assignedCranes, arrivalTimes, departureTimes, targetDays, author, algorithm } = req.body;
            
            console.log('=== EXTRACTED FIELDS ===');
            console.log('vvns:', vvns);
            console.log('assignedCranes:', assignedCranes);
            console.log('arrivalTimes:', arrivalTimes);
            console.log('departureTimes:', departureTimes);
            console.log('targetDays:', targetDays);
            console.log('author:', author);
            console.log('algorithm:', algorithm);
            
            // Extract Auth header from request
            const authHeader = req.headers.authorization;
            
            const result = await this.operationPlanService.createBatch(
                vvns,
                assignedCranes,
                arrivalTimes,
                departureTimes,
                targetDays,
                author,
                algorithm,
                authHeader
            );
            
            if (result.isSuccess) {
                res.status(201).json(result.getValue());
            } else {
                this.logger.error('Service returned error:', result.error);
                res.status(400).json({ error: result.error });
            }
        } catch (e: any) {
            this.logger.error('Exception creating batch operation plans:', e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async updateOperationPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Updating operation plan');
            const dto: OperationPlanDTO = req.body;
            const result = await this.operationPlanService.update(req.params.vvn, dto);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (e: any) {
            this.logger.error('Error updating operation plan:', e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    public async getVvnsWithoutOperationPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting VVNs without operation plans');
            const authHeader = req.headers.authorization;
            const result = await this.operationPlanService.getVvnsWithoutOperationPlan(authHeader);
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

    public async regenerateOperationPlansForDay(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Regenerating operation plans for day');
            const { targetDay, author, algorithm } = req.body;
            
            if (!targetDay || !author || !algorithm) {
                res.status(400).json({ error: 'targetDay, author, and algorithm are required' });
                return;
            }

            const targetDayDate = new Date(targetDay);
            const authHeader = req.headers.authorization;
            
            const result = await this.operationPlanService.regenerateOperationPlansForDay(
                targetDayDate,
                author,
                algorithm,
                authHeader
            );
            
            if (result.isSuccess) {
                res.status(200).json({
                    message: `Successfully regenerated ${result.getValue().length} operation plans`,
                    plans: result.getValue()
                });
            } else {
                res.status(500).json({ error: result.error });
            }
        } catch (e: any) {
            this.logger.error('Error regenerating operation plans:', e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

}