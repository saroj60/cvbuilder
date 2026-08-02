import { Response, NextFunction } from 'express';
import { JobService } from '../services/job.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

export class JobController {
  static async createJob(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const job = await JobService.createJob(userId, req.body);
      return sendSuccess(res, 201, 'Job posting created successfully', job);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getJobs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const jobs = await JobService.getJobs(userId);
      return sendSuccess(res, 200, 'Jobs fetched successfully', jobs);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getJobById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const job = await JobService.getJobById(req.params.id);
      return sendSuccess(res, 200, 'Job fetched successfully', job);
    } catch (error: any) {
      return sendError(res, 404, error.message);
    }
  }
}
