import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { ApiResponse } from '../../utils/apiResponse';
import { parsePagination } from '../../types/index';

export class AuditController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any, 'createdAt');
      const filters = {
        entity: req.query.entity as string | undefined,
        userId: req.query.userId as string | undefined,
        action: req.query.action as string | undefined,
      };
      const { logs, total } = await AuditService.getAll(pagination, filters);
      ApiResponse.paginated(res, logs, total, pagination.page, pagination.limit);
    } catch (error) { next(error); }
  }
}
