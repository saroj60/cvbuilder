import { Request, Response, NextFunction } from 'express';
import { MedicalService } from '../services/medical.service';
import { sendSuccess, sendError } from '../utils/response';

export class MedicalController {
  static async scheduleOrUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MedicalService.scheduleOrUpdateMedical(req.body);
      return sendSuccess(res, 200, 'Medical record updated successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getMedicals(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query as any;
      const list = await MedicalService.getMedicals(status);
      return sendSuccess(res, 200, 'Medical records retrieved', list);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getMedicalById(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await MedicalService.getMedicalById(req.params.id);
      return sendSuccess(res, 200, 'Medical details retrieved', record);
    } catch (error: any) {
      return sendError(res, 404, error.message);
    }
  }

  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await MedicalService.getMedicalMetrics();
      return sendSuccess(res, 200, 'Medical metrics calculated', metrics);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}
