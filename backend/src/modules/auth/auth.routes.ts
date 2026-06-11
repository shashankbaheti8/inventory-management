import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { registerSchema, loginSchema, refreshTokenSchema, updateUserRoleSchema } from './auth.validation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);

// Admin-only routes
router.get('/users', authenticate, authorize('ADMIN'), AuthController.getAllUsers);
router.patch('/users/:id/role', authenticate, authorize('ADMIN'), validate(updateUserRoleSchema), AuthController.updateUserRole);
router.patch('/users/:id/toggle-active', authenticate, authorize('ADMIN'), AuthController.toggleUserActive);

export default router;
