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

  static async getInventoryReport(filters: { search?: string; categoryId?: string; stockStatus?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } } },
      orderBy: { currentStock: 'asc' },
    });

    const totalValue = allProducts.reduce(
      (sum, p) => sum + Number(p.price) * p.currentStock,
      0
    );

    const globalLowStock = allProducts.filter((p) => p.currentStock <= p.minimumStockLevel);
    const globalOutOfStock = allProducts.filter((p) => p.currentStock === 0);

    let filteredProducts = allProducts;

    if (filters.categoryId) {
      filteredProducts = filteredProducts.filter(p => p.categoryId === filters.categoryId);
    }
    
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }

    if (filters.stockStatus) {
      if (filters.stockStatus === 'out') {
        filteredProducts = filteredProducts.filter(p => p.currentStock === 0);
      } else if (filters.stockStatus === 'low') {
        filteredProducts = filteredProducts.filter(p => p.currentStock > 0 && p.currentStock <= p.minimumStockLevel);
      } else if (filters.stockStatus === 'ok') {
        filteredProducts = filteredProducts.filter(p => p.currentStock > p.minimumStockLevel);
      }
    }

    const sortBy = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    const modifier = sortOrder === 'asc' ? 1 : -1;

    filteredProducts.sort((a: any, b: any) => {
      let valA, valB;
      
      if (sortBy === 'value') {
        valA = Number(a.price) * a.currentStock;
        valB = Number(b.price) * b.currentStock;
      } else {
        valA = a[sortBy];
        valB = b[sortBy];
        
        // Handle nested fields like category.name
        if (sortBy.includes('.')) {
          const parts = sortBy.split('.');
          valA = a; valB = b;
          for (const p of parts) {
            valA = valA ? valA[p] : undefined;
            valB = valB ? valB[p] : undefined;
          }
        }
      }

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1 * modifier;
      if (valB === undefined || valB === null) return -1 * modifier;
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * modifier;
      }
      return (valA < valB ? -1 : 1) * modifier;
    });

    const totalFiltered = filteredProducts.length;
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit);

    return {
      products: paginatedProducts,
      pagination: {
        total: totalFiltered,
        page,
        limit,
      },
      summary: {
        totalProducts: allProducts.length,
        totalValue,
        lowStockCount: globalLowStock.length,
        outOfStockCount: globalOutOfStock.length,
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
