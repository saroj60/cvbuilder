import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pdfConverterService } from '../services/pdfConverter.service';
import { imagePreprocessorService } from '../services/imagePreprocessor.service';
import { ocrEngineService } from '../services/ocrEngine.service';

export class OcrController {
  /**
   * POST /api/ocr/extract
   * Multipart PDF file upload handler
   */
  public extractPdfText = async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();
    const tempFiles: string[] = [];
    const tempDir = path.join(os.tmpdir(), `ocr_job_${Date.now()}_${Math.random().toString(36).substring(7)}`);

    try {
      // 1. Validate File Upload Presence
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'INVALID_FILE',
          message: 'No PDF file attached to request. Please upload a file with field name "file".',
        });
        return;
      }

      const file = req.file;

      // 2. Validate File Type
      const isPdfMime = file.mimetype === 'application/pdf';
      const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

      if (!isPdfMime && !isPdfExt) {
        res.status(400).json({
          success: false,
          error: 'INVALID_FILE_TYPE',
          message: 'Unsupported format. Only image/scanned PDF files are supported.',
        });
        return;
      }

      // 3. Validate File Size (Maximum 20 MB)
      const MAX_SIZE_BYTES = 20 * 1024 * 1024;
      if (file.size > MAX_SIZE_BYTES) {
        res.status(400).json({
          success: false,
          error: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum allowed threshold of 20MB. Uploaded file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB.`,
        });
        return;
      }

      // Read PDF Buffer (Memory storage or disk read)
      let pdfBuffer: Buffer;
      if (file.buffer) {
        pdfBuffer = file.buffer;
      } else if (file.path) {
        pdfBuffer = await fs.promises.readFile(file.path);
        tempFiles.push(file.path);
      } else {
        res.status(400).json({
          success: false,
          error: 'CORRUPTED_PDF',
          message: 'Unable to read PDF byte buffer.',
        });
        return;
      }

      if (pdfBuffer.length === 0) {
        res.status(400).json({
          success: false,
          error: 'EMPTY_PDF',
          message: 'The uploaded PDF file is empty (0 bytes).',
        });
        return;
      }

      // 4. Step A: Convert PDF Pages into 300 DPI PNG Image Buffers
      console.log(`[OCR Pipeline] Converting PDF (${file.originalname}) into high-resolution 300 DPI images...`);
      let convertedPages;
      try {
        convertedPages = await pdfConverterService.convertPdfToImages(pdfBuffer, 300);
      } catch (convErr: any) {
        console.error(`[OCR Pipeline Error] PDF conversion failed:`, convErr);
        res.status(422).json({
          success: false,
          error: 'IMAGE_CONVERSION_FAILURE',
          message: `Failed to convert PDF pages into images: ${convErr.message || 'Corrupted PDF file format'}`,
        });
        return;
      }

      if (!convertedPages || convertedPages.length === 0) {
        res.status(400).json({
          success: false,
          error: 'EMPTY_PDF',
          message: 'No readable pages were found in the uploaded PDF file.',
        });
        return;
      }

      // 5. Step B: Preprocess each image (Auto-rotate, Grayscale, Denoise, Sharpen, Contrast)
      console.log(`[OCR Pipeline] Preprocessing ${convertedPages.length} converted page images...`);
      const preprocessedBatch: Array<{ pageIndex: number; image: Buffer }> = [];

      for (const page of convertedPages) {
        const preprocessedBuffer = await imagePreprocessorService.preprocessImage(page.imageBuffer, {
          grayscale: true,
          normalizeContrast: true,
          sharpen: true,
          targetDpi: 300,
        });
        preprocessedBatch.push({
          pageIndex: page.pageIndex,
          image: preprocessedBuffer,
        });
      }

      // 6. Step C: Run Offline OCR Engine on Pages
      console.log(`[OCR Pipeline] Executing Offline OCR recognition on ${preprocessedBatch.length} page(s)...`);
      let ocrResult;
      try {
        ocrResult = await ocrEngineService.recognizeBatch(preprocessedBatch);
      } catch (ocrErr: any) {
        console.error(`[OCR Pipeline Error] OCR engine execution failed:`, ocrErr);
        res.status(500).json({
          success: false,
          error: 'OCR_FAILURE',
          message: `OCR recognition engine encountered an error: ${ocrErr.message || 'Failed to process page image'}`,
        });
        return;
      }

      const processingTimeMs = Date.now() - startTime;
      console.log(`[OCR Pipeline Success] Processed ${ocrResult.pages} page(s) in ${processingTimeMs}ms with average confidence ${ocrResult.confidence}%`);

      // 7. Return Clean Structured API Response
      res.status(200).json({
        success: true,
        pages: ocrResult.pages,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        processingTimeMs,
      });
    } catch (err: any) {
      console.error(`[OCR Controller Unexpected Exception]`, err);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected error occurred during PDF OCR extraction.',
      });
    } finally {
      // 8. Cleanup all temporary disk files
      for (const filePath of tempFiles) {
        try {
          if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
          }
        } catch (cleanupErr) {
          console.warn(`[OCR Cleanup Warning] Failed to delete temp file ${filePath}:`, cleanupErr);
        }
      }
      if (fs.existsSync(tempDir)) {
        try {
          await fs.promises.rm(tempDir, { recursive: true, force: true });
        } catch (e) {
          // ignore
        }
      }
    }
  };
}

export const ocrController = new OcrController();
