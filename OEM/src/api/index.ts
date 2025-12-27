import { Router } from 'express';
import incidentTypeRoute from './routes/IncidentTypeRoute';
import vesselVisitExecutionRoute from './routes/VesselVisitExecutionRoute';
import incidentRoute from './routes/IncidentRoute';
import complementaryTaskCategoryRoute from './routes/ComplementaryTaskCategoryRoute';
import operationPlanRoute from './routes/OperationPlanRoute';

export default () => {
    const app = Router();
    incidentTypeRoute(app);
    vesselVisitExecutionRoute(app);
    incidentRoute(app);
    complementaryTaskCategoryRoute(app);
    operationPlanRoute(app);
    return app;
}