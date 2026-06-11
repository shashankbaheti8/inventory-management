import { Router } from 'express';
import { OrderController } from './order.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from './order.validation';

const router = Router();

router.use(authenticate);

router.get('/', OrderController.getAll);
router.get('/:id', OrderController.getById);
router.post('/', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(createOrderSchema), OrderController.create);
router.patch('/:id/status', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(updateOrderStatusSchema), OrderController.updateStatus);

export default router;
