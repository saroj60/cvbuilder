import { Router } from 'express';
import { DemandController } from '../controllers/demand.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

const createDemandSchema = z.object({
  body: z.object({
    employerId: z.string().min(1, 'Employer ID is required'),
    title: z.string().min(2, 'Position title is required'),
    description: z.string().min(10, 'Provide position description'),
    quantityRequired: z.number().min(1, 'Quantity must be at least 1'),
    salary: z.number().min(1, 'Salary must be positive'),
    currency: z.string().optional(),
    benefits: z.array(z.string()).optional(),
    contractPeriod: z.string().optional(),
    closingDate: z.string().optional(),
    assignedRecruiterId: z.string().optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'FULFILLED', 'CANCELLED']).optional(),
  }),
});

router.use(authenticate);

router.post('/', validate(createDemandSchema), DemandController.createDemand);
router.get('/', DemandController.getDemands);
router.get('/metrics', DemandController.getDemandMetrics);
router.get('/:id', DemandController.getDemandById);
router.post('/:id/assign', DemandController.assignCandidate);
router.patch('/:id/status', DemandController.updateDemandStatus);

export default router;
