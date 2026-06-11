import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { CacheService } from '../../utils/cache';

const CACHE_KEY = 'categories:all';

export class CategoryService {
  static async getAll() {
    const cached = await CacheService.get<any[]>(CACHE_KEY);
    if (cached) return cached;

    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });

    await CacheService.set(CACHE_KEY, categories, 600);
    return categories;
  }

  static async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  static async create(data: { name: string; description?: string }) {
    const category = await prisma.category.create({ data });
    await CacheService.del(CACHE_KEY);
    return category;
  }

  static async update(id: string, data: { name?: string; description?: string }) {
    await this.getById(id);
    const category = await prisma.category.update({ where: { id }, data });
    await CacheService.del(CACHE_KEY);
    return category;
  }

  static async delete(id: string) {
    const category = await this.getById(id);
    if (category._count.products > 0) {
      throw ApiError.badRequest('Cannot delete category with existing products');
    }
    await prisma.category.delete({ where: { id } });
    await CacheService.del(CACHE_KEY);
  }
}
