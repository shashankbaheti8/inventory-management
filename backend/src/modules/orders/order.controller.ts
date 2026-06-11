import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';
import { ApiResponse } from '../../utils/apiResponse';
import { parsePagination } from '../../types/index';
import { OrderStatus } from '@prisma/client';

export class OrderController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any, 'createdAt');
      const filters = {
        status: req.query.status as OrderStatus | undefined,
        supplierId: req.query.supplierId as string | undefined,
      };
      const { orders, total } = await OrderService.getAll(pagination, filters);
      ApiResponse.paginated(res, orders, total, pagination.page, pagination.limit);
    } catch (error) { next(error); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.getById(req.params.id);
      ApiResponse.success(res, order);
    } catch (error) { next(error); }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.create(req.body, req.user!.userId);
      ApiResponse.created(res, order);
    } catch (error) { next(error); }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrderService.updateStatus(req.params.id, req.body.status, req.user!.userId);
      ApiResponse.success(res, order, 'Order status updated');
    } catch (error) { next(error); }
  }
}
