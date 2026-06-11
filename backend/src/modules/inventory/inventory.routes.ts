import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { stockInSchema, stockOutSchema, adjustmentSchema } from './inventory.validation';

const router = Router();

router.use(authenticate);

router.get('/history', InventoryController.getHistory);
router.post('/stock-in', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(stockInSchema), InventoryController.stockIn);
router.post('/stock-out', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(stockOutSchema), InventoryController.stockOut);
router.post('/adjustment', authorize('ADMIN'), validate(adjustmentSchema), InventoryController.adjustment);

export default router;
