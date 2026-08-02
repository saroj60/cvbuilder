import { Router } from 'express';
import multer from 'multer';
import { ocrController } from '../controllers/ocr.controller';

const router = Router();

// Configure Multer in-memory storage (20 MB maximum file size constraint)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Only image/scanned PDF files are supported.'));
    }
  },
});

/**
 * POST /api/ocr/extract
 * Multipart/form-data input with "file" field
 */
router.post('/extract', upload.single('file'), ocrController.extractPdfText);

export default router;
