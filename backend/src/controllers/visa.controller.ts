import { Request, Response, NextFunction } from 'express';
import { VisaService } from '../services/visa.service';
import { sendSuccess, sendError } from '../utils/response';

export class VisaController {
  static async saveVisa(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await VisaService.createOrUpdateVisa(req.body);
      return sendSuccess(res, 200, 'Visa record saved successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async saveMOFA(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await VisaService.createOrUpdateMOFA(req.body);
      return sendSuccess(res, 200, 'MOFA record saved successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getVisas(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.query as any;
      const list = await VisaService.getVisas(status);
      return sendSuccess(res, 200, 'Visa records retrieved', list);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await VisaService.getVisaMetrics();
      return sendSuccess(res, 200, 'Visa & MOFA metrics calculated', metrics);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}
