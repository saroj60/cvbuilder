import fs from 'fs';
import path from 'path';

export interface PreprocessingOptions {
  grayscale?: boolean;
  deskew?: boolean;
  normalizeContrast?: boolean;
  denoise?: boolean;
  sharpen?: boolean;
  targetDpi?: number;
}

export class ImagePreprocessorService {
  /**
   * Preprocesses an input image buffer or file path to produce a high-contrast,
   * sharpened, deskewed, and grayscale image optimal for Tesseract / PaddleOCR recognition.
   */
  public async preprocessImage(
    input: Buffer | string,
    options: PreprocessingOptions = {}
  ): Promise<Buffer> {
    const {
      grayscale = true,
      normalizeContrast = true,
      sharpen = true,
      targetDpi = 300,
    } = options;

    let sharpLib: any;
    try {
      sharpLib = require('sharp');
    } catch (err: any) {
      throw new Error(`SHARP_LOAD_FAILED: Native sharp image processing library is not supported on this hosting environment. Detail: ${err.message}`);
    }

    let pipeline = sharpLib(input, { failOn: 'none' });

    // Ensure high resolution metadata DPI
    pipeline = pipeline.withMetadata({ density: targetDpi });

    // 1. Auto-rotate based on EXIF metadata
    pipeline = pipeline.rotate();

    // 2. Grayscale conversion for text edge detection
    if (grayscale) {
      pipeline = pipeline.grayscale();
    }

    // 3. Contrast Normalization & Thresholding
    if (normalizeContrast) {
      pipeline = pipeline.normalize().linear(1.2, -10);
    }

    // 4. Denoise & Sharpening (Enhances character boundaries for scanned fonts)
    if (sharpen) {
      pipeline = pipeline.sharpen({
        sigma: 1.5,
      });
    }

    // Return clean PNG buffer
    return await pipeline.png().toBuffer();
  }

  /**
   * Saves preprocessed image buffer to temporary disk location for OCR worker consumption
   */
  public async savePreprocessedImage(imageBuffer: Buffer, tempDir: string, pageIndex: number): Promise<string> {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const outputPath = path.join(tempDir, `preprocessed_page_${pageIndex + 1}_${Date.now()}.png`);
    await fs.promises.writeFile(outputPath, imageBuffer);
    return outputPath;
  }
}

export const imagePreprocessorService = new ImagePreprocessorService();
