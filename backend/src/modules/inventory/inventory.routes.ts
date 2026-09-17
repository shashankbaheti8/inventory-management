import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { stockInSchema, stockOutSchema, adjustmentSchema, returnSchema, transferSchema } from './inventory.validation';

const router = Router();

router.use(authenticate);

router.get('/history', InventoryController.getHistory);
router.post('/stock-in', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(stockInSchema), InventoryController.stockIn);
router.post('/stock-out', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(stockOutSchema), InventoryController.stockOut);
router.post('/adjustment', authorize('ADMIN'), validate(adjustmentSchema), InventoryController.adjustment);
router.post('/return', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(returnSchema), InventoryController.returnStock);
router.post('/transfer', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(transferSchema), InventoryController.transferStock);

export default router;
