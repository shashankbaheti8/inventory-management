import { Request, Response, NextFunction } from 'express';
import { SupplierService } from './supplier.service';
import { ApiResponse } from '../../utils/apiResponse';
import { parsePagination } from '../../types/index';

export class SupplierController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any, 'name');
      const { suppliers, total } = await SupplierService.getAll(pagination);
      ApiResponse.paginated(res, suppliers, total, pagination.page, pagination.limit);
    } catch (error) { next(error); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await SupplierService.getById(req.params.id);
      ApiResponse.success(res, supplier);
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await SupplierService.create(req.body);
      ApiResponse.created(res, supplier);
    } catch (error) { next(error); }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const supplier = await SupplierService.update(req.params.id, req.body);
      ApiResponse.success(res, supplier, 'Supplier updated');
    } catch (error) { next(error); }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await SupplierService.delete(req.params.id);
      ApiResponse.success(res, null, 'Supplier deleted');
    } catch (error) { next(error); }
  }
}
