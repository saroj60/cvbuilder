import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body, req.ip);
      return sendSuccess(res, 201, 'User registered successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body, req.ip, req.get('user-agent'));
      return sendSuccess(res, 200, 'Login successful', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return sendError(res, 400, 'Refresh token required');

      const result = await AuthService.refreshAccessToken(refreshToken);
      return sendSuccess(res, 200, 'Token refreshed successfully', result);
    } catch (error: any) {
      return sendError(res, 401, error.message);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      return sendSuccess(res, 200, result.message, result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      const result = await AuthService.resetPassword(token, newPassword);
      return sendSuccess(res, 200, result.message);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(userId, currentPassword, newPassword);
      return sendSuccess(res, 200, result.message);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const updated = await AuthService.updateProfile(userId, req.body);
      return sendSuccess(res, 200, 'Profile updated successfully', updated);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const user = await AuthService.getProfile(userId);
      return sendSuccess(res, 200, 'Profile fetched successfully', user);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (userId) {
        await AuthService.logout(userId, req.ip);
      }
      return sendSuccess(res, 200, 'Logged out successfully');
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}
