import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service';
import { ApiResponse } from '../../utils/apiResponse';

export class ReportController {
  static async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getDashboard();
      ApiResponse.success(res, data);
    } catch (error) { next(error); }
  }

  static async getInventoryReport(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const stockStatus = req.query.stockStatus as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
      
      const data = await ReportService.getInventoryReport({ search, categoryId, stockStatus, page, limit, sortBy, sortOrder });
      ApiResponse.success(res, data);
    } catch (error) { next(error); }
  }

  static async getStockMovement(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
      const data = await ReportService.getStockMovementReport(startDate, endDate);
      ApiResponse.success(res, data);
    } catch (error) { next(error); }
  }
}
