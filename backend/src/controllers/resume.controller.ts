import { Response, NextFunction } from 'express';
import { ResumeService } from '../services/resume.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { ResumeStatus } from '@prisma/client';

export class ResumeController {
  static async createResume(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const resume = await ResumeService.createResume(userId, req.body);
      return sendSuccess(res, 201, 'Resume processed & uploaded successfully', resume);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getResumes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const status = req.query.status as ResumeStatus | undefined;
      const search = req.query.search as string | undefined;

      const resumes = await ResumeService.getResumes(userId, status, search);
      return sendSuccess(res, 200, 'Resumes fetched successfully', resumes);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getResumeById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const resume = await ResumeService.getResumeById(req.params.id, userId);
      return sendSuccess(res, 200, 'Resume fetched successfully', resume);
    } catch (error: any) {
      return sendError(res, 404, error.message);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const { status } = req.body;
      const updated = await ResumeService.updateResumeStatus(req.params.id, userId, status);
      return sendSuccess(res, 200, 'Resume status updated successfully', updated);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async deleteResume(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      await ResumeService.deleteResume(req.params.id, userId);
      return sendSuccess(res, 200, 'Resume deleted successfully');
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) return sendError(res, 401, 'Unauthorized');

      const metrics = await ResumeService.getMetrics(userId);
      return sendSuccess(res, 200, 'Dashboard metrics fetched successfully', metrics);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}
