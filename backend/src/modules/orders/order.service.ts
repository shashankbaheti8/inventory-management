import { OrderStatus, Prisma, TransactionType } from '@prisma/client';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { ParsedPagination } from '../../types/index';
import { AuditService } from '../audit/audit.service';
import { logger } from '../../config/logger';
import { CacheService } from '../../utils/cache';

export class OrderService {
  private static async generateOrderNumber(): Promise<string> {
    const count = await prisma.purchaseOrder.count();
    const date = new Date();
    const prefix = `PO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
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
        orderBy: { createdAt: 'desc' },
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

    // Validate state transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      CREATED: ['APPROVED', 'CANCELLED'],
      APPROVED: ['RECEIVED', 'CANCELLED'],
      RECEIVED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[order.status].includes(newStatus)) {
      throw ApiError.badRequest(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    // When order is RECEIVED, auto stock-in all items
    if (newStatus === 'RECEIVED') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) continue;

          const previousStock = product.currentStock;
          const newStock = previousStock + item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: newStock },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              transactionType: TransactionType.STOCK_IN,
              quantity: item.quantity,
              previousStock,
              newStock,
              reason: `Purchase order ${order.orderNumber} received`,
              reference: order.orderNumber,
              createdById: userId,
            },
          });
        }

        await tx.purchaseOrder.update({
          where: { id },
          data: { status: newStatus },
        });

        await AuditService.log(tx, {
          userId,
          action: 'ORDER_STATUS_CHANGE',
          entity: 'PurchaseOrder',
          entityId: id,
          previousValue: { status: order.status },
          newValue: { status: newStatus },
        });
      });

      await CacheService.delPattern('products:*');
      logger.info(`Order ${order.orderNumber}: stock received and inventory updated`);
    } else {
      await prisma.purchaseOrder.update({
        where: { id },
        data: { status: newStatus },
      });

      await AuditService.log(prisma, {
        userId,
        action: 'ORDER_STATUS_CHANGE',
        entity: 'PurchaseOrder',
        entityId: id,
        previousValue: { status: order.status },
        newValue: { status: newStatus },
      });
    }

    logger.info(`Order ${order.orderNumber}: ${order.status} → ${newStatus}`);
    return this.getById(id);
  }
}
