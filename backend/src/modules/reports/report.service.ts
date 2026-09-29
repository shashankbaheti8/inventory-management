import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { CacheService } from '../../utils/cache';

/** Whitelisted sort fields for the inventory report → SQL expressions. */
const REPORT_SORT_COLUMNS: Record<string, string> = {
  name: 'p.name',
  sku: 'p.sku',
  price: 'p.price',
  currentStock: 'p.current_stock',
  minimumStockLevel: 'p.minimum_stock_level',
  value: '(p.price * p.current_stock)',
  'category.name': 'c.name',
  createdAt: 'p.created_at',
};

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

  /**
   * Inventory report. Filtering, sorting, pagination and the summary totals all
   * run in PostgreSQL, so the API never loads the whole product table into
   * memory. Sort columns come from a whitelist, so user input never reaches
   * the SQL as raw text.
   */
  static async getInventoryReport(filters: { search?: string; categoryId?: string; stockStatus?: string; page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 10));

    const conditions: Prisma.Sql[] = [Prisma.sql`p.is_active = true`];
    if (filters.categoryId) {
      conditions.push(Prisma.sql`p.category_id = ${filters.categoryId}`);
    }
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(Prisma.sql`(p.name ILIKE ${term} OR p.sku ILIKE ${term})`);
    }
    if (filters.stockStatus === 'out') {
      conditions.push(Prisma.sql`p.current_stock = 0`);
    } else if (filters.stockStatus === 'low') {
      conditions.push(Prisma.sql`p.current_stock > 0 AND p.current_stock <= p.minimum_stock_level`);
    } else if (filters.stockStatus === 'ok') {
      conditions.push(Prisma.sql`p.current_stock > p.minimum_stock_level`);
    }
    const where = Prisma.join(conditions, ' AND ');

    const sortColumn = REPORT_SORT_COLUMNS[filters.sortBy || 'name'] ?? REPORT_SORT_COLUMNS.name;
    const direction = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const orderBy = Prisma.raw(`${sortColumn} ${direction} NULLS LAST, p.id ASC`);

    const [pageRows, [{ count }], [summary]] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `,
      prisma.$queryRaw<[{ count: number }]>`
        SELECT COUNT(*)::int AS count FROM products p WHERE ${where}
      `,
      prisma.$queryRaw<[{ total_products: number; total_value: number; low_stock: number; out_of_stock: number }]>`
        SELECT
          COUNT(*)::int                                                         AS total_products,
          COALESCE(SUM(price * current_stock), 0)::float8                       AS total_value,
          COUNT(*) FILTER (WHERE current_stock <= minimum_stock_level)::int     AS low_stock,
          COUNT(*) FILTER (WHERE current_stock = 0)::int                        AS out_of_stock
        FROM products
        WHERE is_active = true
      `,
    ]);

    // Load the page's products with their category, then restore SQL order.
    const ids = pageRows.map((r) => r.id);
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: { category: { select: { name: true } } },
    });
    const position = new Map(ids.map((id, i) => [id, i]));
    products.sort((a, b) => position.get(a.id)! - position.get(b.id)!);

    return {
      products,
      pagination: {
        total: count,
        page,
        limit,
      },
      summary: {
        totalProducts: summary.total_products,
        totalValue: summary.total_value,
        lowStockCount: summary.low_stock,
        outOfStockCount: summary.out_of_stock,
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

    const dateConditions: Prisma.Sql[] = [];
    if (startDate) dateConditions.push(Prisma.sql`created_at >= ${new Date(startDate)}`);
    if (endDate) dateConditions.push(Prisma.sql`created_at <= ${new Date(endDate)}`);
    const dateWhere = dateConditions.length
      ? Prisma.sql`WHERE ${Prisma.join(dateConditions, ' AND ')}`
      : Prisma.empty;

    const daily = await prisma.$queryRaw<any[]>`
      SELECT
        DATE(created_at) as date,
        transaction_type,
        COUNT(*)::int as count,
        SUM(quantity)::int as total_quantity
      FROM inventory_transactions
      ${dateWhere}
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
