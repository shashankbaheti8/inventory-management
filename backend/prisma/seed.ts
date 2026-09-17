import { PrismaClient, Role, TransactionType, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with India-specific data...');

  // ─── USERS ───────────────────────────────────────────────────────────────────
  const adminPass    = await bcrypt.hash('admin123', 12);
  const managerPass  = await bcrypt.hash('manager123', 12);
  const employeePass = await bcrypt.hash('employee123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@inventoryindia.in' },
    update: {},
    create: { email: 'admin@inventoryindia.in', password: adminPass, firstName: 'Rajesh', lastName: 'Sharma', role: Role.ADMIN },
  });

  const manager1 = await prisma.user.upsert({
    where: { email: 'priya.manager@inventoryindia.in' },
    update: {},
    create: { email: 'priya.manager@inventoryindia.in', password: managerPass, firstName: 'Priya', lastName: 'Nair', role: Role.INVENTORY_MANAGER },
  });

  const manager2 = await prisma.user.upsert({
    where: { email: 'arun.manager@inventoryindia.in' },
    update: {},
    create: { email: 'arun.manager@inventoryindia.in', password: managerPass, firstName: 'Arun', lastName: 'Mehta', role: Role.INVENTORY_MANAGER },
  });

  const emp1 = await prisma.user.upsert({
    where: { email: 'suresh.emp@inventoryindia.in' },
    update: {},
    create: { email: 'suresh.emp@inventoryindia.in', password: employeePass, firstName: 'Suresh', lastName: 'Kumar', role: Role.EMPLOYEE },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: 'ananya.emp@inventoryindia.in' },
    update: {},
    create: { email: 'ananya.emp@inventoryindia.in', password: employeePass, firstName: 'Ananya', lastName: 'Reddy', role: Role.EMPLOYEE },
  });

  const emp3 = await prisma.user.upsert({
    where: { email: 'vikram.emp@inventoryindia.in' },
    update: {},
    create: { email: 'vikram.emp@inventoryindia.in', password: employeePass, firstName: 'Vikram', lastName: 'Singh', role: Role.EMPLOYEE },
  });

  console.log('✅ Users created');

  // ─── CATEGORIES ──────────────────────────────────────────────────────────────
  const electronics = await prisma.category.upsert({ where: { name: 'Electronics & Gadgets' }, update: {}, create: { name: 'Electronics & Gadgets', description: 'Laptops, mobiles, accessories and electronic components' } });
  const officeSupplies = await prisma.category.upsert({ where: { name: 'Office Supplies' }, update: {}, create: { name: 'Office Supplies', description: 'Stationery, paper, and daily office essentials' } });
  const furniture = await prisma.category.upsert({ where: { name: 'Furniture & Fixtures' }, update: {}, create: { name: 'Furniture & Fixtures', description: 'Office and warehouse furniture including modular workstations' } });
  const rawMaterials = await prisma.category.upsert({ where: { name: 'Raw Materials' }, update: {}, create: { name: 'Raw Materials', description: 'Manufacturing raw materials — steel, copper, plastics' } });
  const packaging = await prisma.category.upsert({ where: { name: 'Packaging Materials' }, update: {}, create: { name: 'Packaging Materials', description: 'Corrugated boxes, bubble wrap, tapes and labels' } });
  const textiles = await prisma.category.upsert({ where: { name: 'Textiles & Fabrics' }, update: {}, create: { name: 'Textiles & Fabrics', description: 'Cotton, polyester and blended fabrics in bulk rolls' } });
  const ayurvedic = await prisma.category.upsert({ where: { name: 'Ayurvedic & FMCG' }, update: {}, create: { name: 'Ayurvedic & FMCG', description: 'Herbal products, personal care and fast-moving consumer goods' } });
  const foodGrain = await prisma.category.upsert({ where: { name: 'Food Grain & Agri' }, update: {}, create: { name: 'Food Grain & Agri', description: 'Rice, wheat, pulses, spices and agricultural produce' } });
  const itPeripherals = await prisma.category.upsert({ where: { name: 'IT Peripherals' }, update: {}, create: { name: 'IT Peripherals', description: 'Networking equipment, printers and IT accessories' } });
  const safety = await prisma.category.upsert({ where: { name: 'Safety & PPE' }, update: {}, create: { name: 'Safety & PPE', description: 'Personal protective equipment, helmets, gloves and safety gear' } });

  console.log('✅ Categories created (10)');

  // ─── SUPPLIERS ───────────────────────────────────────────────────────────────
  const s1 = await prisma.supplier.upsert({ where: { id: '11000000-0000-0000-0000-000000000001' }, update: {}, create: { id: '11000000-0000-0000-0000-000000000001', name: 'Tata Electronics Pvt. Ltd.', email: 'procurement@tataelec.co.in', phone: '+91-22-4001-2345', address: 'Bombay House, 24 Homi Mody Street, Mumbai, Maharashtra 400001', contactPerson: 'Dinesh Kapoor' } });
  const s2 = await prisma.supplier.upsert({ where: { id: '11000000-0000-0000-0000-000000000002' }, update: {}, create: { id: '11000000-0000-0000-0000-000000000002', name: 'Wipro Infrastructure Services', email: 'supply@wiproinfra.in', phone: '+91-80-2844-0011', address: 'Doddakannelli, Sarjapur Road, Bengaluru, Karnataka 560035', contactPerson: 'Kavitha Rao' } });
  const s3 = await prisma.supplier.upsert({ where: { id: '11000000-0000-0000-0000-000000000003' }, update: {}, create: { id: '11000000-0000-0000-0000-000000000003', name: 'Ambani Steel & Alloys', email: 'orders@ambanisteel.in', phone: '+91-261-2401-789', address: 'Plot No. 47, GIDC Estate, Surat, Gujarat 394510', contactPerson: 'Mukesh Patel' } });
  const s4 = await prisma.supplier.upsert({ where: { id: '11000000-0000-0000-0000-000000000004' }, update: {}, create: { id: '11000000-0000-0000-0000-000000000004', name: 'Delhi Stationery House', email: 'bulk@delhistat.in', phone: '+91-11-2326-5577', address: 'Nehru Place Market, Block C, New Delhi 110019', contactPerson: 'Ramesh Gupta' } });
  const s5 = await prisma.supplier.upsert({ where: { id: '11000000-0000-0000-0000-000000000005' }, update: {}, create: { id: '11000000-0000-0000-0000-000000000005', name: 'Chennai Packaging Solutions', email: 'sales@chennaipkg.in', phone: '+91-44-2815-3344', address: '15, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058', contactPerson: 'Lakshmi Iyer' } });
  const s6 = await prisma.supplier.upsert({ where: { id: '11000000-0000-0000-0000-000000000006' }, update: {}, create: { id: '11000000-0000-0000-0000-000000000006', name: 'Rajasthan Textiles Ltd.', email: 'export@rajasthanitex.in', phone: '+91-141-2610-882', address: 'Sanganer Industrial Area, Jaipur, Rajasthan 302029', contactPerson: 'Bharat Singhvi' } });
  const s7 = await prisma.supplier.upsert({ where: { id: '11000000-0000-0000-0000-000000000007' }, update: {}, create: { id: '11000000-0000-0000-0000-000000000007', name: 'Himalaya Drug Company', email: 'trade@himalayaherbal.in', phone: '+91-80-2371-4444', address: 'Makali, Tumkur Road, Bengaluru, Karnataka 562162', contactPerson: 'Deepa Menon' } });
  const s8 = await prisma.supplier.upsert({ where: { id: '11000000-0000-0000-0000-000000000008' }, update: {}, create: { id: '11000000-0000-0000-0000-000000000008', name: 'Punjab Agri Export Corp.', email: 'export@punjabagrex.in', phone: '+91-161-2400-991', address: 'Grain Market, Khanna, Ludhiana, Punjab 141401', contactPerson: 'Gurpreet Singh' } });

  console.log('✅ Suppliers created (8)');

  // ─── PRODUCTS ────────────────────────────────────────────────────────────────
  const productData = [
    // Electronics & Gadgets
    { name: 'Lenovo IdeaPad 5 Intel i5 16GB',       sku: 'ELEC-IN-001', description: 'Lenovo IdeaPad 5 15.6in FHD, Core i5-12th Gen, 16GB RAM, 512GB SSD', price: 58999.00, currentStock: 22, minimumStockLevel: 10, categoryId: electronics.id },
    { name: 'Redmi Note 13 Pro 5G 8GB 256GB',        sku: 'ELEC-IN-002', description: 'Redmi Note 13 Pro 5G, 8GB RAM, 256GB Storage, 200MP Camera',          price: 26999.00, currentStock: 80, minimumStockLevel: 30, categoryId: electronics.id },
    { name: 'Samsung Galaxy Tab S9 FE 128GB',         sku: 'ELEC-IN-003', description: 'Samsung Galaxy Tab S9 FE 10.9in, 128GB, Wi-Fi',                       price: 36999.00, currentStock: 15, minimumStockLevel: 8,  categoryId: electronics.id },
    { name: 'boAt Rockerz 550 Bluetooth Headphone',  sku: 'ELEC-IN-004', description: 'boAt Rockerz 550 over-ear wireless, 20hr battery, foldable',           price:  1799.00, currentStock: 200,minimumStockLevel: 60, categoryId: electronics.id },
    { name: 'LG 27in FHD IPS Monitor',               sku: 'ELEC-IN-005', description: 'LG 27MP500-B Full HD IPS Monitor with AMD FreeSync',                   price: 16499.00, currentStock: 18, minimumStockLevel: 8,  categoryId: electronics.id },
    { name: 'Syska 65W GaN USB-C Charger',           sku: 'ELEC-IN-006', description: 'Syska 65W GaN Type-C fast charger — laptops and phones',               price:  1299.00, currentStock: 7,  minimumStockLevel: 25, categoryId: electronics.id }, // LOW
    // IT Peripherals
    { name: 'HP LaserJet Pro M211d Printer',         sku: 'IT-IN-001',   description: 'HP LaserJet Pro M211d monochrome laser printer',                        price: 12999.00, currentStock: 10, minimumStockLevel: 5,  categoryId: itPeripherals.id },
    { name: 'TP-Link 8-Port Gigabit Switch',         sku: 'IT-IN-002',   description: 'TP-Link TL-SG108 8-port unmanaged gigabit ethernet switch',             price:  1499.00, currentStock: 45, minimumStockLevel: 15, categoryId: itPeripherals.id },
    { name: 'D-Link Wi-Fi 6 Router AX1800',          sku: 'IT-IN-003',   description: 'D-Link AX1800 Wi-Fi 6 Dual Band Router DIR-X1860',                      price:  5999.00, currentStock: 3,  minimumStockLevel: 10, categoryId: itPeripherals.id }, // LOW
    { name: 'Seagate 2TB Portable External HDD',     sku: 'IT-IN-004',   description: 'Seagate Backup Plus Slim 2TB portable external HDD',                    price:  4299.00, currentStock: 35, minimumStockLevel: 12, categoryId: itPeripherals.id },
    // Office Supplies
    { name: 'JK Copier A4 Paper 500 Sheets',         sku: 'OFF-IN-001',  description: 'JK Copier A4 75gsm ream, 500 sheets — all inkjet and laser printers',   price:   299.00, currentStock: 4,  minimumStockLevel: 50, categoryId: officeSupplies.id }, // CRITICAL
    { name: 'Camlin Whiteboard Markers 12 Pcs',      sku: 'OFF-IN-002',  description: 'Camlin whiteboard markers, assorted colours, chisel tip, pack of 12',    price:   249.00, currentStock: 120,minimumStockLevel: 40, categoryId: officeSupplies.id },
    { name: 'Lexi Ball Pen Pack of 10',              sku: 'OFF-IN-003',  description: 'Lexi blue ink ball pen, smooth writing, pack of 10',                     price:    79.00, currentStock: 500,minimumStockLevel: 100,categoryId: officeSupplies.id },
    { name: 'Cello Scotch Tape 24mm x 66m',         sku: 'OFF-IN-004',  description: 'Cello transparent adhesive tape, 24mm width, 66m length',                price:    35.00, currentStock: 300,minimumStockLevel: 80, categoryId: officeSupplies.id },
    { name: 'Kangaro Stapler HD-45',                 sku: 'OFF-IN-005',  description: 'Kangaro HD-45 heavy-duty stapler, capacity 45 sheets',                   price:   649.00, currentStock: 25, minimumStockLevel: 10, categoryId: officeSupplies.id },
    // Furniture & Fixtures
    { name: 'Godrej Interio Steel Almirah 2-Door',  sku: 'FURN-IN-001', description: 'Godrej Interio 2-door steel almirah with locker, powder-coated finish',  price: 12500.00, currentStock: 8,  minimumStockLevel: 4,  categoryId: furniture.id },
    { name: 'Featherlite L-Shape Workstation Desk', sku: 'FURN-IN-002', description: 'Featherlite modular L-shape office workstation, 1.5m x 1.2m',            price: 18999.00, currentStock: 6,  minimumStockLevel: 3,  categoryId: furniture.id },
    { name: 'Wipro Furniture Ergonomic Chair',      sku: 'FURN-IN-003', description: 'Wipro Furniture high-back ergonomic chair with lumbar support mesh back', price: 11499.00, currentStock: 2,  minimumStockLevel: 6,  categoryId: furniture.id }, // LOW
    { name: 'Heavy-Duty Steel Pallet Rack 5-Level', sku: 'FURN-IN-004', description: 'Heavy-duty steel pallet racking, 5 levels, 500kg load per shelf',        price: 24999.00, currentStock: 14, minimumStockLevel: 5,  categoryId: furniture.id },
    // Raw Materials
    { name: 'MS Steel Sheet 2mm 1250x2500mm',       sku: 'RAW-IN-001',  description: 'Mild steel sheet 2mm, 1250x2500mm, IS 2062 Grade A',                     price:  3200.00, currentStock: 250,minimumStockLevel: 80, categoryId: rawMaterials.id },
    { name: 'Copper Wire 1.5sqmm 90m Coil',         sku: 'RAW-IN-002',  description: 'Havells FR PVC insulated copper conductor 1.5 sq mm, 90m coil',          price:  1750.00, currentStock: 180,minimumStockLevel: 50, categoryId: rawMaterials.id },
    { name: 'HDPE Granules 25kg Bag',               sku: 'RAW-IN-003',  description: 'High-density polyethylene granules, natural, 25kg bag',                   price:  2850.00, currentStock: 60, minimumStockLevel: 20, categoryId: rawMaterials.id },
    { name: 'Aluminium Angle 40x40x5mm 6m',         sku: 'RAW-IN-004',  description: 'Aluminium equal angle 40x40x5mm, 6m length, 6063-T5 alloy',              price:  1950.00, currentStock: 0,  minimumStockLevel: 25, categoryId: rawMaterials.id }, // OUT OF STOCK
    // Packaging
    { name: 'Corrugated Box 5-Ply 30x20x20cm x50', sku: 'PKG-IN-001',  description: '5-ply corrugated shipping box, 30x20x20cm, pack of 50',                  price:  1850.00, currentStock: 0,  minimumStockLevel: 30, categoryId: packaging.id }, // OUT OF STOCK
    { name: 'Bubble Wrap Roll 50m x 1m',            sku: 'PKG-IN-002',  description: 'Anti-static bubble wrap, 50m x 1m, 10mm bubble diameter',                price:  1200.00, currentStock: 40, minimumStockLevel: 15, categoryId: packaging.id },
    { name: 'BOPP Tape 48mm x 100m Carton 24 Rolls',sku: 'PKG-IN-003',  description: 'Transparent BOPP sealing tape 48mm x 100m, carton of 24 rolls',          price:   850.00, currentStock: 90, minimumStockLevel: 30, categoryId: packaging.id },
    { name: 'Thermal Label Roll 100x150mm 500 Pcs', sku: 'PKG-IN-004',  description: 'Direct thermal shipping label 100x150mm, 500 labels per roll',            price:   450.00, currentStock: 120,minimumStockLevel: 40, categoryId: packaging.id },
    // Textiles
    { name: 'Cotton Fabric 40s Bleached White 100m',sku: 'TEX-IN-001',  description: 'Pure cotton 40s count, bleached white, 58in width, 100m roll',            price:  8500.00, currentStock: 35, minimumStockLevel: 10, categoryId: textiles.id },
    { name: 'Polyester Interlock 150GSM 50m Roll',  sku: 'TEX-IN-002',  description: 'Polyester interlock knit 150 GSM, 60in width, 50m roll',                  price:  4200.00, currentStock: 55, minimumStockLevel: 15, categoryId: textiles.id },
    { name: 'Khadi Handloom Cotton 36in 20m Bolt',  sku: 'TEX-IN-003',  description: 'Handwoven khadi cotton, 36in width, natural off-white, 20m bolt',         price:  3800.00, currentStock: 20, minimumStockLevel: 8,  categoryId: textiles.id },
    // Ayurvedic & FMCG
    { name: 'Dabur Chyawanprash 1kg Carton x12',    sku: 'AYU-IN-001',  description: 'Dabur Chyawanprash 1kg, immunity booster, carton of 12 units',            price:  5760.00, currentStock: 48, minimumStockLevel: 24, categoryId: ayurvedic.id },
    { name: 'Patanjali Dant Kanti 200g x12 Carton', sku: 'AYU-IN-002',  description: 'Patanjali Dant Kanti herbal toothpaste 200g, carton of 12',               price:  1080.00, currentStock: 96, minimumStockLevel: 36, categoryId: ayurvedic.id },
    { name: 'Marico Parachute Coconut Oil 500ml x24',sku: 'AYU-IN-003', description: 'Marico Parachute 100% pure coconut oil 500ml, carton of 24',              price:  5280.00, currentStock: 6,  minimumStockLevel: 24, categoryId: ayurvedic.id }, // LOW
    { name: 'Himalaya Neem Face Wash 150ml x12',    sku: 'AYU-IN-004',  description: 'Himalaya purifying neem face wash 150ml, carton of 12',                   price:  2040.00, currentStock: 72, minimumStockLevel: 24, categoryId: ayurvedic.id },
    // Food Grain & Agri
    { name: 'Basmati Rice 1121 Extra Long 25kg',    sku: 'AGRI-IN-001', description: 'Premium 1121 extra long basmati rice, 25kg jute bag, aged 1 year',        price:  2100.00, currentStock: 120,minimumStockLevel: 40, categoryId: foodGrain.id },
    { name: 'Toor Dal Arhar 25kg Bag',              sku: 'AGRI-IN-002', description: 'Machine-cleaned toor dal arhar, 25kg polypropylene bag',                   price:  2875.00, currentStock: 80, minimumStockLevel: 30, categoryId: foodGrain.id },
    { name: 'Erode Turmeric Powder Premium 1kg',    sku: 'AGRI-IN-003', description: 'Erode turmeric powder, 4% curcumin content, 1kg sealed pouch',            price:   220.00, currentStock: 350,minimumStockLevel: 100,categoryId: foodGrain.id },
    { name: 'Aashirvaad Whole Wheat Atta 10kg',     sku: 'AGRI-IN-004', description: 'ITC Aashirvaad select whole wheat atta, 10kg bag',                        price:   560.00, currentStock: 200,minimumStockLevel: 60, categoryId: foodGrain.id },
    // Safety & PPE
    { name: '3M Safety Helmet Yellow EN397',        sku: 'SAFE-IN-001', description: '3M H-700 series hard hat, yellow, ventilated HDPE shell',                  price:  1250.00, currentStock: 50, minimumStockLevel: 20, categoryId: safety.id },
    { name: 'Honeywell Nitrile Gloves M 100pcs',    sku: 'SAFE-IN-002', description: 'Honeywell Duracoat nitrile gloves, medium, box of 100',                   price:   699.00, currentStock: 150,minimumStockLevel: 50, categoryId: safety.id },
    { name: '3M N95 Respirator Mask Pack of 10',    sku: 'SAFE-IN-003', description: '3M Aura 9332+ N95 FFP3 particulate respirator, pack of 10',               price:  1499.00, currentStock: 60, minimumStockLevel: 30, categoryId: safety.id },
    { name: 'Karam Full Body Safety Harness PN51',  sku: 'SAFE-IN-004', description: 'Karam PN 51 full body safety harness, EN 361 certified, polyester webbing',price:  3200.00, currentStock: 10, minimumStockLevel: 5,  categoryId: safety.id },
  ];

  const createdProducts: Record<string, string> = {};
  for (const product of productData) {
    const p = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
    createdProducts[product.sku] = p.id;
  }

  console.log('✅ Products created (40)');

  // ─── INVENTORY TRANSACTIONS ───────────────────────────────────────────────────
  const txData = [
    { sku: 'ELEC-IN-001', type: TransactionType.STOCK_IN,   qty: 30,  prev: 0,   next: 30,  reason: 'Initial stock received from Tata Electronics',              ref: 'GRN-2024-001',  userId: manager1.id },
    { sku: 'ELEC-IN-002', type: TransactionType.STOCK_IN,   qty: 100, prev: 0,   next: 100, reason: 'Initial stock from Redmi distributor Mumbai',               ref: 'GRN-2024-002',  userId: manager1.id },
    { sku: 'ELEC-IN-006', type: TransactionType.STOCK_IN,   qty: 50,  prev: 0,   next: 50,  reason: 'Initial stock received',                                   ref: 'GRN-2024-003',  userId: emp1.id },
    { sku: 'ELEC-IN-001', type: TransactionType.STOCK_OUT,  qty: 8,   prev: 30,  next: 22,  reason: 'Issued to Bengaluru office project team',                  ref: 'ISO-2024-011',  userId: emp1.id },
    { sku: 'ELEC-IN-002', type: TransactionType.STOCK_OUT,  qty: 20,  prev: 100, next: 80,  reason: 'Retail sale — Vijay Sales, Mumbai',                        ref: 'SALE-2024-031', userId: emp2.id },
    { sku: 'ELEC-IN-006', type: TransactionType.STOCK_OUT,  qty: 43,  prev: 50,  next: 7,   reason: 'Bulk sale to Infosys Pune corporate order',                ref: 'SALE-2024-044', userId: emp1.id },
    { sku: 'OFF-IN-001',  type: TransactionType.ADJUSTMENT, qty: 46,  prev: 50,  next: 4,   reason: 'Stock count correction — monsoon water damage in storage',  ref: 'ADJ-2024-007',  userId: manager2.id },
    { sku: 'RAW-IN-004',  type: TransactionType.ADJUSTMENT, qty: 25,  prev: 25,  next: 0,   reason: 'Aluminium angle consumed in factory floor expansion',       ref: 'ADJ-2024-008',  userId: admin.id },
    { sku: 'PKG-IN-001',  type: TransactionType.ADJUSTMENT, qty: 30,  prev: 30,  next: 0,   reason: 'Used for Diwali season dispatch — stock exhausted',         ref: 'ADJ-2024-009',  userId: emp2.id },
    { sku: 'ELEC-IN-003', type: TransactionType.RETURN,     qty: 2,   prev: 13,  next: 15,  reason: 'Customer return — Samsung Galaxy Tab display defect',       ref: 'RTN-2024-004',  userId: manager1.id },
    { sku: 'FURN-IN-003', type: TransactionType.RETURN,     qty: 1,   prev: 1,   next: 2,   reason: 'Chair returned by Finance dept — wrong size ordered',       ref: 'RTN-2024-005',  userId: emp3.id },
    { sku: 'AGRI-IN-001', type: TransactionType.TRANSFER,   qty: 30,  prev: 150, next: 120, reason: 'Transfer to Pune cold storage facility',                   ref: 'TRF-2024-012',  userId: manager2.id },
    { sku: 'TEX-IN-001',  type: TransactionType.TRANSFER,   qty: 10,  prev: 45,  next: 35,  reason: 'Transfer to Tirupur production unit',                      ref: 'TRF-2024-013',  userId: emp3.id },
    { sku: 'IT-IN-001',   type: TransactionType.STOCK_IN,   qty: 10,  prev: 0,   next: 10,  reason: 'Received from HP India distributor',                       ref: 'GRN-2024-020',  userId: manager1.id },
    { sku: 'FURN-IN-004', type: TransactionType.STOCK_IN,   qty: 14,  prev: 0,   next: 14,  reason: 'Pallet racks received for new Mumbai warehouse',            ref: 'GRN-2024-021',  userId: manager2.id },
    { sku: 'AYU-IN-001',  type: TransactionType.STOCK_IN,   qty: 48,  prev: 0,   next: 48,  reason: 'Seasonal stock before Diwali — Dabur Chyawanprash',        ref: 'GRN-2024-022',  userId: emp1.id },
    { sku: 'AYU-IN-003',  type: TransactionType.STOCK_OUT,  qty: 18,  prev: 24,  next: 6,   reason: 'Dispatched to retail stores in Kerala',                    ref: 'SALE-2024-055', userId: emp2.id },
    { sku: 'SAFE-IN-001', type: TransactionType.STOCK_IN,   qty: 50,  prev: 0,   next: 50,  reason: 'Annual safety gear procurement — 3M India',                ref: 'GRN-2024-030',  userId: admin.id },
    { sku: 'SAFE-IN-002', type: TransactionType.STOCK_OUT,  qty: 50,  prev: 200, next: 150, reason: 'Issued to construction workers — Navi Mumbai project',     ref: 'ISO-2024-040',  userId: emp3.id },
    { sku: 'AGRI-IN-003', type: TransactionType.TRANSFER,   qty: 50,  prev: 400, next: 350, reason: 'Transfer Chennai warehouse to Hyderabad distributor',      ref: 'TRF-2024-014',  userId: manager1.id },
  ];

  for (const tx of txData) {
    const productId = createdProducts[tx.sku];
    if (!productId) continue;
    await prisma.inventoryTransaction.create({
      data: {
        productId,
        transactionType: tx.type,
        quantity: tx.qty,
        previousStock: tx.prev,
        newStock: tx.next,
        reason: tx.reason,
        reference: tx.ref,
        createdById: tx.userId,
      },
    });
  }

  console.log('✅ Transactions created (20 — all 5 types)');

  // ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────
  const poList = [
    { num: 'PO-2024-IND-001', sup: s1, status: OrderStatus.COMPLETED,  createdBy: manager1.id, total: 1297978.00, notes: 'Urgent restock for Bengaluru office laptops Q3 hiring', items: [{ sku: 'ELEC-IN-001', qty: 20, up: 55999.00 }, { sku: 'ELEC-IN-005', qty: 10, up: 15999.80 }] },
    { num: 'PO-2024-IND-002', sup: s4, status: OrderStatus.RECEIVED,   createdBy: manager2.id, total: 47600.00,  notes: 'Monthly office supplies replenishment all branches',     items: [{ sku: 'OFF-IN-001', qty: 100, up: 285.00 }, { sku: 'OFF-IN-002', qty: 50, up: 235.00 }, { sku: 'OFF-IN-003', qty: 200, up: 75.00 }, { sku: 'OFF-IN-004', qty: 100, up: 32.00 }] },
    { num: 'PO-2024-IND-003', sup: s3, status: OrderStatus.APPROVED,   createdBy: admin.id,    total: 997500.00, notes: 'Steel and aluminium raw material for Q4 production',     items: [{ sku: 'RAW-IN-001', qty: 200, up: 3050.00 }, { sku: 'RAW-IN-004', qty: 50, up: 1850.00 }] },
    { num: 'PO-2024-IND-004', sup: s5, status: OrderStatus.CREATED,    createdBy: emp1.id,     total: 200500.00, notes: 'Packaging restock for festive season surge',             items: [{ sku: 'PKG-IN-001', qty: 60, up: 1800.00 }, { sku: 'PKG-IN-002', qty: 20, up: 1150.00 }, { sku: 'PKG-IN-003', qty: 50, up: 820.00 }, { sku: 'PKG-IN-004', qty: 100, up: 430.00 }] },
    { num: 'PO-2024-IND-005', sup: s7, status: OrderStatus.COMPLETED,  createdBy: manager1.id, total: 143880.00, notes: 'FMCG restock Himalaya and Patanjali brands',             items: [{ sku: 'AYU-IN-004', qty: 50, up: 1950.00 }, { sku: 'AYU-IN-002', qty: 80, up: 1035.00 }] },
    { num: 'PO-2024-IND-006', sup: s8, status: OrderStatus.APPROVED,   createdBy: manager2.id, total: 702000.00, notes: 'Agri bulk order ahead of rabi season',                  items: [{ sku: 'AGRI-IN-001', qty: 200, up: 2050.00 }, { sku: 'AGRI-IN-002', qty: 60, up: 2750.00 }] },
    { num: 'PO-2024-IND-007', sup: s2, status: OrderStatus.CANCELLED,  createdBy: admin.id,    total: 89970.00,  notes: 'Cancelled — vendor pricing mismatch, retendering',      items: [{ sku: 'IT-IN-002', qty: 30, up: 1450.00 }, { sku: 'IT-IN-004', qty: 15, up: 4148.00 }] },
    { num: 'PO-2024-IND-008', sup: s1, status: OrderStatus.RECEIVED,   createdBy: emp3.id,     total: 267970.00, notes: 'IT refresh cycle — network infrastructure upgrade',      items: [{ sku: 'IT-IN-003', qty: 20, up: 5799.00 }, { sku: 'IT-IN-001', qty: 10, up: 12499.00 }] },
  ];

  for (const po of poList) {
    await prisma.purchaseOrder.upsert({
      where: { orderNumber: po.num },
      update: {},
      create: {
        orderNumber: po.num,
        supplierId: po.sup.id,
        status: po.status,
        totalAmount: po.total,
        notes: po.notes,
        createdById: po.createdBy,
        items: {
          create: po.items.map(i => ({
            productId: createdProducts[i.sku],
            quantity: i.qty,
            unitPrice: i.up,
            totalPrice: i.qty * i.up,
          })),
        },
      },
    });
  }

  console.log('✅ Purchase orders created (8 — all statuses)');

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: admin.id,    title: 'Low Stock Alert',         message: 'Syska 65W GaN Charger critically low — 7 units remaining (min: 25). Raise PO immediately.',       type: 'LOW_STOCK',    metadata: { sku: 'ELEC-IN-006', currentStock: 7 } },
      { userId: manager1.id, title: 'Out of Stock',            message: 'Corrugated Box 5-Ply is out of stock. Festive season shipments will be impacted.',                 type: 'OUT_OF_STOCK', metadata: { sku: 'PKG-IN-001',  currentStock: 0 } },
      { userId: manager2.id, title: 'Purchase Order Approved', message: 'PO-2024-IND-003 (Steel & Aluminium) approved and sent to Ambani Steel & Alloys.',                  type: 'PO_APPROVED',  metadata: { orderNumber: 'PO-2024-IND-003' } },
      { userId: emp1.id,     title: 'Stock Received',          message: 'GRN-2024-022 confirmed. 48 units of Dabur Chyawanprash received and logged into inventory.',       type: 'STOCK_IN',     metadata: { ref: 'GRN-2024-022' } },
      { userId: admin.id,    title: 'PO Cancelled',            message: 'PO-2024-IND-007 cancelled due to vendor pricing mismatch. Re-tender process initiated.',           type: 'PO_CANCELLED', metadata: { orderNumber: 'PO-2024-IND-007' } },
      { userId: manager1.id, title: 'Low Stock Alert',         message: 'D-Link Wi-Fi 6 Router at 3 units (min: 10). Network upgrade project may be delayed.',              type: 'LOW_STOCK',    metadata: { sku: 'IT-IN-003',   currentStock: 3 } },
    ],
  });

  console.log('✅ Notifications created (6)');

  // ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id,    action: 'CREATE', entity: 'PurchaseOrder',        entityId: 'PO-2024-IND-003',             newValue: { orderNumber: 'PO-2024-IND-003', status: 'CREATED' },               ipAddress: '10.0.1.15' },
      { userId: admin.id,    action: 'UPDATE', entity: 'PurchaseOrder',        entityId: 'PO-2024-IND-003',             previousValue: { status: 'CREATED' }, newValue: { status: 'APPROVED' },         ipAddress: '10.0.1.15' },
      { userId: manager2.id, action: 'UPDATE', entity: 'Product',              entityId: createdProducts['OFF-IN-001'], previousValue: { currentStock: 50 }, newValue: { currentStock: 4 },             ipAddress: '192.168.1.42' },
      { userId: manager1.id, action: 'CREATE', entity: 'PurchaseOrder',        entityId: 'PO-2024-IND-001',             newValue: { orderNumber: 'PO-2024-IND-001', status: 'CREATED' },               ipAddress: '10.0.2.31' },
      { userId: emp1.id,     action: 'CREATE', entity: 'InventoryTransaction', entityId: 'GRN-2024-022',                newValue: { ref: 'GRN-2024-022', type: 'STOCK_IN', qty: 48 },                  ipAddress: '192.168.2.10' },
      { userId: admin.id,    action: 'UPDATE', entity: 'PurchaseOrder',        entityId: 'PO-2024-IND-007',             previousValue: { status: 'APPROVED' }, newValue: { status: 'CANCELLED' },       ipAddress: '10.0.1.15' },
      { userId: emp3.id,     action: 'CREATE', entity: 'InventoryTransaction', entityId: 'RTN-2024-005',                newValue: { ref: 'RTN-2024-005', type: 'RETURN', qty: 1 },                     ipAddress: '192.168.3.77' },
    ],
  });

  console.log('✅ Audit logs created (7)');

  console.log('\n🎉 Database seeded with full India-specific data!');
  console.log('\n📋 Test accounts:');
  console.log('  Admin:     admin@inventoryindia.in          / admin123    (Rajesh Sharma)');
  console.log('  Manager1:  priya.manager@inventoryindia.in / manager123  (Priya Nair)');
  console.log('  Manager2:  arun.manager@inventoryindia.in  / manager123  (Arun Mehta)');
  console.log('  Employee1: suresh.emp@inventoryindia.in    / employee123 (Suresh Kumar)');
  console.log('  Employee2: ananya.emp@inventoryindia.in    / employee123 (Ananya Reddy)');
  console.log('  Employee3: vikram.emp@inventoryindia.in    / employee123 (Vikram Singh)');
  console.log('\n📊 Summary:');
  console.log('  👤 Users: 6  |  📁 Categories: 10  |  🏭 Suppliers: 8');
  console.log('  📦 Products: 40 (INR pricing, Indian brands)');
  console.log('  🔄 Transactions: 20 (all 5 types)  |  📋 Orders: 8 (all statuses)');
  console.log('  🔔 Notifications: 6  |  📝 Audit Logs: 7');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
