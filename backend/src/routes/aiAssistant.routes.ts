import { Router } from 'express';
import { AIAssistantController } from '../controllers/aiAssistant.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/evaluate-candidate', AIAssistantController.evaluateCandidate);
router.post('/match-job', AIAssistantController.matchJob);
router.post('/recommend-employers', AIAssistantController.recommendEmployers);
router.post('/interview-questions', AIAssistantController.generateInterviewQuestions);
router.post('/ocr-document', AIAssistantController.ocrDocument);
router.post('/parse-resume', AIAssistantController.parseResume);
router.post('/chat', AIAssistantController.chat);

export default router;
