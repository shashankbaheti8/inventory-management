import prisma from '../../config/prisma';
import { ParsedPagination } from '../../types/index';

export class NotificationService {
  static async getUserNotifications(userId: string, pagination: ParsedPagination) {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { notifications, total };
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  static async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  static async create(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    metadata?: any;
  }) {
    return prisma.notification.create({ data });
  }
}
