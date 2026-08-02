import { Router } from 'express';
import { MedicalController } from '../controllers/medical.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

const scheduleMedicalSchema = z.object({
  body: z.object({
    candidateId: z.string().min(1, 'Candidate ID is required'),
    clinicName: z.string().min(2, 'Medical clinic name is required'),
    reportNo: z.string().min(2, 'Medical report number is required'),
    testDate: z.string().min(1, 'Test date is required'),
    expiryDate: z.string().optional(),
    status: z.enum(['PENDING', 'FIT', 'UNFIT', 'REEXAMINE']).optional(),
    remarks: z.string().optional(),
    documentUrl: z.string().optional(),
  }),
});

router.use(authenticate);

router.post('/schedule', validate(scheduleMedicalSchema), MedicalController.scheduleOrUpdate);
router.get('/', MedicalController.getMedicals);
router.get('/metrics', MedicalController.getMetrics);
router.get('/:id', MedicalController.getMedicalById);

export default router;
