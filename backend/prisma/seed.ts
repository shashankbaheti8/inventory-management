import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const managerPassword = await bcrypt.hash('manager123', 12);
  const employeePassword = await bcrypt.hash('employee123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: {
      email: 'admin@inventory.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@inventory.com' },
    update: {},
    create: {
      email: 'manager@inventory.com',
      password: managerPassword,
      firstName: 'Jane',
      lastName: 'Manager',
      role: Role.INVENTORY_MANAGER,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@inventory.com' },
    update: {},
    create: {
      email: 'employee@inventory.com',
      password: employeePassword,
      firstName: 'John',
      lastName: 'Employee',
      role: Role.EMPLOYEE,
    },
  });

  console.log('✅ Users created');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Electronics' }, update: {}, create: { name: 'Electronics', description: 'Electronic devices and components' } }),
    prisma.category.upsert({ where: { name: 'Office Supplies' }, update: {}, create: { name: 'Office Supplies', description: 'Stationery, paper, and office essentials' } }),
    prisma.category.upsert({ where: { name: 'Furniture' }, update: {}, create: { name: 'Furniture', description: 'Office and warehouse furniture' } }),
    prisma.category.upsert({ where: { name: 'Raw Materials' }, update: {}, create: { name: 'Raw Materials', description: 'Manufacturing raw materials' } }),
    prisma.category.upsert({ where: { name: 'Packaging' }, update: {}, create: { name: 'Packaging', description: 'Packaging materials and supplies' } }),
  ]);

  console.log('✅ Categories created');

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'TechParts Inc.',
        email: 'orders@techparts.com',
        phone: '+1-555-0101',
        address: '123 Tech Blvd, San Jose, CA',
        contactPerson: 'Mike Chen',
      },
    }),
    prisma.supplier.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Office World',
        email: 'supply@officeworld.com',
        phone: '+1-555-0102',
        address: '456 Commerce St, Austin, TX',
        contactPerson: 'Sarah Johnson',
      },
    }),
    prisma.supplier.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Industrial Materials Co.',
        email: 'sales@industrialmat.com',
        phone: '+1-555-0103',
        address: '789 Factory Rd, Detroit, MI',
        contactPerson: 'Tom Williams',
      },
    }),
  ]);

  console.log('✅ Suppliers created');

  // Create products
  const products = [
    { name: 'Laptop - Dell XPS 15', sku: 'ELEC-001', price: 1299.99, currentStock: 25, minimumStockLevel: 10, categoryId: categories[0].id },
    { name: 'Wireless Mouse', sku: 'ELEC-002', price: 29.99, currentStock: 150, minimumStockLevel: 50, categoryId: categories[0].id },
    { name: 'USB-C Hub', sku: 'ELEC-003', price: 49.99, currentStock: 8, minimumStockLevel: 20, categoryId: categories[0].id },
    { name: 'Monitor 27"', sku: 'ELEC-004', price: 449.99, currentStock: 30, minimumStockLevel: 15, categoryId: categories[0].id },
    { name: 'A4 Paper (500 sheets)', sku: 'OFF-001', price: 8.99, currentStock: 5, minimumStockLevel: 20, categoryId: categories[1].id },
    { name: 'Ballpoint Pens (12 pack)', sku: 'OFF-002', price: 4.99, currentStock: 200, minimumStockLevel: 50, categoryId: categories[1].id },
    { name: 'Standing Desk', sku: 'FURN-001', price: 699.99, currentStock: 12, minimumStockLevel: 5, categoryId: categories[2].id },
    { name: 'Ergonomic Chair', sku: 'FURN-002', price: 449.99, currentStock: 3, minimumStockLevel: 8, categoryId: categories[2].id },
    { name: 'Steel Sheets (1m²)', sku: 'RAW-001', price: 35.00, currentStock: 500, minimumStockLevel: 100, categoryId: categories[3].id },
    { name: 'Cardboard Boxes (50 pack)', sku: 'PACK-001', price: 24.99, currentStock: 0, minimumStockLevel: 30, categoryId: categories[4].id },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('✅ Products created (some intentionally low stock for alert testing)');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Test accounts:');
  console.log('  Admin:    admin@inventory.com / admin123');
  console.log('  Manager:  manager@inventory.com / manager123');
  console.log('  Employee: employee@inventory.com / employee123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
