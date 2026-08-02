import { Router } from 'express';
import { PDFEngineController } from '../controllers/pdfEngine.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/generate-pdf', PDFEngineController.generatePDF);

export default router;
