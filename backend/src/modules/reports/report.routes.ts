import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);

router.get('/dashboard', ReportController.getDashboard);
router.get('/inventory', authorize('ADMIN', 'INVENTORY_MANAGER'), ReportController.getInventoryReport);
router.get('/stock-movement', authorize('ADMIN', 'INVENTORY_MANAGER'), ReportController.getStockMovement);

export default router;
