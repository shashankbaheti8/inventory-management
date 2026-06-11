import { PrismaClient } from '@prisma/client';
import prisma from '../../config/prisma';
import { ParsedPagination } from '../../types/index';

interface AuditLogData {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
}

export class AuditService {
  /**
   * Create an audit log entry. Accepts a Prisma client or transaction client.
   */
  static async log(client: any, data: AuditLogData) {
    return client.auditLog.create({ data });
  }

  static async getAll(pagination: ParsedPagination, filters: { entity?: string; userId?: string; action?: string }) {
    const where: any = {};
    if (filters.entity) where.entity = filters.entity;
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };

    if (pagination.search) {
      where.OR = [
        { action: { contains: pagination.search, mode: 'insensitive' } },
        { entity: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}
