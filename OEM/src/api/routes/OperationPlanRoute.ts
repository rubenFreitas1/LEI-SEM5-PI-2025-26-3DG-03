import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import { Container } from 'typedi';
import IOperationPlanController from '../../controllers/IControllers/IOperationPlanController';

import config from "../../../config";

const route = Router();

export default (app: Router) => {
    app.use('/operation-plans', route);

    const ctrl = Container.get(config.controllers.operationPlan.name) as IOperationPlanController;

    /**
     * @swagger
     * /operation-plans:
     *   post:
     *     tags: [OperationPlans]
     *     summary: Create multiple Operation Plans from scheduling data
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - vvns
     *               - assignedCranes
     *               - staffs
     *               - operationTypes
     *               - containers
     *               - arrivalTimes
     *               - departureTimes
     *               - targetDays
     *               - author
     *               - algorithm
     *             properties:
     *               vvns:
     *                 type: array
     *                 items:
     *                   type: string
     *                 example: ["VVN-001", "VVN-002"]
     *               assignedCranes:
     *                 type: array
     *                 items:
     *                   type: array
     *                   items:
     *                     type: string
     *                 example: [["CRANE-1", "CRANE-2"], ["CRANE-3"]]
     *               staffs:
     *                 type: array
     *                 items:
     *                   type: array
     *                   items:
     *                     type: string
     *                 example: [["STAFF-A", "STAFF-B"], ["STAFF-C"]]
     *               operationTypes:
     *                 type: array
     *                 items:
     *                   type: array
     *                   items:
     *                     type: string
     *                 example: [["LOADING", "UNLOADING"], ["LOADING"]]
     *               containers:
     *                 type: array
     *                 items:
     *                   type: array
     *                   items:
     *                     type: string
     *                 example: [["CONT-001", "CONT-002"], ["CONT-003"]]
     *               arrivalTimes:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: date-time
     *                 example: ["2025-01-10T08:00:00Z", "2025-01-10T14:00:00Z"]
     *               departureTimes:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: date-time
     *                 example: ["2025-01-10T16:00:00Z", "2025-01-10T20:00:00Z"]
     *               targetDays:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: date
     *                 example: ["2025-01-10", "2025-01-10"]
     *               author:
     *                 type: string
     *                 example: "prolog-scheduler"
     *               algorithm:
     *                 type: string
     *                 example: "PROLOG_SIMULATION"
     *     responses:
     *       201:
     *         description: Operation plans created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/OperationPlanDTO'
     *       400:
     *         description: Validation error
     */
    route.post('', async (req, res, next) => {
        console.log('=== OperationPlanRoute - POST /operation-plans ===');
        console.log('Content-Type:', req.get('Content-Type'));
        console.log('Body type:', typeof req.body);
        console.log('Body keys:', req.body ? Object.keys(req.body) : 'null/undefined');
        console.log('Raw body:', JSON.stringify(req.body));
        console.log('Body in route:', req.body);
        console.log('===================================================');
        
        try {
            await ctrl.createOperationPlan(req, res, next);
        } catch (e) {
            console.error('Error in route:', e);
            next(e);
        }
    });

    /**
     * @swagger
     * /operation-plans/update/{vvn}:
     *   put:
     *     tags: [OperationPlans]
     *     summary: Update an Operation Plan
     *     parameters:
     *       - in: path
     *         name: vvn
     *         required: true
     *         schema:
     *           type: string
     *         description: VVN of the Operation Plan to update
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/OperationPlanDTO'
     *     responses:
     *       200:
     *         description: Updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OperationPlanDTO'
     *       400:
     *         description: Validation error
     *       404:
     *         description: Operation Plan not found
     */
    route.put(
        '/update/:vvn',
        celebrate({
            body: Joi.object({
                id: Joi.string().optional(),
                vvn: Joi.string().required(),
                targetDay: Joi.date().required(),
                arrivalTime: Joi.date().iso().required(),
                departureTime: Joi.date().iso().required(),
                operations: Joi.array().items(
                    Joi.object({
                        id: Joi.string().required(),
                        operationType: Joi.string().required(),
                        container: Joi.string().required(),
                        operationStart: Joi.date().iso().required(),
                        operationEnd: Joi.date().iso().required(),
                        craneUsed: Joi.string().required()
                    })
                ).required(),
                author: Joi.string().required(),
                algorithm: Joi.string().required(),
                createdAt: Joi.date().iso().optional(),
                changeReason: Joi.string().required()
            })
        }),
        (req, res, next) => ctrl.updateOperationPlan(req, res, next)
    );

    /**
     * @swagger
     * /operation-plans:
     *   get:
     *     tags: [OperationPlans]
     *     summary: Get all operation plans
     *     responses:
     *       200:
     *         description: Array of operation plans
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/OperationPlanDTO'
     */
    route.get('', (req, res, next) =>
        ctrl.getAllOperationPlans(req, res, next)
    );

    /**
     * @swagger
     * /operation-plans/id/{id}:
     *   get:
     *     tags: [OperationPlans]
     *     summary: Get an operation plan by its ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Operation Plan found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OperationPlanDTO'
     *       404:
     *         description: Not found
     */

    route.get('/id/:id', (req, res, next) =>
        ctrl.getOperationPlanById(req, res, next)
    );

    /**
     * @swagger
     * /operation-plans/vvn/{vvn}:
     *   get:
     *     tags: [OperationPlans]
     *     summary: Get operation plans by VVN
     *     parameters:
     *       - in: path
     *         name: vvn
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Array of Operation Plans found
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/OperationPlanDTO'
     *       404:
     *         description: Not found
     */

    route.get('/vvn/:vvn', (req, res, next) =>
        ctrl.getOperationPlansByVvn(req, res, next)
    );

    /**
     * @swagger
     * /operation-plans/target-day/{targetDay}:
     *   get:
     *     tags: [OperationPlans]
     *     summary: Get operation plans by target day
     *     parameters:
     *       - in: path
     *         name: targetDay
     *         required: true
     *         schema:
     *           type: string
     *           format: date
     *     responses:
     *       200:
     *         description: Array of Operation Plans found
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/OperationPlanDTO'
     *       404:
     *         description: Not found
     */
    route.get('/target-day/:targetDay', (req, res, next) =>
        ctrl.getOperationPlansByTargetDay(req, res, next)
    );

    /**
     * @swagger
     * /operation-plans/author/{author}:
     *   get:
     *     tags: [OperationPlans]
     *     summary: Get operation plans by author
     *     parameters:
     *       - in: path
     *         name: author
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Array of Operation Plans found
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/OperationPlanDTO'
     *       404:
     *         description: Not found
     */
    route.get('/author/:author', (req, res, next) =>
        ctrl.getOperationPlansByAuthor(req, res, next)
    );

    /**
     * @swagger
     * /operation-plans/algorithm/{algorithm}:
     *   get:
     *     tags: [OperationPlans]
     *     summary: Get operation plans by algorithm
     *     parameters:
     *       - in: path
     *         name: algorithm
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Array of Operation Plans found
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/OperationPlanDTO'
     *       404:
     *         description: Not found
     */
    route.get('/algorithm/:algorithm', (req, res, next) =>
        ctrl.getOperationPlansByAlgorithm(req, res, next)
    );

    /**
     * @swagger
     * /operation-plans/missing:
     *   get:
     *     tags: [OperationPlans]
     *     summary: Get VVNs without associated Operation Plans
     *     description: Returns all Vessel Visit Notifications that do not have an Operation Plan
     *     responses:
     *       200:
     *         description: Array of VVNs without operation plans
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 type: object
     *       500:
     *         description: Internal server error
     */
    route.get('/missing', (req, res, next) =>
        ctrl.getVvnsWithoutOperationPlan(req, res, next)
    );

    /**
     * @swagger
     * /operation-plans/regenerate:
     *   post:
     *     tags: [OperationPlans]
     *     summary: Regenerate all operation plans for a specific day
     *     description: Deletes all existing operation plans for the specified day and creates new ones
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - targetDay
     *               - author
     *               - algorithm
     *             properties:
     *               targetDay:
     *                 type: string
     *                 format: date
     *                 example: "2025-01-10"
     *               author:
     *                 type: string
     *                 example: "operator@example.com"
     *               algorithm:
     *                 type: string
     *                 example: "GENETIC_ALGORITHM"
     *     responses:
     *       200:
     *         description: Operation plans regenerated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 plans:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/OperationPlanDTO'
     *       400:
     *         description: Missing required parameters
     *       500:
     *         description: Internal server error
     */
    route.post('/regenerate', celebrate({
        body: Joi.object({
            targetDay: Joi.date().required(),
            author: Joi.string().required(),
            algorithm: Joi.string().required()
        })
    }), (req, res, next) =>
        ctrl.regenerateOperationPlansForDay(req, res, next)
    );
}

