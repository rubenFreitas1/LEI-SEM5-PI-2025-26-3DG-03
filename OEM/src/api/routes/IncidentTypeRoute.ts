import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import { Container } from 'typedi';
import IIncidentTypeController from '../../controllers/IControllers/IIncidentTypeController';

import config from "../../../config";

const route = Router();

export default (app: Router) => {
  app.use('/incident-types', route);

  const ctrl = Container.get(config.controllers.incidentType.name) as IIncidentTypeController;

  /**
   * @swagger
   * /incident-types:
   *   post:
   *     tags: [IncidentTypes]
   *     summary: Create a new Incident Type
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/IncidentTypeDTO'
   *     responses:
   *       201:
   *         description: Incident type created
   *       400:
   *         description: Validation error
   */
  route.post(
    '',
    celebrate({
      body: Joi.object({
        code: Joi.string().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        classification: Joi.string().valid("Minor", "Major", "Critical").required(),
        parentIncidentTypeCode: Joi.string().optional().allow(null)
      })
    }),
    (req, res, next) => ctrl.createIncidentType(req, res, next)
  );

  /**
   * @swagger
   * /incident-types/update/{code}:
   *   put:
   *     tags: [IncidentTypes]
   *     summary: Update an Incident Type
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Code of the Incident Type to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/IncidentTypeDTO'
   *     responses:
   *       200:
   *         description: Updated successfully
   *       400:
   *         description: Validation error
   *       404:
   *         description: Incident Type not found
   */
  route.put(
    '/update/:code',
    celebrate({
      body: Joi.object({
        code: Joi.string().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        classification: Joi.string().valid("Minor", "Major", "Critical").required(),
        parentIncidentTypeCode: Joi.string().optional()
      })
    }),
    (req, res, next) => ctrl.updateIncidentType(req, res, next)
  );

  /**
   * @swagger
   * /incident-types:
   *   get:
   *     tags: [IncidentTypes]
   *     summary: Get all incident types
   *     responses:
   *       200:
   *         description: Array of incident types
   */
  route.get('', (req, res, next) =>
    ctrl.getAllIncidentTypes(req, res, next)
  );

  /**
   * @swagger
   * /incident-types/id/{id}:
   *   get:
   *     tags: [IncidentTypes]
   *     summary: Get an incident type by its ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Incident Type found
   *       404:
   *         description: Not found
   */
  route.get('/id/:id', (req, res, next) =>
    ctrl.getIncidentTypeById(req, res, next)
  );

  /**
   * @swagger
   * /incident-types/code/{code}:
   *   get:
   *     tags: [IncidentTypes]
   *     summary: Get an Incident Type by its code
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Incident Type found
   *       404:
   *         description: Not found
   */
  route.get('/code/:code', (req, res, next) =>
    ctrl.getIncidentTypeByCode(req, res, next)
  );

  /**
   * @swagger
   * /incident-types/name/{name}:
   *   get:
   *     tags: [IncidentTypes]
   *     summary: Get an Incident Type by its name
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Incident Type found
   *       404:
   *         description: Not found
   */
  route.get('/name/:name', (req, res, next) =>
    ctrl.getIncidentTypeByName(req, res, next)
  );

  /**
   * @swagger
   * /incident-types/parent/{parentCode}:
   *   get:
   *     tags: [IncidentTypes]
   *     summary: Get incident types that have a specific parent
   *     parameters:
   *       - in: path
   *         name: parentCode
   *         required: true
   *         schema:
   *           type: string
   *         description: Code of the parent incident type
   *     responses:
   *       200:
   *         description: List of child incident types
   */
  route.get('/parent/:parentCode', (req, res, next) =>
    ctrl.getIncidentTypesByParent(req, res, next)
  );

  /**
   * @swagger
   * /incident-types/classification/{classification}:
   *   get:
   *     tags: [IncidentTypes]
   *     summary: Get incident types filtered by classification
   *     parameters:
   *       - in: path
   *         name: classification
   *         required: true
   *         schema:
   *           type: string
   *           enum: [Minor, Major, Critical]
   *     responses:
   *       200:
   *         description: List of incident types
   */
  route.get('/classification/:classification', (req, res, next) =>
    ctrl.getIncidentTypesByClassification(req, res, next)
  );

  /**
   * @swagger
   * /incident-types/hasParent/{value}:
   *   get:
   *     tags: [IncidentTypes]
   *     summary: Get incident types filtered by having (or not having) a parent
   *     parameters:
   *       - in: path
   *         name: value
   *         required: true
   *         schema:
   *           type: string
   *           enum: ["true", "false"]
   *     responses:
   *       200:
   *         description: List of incident types
   */
  route.get('/hasParent/:value', (req, res, next) =>
    ctrl.getIncidentTypesWithParent(req, res, next)
  );
};
