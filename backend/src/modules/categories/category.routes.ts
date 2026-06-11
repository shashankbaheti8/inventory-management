import { Router } from 'express';
import { CategoryController } from './category.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createCategorySchema, updateCategorySchema } from './category.validation';

const router = Router();

router.use(authenticate);

router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);
router.post('/', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(createCategorySchema), CategoryController.create);
router.put('/:id', authorize('ADMIN', 'INVENTORY_MANAGER'), validate(updateCategorySchema), CategoryController.update);
router.delete('/:id', authorize('ADMIN'), CategoryController.delete);

export default router;
