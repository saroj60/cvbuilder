import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Job title is required'),
    description: z.string().min(10, 'Job description must be detailed'),
    skills: z.array(z.string()).default([]),
    department: z.string().min(2, 'Department is required'),
    location: z.string().min(2, 'Location is required'),
  }),
});

router.use(authenticate);

router.post('/', validate(createJobSchema), JobController.createJob);
router.get('/', JobController.getJobs);
router.get('/:id', JobController.getJobById);

export default router;
