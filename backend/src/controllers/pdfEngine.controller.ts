import { Request, Response, NextFunction } from 'express';
import { PDFEngineService } from '../services/pdfEngine.service';
import { sendError } from '../utils/response';

export class PDFEngineController {
  static async generatePDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { htmlContent, watermarkText, showQrCode, companyLogoUrl, headerTitle, footerText, filename } = req.body;

      if (!htmlContent) {
        return sendError(res, 400, 'htmlContent is required to generate PDF');
      }
      
      console.log('Received HTML content length:', htmlContent.length);

      const pdfBuffer = await PDFEngineService.generatePDFFromHTML(htmlContent, {
        watermarkText: watermarkText ?? '',
        showQrCode: showQrCode === true,
        companyLogoUrl,
        headerTitle: headerTitle ?? '',
        footerText,
      });

      const downloadName = filename ? `${filename}.pdf` : `Resume_Export_${Date.now()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      return res.end(pdfBuffer);
    } catch (error: any) {
      return sendError(res, 500, error.message);
    }
  }
}
