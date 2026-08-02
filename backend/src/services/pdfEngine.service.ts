import puppeteer from 'puppeteer';

export interface PDFOptions {
  watermarkText?: string;
  showQrCode?: boolean;
  companyLogoUrl?: string;
  templateName?: string;
  headerTitle?: string;
  footerText?: string;
}

export class PDFEngineService {
  /**
   * Compiles HTML string into a High-Resolution A4 PDF Buffer using Puppeteer
   */
  static async generatePDFFromHTML(htmlContent: string, options: PDFOptions = {}): Promise<Buffer> {
    const watermarkHtml = options.watermarkText
      ? `<div style="
          position: fixed;
          top: 35%;
          left: 10%;
          width: 80%;
          text-align: center;
          font-size: 52px;
          font-weight: 900;
          color: rgba(220, 226, 235, 0.35);
          transform: rotate(-35deg);
          z-index: 9999;
          pointer-events: none;
          text-transform: uppercase;
          letter-spacing: 6px;
          font-family: sans-serif;
        ">${options.watermarkText}</div>`
      : '';

    const logoHtml = options.companyLogoUrl
      ? `<img src="${options.companyLogoUrl}" alt="Logo" style="height: 35px; width: auto; margin-right: 15px;" />`
      : '';

    const qrCodeHtml = options.showQrCode === true
      ? `<div style="
          position: absolute;
          top: 20px;
          right: 20px;
          text-align: center;
        ">
          <svg width="45" height="45" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#1E293B" rx="10"/>
            <rect x="15" y="15" width="30" height="30" fill="#FFFFFF"/>
            <rect x="22" y="22" width="16" height="16" fill="#1E293B"/>
            <rect x="55" y="15" width="30" height="30" fill="#FFFFFF"/>
            <rect x="62" y="22" width="16" height="16" fill="#1E293B"/>
            <rect x="15" y="55" width="30" height="30" fill="#FFFFFF"/>
            <rect x="22" y="62" width="16" height="16" fill="#1E293B"/>
            <rect x="55" y="55" width="15" height="15" fill="#FFFFFF"/>
            <rect x="75" y="75" width="10" height="10" fill="#FFFFFF"/>
          </svg>
          <div style="font-size: 7px; font-weight: bold; color: #475569; margin-top: 2px;">VERIFIED</div>
        </div>`
      : '';

    const headerBannerHtml = (options.headerTitle || options.companyLogoUrl)
      ? `<div class="header-banner">
          ${logoHtml}
          <div>
            <div style="font-size: 10px; font-weight: 800; color: #2563EB; letter-spacing: 1px; text-transform: uppercase;">
              ${options.headerTitle}
            </div>
            <div style="font-size: 8px; color: #64748B;">Official Curriculum Vitae • High-Resolution A4 Export</div>
          </div>
        </div>`
      : '';

    const fullDocHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <!-- Load Tailwind Play CDN to compile dynamic classes (flex, w-48, text-[14pt] etc.) on the fly -->
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            corePlugins: {
              preflight: false, // Keep default browser margins/paddings stable for document print
            }
          }
        </script>
        <style>
          @page {
            size: A4;
            margin: 12mm 12mm 15mm 12mm;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #0F172A;
            background-color: #FFFFFF;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Native layout fallbacks in case CDN is offline */
          .flex {
            display: flex !important;
            flex-direction: row !important;
          }
          .flex-col {
            display: flex !important;
            flex-direction: column !important;
          }
          .flex-1 {
            flex: 1 1 0% !important;
          }
          .w-48 {
            width: 12rem !important;
            min-width: 12rem !important;
          }
          .w-full {
            width: 100% !important;
          }
          .text-center {
            text-align: center !important;
          }
          .text-justify {
            text-align: justify !important;
          }
          .text-left {
            text-align: left !important;
          }
          .border-b {
            border-bottom: 1px solid #9ca3af !important;
          }
          .border-gray-400 {
            border-color: #9ca3af !important;
          }
          .pb-3 {
            padding-bottom: 12px !important;
          }
          .pb-5 {
            padding-bottom: 20px !important;
          }
          .mb-5 {
            margin-bottom: 20px !important;
          }
          .mt-1 {
            margin-top: 4px !important;
          }
          .font-bold {
            font-weight: 700 !important;
          }
          .font-normal {
            font-weight: 400 !important;
          }
          .font-extrabold {
            font-weight: 800 !important;
          }
          .uppercase {
            text-transform: uppercase !important;
          }
          .tracking-wide {
            letter-spacing: 0.025em !important;
          }
          .tracking-wider {
            letter-spacing: 0.05em !important;
          }
          .text-\\[14pt\\] {
            font-size: 14pt !important;
          }
          .text-\\[20pt\\] {
            font-size: 20pt !important;
          }
          .text-\\[12\\.5pt\\] {
            font-size: 12.5pt !important;
          }
          .text-\\[11\\.5pt\\] {
            font-size: 11.5pt !important;
          }
          .text-\\[11pt\\] {
            font-size: 11pt !important;
          }
          .text-\\[10\\.5pt\\] {
            font-size: 10.5pt !important;
          }
          .space-y-1\\.5 > * + * {
            margin-top: 6px !important;
          }
          .space-y-1 > * + * {
            margin-top: 4px !important;
          }
          .space-y-3 > * + * {
            margin-top: 12px !important;
          }
          .space-y-4 > * + * {
            margin-top: 16px !important;
          }
          .space-y-5 > * + * {
            margin-top: 20px !important;
          }

          .page-break-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .page-break-after {
            page-break-after: always;
            break-after: page;
          }
          .header-banner {
            display: flex;
            align-items: center;
            border-bottom: 2px solid #2563EB;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        ${watermarkHtml}
        ${qrCodeHtml}
        ${headerBannerHtml}
        ${htmlContent}
      </body>
      </html>
    `;

    // Launch headless Chromium browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    });

    try {
      const page = await browser.newPage();

      await page.setContent(fullDocHtml, { waitUntil: 'networkidle0' as any });

      // Header and Footer HTML for Puppeteer (removed 'AI Recruitment Candidate Dossier' header text)
      const headerTemplate = `<div></div>`;

      const footerTemplate = `<div style="font-size: 8px; color: #94A3B8; font-family: sans-serif; width: 100%; display: flex; justify-content: space-between; padding: 0 20px;">
        <span>${options.footerText || 'Confidential & Proprietary'}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`;

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate,
        footerTemplate,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '12mm',
          right: '12mm',
        },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
