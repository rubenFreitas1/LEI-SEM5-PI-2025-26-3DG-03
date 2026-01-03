import { Request, Response, NextFunction } from 'express';

export default interface IOperationPlanController {
    getAllOperationPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOperationPlanById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOperationPlansByVvn(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOperationPlansByTargetDay(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOperationPlansByArrivalTime(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOperationPlansByDepartureTime(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOperationPlansByAuthor(req: Request, res: Response, next: NextFunction): Promise<void>;
    getOperationPlansByAlgorithm(req: Request, res: Response, next: NextFunction): Promise<void>;
    createOperationPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateOperationPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVvnsWithoutOperationPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    regenerateOperationPlansForDay(req: Request, res: Response, next: NextFunction): Promise<void>;
}