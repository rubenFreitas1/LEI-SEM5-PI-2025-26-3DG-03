import { Result } from "../../core/logic/Result";
import { OperationPlanDTO } from "../../dto/OperationPlanDTO";
import { VesselVisitNotificationDTO } from "../clients/VesselVisitNotificationClient";

export default interface IOperationPlanService {

    getAllOperationPlans(): Promise<Result<OperationPlanDTO[]>>;

    getOperationPlanById(id: string): Promise<Result<OperationPlanDTO>>;

    getOperationPlansByVvn(vvn: string): Promise<Result<OperationPlanDTO[]>>;

    getOperationPlansByTargetDay(targetDay: Date): Promise<Result<OperationPlanDTO[]>>;

    getOperationPlansByArrivalTime(arrivalTime: Date): Promise<Result<OperationPlanDTO[]>>;

    getOperationPlansByDepartureTime(departureTime: Date): Promise<Result<OperationPlanDTO[]>>;

    getOperationPlansByAuthor(author: string): Promise<Result<OperationPlanDTO[]>>;

    getOperationPlansByAlgorithm(algorithm: string): Promise<Result<OperationPlanDTO[]>>;

    create(dto: OperationPlanDTO): Promise<Result<OperationPlanDTO>>;

    update(id: string, dto: OperationPlanDTO): Promise<Result<OperationPlanDTO>>;

    getVvnsWithoutOperationPlan(authHeader?: string): Promise<Result<VesselVisitNotificationDTO[]>>;

    regenerateOperationPlansForDay(targetDay: Date, author: string, algorithm: string, authHeader?: string): Promise<Result<OperationPlanDTO[]>>;
}