import prisma from '../../config/prisma';
import { CacheService } from '../../utils/cache';

export class ReportService {
  static async getDashboard() {
    const cacheKey = 'reports:dashboard';
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) return cached;

    const [
      totalProducts,
      totalCategories,
      totalSuppliers,
      activeOrders,
      lowStockCount,
      totalInventoryValue,
      recentTransactions,
      ordersByStatus,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.category.count(),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.purchaseOrder.count({ where: { status: { in: ['CREATED', 'APPROVED'] } } }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM products
        WHERE is_active = true AND current_stock <= minimum_stock_level
      `,
      prisma.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(CAST(price AS NUMERIC) * current_stock), 0) as total
        FROM products WHERE is_active = true
      `,
      prisma.inventoryTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.purchaseOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const dashboard = {
      stats: {
        totalProducts,
        totalCategories,
        totalSuppliers,
        activeOrders,
        lowStockCount: Number(lowStockCount[0]?.count || 0),
        totalInventoryValue: Number(totalInventoryValue[0]?.total || 0),
      },
      recentTransactions,
      ordersByStatus: ordersByStatus.map((o) => ({ status: o.status, count: o._count })),
    };

    await CacheService.set(cacheKey, dashboard, 60);
    return dashboard;
  }

  static async getInventoryReport() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } } },
      orderBy: { currentStock: 'asc' },
    });

    const totalValue = products.reduce(
      (sum, p) => sum + Number(p.price) * p.currentStock,
      0
    );

    const lowStock = products.filter((p) => p.currentStock <= p.minimumStockLevel);
    const outOfStock = products.filter((p) => p.currentStock === 0);

    return {
      products,
      summary: {
        totalProducts: products.length,
        totalValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
      },
    };
  }

  static async getStockMovementReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const movements = await prisma.inventoryTransaction.groupBy({
      by: ['transactionType'],
      where,
      _count: true,
      _sum: { quantity: true },
    });

    const daily = await prisma.$queryRaw<any[]>`
      SELECT
        DATE(created_at) as date,
        transaction_type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM inventory_transactions
      ${startDate ? prisma.$queryRaw`WHERE created_at >= ${new Date(startDate)}` : prisma.$queryRaw``}
      GROUP BY DATE(created_at), transaction_type
      ORDER BY date DESC
      LIMIT 30
    `;

    return {
      summary: movements.map((m) => ({
        type: m.transactionType,
        count: m._count,
        totalQuantity: m._sum.quantity,
      })),
      daily,
    };
  }
}
