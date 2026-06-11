import { Router } from 'express';
import { ProductController } from './product.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './product.validation';

const router = Router();

router.use(authenticate);

router.get('/', ProductController.getAll);
router.get('/low-stock', ProductController.getLowStock);
router.get('/:id', ProductController.getById);
router.post('/', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(createProductSchema), ProductController.create);
router.put('/:id', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(updateProductSchema), ProductController.update);
router.delete('/:id', authorize('ADMIN'), ProductController.delete);

export default router;
