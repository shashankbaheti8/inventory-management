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

  static async getInventoryReport(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportService.getInventoryReport();
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
