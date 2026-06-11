import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { ApiResponse } from '../../utils/apiResponse';
import { parsePagination } from '../../types/index';

export class NotificationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { notifications, total } = await NotificationService.getUserNotifications(req.user!.userId, pagination);
      ApiResponse.paginated(res, notifications, total, pagination.page, pagination.limit);
    } catch (error) { next(error); }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.userId);
      ApiResponse.success(res, { count });
    } catch (error) { next(error); }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAsRead(req.params.id, req.user!.userId);
      ApiResponse.success(res, null, 'Notification marked as read');
    } catch (error) { next(error); }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await NotificationService.markAllAsRead(req.user!.userId);
      ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (error) { next(error); }
  }
}
