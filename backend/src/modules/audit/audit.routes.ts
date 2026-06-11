import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

router.use(authenticate);
router.get('/', authorize('ADMIN'), AuditController.getAll);

export default router;
