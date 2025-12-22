import { Request, Response, NextFunction } from 'express';
import { Inject, Service } from 'typedi';
import IComplementaryTaskCategoryController from './IControllers/IComplementaryTaskCategoryController';
import { ComplementaryTaskCategoryDTO } from '../dto/ComplementaryTaskCategoryDTO';
import { Result } from '../core/logic/Result';
import { privateDecrypt } from 'crypto';

@Service()
export default class ComplementaryTaskCategoryController implements IComplementaryTaskCategoryController {

    constructor(
        @Inject('complementaryTaskCategoryService') private complementaryTaskCategoryService,
        @Inject('logger') private logger : any
    ) {}

    public async getAllComplementaryTaskCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting all complementary task categories');
            const result = await this.complementaryTaskCategoryService.getAllComplementaryTaskCategories();
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

    public async getComplementaryTaskCategoryById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary task category by ID');
            const result = await this.complementaryTaskCategoryService.getComplementaryTaskCategoryById(req.params.id);
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

    public async getComplementaryTaskCategoryByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary task category by code');
            const result = await this.complementaryTaskCategoryService.getComplementaryTaskCategoryByCode(req.params.code);
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

    public async getComplementaryTaskCategoryByName(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary task category by name');
            const result = await this.complementaryTaskCategoryService.getComplementaryTaskCategoryByName(req.params.name);
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

    public async getComplementaryTaskCategoriesWithParent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary task categories with parent filter');
            const hasParent = req.params.value === 'true';
            const result = await this.complementaryTaskCategoryService.getComplementaryTaskCategoriesWithParent(hasParent);
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

    public async getComplementaryTaskCategoriesByParent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Getting complementary task categories by parent code');
            const parentCode = req.params.parentCode;
            const result = await this.complementaryTaskCategoryService.getComplementaryTaskCategoryByParent(parentCode);
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
    
    public async createComplementaryTaskCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Creating complementary task category');
            const dto: ComplementaryTaskCategoryDTO = req.body;
            const result = await this.complementaryTaskCategoryService.create(dto);
            if (result.isSuccess) {
                res.status(201).json(result.getValue());
            } else {
                res.status(400).json({ error: result.error });
            }
        } catch (e: any) {
            this.logger.error('Error creating complementary task category:', e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    
    public async updateComplementaryTaskCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            this.logger.silly('Updating complementary task category');
            const code: string = req.params.code;
            const dto: ComplementaryTaskCategoryDTO = req.body;
            const result = await this.complementaryTaskCategoryService.update(code, dto);
            if (result.isSuccess) {
                res.status(200).json(result.getValue());
            } else {
                const statusCode = result.error && typeof result.error === 'string' && result.error.includes('not found') ? 404 : 400;
                res.status(statusCode).json({ error: result.error });
            }
        } catch (e) {
            this.logger.error(e);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}