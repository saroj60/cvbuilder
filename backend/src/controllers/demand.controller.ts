import { Request, Response, NextFunction } from 'express';
import { DemandService } from '../services/demand.service';
import { sendSuccess, sendError } from '../utils/response';

export class DemandController {
  static async createDemand(req: Request, res: Response, next: NextFunction) {
    try {
      const createdById = (req as any).user.id;
      const demand = await DemandService.createDemand({ ...req.body, createdById });
      return sendSuccess(res, 201, 'Employer Demand created successfully', demand);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getDemands(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, employerId } = req.query as any;
      const demands = await DemandService.getDemands(status, employerId);
      return sendSuccess(res, 200, 'Demands fetched successfully', demands);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getDemandById(req: Request, res: Response, next: NextFunction) {
    try {
      const demand = await DemandService.getDemandById(req.params.id);
      return sendSuccess(res, 200, 'Demand details retrieved', demand);
    } catch (error: any) {
      return sendError(res, 404, error.message);
    }
  }

  static async assignCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidateId } = req.body;
      const updated = await DemandService.assignCandidate(req.params.id, candidateId);
      return sendSuccess(res, 200, 'Candidate assigned to demand', updated);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async updateDemandStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const updated = await DemandService.updateDemandStatus(req.params.id, status);
      return sendSuccess(res, 200, 'Demand status updated', updated);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getDemandMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await DemandService.getDemandMetrics();
      return sendSuccess(res, 200, 'Demand metrics calculated', metrics);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}
