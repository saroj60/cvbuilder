import { Router } from 'express';
import authRoutes from './auth.routes';
import resumeRoutes from './resume.routes';
import jobRoutes from './job.routes';
import dashboardRoutes from './dashboard.routes';
import documentRoutes from './document.routes';
import aiBuilderRoutes from './aiBuilder.routes';
import pdfEngineRoutes from './pdfEngine.routes';
import employerRoutes from './employer.routes';
import demandRoutes from './demand.routes';
import medicalRoutes from './medical.routes';
import visaRoutes from './visa.routes';
import aiAssistantRoutes from './aiAssistant.routes';

import ocrRoutes from './ocr.routes';

const router = Router();

router.use('/ocr', ocrRoutes);
router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/jobs', jobRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/documents', documentRoutes);
router.use('/ai-builder', aiBuilderRoutes);
router.use('/pdf', pdfEngineRoutes);
router.use('/employers', employerRoutes);
router.use('/demands', demandRoutes);
router.use('/medicals', medicalRoutes);
router.use('/visas', visaRoutes);
router.use('/ai-assistant', aiAssistantRoutes);

export default router;
