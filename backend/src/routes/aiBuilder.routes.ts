import { Router } from 'express';
import { AIBuilderController } from '../controllers/aiBuilder.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/generate-resume', AIBuilderController.generateFullResume);
router.post('/generate-summary', AIBuilderController.generateSummary);
router.post('/generate-objective', AIBuilderController.generateObjective);
router.post('/improve-experience', AIBuilderController.improveExperience);
router.post('/generate-responsibilities', AIBuilderController.generateResponsibilities);
router.post('/improve-skills', AIBuilderController.improveSkills);
router.post('/correct-grammar', AIBuilderController.correctGrammar);
router.post('/translate-nepali', AIBuilderController.translateNepali);
router.post('/ats-score', AIBuilderController.atsScore);
router.post('/generate-cover-letter', AIBuilderController.generateCoverLetter);

export default router;
