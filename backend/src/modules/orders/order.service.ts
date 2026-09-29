import { OrderStatus, Prisma, TransactionType } from '@prisma/client';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { ParsedPagination } from '../../types/index';
import { buildOrderBy } from '../../utils/prismaHelper';
import { AuditService } from '../audit/audit.service';
import { logger } from '../../config/logger';
import { CacheService } from '../../utils/cache';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['APPROVED', 'CANCELLED'],
  APPROVED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export class OrderService {
  /**
   * Order numbers come from a Postgres sequence, so concurrent requests can
   * never be handed the same number (unlike `count() + 1`).
   */
  private static async generateOrderNumber(): Promise<string> {
    const [{ seq }] = await prisma.$queryRaw<[{ seq: bigint }]>`
      SELECT nextval('purchase_order_number_seq') AS seq
    `;
    const date = new Date();
    const prefix = `PO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    return `${prefix}-${String(seq).padStart(5, '0')}`;
  }

  static async getAll(pagination: ParsedPagination, filters: { status?: OrderStatus; supplierId?: string }) {
    const where: Prisma.PurchaseOrderWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.supplierId) where.supplierId = filters.supplierId;

    if (pagination.search) {
      where.OR = [
        { orderNumber: { contains: pagination.search, mode: 'insensitive' } },
        { supplier: { name: { contains: pagination.search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: buildOrderBy(pagination.sortBy, pagination.sortOrder),
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return { orders, total };
  }

  static async getById(id: string) {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true, currentStock: true } } },
        },
      },
    });
    if (!order) throw ApiError.notFound('Purchase order not found');
    return order;
  }

  static async create(
    data: {
      supplierId: string;
      notes?: string;
      items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    },
    userId: string
  ) {
    // Verify supplier
    const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
    if (!supplier || !supplier.isActive) throw ApiError.badRequest('Supplier not found');

    // Verify all products
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });
    if (products.length !== productIds.length) {
      throw ApiError.badRequest('One or more products not found');
    }

    const orderNumber = await this.generateOrderNumber();
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        notes: data.notes,
        totalAmount,
        createdById: userId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });

    logger.info(`Purchase order created: ${orderNumber} — $${totalAmount}`);
    return order;
  }

  static async updateStatus(id: string, newStatus: OrderStatus, userId: string) {
    const order = await this.getById(id);

    if (!VALID_TRANSITIONS[order.status].includes(newStatus)) {
      throw ApiError.badRequest(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    await prisma.$transaction(async (tx) => {
      // Claim the transition with a conditional update. If another request
      // already moved the order out of its current status, this matches zero
      // rows and we abort — so an order can never be received twice.
      const claimed = await tx.purchaseOrder.updateMany({
        where: { id, status: order.status },
        data: { status: newStatus },
      });
      if (claimed.count === 0) {
        throw ApiError.conflict('Order status was changed by another request. Please refresh and try again.');
      }

      // When order is RECEIVED, auto stock-in all items with atomic increments
      if (newStatus === 'RECEIVED') {
        for (const item of order.items) {
          const product = await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              transactionType: TransactionType.STOCK_IN,
              quantity: item.quantity,
              previousStock: product.currentStock - item.quantity,
              newStock: product.currentStock,
              reason: `Purchase order ${order.orderNumber} received`,
              reference: order.orderNumber,
              createdById: userId,
            },
          });
        }
      }

      await AuditService.log(tx, {
        userId,
        action: 'ORDER_STATUS_CHANGE',
        entity: 'PurchaseOrder',
        entityId: id,
        previousValue: { status: order.status },
        newValue: { status: newStatus },
      });
    });

    if (newStatus === 'RECEIVED') {
      await CacheService.delPattern('products:*');
      for (const item of order.items) await CacheService.del(`product:${item.productId}`);
      logger.info(`Order ${order.orderNumber}: stock received and inventory updated`);
    }

    logger.info(`Order ${order.orderNumber}: ${order.status} → ${newStatus}`);
    return this.getById(id);
  }
}
