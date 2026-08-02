import { Router } from 'express';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

const uploadDocSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Document title is required'),
    documentType: z.enum([
      'PASSPORT',
      'CITIZENSHIP',
      'MEDICAL',
      'POLICE_CLEARANCE',
      'CERTIFICATE',
      'PHOTO',
      'RESUME',
      'VISA',
      'CONTRACT',
      'OTHER',
    ]),
    fileUrl: z.string().min(1, 'File URL is required'),
    fileType: z.string().min(1, 'File MIME type is required'),
    fileSize: z.number().max(10 * 1024 * 1024, 'Max file size is 10MB'),
    candidateId: z.string().optional(),
  }),
});

router.use(authenticate);

router.post('/upload', validate(uploadDocSchema), DocumentController.uploadDocument);
router.get('/', DocumentController.getDocuments);
router.get('/history/:candidateId/:documentType', DocumentController.getVersionHistory);
router.post('/:id/replace', DocumentController.replaceDocument);
router.delete('/:id', DocumentController.deleteDocument);

export default router;
