import { Router } from 'express';
import { ResumeController } from '../controllers/resume.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

const createResumeSchema = z.object({
  body: z.object({
    candidateName: z.string().min(2, 'Candidate name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    summary: z.string().optional(),
    skills: z.array(z.string()).default([]),
    experienceYrs: z.number().min(0).default(0),
    education: z.string().optional(),
    jobId: z.string().optional(),
    fileUrl: z.string().optional(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'PARSED', 'SHORTLISTED', 'REJECTED', 'INTERVIEWED']),
  }),
});

router.use(authenticate);

router.post('/', validate(createResumeSchema), ResumeController.createResume);
router.get('/', ResumeController.getResumes);
router.get('/metrics', ResumeController.getMetrics);
router.get('/:id', ResumeController.getResumeById);
router.patch('/:id/status', validate(updateStatusSchema), ResumeController.updateStatus);
router.delete('/:id', ResumeController.deleteResume);

export default router;
