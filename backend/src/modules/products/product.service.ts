import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { CacheService } from '../../utils/cache';
import { ParsedPagination } from '../../types/index';

export class ProductService {
  static async getAll(pagination: ParsedPagination, categoryId?: string) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (categoryId) where.categoryId = categoryId;

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { sku: { contains: pagination.search, mode: 'insensitive' } },
        { description: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const cacheKey = `products:${JSON.stringify({ ...pagination, categoryId })}`;
    const cached = await CacheService.get<{ products: any[]; total: number }>(cacheKey);
    if (cached) return cached;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    const result = { products, total };
    await CacheService.set(cacheKey, result, 120);
    return result;
  }

  static async getById(id: string) {
    const cacheKey = `product:${id}`;
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) return cached;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        inventoryTransactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!product) throw ApiError.notFound('Product not found');

    await CacheService.set(cacheKey, product, 300);
    return product;
  }

  static async create(data: {
    name: string;
    sku: string;
    description?: string;
    price: number;
    minimumStockLevel?: number;
    categoryId: string;
  }) {
    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw ApiError.badRequest('Category not found');

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku.toUpperCase(),
        description: data.description,
        price: data.price,
        minimumStockLevel: data.minimumStockLevel ?? 10,
        categoryId: data.categoryId,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    await CacheService.delPattern('products:*');
    return product;
  }

  static async update(id: string, data: Partial<{
    name: string;
    sku: string;
    description: string;
    price: number;
    minimumStockLevel: number;
    categoryId: string;
  }>) {
    await this.getById(id);

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) throw ApiError.badRequest('Category not found');
    }

    if (data.sku) data.sku = data.sku.toUpperCase();

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } } },
    });

    await CacheService.del(`product:${id}`);
    await CacheService.delPattern('products:*');
    return product;
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    await CacheService.del(`product:${id}`);
    await CacheService.delPattern('products:*');
  }

  static async getLowStock() {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        currentStock: { lte: prisma.product.fields.minimumStockLevel as any },
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { currentStock: 'asc' },
    });

    // Fallback: raw query for the comparison between two columns
    const lowStockProducts = await prisma.$queryRaw<any[]>`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.current_stock <= p.minimum_stock_level
      ORDER BY p.current_stock ASC
    `;

    return lowStockProducts;
  }
}
