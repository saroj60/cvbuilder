import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

export class DashboardController {
  static async getHRMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await DashboardService.getHRMetrics();
      return sendSuccess(res, 200, 'HR Dashboard metrics fetched successfully', data);
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }
}
