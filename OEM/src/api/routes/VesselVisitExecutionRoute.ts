import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import { Container } from 'typedi';
import IVesselVisitExecutionController from '../../controllers/IControllers/IVesselVisitExecutionController';

import config from "../../../config";

const route = Router();

export default (app: Router) => {
    app.use('/vessel-visit-executions', route);

    const ctrl = Container.get(config.controllers.vesselVisitExecution.name) as IVesselVisitExecutionController;

    /**
     * @swagger
     * /vessel-visit-executions:
     *   post:
     *     tags: [VesselVisitExecutions]
     *     summary: Create a new Vessel Visit Execution
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/VesselVisitExecutionDTO'
     *           example:
     *             vesselVisitNotificationCode: "2025-PA-000005"
     *             arrivalDate: "2025-12-16T10:30:00Z"
     *     responses:
     *       201:
     *         description: Vessel Visit Execution created successfully
     *       400:
     *         description: Validation error
     */
    route.post(
        '',
        celebrate({
            body: Joi.object({
                vesselVisitNotificationCode: Joi.string().required(),
                arrivalDate: Joi.date().required(),
            }).unknown(true),
        }),
        (req, res, next) => ctrl.createVesselVisitExecution(req, res, next)
    );

    /**
     * @swagger
     * /vessel-visit-executions:
     *   get:
     *     tags: [VesselVisitExecutions]
     *     summary: Get all Vessel Visit Executions
     *     responses:
     *       200:
     *         description: Array of Vessel Visit Executions
     */
    route.get('', (req, res, next) =>
        ctrl.getVesselVisitExecutions(req, res, next)
    );

    /**
     * @swagger
     * /vessel-visit-executions/id/{id}:
     *   get:
     *     tags: [VesselVisitExecutions]
     *     summary: Get a Vessel Visit Execution by its ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Vessel Visit Execution found
     *       404:
     *         description: Not found
     */
    route.get('/id/:id', (req, res, next) =>
        ctrl.getVesselVisitExecutionById(req, res, next)
    );

    /**
     * @swagger
     * /vessel-visit-executions/code/{code}:
     *   get:
     *     tags: [VesselVisitExecutions]
     *     summary: Get a Vessel Visit Execution by its code
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         description: Code in the format "YYYY-PA-XXXXXX"
     *     responses:
     *       200:
     *         description: Vessel Visit Execution found
     *       404:
     *         description: Not found
     */
    route.get('/code/:code', (req, res, next) =>
        ctrl.getVesselVisitExecutionByCode(req, res, next)
    );

    /**
     * @swagger
     * /vessel-visit-executions/status/{status}:
     *   get:
     *     tags: [VesselVisitExecutions]
     *     summary: Get Vessel Visit Executions by status
     *     parameters:
     *       - in: path
     *         name: status
     *         required: true
     *         schema:
     *           type: string
     *           enum: [InProgress, Completed]
     *     responses:
     *       200:
     *         description: List of Vessel Visit Executions
     *       404:
     *         description: No executions found for this status
     */
    route.get('/status/:status', (req, res, next) =>
        ctrl.getVesselVisitExecutionsByStatus(req, res, next)
    );

    /**
     * @swagger
     * /vessel-visit-executions/vessel-imo/{vesselIMO}:
     *   get:
     *     tags: [VesselVisitExecutions]
     *     summary: Get Vessel Visit Executions by vessel IMO
     *     parameters:
     *       - in: path
     *         name: vesselIMO
     *         required: true
     *         schema:
     *           type: string
     *         description: International Maritime Organization number
     *     responses:
     *       200:
     *         description: List of Vessel Visit Executions
     *       404:
     *         description: No executions found for this vessel
     */
    route.get('/vessel-imo/:vesselIMO', (req, res, next) =>
        ctrl.getVesselVisitExecutionsByVesselIMO(req, res, next)
    );

    /**
     * @swagger
     * /vessel-visit-executions/{code}:
     *   put:
     *     tags: [VesselVisitExecutions]
     *     summary: Update a Vessel Visit Execution status by its code
     *     parameters:
     *       - in: path
     *         name: code
     *         required: true
     *         schema:
     *           type: string
     *         description: Code in the format "YYYY-PA-XXXXXX"
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [InProgress, Completed]
     *             required: [status]
     *           example:
     *             status: "Completed"
     *     responses:
     *       200:
     *         description: Vessel Visit Execution updated
     *       400:
     *         description: Validation error
     *       404:
     *         description: Not found
     */
    route.put(
        '/:code',
        celebrate({
            body: Joi.object({
                status: Joi.string().valid('InProgress', 'Completed').required(),
            }).unknown(true),
        }),
        (req, res, next) => ctrl.updateVesselVisitExecution(req, res, next)
    );
}