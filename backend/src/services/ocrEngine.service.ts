import { createWorker, Worker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

export interface PageOcrResult {
  pageIndex: number;
  text: string;
  confidence: number;
  wordsCount: number;
}

export interface FullOcrResult {
  pages: number;
  text: string;
  confidence: number;
  pageDetails: PageOcrResult[];
}

export class OcrEngineService {
  private worker: Worker | null = null;

  /**
   * Initializes offline Tesseract OCR worker
   */
  private async getWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = await createWorker('eng', 1, {
        langPath: path.resolve(__dirname, '../../'),
        cachePath: path.resolve(__dirname, '../../'),
        logger: (m) => {
          if (process.env.DEBUG_OCR === 'true') {
            console.log(`[Tesseract OCR Engine]`, m.status, m.progress ? `${Math.round(m.progress * 100)}%` : '');
          }
        },
      });
    }
    return this.worker;
  }

  /**
   * Runs OCR on a single preprocessed image buffer or file path
   */
  public async recognizePage(
    imageInput: Buffer | string,
    pageIndex: number
  ): Promise<PageOcrResult> {
    const worker = await this.getWorker();
    const { data } = await worker.recognize(imageInput);

    const text = (data.text || '').trim();
    const confidence = parseFloat((data.confidence || 0).toFixed(2));
    const wordsCount = (data as any).words ? (data as any).words.length : text.split(/\s+/).filter(Boolean).length;

    return {
      pageIndex,
      text,
      confidence,
      wordsCount,
    };
  }

  /**
   * Runs asynchronous multi-page batch OCR processing
   */
  public async recognizeBatch(
    imageInputs: Array<{ pageIndex: number; image: Buffer | string }>
  ): Promise<FullOcrResult> {
    const pageDetails: PageOcrResult[] = [];

    // Parallel or sequential execution depending on workload
    for (const item of imageInputs) {
      const pageRes = await this.recognizePage(item.image, item.pageIndex);
      pageDetails.push(pageRes);
    }

    // Sort page order
    pageDetails.sort((a, b) => a.pageIndex - b.pageIndex);

    // Combine extracted text across pages
    const fullText = pageDetails
      .map((p, idx) => `--- PAGE ${idx + 1} ---\n${p.text}`)
      .join('\n\n');

    // Calculate weighted average confidence score
    const totalConfidence = pageDetails.reduce((acc, p) => acc + p.confidence, 0);
    const averageConfidence =
      pageDetails.length > 0 ? parseFloat((totalConfidence / pageDetails.length).toFixed(2)) : 0;

    return {
      pages: pageDetails.length,
      text: fullText,
      confidence: averageConfidence,
      pageDetails,
    };
  }

  /**
   * Cleanup Tesseract worker resource
   */
  public async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const ocrEngineService = new OcrEngineService();
