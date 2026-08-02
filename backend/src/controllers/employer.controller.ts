import { Request, Response, NextFunction } from 'express';
import { EmployerService } from '../services/employer.service';
import { sendSuccess, sendError } from '../utils/response';

export class EmployerController {
  static async createEmployer(req: Request, res: Response, next: NextFunction) {
    try {
      const employer = await EmployerService.createEmployer(req.body);
      return sendSuccess(res, 201, 'Employer created successfully', employer);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getEmployers(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, country } = req.query as any;
      const employers = await EmployerService.getEmployers(search, country);
      return sendSuccess(res, 200, 'Employers fetched successfully', employers);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getEmployerById(req: Request, res: Response, next: NextFunction) {
    try {
      const employer = await EmployerService.getEmployerById(req.params.id);
      return sendSuccess(res, 200, 'Employer details fetched successfully', employer);
    } catch (error: any) {
      return sendError(res, 404, error.message);
    }
  }

  static async updateEmployer(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await EmployerService.updateEmployer(req.params.id, req.body);
      return sendSuccess(res, 200, 'Employer updated successfully', updated);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async deleteEmployer(req: Request, res: Response, next: NextFunction) {
    try {
      await EmployerService.deleteEmployer(req.params.id);
      return sendSuccess(res, 200, 'Employer deleted successfully');
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}
