import { Router } from 'express';
import { celebrate, Joi } from 'celebrate';
import { Container } from 'typedi';
import IComplementaryTaskCategoryController from '../../controllers/IControllers/IComplementaryTaskCategoryController';
import { requireRole } from '../middlewares/RequiredRole';
import config from "../../../config";

const route = Router();

export default (app: Router) => {
  app.use('/complementary-task-categories', route);

  const ctrl = Container.get(config.controllers.complementaryTaskCategory.name) as IComplementaryTaskCategoryController;

  /**
   * @swagger
   * /complementary-task-categories:
   *   post:
   *     tags: [ComplementaryTaskCategories]
   *     summary: Create a new Complementary Task Category
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ComplementaryTaskCategoryDTO'
   *     responses:
   *       201:
   *         description: Complementary Task Category created
   *       400:
   *         description: Validation error
   */
  route.post(
    '',
    requireRole(['Admin', 'PortAuthorityOfficer']),
    celebrate({
      body: Joi.object({
        code: Joi.string().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        duration: Joi.string().optional().allow(null),
        parentComplementaryTaskCategoryCode: Joi.string().optional().allow(null)
      })
    }),
    (req, res, next) => ctrl.createComplementaryTaskCategory(req, res, next)
  );

  /**
   * @swagger
   * /complementary-task-categories/update/{code}:
   *   put:
   *     tags: [ComplementaryTaskCategories]
   *     summary: Update a Complementary Task Category
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Code of the Complementary Task Category to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ComplementaryTaskCategoryDTO'
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
    requireRole(['Admin', 'PortAuthorityOfficer']),
    celebrate({
      body: Joi.object({
        code: Joi.string().required(),
        name: Joi.string().required(),
        description: Joi.string().required(),
        duration: Joi.string().optional().allow(null),
        parentComplementaryTaskCategoryCode: Joi.string().optional()
      })
    }),
    (req, res, next) => ctrl.updateComplementaryTaskCategory(req, res, next)
  );

  /**
   * @swagger
   * /complementary-task-categories:
   *   get:
   *     tags: [ComplementaryTaskCategories]
   *     summary: Get all complementary task categories
   *     responses:
   *       200:
   *         description: Array of complementary task categories
   */
  route.get('', (req, res, next) =>
    ctrl.getAllComplementaryTaskCategories(req, res, next)
  );

  /**
   * @swagger
   * /complementary-task-categories/id/{id}:
   *   get:
   *     tags: [ComplementaryTaskCategories]
   *     summary: Get a complementary task category by its ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Complementary Task Category found
   *       404:
   *         description: Not found
   */
  route.get('/id/:id', (req, res, next) =>
    ctrl.getComplementaryTaskCategoryById(req, res, next)
  );

  /**
   * @swagger
   * /complementary-task-categories/code/{code}:
   *   get:
   *     tags: [ComplementaryTaskCategories]
   *     summary: Get a Complementary Task Category by its code
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Complementary Task Category found
   *       404:
   *         description: Not found
   */
  route.get('/code/:code', (req, res, next) =>
    ctrl.getComplementaryTaskCategoryByCode(req, res, next)
  );

  /**
   * @swagger
   * /complementary-task-categories/name/{name}:
   *   get:
   *     tags: [ComplementaryTaskCategories]
   *     summary: Get a Complementary Task Category by its name
   *     parameters:
   *       - in: path
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Complementary Task Category found
   *       404:
   *         description: Not found
   */
  route.get('/name/:name', (req, res, next) =>
    ctrl.getComplementaryTaskCategoryByName(req, res, next)
  );

  /**
   * @swagger
   * /complementary-task-categories/parent/{parentCode}:
   *   get:
   *     tags: [ComplementaryTaskCategories]
   *     summary: Get complementary task categories that have a specific parent
   *     parameters:
   *       - in: path
   *         name: parentCode
   *         required: true
   *         schema:
   *           type: string
   *         description: Code of the parent complementary task category
   *     responses:
   *       200:
   *         description: List of child complementary task categories
   */
  route.get('/parent/:parentCode', (req, res, next) =>
    ctrl.getComplementaryTaskCategoriesByParent(req, res, next)
  );

  /**
   * @swagger
   * /complementary-task-categories/hasParent/{value}:
   *   get:
   *     tags: [ComplementaryTaskCategories]
   *     summary: Get complementary task categories filtered by having (or not having) a parent
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
    ctrl.getComplementaryTaskCategoriesWithParent(req, res, next)
  );
};
