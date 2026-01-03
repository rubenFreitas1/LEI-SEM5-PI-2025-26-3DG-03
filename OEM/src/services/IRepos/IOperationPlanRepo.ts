import { Repo } from "../../core/infra/Repo";
import { OperationPlan } from "../../domain/OperationPlan";

export default interface IOperationPlanRepo extends Repo<OperationPlan> {

    findAll(): Promise<OperationPlan[]>;

    findById(id: string): Promise<OperationPlan | null>;

    findByVvn(vvn: string): Promise<OperationPlan | null>;

    findByTargetDay(targetDay: Date): Promise<OperationPlan | null>;

    findByArrivalTime(arrivalTime: Date): Promise<OperationPlan[]>;

    findByDepartureTime(departureTime: Date): Promise<OperationPlan[]>;

    findByAuthor(author: string): Promise<OperationPlan[]>;

    findByAlgorithm(algorithm: string): Promise<OperationPlan[]>;

    update(operationPlan: OperationPlan): Promise<boolean>;

    findByIds(ids: string[]): Promise<OperationPlan[]>;

    delete(id: string): Promise<boolean>;
}