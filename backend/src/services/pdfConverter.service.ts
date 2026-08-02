import fs from 'fs';
import path from 'path';

// Node environment canvas rendering setup for pdfjs-dist lazy-loaded inside class methods

export interface ConvertedPage {
  pageIndex: number;
  imageBuffer: Buffer;
}

export class PdfConverterService {
  /**
   * Converts a multi-page PDF buffer/file into high-resolution PNG image buffers at specified DPI (default 300)
   */
  public async convertPdfToImages(
    pdfBuffer: Buffer,
    dpi: number = 300
  ): Promise<ConvertedPage[]> {
    let NodeCanvas: any;
    let pdfjsLib: any;
    try {
      NodeCanvas = require('canvas');
    } catch (err: any) {
      throw new Error(`CANVAS_LOAD_FAILED: Native canvas engine is not supported on this hosting environment. Detail: ${err.message}`);
    }
 
    try {
      pdfjsLib = await import('pdfjs-dist');
    } catch (err: any) {
      throw new Error(`PDFJS_LOAD_FAILED: Failed to load PDF engine. Detail: ${err.message}`);
    }
 
    const scale = dpi / 72; // Standard PDF 72 DPI to target DPI scale factor
    const uint8Array = new Uint8Array(pdfBuffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      verbosity: 0,
      disableFontFace: false,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    if (numPages === 0) {
      throw new Error('EMPTY_PDF: The uploaded PDF document contains 0 pages.');
    }

    const convertedPages: ConvertedPage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = NodeCanvas.createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext as any).promise;

      const imageBuffer = canvas.toBuffer('image/png');
      convertedPages.push({
        pageIndex: pageNum - 1,
        imageBuffer,
      });
    }

    return convertedPages;
  }
}

export const pdfConverterService = new PdfConverterService();
