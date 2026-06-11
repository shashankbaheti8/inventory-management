import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createSupplierSchema, updateSupplierSchema } from './supplier.validation';

const router = Router();

router.use(authenticate);

router.get('/', SupplierController.getAll);
router.get('/:id', SupplierController.getById);
router.post('/', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(createSupplierSchema), SupplierController.create);
router.put('/:id', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(updateSupplierSchema), SupplierController.update);
router.delete('/:id', authorize('ADMIN'), SupplierController.delete);

export default router;
