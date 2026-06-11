import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { ApiResponse } from '../../utils/apiResponse';
import { parsePagination } from '../../types/index';
import { TransactionType } from '@prisma/client';

export class InventoryController {
  static async stockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, reason, reference } = req.body;
      const transaction = await InventoryService.stockIn(productId, quantity, reason, req.user!.userId, reference);
      ApiResponse.created(res, transaction, 'Stock added successfully');
    } catch (error) { next(error); }
  }

  static async stockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, reason, reference } = req.body;
      const transaction = await InventoryService.stockOut(productId, quantity, reason, req.user!.userId, reference);
      ApiResponse.created(res, transaction, 'Stock removed successfully');
    } catch (error) { next(error); }
  }

  static async adjustment(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, quantity, reason } = req.body;
      const transaction = await InventoryService.adjustment(productId, quantity, reason, req.user!.userId);
      ApiResponse.created(res, transaction, 'Stock adjusted successfully');
    } catch (error) { next(error); }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any, 'createdAt');
      const filters = {
        productId: req.query.productId as string | undefined,
        transactionType: req.query.transactionType as TransactionType | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      const { transactions, total } = await InventoryService.getHistory(pagination, filters);
      ApiResponse.paginated(res, transactions, total, pagination.page, pagination.limit);
    } catch (error) { next(error); }
  }
}
