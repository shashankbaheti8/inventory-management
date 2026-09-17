import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/apiResponse';
import { parsePagination } from '../../types/index';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      ApiResponse.created(res, user, 'Registration successful');
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.createUser(req.body);
      ApiResponse.created(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body.email, req.body.password);
      ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const tokens = await AuthService.refreshToken(req.body.refreshToken);
      ApiResponse.success(res, tokens, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.logout(req.user!.userId);
      ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile(req.user!.userId);
      ApiResponse.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = parsePagination(req.query as any);
      const { users, total } = await AuthService.getAllUsers(pagination);
      ApiResponse.paginated(res, users, total, pagination.page, pagination.limit);
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.updateUserRole(req.params.id as string, req.body.role);
      ApiResponse.success(res, user, 'User role updated');
    } catch (error) {
      next(error);
    }
  }

  static async toggleUserActive(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.toggleUserActive(req.params.id as string);
      ApiResponse.success(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      next(error);
    }
  }
}
