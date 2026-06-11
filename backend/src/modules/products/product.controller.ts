import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { ApiResponse } from '../../utils/apiResponse';
import { parsePagination } from '../../types/index';

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any, 'createdAt');
      const categoryId = req.query.categoryId as string | undefined;
      const { products, total } = await ProductService.getAll(pagination, categoryId);
      ApiResponse.paginated(res, products, total, pagination.page, pagination.limit);
    } catch (error) { next(error); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.getById(req.params.id);
      ApiResponse.success(res, product);
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.create(req.body);
      ApiResponse.created(res, product);
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await ProductService.update(req.params.id, req.body);
      ApiResponse.success(res, product, 'Product updated');
    } catch (error) { next(error); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ProductService.delete(req.params.id);
      ApiResponse.success(res, null, 'Product deleted');
    } catch (error) { next(error); }
  }

  static async getLowStock(_req: Request, res: Response, next: NextFunction) {
    try {
      const products = await ProductService.getLowStock();
      ApiResponse.success(res, products);
    } catch (error) { next(error); }
  }
}
