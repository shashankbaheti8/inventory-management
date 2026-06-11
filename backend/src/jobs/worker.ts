import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import prisma from '../config/prisma';
import { logger } from '../config/logger';
import { sendEmail } from '../config/email';
import { NotificationService } from '../modules/notifications/notification.service';

const lowStockWorker = new Worker(
  'low-stock-check',
  async (job: Job) => {
    logger.info('🔍 Running low stock check...');

    const lowStockProducts = await prisma.$queryRaw<any[]>`
      SELECT p.id, p.name, p.sku, p.current_stock, p.minimum_stock_level,
             c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true AND p.current_stock <= p.minimum_stock_level
      ORDER BY p.current_stock ASC
    `;

    if (lowStockProducts.length === 0) {
      logger.info('✅ No low stock products found');
      return { checked: true, alertsSent: 0 };
    }

    logger.warn(`⚠️ Found ${lowStockProducts.length} low stock product(s)`);

    // Get all admin and inventory manager users
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'INVENTORY_MANAGER'] },
        isActive: true,
      },
      select: { id: true, email: true, firstName: true },
    });

    // Build alert email
    const productList = lowStockProducts
      .map(
        (p: any) =>
          `<tr>
            <td style="padding:8px;border:1px solid #ddd;">${p.name}</td>
            <td style="padding:8px;border:1px solid #ddd;">${p.sku}</td>
            <td style="padding:8px;border:1px solid #ddd;color:${p.current_stock === 0 ? '#dc2626' : '#f59e0b'};font-weight:bold;">${p.current_stock}</td>
            <td style="padding:8px;border:1px solid #ddd;">${p.minimum_stock_level}</td>
            <td style="padding:8px;border:1px solid #ddd;">${p.category_name || 'N/A'}</td>
          </tr>`
      )
      .join('');

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#dc2626;">⚠️ Low Stock Alert</h2>
        <p>The following products are at or below their minimum stock level:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Product</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">SKU</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Current</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Minimum</th>
              <th style="padding:8px;border:1px solid #ddd;text-align:left;">Category</th>
            </tr>
          </thead>
          <tbody>${productList}</tbody>
        </table>
        <p style="color:#6b7280;font-size:12px;">This is an automated alert from the Inventory Management System.</p>
      </div>
    `;

    // Send notifications to each manager
    let alertsSent = 0;
    for (const manager of managers) {
      try {
        // In-app notification
        await NotificationService.create({
          userId: manager.id,
          title: 'Low Stock Alert',
          message: `${lowStockProducts.length} product(s) are at or below minimum stock level`,
          type: 'LOW_STOCK',
          metadata: { productCount: lowStockProducts.length },
        });

        // Email notification
        await sendEmail(
          manager.email,
          `⚠️ Low Stock Alert — ${lowStockProducts.length} product(s) need attention`,
          emailHtml
        );

        alertsSent++;
      } catch (err) {
        logger.error(`Failed to send alert to ${manager.email}:`, err);
      }
    }

    logger.info(`📧 Low stock alerts sent to ${alertsSent} manager(s)`);
    return { checked: true, alertsSent, lowStockCount: lowStockProducts.length };
  },
  {
    connection: redis,
    concurrency: 1,
  }
);

lowStockWorker.on('completed', (job, result) => {
  logger.info(`Low stock check completed: ${JSON.stringify(result)}`);
});

lowStockWorker.on('failed', (job, err) => {
  logger.error(`Low stock check failed: ${err.message}`);
});

export default lowStockWorker;
