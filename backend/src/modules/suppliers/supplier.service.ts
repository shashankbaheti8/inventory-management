import { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiError';
import { ParsedPagination } from '../../types/index';

export class SupplierService {
  static async getAll(pagination: ParsedPagination) {
    const where: Prisma.SupplierWhereInput = { isActive: true };

    if (pagination.search) {
      where.OR = [
        { name: { contains: pagination.search, mode: 'insensitive' } },
        { email: { contains: pagination.search, mode: 'insensitive' } },
        { contactPerson: { contains: pagination.search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: { _count: { select: { purchaseOrders: true } } },
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { [pagination.sortBy]: pagination.sortOrder },
      }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, total };
  }

  static async getById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { purchaseOrders: true } },
        purchaseOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        },
      },
    });
    if (!supplier) throw ApiError.notFound('Supplier not found');
    return supplier;
  }

  static async create(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
  }) {
    return prisma.supplier.create({ data });
  }

  static async update(id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    contactPerson: string;
  }>) {
    await this.getById(id);
    return prisma.supplier.update({ where: { id }, data });
  }

  static async delete(id: string) {
    await this.getById(id);
    await prisma.supplier.update({ where: { id }, data: { isActive: false } });
  }
}
