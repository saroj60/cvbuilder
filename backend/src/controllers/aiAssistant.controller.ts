import { Request, Response, NextFunction } from 'express';
import { AIAssistantService } from '../services/aiAssistant.service';
import { sendSuccess, sendError } from '../utils/response';

export class AIAssistantController {
  static async evaluateCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidateName, jobTitle, rawResumeText } = req.body;
      const result = await AIAssistantService.evaluateCandidate(candidateName, jobTitle, rawResumeText);
      return sendSuccess(res, 200, 'Candidate evaluated successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async matchJob(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidateSkills, jobRequirements } = req.body;
      const result = await AIAssistantService.matchCandidateToJob(candidateSkills || [], jobRequirements || []);
      return sendSuccess(res, 200, 'Job matching score calculated', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async recommendEmployers(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobTitle } = req.body;
      const result = await AIAssistantService.recommendEmployers(jobTitle);
      return sendSuccess(res, 200, 'Employer recommendations generated', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async generateInterviewQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobTitle, seniority } = req.body;
      const result = await AIAssistantService.generateInterviewQuestions(jobTitle, seniority);
      return sendSuccess(res, 200, 'Interview questions generated', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async ocrDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentType, fileUrl, base64Image } = req.body;
      const result = await AIAssistantService.ocrDocumentText(documentType, fileUrl, base64Image);
      return sendSuccess(res, 200, 'Document OCR completed', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async parseResume(req: Request, res: Response, next: NextFunction) {
    try {
      const { rawText } = req.body;
      const result = await AIAssistantService.parseResumeToJSON(rawText || '');
      return sendSuccess(res, 200, 'Resume parsed to structured JSON', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      const result = await AIAssistantService.chatWithAssistant(message);
      return sendSuccess(res, 200, 'AI chat reply generated', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}
