import { TransactionType, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { CacheService } from '../../utils/cache';
import { ParsedPagination } from '../../types/index';
import { logger } from '../../config/logger';
import { AuditService } from '../audit/audit.service';

export class InventoryService {
  /**
   * Stock In — adds units to inventory inside a transaction
   */
  static async stockIn(
    productId: string,
    quantity: number,
    reason: string,
    userId: string,
    reference?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.updateMany({
        where: { id: productId, isActive: true },
        data: { currentStock: { increment: quantity } },
      });

      if (updated.count === 0) throw ApiError.notFound('Product not found');

      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw ApiError.notFound('Product not found');
      
      const newStock = product.currentStock;
      const previousStock = newStock - quantity;

      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId,
          transactionType: TransactionType.STOCK_IN,
          quantity,
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

      // Audit log
      await AuditService.log(tx, {
        userId,
        action: 'STOCK_IN',
        entity: 'Product',
        entityId: productId,
        previousValue: { currentStock: previousStock },
        newValue: { currentStock: newStock },
      });

      logger.info(`Stock IN: ${product.sku} +${quantity} (${previousStock} → ${newStock})`);

      await CacheService.del(`product:${productId}`);
      await CacheService.delPattern('products:*');

      return transaction;
    });
  }

  /**
   * Stock Out — removes units from inventory
   */
  static async stockOut(
    productId: string,
    quantity: number,
    reason: string,
    userId: string,
    reference?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.product.updateMany({
        where: { id: productId, isActive: true, currentStock: { gte: quantity } },
        data: { currentStock: { decrement: quantity } },
      });

      if (updated.count === 0) {
        throw ApiError.badRequest('Insufficient stock or product not found');
      }

      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw ApiError.notFound('Product not found');
      
      const newStock = product.currentStock;
      const previousStock = newStock + quantity;

      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId,
          transactionType: TransactionType.STOCK_OUT,
          quantity,
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
        action: 'STOCK_OUT',
        entity: 'Product',
        entityId: productId,
        previousValue: { currentStock: previousStock },
        newValue: { currentStock: newStock },
      });

      logger.info(`Stock OUT: ${product.sku} -${quantity} (${previousStock} → ${newStock})`);

      await CacheService.del(`product:${productId}`);
      await CacheService.delPattern('products:*');

      return transaction;
    });
  }

  /**
   * Adjustment — set stock to a specific value (can be + or -)
   */
  static async adjustment(
    productId: string,
    quantity: number,
    reason: string,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const isNegative = quantity < 0;
      const updated = await tx.product.updateMany({
        where: { 
          id: productId, 
          isActive: true,
          ...(isNegative ? { currentStock: { gte: Math.abs(quantity) } } : {})
        },
        data: { currentStock: { increment: quantity } },
      });

      if (updated.count === 0) {
        throw ApiError.badRequest(isNegative ? 'Adjustment would result in negative stock or product not found' : 'Product not found');
      }

      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw ApiError.notFound('Product not found');

      const newStock = product.currentStock;
      const previousStock = newStock - quantity;

      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId,
          transactionType: TransactionType.ADJUSTMENT,
          quantity: Math.abs(quantity),
          previousStock,
          newStock,
          reason,
          createdById: userId,
        },
        include: {
          product: { select: { name: true, sku: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      });

      await AuditService.log(tx, {
        userId,
        action: 'STOCK_ADJUSTMENT',
        entity: 'Product',
        entityId: productId,
        previousValue: { currentStock: previousStock },
        newValue: { currentStock: newStock },
      });

      logger.info(`Stock ADJUSTMENT: ${product.sku} ${quantity >= 0 ? '+' : ''}${quantity} (${previousStock} → ${newStock})`);

      await CacheService.del(`product:${productId}`);
      await CacheService.delPattern('products:*');

      return transaction;
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryTransaction.count({ where }),
    ]);

    return { transactions, total };
  }
}
