import { Request, Response, NextFunction } from 'express';
import { AIBuilderService } from '../services/aiBuilder.service';
import { sendSuccess, sendError } from '../utils/response';

export class AIBuilderController {
  static async generateFullResume(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobTitle, experienceYears, rawInput } = req.body;
      const result = await AIBuilderService.generateFullResume(jobTitle, experienceYears, rawInput);
      return sendSuccess(res, 200, 'Structured resume generated successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async generateSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobTitle, skills } = req.body;
      const result = await AIBuilderService.generateSummary(jobTitle, skills || []);
      return sendSuccess(res, 200, 'Professional summary generated', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async generateObjective(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobTitle, industry } = req.body;
      const result = await AIBuilderService.generateCareerObjective(jobTitle, industry || 'Technology');
      return sendSuccess(res, 200, 'Career objective generated', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async improveExperience(req: Request, res: Response, next: NextFunction) {
    try {
      const { bulletPoints } = req.body;
      const result = await AIBuilderService.improveWorkExperience(bulletPoints || []);
      return sendSuccess(res, 200, 'Work experience bullet points enhanced', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async generateResponsibilities(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobTitle } = req.body;
      const result = await AIBuilderService.generateResponsibilities(jobTitle);
      return sendSuccess(res, 200, 'Work experience responsibilities generated', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async improveSkills(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobTitle } = req.body;
      const result = await AIBuilderService.improveSkills(jobTitle);
      return sendSuccess(res, 200, 'Skills recommendations generated', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async correctGrammar(req: Request, res: Response, next: NextFunction) {
    try {
      const { text } = req.body;
      const result = await AIBuilderService.correctGrammar(text);
      return sendSuccess(res, 200, 'Grammar corrected and tone polished', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async translateNepali(req: Request, res: Response, next: NextFunction) {
    try {
      const { nepaliText } = req.body;
      const result = await AIBuilderService.translateNepaliToEnglish(nepaliText);
      return sendSuccess(res, 200, 'Nepali text translated to professional English', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async atsScore(req: Request, res: Response, next: NextFunction) {
    try {
      const { resumeData } = req.body;
      const result = await AIBuilderService.calculateAtsScore(resumeData);
      return sendSuccess(res, 200, 'ATS compatibility score calculated', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }

  static async generateCoverLetter(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidateName, jobTitle, companyName } = req.body;
      const result = await AIBuilderService.generateCoverLetter(candidateName, jobTitle, companyName);
      return sendSuccess(res, 200, 'Cover letter generated successfully', result);
    } catch (error: any) {
      return sendError(res, 400, error.message);
    }
  }
}
