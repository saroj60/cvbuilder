import { Router } from 'express';
import { EmployerController } from '../controllers/employer.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

const createEmployerSchema = z.object({
  body: z.object({
    companyName: z.string().min(2, 'Company name is required'),
    companyEmail: z.string().email('Invalid email address'),
    companyPhone: z.string().min(6, 'Valid phone number is required'),
    country: z.string().min(2, 'Country is required'),
    address: z.string().optional(),
    contactPerson: z.string().min(2, 'Contact person is required'),
    website: z.string().url().optional().or(z.literal('')),
    isVerified: z.boolean().optional(),
  }),
});

router.use(authenticate);

router.post('/', validate(createEmployerSchema), EmployerController.createEmployer);
router.get('/', EmployerController.getEmployers);
router.get('/:id', EmployerController.getEmployerById);
router.patch('/:id', EmployerController.updateEmployer);
router.delete('/:id', EmployerController.deleteEmployer);

export default router;
