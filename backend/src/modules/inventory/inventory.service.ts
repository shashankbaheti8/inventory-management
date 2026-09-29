import { Prisma, TransactionType } from '@prisma/client';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { CacheService } from '../../utils/cache';
import { ParsedPagination } from '../../types/index';
import { buildOrderBy } from '../../utils/prismaHelper';
import { logger } from '../../config/logger';
import { AuditService } from '../audit/audit.service';

interface MovementInput {
  productId: string;
  type: TransactionType;
  /** Signed change in stock: positive adds units, negative removes them. */
  delta: number;
  auditAction: string;
  reason: string;
  userId: string;
  reference?: string;
}

export class InventoryService {
  /**
   * Applies a stock movement atomically.
   *
   * The stock check and the update happen in a single conditional UPDATE
   * (`... WHERE current_stock >= n`), so concurrent removals can never push
   * stock below zero. The transaction record and audit log are written in the
   * same database transaction, and the cache is invalidated only after commit
   * so readers cannot re-cache pre-commit data.
   */
  private static async applyMovement(input: MovementInput) {
    const { productId, type, delta, auditAction, reason, userId, reference } = input;
    const isRemoval = delta < 0;

    const transaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.updateMany({
        where: {
          id: productId,
          isActive: true,
          ...(isRemoval ? { currentStock: { gte: Math.abs(delta) } } : {}),
        },
        data: { currentStock: { increment: delta } },
      });

      if (updated.count === 0) {
        throw isRemoval
          ? ApiError.badRequest('Insufficient stock or product not found')
          : ApiError.notFound('Product not found');
      }

      const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
      const newStock = product.currentStock;
      const previousStock = newStock - delta;

      const record = await tx.inventoryTransaction.create({
        data: {
          productId,
          transactionType: type,
          quantity: Math.abs(delta),
          previousStock,
          newStock,
          reason,
          reference,
          createdById: userId,
        },
        include: {
          product: { select: { name: true, sku: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });

      await AuditService.log(tx, {
        userId,
        action: auditAction,
        entity: 'Product',
        entityId: productId,
        previousValue: { currentStock: previousStock },
        newValue: { currentStock: newStock },
      });

      logger.info(`${type}: ${product.sku} ${delta >= 0 ? '+' : ''}${delta} (${previousStock} → ${newStock})`);
      return record;
    });

    await CacheService.del(`product:${productId}`);
    await CacheService.delPattern('products:*');

    return transaction;
  }

  static stockIn(productId: string, quantity: number, reason: string, userId: string, reference?: string) {
    return this.applyMovement({
      productId, type: TransactionType.STOCK_IN, delta: quantity,
      auditAction: 'STOCK_IN', reason, userId, reference,
    });
  }

  static stockOut(productId: string, quantity: number, reason: string, userId: string, reference?: string) {
    return this.applyMovement({
      productId, type: TransactionType.STOCK_OUT, delta: -quantity,
      auditAction: 'STOCK_OUT', reason, userId, reference,
    });
  }

  /** Adjustment — quantity may be positive or negative. */
  static adjustment(productId: string, quantity: number, reason: string, userId: string) {
    return this.applyMovement({
      productId, type: TransactionType.ADJUSTMENT, delta: quantity,
      auditAction: 'STOCK_ADJUSTMENT', reason, userId,
    });
  }

  static returnStock(productId: string, quantity: number, reason: string, userId: string, reference?: string) {
    return this.applyMovement({
      productId, type: TransactionType.RETURN, delta: quantity,
      auditAction: 'STOCK_RETURN', reason, userId, reference,
    });
  }

  static transferStock(productId: string, quantity: number, reason: string, userId: string, reference?: string) {
    return this.applyMovement({
      productId, type: TransactionType.TRANSFER, delta: -quantity,
      auditAction: 'STOCK_TRANSFER', reason, userId, reference,
    });
  }

  /**
   * Get transaction history with filtering
   */
  static async getHistory(
    pagination: ParsedPagination,
    filters: {
      productId?: string;
      transactionType?: TransactionType;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const where: Prisma.InventoryTransactionWhereInput = {};

    if (filters.productId) where.productId = filters.productId;
    if (filters.transactionType) where.transactionType = filters.transactionType;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { firstName: true, lastName: true, email: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: buildOrderBy(pagination.sortBy, pagination.sortOrder),
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return { transactions, total };
  }
}
