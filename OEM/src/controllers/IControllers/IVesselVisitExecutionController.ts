import { Request, Response, NextFunction } from "express";

export default interface IVesselVisitExecutionController {
    getAllVesselVisitExecutions(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVesselVisitExecutionById(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVesselVisitExecutionByCode(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVesselVisitExecutionsByStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVesselVisitExecutionsByVesselIMO(req: Request, res: Response, next: NextFunction): Promise<void>;
    getVesselVisitExecutions(req: Request, res: Response, next: NextFunction): Promise<void>;
    createVesselVisitExecution(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateVesselVisitExecution(req: Request, res: Response, next: NextFunction): Promise<void>;
}