import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document.service';
import { sendSuccess, sendError } from '../utils/response';

export class DocumentController {
  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await DocumentService.uploadDocument(req.body);
      return sendSuccess(res, 201, 'Document uploaded successfully', doc);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentType, candidateId } = req.query as any;
      const docs = await DocumentService.getDocuments(documentType, candidateId);
      return sendSuccess(res, 200, 'Documents retrieved successfully', docs);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async getVersionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentType, candidateId } = req.params as any;
      const history = await DocumentService.getDocumentHistory(documentType as any, candidateId);
      return sendSuccess(res, 200, 'Document version history fetched', history);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async replaceDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const newVersion = await DocumentService.replaceDocument(req.params.id, req.body);
      return sendSuccess(res, 200, 'Document version replaced successfully', newVersion);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      await DocumentService.deleteDocument(req.params.id);
      return sendSuccess(res, 200, 'Document deleted successfully');
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}
