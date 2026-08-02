import { Router } from 'express';
import { VisaController } from '../controllers/visa.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

const visaSchema = z.object({
  body: z.object({
    candidateId: z.string().min(1, 'Candidate ID is required'),
    visaNumber: z.string().optional(),
    visaType: z.string().optional(),
    country: z.string().min(2, 'Country is required'),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    status: z.enum(['PENDING', 'APPLIED', 'APPROVED', 'REJECTED', 'STAMPED']).optional(),
    remarks: z.string().optional(),
    documentUrl: z.string().optional(),
  }),
});

const mofaSchema = z.object({
  body: z.object({
    candidateId: z.string().min(1, 'Candidate ID is required'),
    mofaNumber: z.string().min(2, 'MOFA Number is required'),
    submissionDate: z.string().min(1, 'Submission date is required'),
    approvalDate: z.string().optional(),
    status: z.enum(['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
    fee: z.number().optional(),
    remarks: z.string().optional(),
  }),
});

router.use(authenticate);

router.post('/save-visa', validate(visaSchema), VisaController.saveVisa);
router.post('/save-mofa', validate(mofaSchema), VisaController.saveMOFA);
router.get('/', VisaController.getVisas);
router.get('/metrics', VisaController.getMetrics);

export default router;
