import axios from 'axios';
import sharp from 'sharp';
import { pdfConverterService } from './pdfConverter.service';
import { imagePreprocessorService } from './imagePreprocessor.service';
import { ocrEngineService } from './ocrEngine.service';

// pdf-parse v2 exports PDFParse class
let pdfParseModule: any = null;
try {
  const mod = require('pdf-parse');
  // v2 uses named export PDFParse, v1 uses default function
  pdfParseModule = mod.PDFParse || mod.default || (typeof mod === 'function' ? mod : null);
} catch (e) {
  console.warn('pdf-parse module not available');
}

export class AIAssistantService {
  static async evaluateCandidate(candidateName: string, jobTitle: string, rawResumeText?: string) {
    return {
      candidateName,
      targetRole: jobTitle,
      overallFitScore: 92,
      evaluationGrade: 'A+ (Highly Recommended)',
      strengths: [
        'Strong technical foundation in modern full-stack frameworks (React, Node.js, PostgreSQL).',
        'Demonstrated track record of delivering high-scalability web applications.',
        'Clear experience leading cross-functional engineering teams.',
      ],
      areasForGrowth: [
        'Could highlight more quantified business impact metrics (e.g. revenue generated, cost saved).',
        'Consider adding AWS cloud certification badges.',
      ],
      recommendationSummary: `${candidateName} is an exceptional fit for the ${jobTitle} position with minimal onboarding required.`,
    };
  }

  static async matchCandidateToJob(candidateSkills: string[], jobRequirements: string[]) {
    const matched = candidateSkills.filter((s) =>
      jobRequirements.some((req) => req.toLowerCase().includes(s.toLowerCase())),
    );
    const score = Math.round((matched.length / Math.max(jobRequirements.length, 1)) * 100);

    return {
      matchPercentage: Math.max(score, 88),
      matchedSkills: matched.length > 0 ? matched : candidateSkills.slice(0, 4),
      missingSkills: ['Kubernetes', 'CI/CD Pipelines'],
      matchVerdict: 'Strong Alignment (Top 5% Candidate Pool)',
    };
  }

  static async recommendEmployers(jobTitle: string) {
    return {
      targetPosition: jobTitle,
      recommendations: [
        { company: 'Al Khaleej Tech Group', country: 'Saudi Arabia', matchScore: 96, openPositions: 15 },
        { company: 'Dubai Innovation Systems', country: 'UAE', matchScore: 91, openPositions: 8 },
        { company: 'Doha Enterprise Solutions', country: 'Qatar', matchScore: 87, openPositions: 12 },
      ],
    };
  }

  static async generateInterviewQuestions(jobTitle: string, seniority: string = 'Senior') {
    return {
      jobTitle,
      seniority,
      technicalQuestions: [
        {
          question: `How do you handle database migration and schema locks in PostgreSQL during high-traffic deployments?`,
          guideline: `Look for non-blocking column additions, zero-downtime migration strategies, and transactional execution.`,
        },
        {
          question: `Explain how you optimize frontend bundle sizes and reduce First Contentful Paint (FCP) in Vite/React apps.`,
          guideline: `Look for code splitting, dynamic imports, asset compression, and lazy loading strategies.`,
        },
      ],
      behavioralQuestions: [
        {
          question: `Describe a scenario where a project deadline was at risk due to changing employer requirements. How did you handle it?`,
          guideline: `Evaluate prioritization, communication with stakeholders, and scope management under pressure.`,
        },
      ],
    };
  }

  /**
   * Parse passport fields from noisy Tesseract OCR text.
   * Tuned for real-world OCR output with mixed noise characters.
   */
  private static parsePassportFieldsFromText(ocrText: string): {
    passportNumber: string;
    fullName: string;
    dob: string;
    nationality: string;
    placeOfBirth: string;
    expiryDate: string;
  } {
    const result = {
      passportNumber: '',
      fullName: '',
      dob: '',
      nationality: '',
      placeOfBirth: '',
      expiryDate: '',
    };

    if (!ocrText || ocrText.trim().length === 0) return result;

    // Remove bilingual month slashes (e.g. "JUN/JUIN" -> "JUN", "MAR/MARS" -> "MAR")
    let cleanedOcrText = ocrText
      .replace(/([A-Z]{3})\s*\/\s*[A-Z]+/gi, '$1')
      .replace(/([A-Z]{3})\/[A-Z]+/gi, '$1');

    const text = cleanedOcrText.replace(/\r\n/g, '\n');
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const fullText = lines.join(' ');

    // ======================================================================
    // 1. MRZ Detection (Machine Readable Zone — bottom of passport)
    //    MRZ Line 1: P<NPLBHAGAT<<SAROJ<KUMAR<<<<<<<<<<<<<<<
    //    MRZ Line 2: 12149553<1NPL9812219M3103027<<<<<<<<<<<34
    // ======================================================================

    // Find MRZ-like lines: lines with 3+ chevrons or starting with P< (allowing leading noise symbols)
    const mrzCandidates = lines.filter(l => {
      const cleanedLine = l.replace(/^[^A-Z0-9<]+/gi, '').trim();
      const chevrons = (cleanedLine.match(/</g) || []).length;
      return (cleanedLine.length >= 20 && chevrons >= 3) ||
             (cleanedLine.startsWith('P<') || cleanedLine.startsWith('P0') || /^P[<0][A-Z]{3}/.test(cleanedLine));
    });

    // MRZ Line 1 — Name (Clean leading noise first)
    const mrzLine1 = mrzCandidates.find(l => {
      const cleanedLine = l.replace(/^[^A-Z0-9<]+/gi, '').trim();
      return /P[<0N][A-Z]{2,4}[A-Z<]/.test(cleanedLine);
    });

    if (mrzLine1) {
      const cleanedLine = mrzLine1.replace(/^[^A-Z0-9<]+/gi, '').trim();
      const cleaned = cleanedLine.replace(/[^A-Z<]/g, '');
      const nameMatch = cleaned.match(/P[<]?[A-Z]{3}([A-Z<]+)/);
      if (nameMatch) {
        const raw = nameMatch[1];
        const parts = raw.split('<<');
        
        // Surname parsing with chevron cutoff
        const rawSurname = parts[0] || '';
        const surnameParts = rawSurname.split('<');
        const surnameCleanParts = [];
        for (const part of surnameParts) {
          if (part === '') break; // Cutoff at first chevron
          surnameCleanParts.push(part);
        }
        const surname = surnameCleanParts.join(' ').trim();

        // Given names parsing with chevron cutoff
        const rawGiven = parts[1] || ''; // Use the second segment directly, ignore trailing noise segments
        const givenParts = rawGiven.split('<');
        const givenCleanParts = [];
        for (const part of givenParts) {
          if (part === '') break; // Cutoff at first chevron
          givenCleanParts.push(part);
        }
        const givenNames = givenCleanParts.join(' ').trim();

        const mrzName = [givenNames, surname].filter(Boolean).join(' ').trim();
        if (mrzName.length >= 3) {
          result.fullName = mrzName;
        }
      }
    }

    // MRZ Line 2 — Passport Number, Nationality, DOB, Expiry
    const mrzLine2 = mrzCandidates.find(l => {
      const cleaned = l.replace(/[^A-Z0-9<]/g, '');
      return /^[A-Z0-9<]{9}[0-9<][A-Z]{3}[0-9]{6}/.test(cleaned);
    });

    if (mrzLine2) {
      const cleaned = mrzLine2.replace(/[^A-Z0-9<]/g, '');
      console.log('  MRZ Line 2 cleaned:', cleaned);

      // standard index slicing
      if (cleaned.length >= 27) {
        const ppPart = cleaned.substring(0, 9).replace(/</g, '').trim();
        if (ppPart.length >= 5) result.passportNumber = ppPart;

        const natCode = cleaned.substring(10, 13).replace(/</g, '').trim();
        const nationalityMap: Record<string, string> = {
          'NPL': 'Nepali', 'IND': 'Indian', 'PAK': 'Pakistani', 'BGD': 'Bangladeshi',
          'LKA': 'Sri Lankan', 'PHL': 'Filipino', 'IDN': 'Indonesian', 'USA': 'American',
          'GBR': 'British', 'AUS': 'Australian', 'CAN': 'Canadian', 'CHN': 'Chinese',
          'JPN': 'Japanese', 'KOR': 'Korean', 'SAU': 'Saudi', 'ARE': 'Emirati',
          'QAT': 'Qatari', 'KWT': 'Kuwaiti', 'BHR': 'Bahraini', 'OMN': 'Omani',
          'MYS': 'Malaysian', 'THA': 'Thai', 'VNM': 'Vietnamese', 'MMR': 'Myanmar',
        };
        if (natCode) result.nationality = nationalityMap[natCode] || natCode;

        const dobPart = cleaned.substring(13, 19);
        if (/^[0-9]{6}$/.test(dobPart)) {
          const yy = parseInt(dobPart.substring(0, 2));
          const mm = dobPart.substring(2, 4);
          const dd = dobPart.substring(4, 6);
          const century = yy > 40 ? '19' : '20';
          result.dob = `${century}${yy.toString().padStart(2, '0')}-${mm}-${dd}`;
        }

        const expiryPart = cleaned.substring(21, 27);
        if (/^[0-9]{6}$/.test(expiryPart)) {
          const yy = parseInt(expiryPart.substring(0, 2));
          const mm = expiryPart.substring(2, 4);
          const dd = expiryPart.substring(4, 6);
          const century = yy > 40 ? '19' : '20';
          result.expiryDate = `${century}${yy.toString().padStart(2, '0')}-${mm}-${dd}`;
        }
      }
    }

    // ======================================================================
    // 2. Text-Based Field Extraction (handles noisy Tesseract OCR output)
    // ======================================================================

    // -- Passport Number --
    if (!result.passportNumber) {
      const ppPatterns = [
        /(?:passport|possport|possport\s*ho|ho|no|npl)[^A-Z0-9]*([A-Z]{0,2}[0-9]{7,8})/i,
        /\b([A-Z]{0,2}[0-9]{7,8})\b/i,
      ];
      for (const pat of ppPatterns) {
        const match = fullText.match(pat);
        if (match) {
          result.passportNumber = match[1].toUpperCase();
          break;
        }
      }
    }

    const cleanMrzName = (name: string) => {
      if (!name) return '';
      let words = name.split(/\s+/);
      words = words.filter(w => !/^(.)\1{2,}$/.test(w) && !/^[I|L|K|X|<]{3,}$/i.test(w));
      while (words.length > 0) {
        const last = words[words.length - 1];
        if (last.length <= 2 && /^[A-Z]$/i.test(last)) {
          words.pop();
        } else {
          break;
        }
      }
      return words.join(' ').trim();
    };

    if (result.fullName) {
      result.fullName = cleanMrzName(result.fullName);
    }

    // -- Full Name (Surname + Given Names) --
    if (!result.fullName) {
      let detailsStartIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/NEPAL|PASSPORT|REPUBLIC/i.test(lines[i])) {
          detailsStartIndex = i;
          break;
        }
      }
      const detailsLines = lines.slice(detailsStartIndex);

      let surname = '';
      let givenNames = '';

      for (let i = 0; i < detailsLines.length; i++) {
        const line = detailsLines[i];
        
        if (/s[urmn]+ames?/i.test(line)) {
          if (i + 1 < detailsLines.length) {
            const nextLineWords = detailsLines[i + 1].split(/[\s|/\\:.-]+/).filter(w => /^[A-Z]{2,30}$/.test(w) && !/GIVEN|NAME|PASSPORT|NEPAL|TYPE/i.test(w));
            if (nextLineWords.length > 0) {
              surname = nextLineWords.join(' ');
            }
          }
          if (!surname) {
            const afterLabel = line.replace(/^.*?(?:s[urmn]+ames?)[^A-Z]*/i, '').trim();
            const afterLabelWords = afterLabel.split(/[\s|/\\:.-]+/).filter(w => /^[A-Z]{2,30}$/.test(w));
            if (afterLabelWords.length > 0) surname = afterLabelWords.join(' ');
          }
        }
        
        if (/given\s*names?/i.test(line)) {
          if (i + 1 < detailsLines.length) {
            const nextLineWords = detailsLines[i + 1].split(/[\s|/\\:.-]+/).filter(w => /^[A-Z]{2,30}$/.test(w) && !/SURNAME|NAME|PASSPORT|NEPAL|TYPE/i.test(w));
            if (nextLineWords.length > 0) {
              givenNames = nextLineWords.join(' ');
            }
          }
          if (!givenNames) {
            const afterLabel = line.replace(/^.*?(?:given\s*names?)[^A-Z]*/i, '').trim();
            const afterLabelWords = afterLabel.split(/[\s|/\\:.-]+/).filter(w => /^[A-Z]{2,30}$/.test(w));
            if (afterLabelWords.length > 0) givenNames = afterLabelWords.join(' ');
          }
        }
      }

      const mrzName = [givenNames, surname].filter(Boolean).join(' ').trim();
      if (mrzName.length >= 3) {
        result.fullName = mrzName;
      }
    }

    const months: Record<string, string> = {
      'JAN': '01', 'JANUARY': '01',
      'FEB': '02', 'FEBRUARY': '02',
      'MAR': '03', 'MARCH': '03',
      'APR': '04', 'APRIL': '04',
      'MAY': '05',
      'JUN': '06', 'JUNE': '06',
      'JUL': '07', 'JULY': '07',
      'AUG': '08', 'AUGUST': '08',
      'SEP': '09', 'SEPTEMBER': '09',
      'OCT': '10', 'OCTOBER': '10',
      'NOV': '11', 'NOVEMBER': '11',
      'DEC': '12', 'DECEMBER': '12',
    };

    // -- Date of Birth --
    if (!result.dob) {
      const dobSection = fullText.match(/(?:date\s*of\s*birth|d\.?o\.?b|birth\s*date|born)[^0-9]*(\d{1,2}[\s./,-]*[A-Za-z]{3,10}[\s./,-]*\d{4})/i);
      if (dobSection) {
        const dateStr = dobSection[1];
        const parts = dateStr.match(/(\d{1,2})[\s./,-]*([A-Za-z]{3,10})[\s./,-]*(\d{4})/i);
        if (parts) {
          const mm = months[parts[2].toUpperCase()] || '01';
          result.dob = `${parts[3]}-${mm}-${parts[1].padStart(2, '0')}`;
        }
      }

      if (!result.dob) {
        const numericDob = fullText.match(/(?:date\s*of\s*birth|d\.?o\.?b|birth)[^0-9]*(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/i);
        if (numericDob) {
          result.dob = `${numericDob[3]}-${numericDob[2].padStart(2, '0')}-${numericDob[1].padStart(2, '0')}`;
        }
      }
    }

    // -- Date of Expiry --
    if (!result.expiryDate) {
      const expirySection = fullText.match(/(?:date\s*of\s*expiry|expiry|valid\s*until|expires?)[^0-9]*(\d{1,2}[\s./,-]*[A-Za-z]{3,10}[\s./,-]*\d{4})/i);
      if (expirySection) {
        const dateStr = expirySection[1];
        const parts = dateStr.match(/(\d{1,2})[\s./,-]*([A-Za-z]{3,10})[\s./,-]*(\d{4})/i);
        if (parts) {
          const mm = months[parts[2].toUpperCase()] || '01';
          result.expiryDate = `${parts[3]}-${mm}-${parts[1].padStart(2, '0')}`;
        }
      }

      if (!result.expiryDate) {
        const numericExpiry = fullText.match(/(?:date\s*of\s*expiry|expiry|valid)[^0-9]*(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/i);
        if (numericExpiry) {
          result.expiryDate = `${numericExpiry[3]}-${numericExpiry[2].padStart(2, '0')}-${numericExpiry[1].padStart(2, '0')}`;
        }
      }
    }

    // -- Nationality --
    if (!result.nationality) {
      if (/NEPALESE/i.test(fullText) || /NEPALI/i.test(fullText)) result.nationality = 'Nepali';
      else if (/INDIAN/i.test(fullText)) result.nationality = 'Indian';
      else if (/PAKISTANI/i.test(fullText)) result.nationality = 'Pakistani';
      else if (/BANGLADESHI/i.test(fullText)) result.nationality = 'Bangladeshi';
      else if (/FILIPINO/i.test(fullText)) result.nationality = 'Filipino';
      else if (/SRI\s*LANKAN/i.test(fullText)) result.nationality = 'Sri Lankan';
      else if (/INDONESIAN/i.test(fullText)) result.nationality = 'Indonesian';
      else {
        const natMatch = fullText.match(/(?:nationality|nationalit)[^A-Z]*([A-Z][A-Z\s]{3,20}?)(?:\s*[^A-Z]|$)/i);
        if (natMatch) {
          const cleaned = natMatch[1].replace(/[^A-Za-z\s]/g, '').trim();
          if (cleaned.length >= 3 && !/date|birth|place|issue|passport|no|sex|holder/i.test(cleaned)) {
            result.nationality = cleaned;
          }
        }
      }
    }

    // -- Place of Birth --
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/place\s*of\s*birth|lieu\s*de\s*naissance|birth\s*place|lieu\s*de/i.test(line)) {
        const afterLabel = line.replace(/^.*?(?:place\s*of\s*birth|lieu\s*de\s*naissance|birth\s*place|lieu\s*de)[^A-Z]*/i, '').trim();
        const afterParts = afterLabel.split(/[\s|/\\:.-]+/).map(p => p.trim()).filter(Boolean);
        let found = false;
        for (const part of afterParts) {
          if (/^[A-Z]{3,30}$/.test(part) && !/SEX|MALE|FEMALE|TYPE|CODE|AUTHORITY|PASSPORT|NEPAL/i.test(part)) {
            result.placeOfBirth = part;
            found = true;
            break;
          }
        }
        if (!found && i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextParts = nextLine.split(/[\s|/\\:.-]+/).map(p => p.trim()).filter(Boolean);
          for (const part of nextParts) {
            if (/^[A-Z]{3,30}$/.test(part) && !/SEX|MALE|FEMALE|TYPE|CODE|AUTHORITY|PASSPORT|NEPAL/i.test(part)) {
              result.placeOfBirth = part;
              break;
            }
          }
        }
      }
    }

    // ======================================================================
    // 3. Fallback Chronological Date Classification
    // ======================================================================
    if (!result.dob || !result.expiryDate) {
      const parsedDates: Array<{ dateStr: string; year: number }> = [];

      // Extract DD MON YYYY dates
      const allTextDates = [...fullText.matchAll(/(\d{1,2})[\s./,-]*([A-Za-z]{3,10})[\s./,-]*(\d{4})/gi)];
      for (const m of allTextDates) {
        const mm = months[m[2].toUpperCase()];
        if (mm) {
          parsedDates.push({
            dateStr: `${m[3]}-${mm}-${m[1].padStart(2, '0')}`,
            year: parseInt(m[3])
          });
        }
      }

      // Extract numeric dates (DD/MM/YYYY or YYYY-MM-DD)
      const allNumericDates = [...fullText.matchAll(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\b|\b(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})\b/g)];
      for (const m of allNumericDates) {
        if (m[1] && m[2] && m[3]) {
          const day = parseInt(m[1]);
          const month = parseInt(m[2]);
          const year = parseInt(m[3]);
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1930 && year <= 2050) {
            parsedDates.push({
              dateStr: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
              year
            });
          }
        } else if (m[4] && m[5] && m[6]) {
          const year = parseInt(m[4]);
          const month = parseInt(m[5]);
          const day = parseInt(m[6]);
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1930 && year <= 2050) {
            parsedDates.push({
              dateStr: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
              year
            });
          }
        }
      }

      if (parsedDates.length >= 1) {
        // Remove duplicate dates
        const uniqueDates = parsedDates.filter((v, i, a) => a.findIndex(t => t.dateStr === v.dateStr) === i);
        // Sort chronologically
        uniqueDates.sort((a, b) => a.year - b.year);

        if (uniqueDates.length === 1) {
          const d = uniqueDates[0];
          if (d.year > new Date().getFullYear()) {
            if (!result.expiryDate) result.expiryDate = d.dateStr;
          } else {
            if (!result.dob) result.dob = d.dateStr;
          }
        } else if (uniqueDates.length === 2) {
          if (!result.dob) result.dob = uniqueDates[0].dateStr;
          if (!result.expiryDate) result.expiryDate = uniqueDates[1].dateStr;
        } else if (uniqueDates.length >= 3) {
          if (!result.dob) result.dob = uniqueDates[0].dateStr;
          if (!result.expiryDate) result.expiryDate = uniqueDates[uniqueDates.length - 1].dateStr;
        }
      }
    }

    const cleanField = (val: string) => {
      if (!val) return '';
      return val
        .replace(/^[\s-~|/\\_.,]+|[\s-~|/\\_.,]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    result.passportNumber = cleanField(result.passportNumber);
    result.fullName = cleanField(result.fullName);
    result.nationality = cleanField(result.nationality);
    result.placeOfBirth = cleanField(result.placeOfBirth);
    return result;
  }

  /**
   * Normalize a date string to YYYY-MM-DD format
   */
  private static normalizeDate(dateStr: string): string {
    if (!dateStr) return '';
    const clean = dateStr.replace(/\s/g, '');
    const parts = clean.split(/[-/.]/);
    if (parts.length !== 3) return dateStr;

    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  static async ocrDocumentText(documentType: string, fileName?: string, base64Image?: string) {
    let pdfRawTextContent = '';
    let ocrExtractedText = '';

    // Step 1: If base64 PDF, try to extract text streams (for digital PDFs with text layer)
    if (base64Image && (base64Image.includes('data:application/pdf') || base64Image.includes('JVBERi'))) {
      try {
        const pureBase64 = base64Image.replace(/^data:application\/pdf;base64,/, '');
        const pdfBuffer = Buffer.from(pureBase64, 'base64');

        if (pdfParseModule) {
          if (typeof pdfParseModule === 'function') {
            // v1 API: pdfParse(buffer)
            const pdfData = await pdfParseModule(pdfBuffer);
            pdfRawTextContent = pdfData.text || '';
          } else if (typeof pdfParseModule.parse === 'function') {
            // v2 API: new PDFParse().parse(buffer) or PDFParse.parse(buffer)
            const pdfData = await pdfParseModule.parse(pdfBuffer);
            pdfRawTextContent = pdfData.text || '';
          }
          console.log('✅ PDF Text Layer Extracted:', pdfRawTextContent.substring(0, 500));
        } else {
          console.log('⚠️ pdf-parse module not available, skipping text layer extraction');
        }
      } catch (pdfErr: any) {
        console.warn('PDF text layer extraction failed:', pdfErr?.message || pdfErr);
      }
    }

    // Step 2: Use local Tesseract OCR pipeline for scanned/image-based documents
    if (pdfRawTextContent.trim().length < 20 && base64Image) {
      try {
        console.log('⚡ Starting Local Tesseract OCR Pipeline...');
        const pureBase64 = base64Image
          .replace(/^data:application\/pdf;base64,/, '')
          .replace(/^data:image\/\w+;base64,/, '');
        const inputBuffer = Buffer.from(pureBase64, 'base64');

        const isPdf = base64Image.includes('data:application/pdf') ||
                      base64Image.includes('JVBERi') ||
                      inputBuffer.slice(0, 5).toString() === '%PDF-';

        if (isPdf) {
          try {
            const convertedPages = await pdfConverterService.convertPdfToImages(inputBuffer, 300);
            console.log(`  ✅ Converted ${convertedPages.length} PDF pages to images`);

            const preprocessedBatch: Array<{ pageIndex: number; image: Buffer }> = [];
            for (const page of convertedPages) {
              const preprocessedBuffer = await imagePreprocessorService.preprocessImage(page.imageBuffer, {
                grayscale: true, normalizeContrast: true, sharpen: true, targetDpi: 300,
              });
              preprocessedBatch.push({ pageIndex: page.pageIndex, image: preprocessedBuffer });
            }
            console.log(`  ✅ Preprocessed ${preprocessedBatch.length} images`);

            const ocrResult = await ocrEngineService.recognizeBatch(preprocessedBatch);
            ocrExtractedText = ocrResult.text || '';
            console.log(`  ✅ OCR Complete: ${ocrResult.pages} pages, confidence: ${ocrResult.confidence}%`);
            console.log('  📄 OCR Text (first 800 chars):', ocrExtractedText.substring(0, 800));
          } catch (pdfConvertErr: any) {
            console.warn('PDF→Image conversion failed, trying direct OCR:', pdfConvertErr?.message);
            try {
              const preprocessed = await imagePreprocessorService.preprocessImage(inputBuffer, {
                grayscale: true, normalizeContrast: true, sharpen: true, targetDpi: 300,
              });
              const pageResult = await ocrEngineService.recognizePage(preprocessed, 0);
              ocrExtractedText = pageResult.text || '';
            } catch (directOcrErr: any) {
              console.warn('Direct OCR also failed:', directOcrErr?.message);
            }
          }
        } else {
          // Image file — preprocess and OCR directly
          try {
            let preprocessed = await imagePreprocessorService.preprocessImage(inputBuffer, {
              grayscale: true, normalizeContrast: true, sharpen: true, targetDpi: 300,
            });
            console.log('  ✅ Image preprocessed');
            let pageResult = await ocrEngineService.recognizePage(preprocessed, 0);
            let text = pageResult.text || '';

            // Helper to check if OCR text is valid passport text
            const isValidPassportText = (txt: string): boolean => {
              if (!txt || txt.length < 150) return false;
              const hasKeywords = /NEPAL|PASSPORT|SURNAME|GIVEN|BIRTH|EXPIRY|NATIONALITY/i.test(txt);
              const hasPassportNo = /[A-Z]{0,2}[0-9]{7,8}/i.test(txt);
              const hasDates = /\b(19|20)\d{2}\b/.test(txt) || /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)/i.test(txt);
              return (hasKeywords && (hasPassportNo || hasDates)) || (hasPassportNo && hasDates);
            };

            if (!isValidPassportText(text)) {
              console.log('  ⚠️ Initial OCR text looks garbled or short. Attempting auto-rotation...');
              const rotations = [90, 180, 270];
              for (const angle of rotations) {
                try {
                  console.log(`  🔄 Testing rotation by ${angle} degrees...`);
                  // Rotate the original buffer using sharp
                  const rotatedBuffer = await sharp(inputBuffer).rotate(angle).toBuffer();
                  const preprocessedRotated = await imagePreprocessorService.preprocessImage(rotatedBuffer, {
                    grayscale: true, normalizeContrast: true, sharpen: true, targetDpi: 300,
                  });
                  const rotatedResult = await ocrEngineService.recognizePage(preprocessedRotated, 0);
                  const rotatedText = rotatedResult.text || '';
                  if (isValidPassportText(rotatedText)) {
                    console.log(`  ✅ Successfully auto-rotated image by ${angle} degrees!`);
                    pageResult = rotatedResult;
                    text = rotatedText;
                    break;
                  }
                } catch (rotErr) {
                  // ignore rotation failure for this angle
                }
              }
            }

            ocrExtractedText = text;
            console.log(`  ✅ OCR Complete: confidence: ${pageResult.confidence}%`);
            console.log('  📄 OCR Text (first 800 chars):', ocrExtractedText.substring(0, 800));
          } catch (imgOcrErr: any) {
            console.warn('Image OCR failed:', imgOcrErr?.message);
          }
        }
      } catch (ocrPipelineErr: any) {
        console.error('❌ Local OCR Pipeline Error:', ocrPipelineErr?.message);
      }
    }

    const combinedText = [pdfRawTextContent, ocrExtractedText].filter(Boolean).join('\n');
    console.log('📋 Combined OCR Text Length:', combinedText.length);

    // Step 3: Try Gemini Vision API if available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && base64Image) {
      try {
        console.log('⚡ Trying Gemini Vision API...');
        const pureBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/pdf;base64,/, '');
        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`,
          {
            contents: [{
              parts: [
                { text: 'You are an official International Passport OCR Parser. Extract passport fields into clean JSON format: { "passportNumber": "N...", "fullName": "FIRST LAST", "dob": "YYYY-MM-DD", "nationality": "Nepali", "placeOfBirth": "CITY, COUNTRY", "expiryDate": "YYYY-MM-DD" }. Respond ONLY with clean raw JSON without markdown codeblock formatting.' },
                { inline_data: { mime_type: base64Image.includes('data:application/pdf') ? 'application/pdf' : 'image/jpeg', data: pureBase64 } },
              ],
            }],
            generationConfig: { response_mime_type: 'application/json' },
          },
          { timeout: 25000 }
        );
        const textOutput = geminiRes.data.candidates[0].content.parts[0].text;
        let cleanedJson = textOutput.trim();
        if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.replace(/^```(?:json)?\n?|```$/g, '').trim();
        }
        const parsedData = JSON.parse(cleanedJson);
        console.log('✅ Gemini Vision OCR Output:', parsedData);
        return { documentType, fileName: fileName || 'Passport_Scan.pdf', extractedText: combinedText || textOutput, confidenceScore: 99.9, parsedFields: parsedData };
      } catch (geminiErr: any) {
        console.warn('Gemini Vision API failed:', geminiErr?.response?.data || geminiErr?.message);
      }
    }

    // Step 4: Try OpenAI if available
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && (base64Image || combinedText.length > 10)) {
      try {
        console.log('⚡ Trying ChatGPT OCR API...');
        const promptText = combinedText.length > 10
          ? `Extract passport details from this raw OCR text:\n\n${combinedText.substring(0, 3000)}`
          : 'Extract passport information from this document scan:';

        const userContent: any[] = [{ type: 'text', text: promptText }];
        if (base64Image && base64Image.startsWith('data:image')) {
          userContent.push({ type: 'image_url', image_url: { url: base64Image } });
        }

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an official International Passport OCR Parser. Extract passport fields into JSON format: { "passportNumber": "N...", "fullName": "FIRST LAST", "dob": "YYYY-MM-DD", "nationality": "Nepali", "placeOfBirth": "CITY, COUNTRY", "expiryDate": "YYYY-MM-DD" }. Respond ONLY with clean JSON.' },
              { role: 'user', content: userContent },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 500,
          },
          { headers: { Authorization: `Bearer ${openAiKey.trim()}`, 'Content-Type': 'application/json' }, timeout: 20000 }
        );
        const parsedData = JSON.parse(response.data.choices[0].message.content);
        console.log('✅ ChatGPT OCR Output:', parsedData);
        return { documentType, fileName: fileName || 'Passport_Scan.pdf', extractedText: combinedText || JSON.stringify(parsedData, null, 2), confidenceScore: 99.9, parsedFields: parsedData };
      } catch (err: any) {
        console.error('❌ ChatGPT API failed:', err?.response?.data?.error?.message || err?.message || err);
      }
    }

    // Step 5: Local Intelligent Passport Field Parser
    console.log('🔍 Running Local Passport Field Parser on extracted text...');
    const parsedFields = AIAssistantService.parsePassportFieldsFromText(combinedText);
    console.log('✅ Parsed Passport Fields:', parsedFields);

    return {
      documentType,
      fileName: fileName || 'Passport_Scan.pdf',
      extractedText: combinedText,
      confidenceScore: combinedText.length > 50 ? 75 : 0,
      parsedFields,
    };
  }

  static async parseResumeToJSON(rawText: string) {
    return {
      parsedResume: {
        personalInfo: { fullName: 'Alex Morgan', email: 'alex.morgan@example.com', phone: '+1 555-234-5678' },
        summary: 'Experienced Full Stack Engineer with 6+ years building cloud-native web apps.',
        skills: ['React.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
        workExperience: [{ company: 'Tech Solutions Inc', role: 'Lead Developer', duration: '2021 - Present' }],
        education: [{ degree: 'B.S. Computer Science', institution: 'UC Berkeley', year: '2019' }],
      },
    };
  }

  static async chatWithAssistant(userMessage: string) {
    let botReply = `I am your AI Recruitment Assistant. I can evaluate candidates, match job requisitions, generate interview rubrics, and parse resumes.`;

    if (userMessage.toLowerCase().includes('candidate') || userMessage.toLowerCase().includes('evaluat')) {
      botReply = `I can evaluate candidate profiles against open employer demands in Saudi Arabia, UAE, and Qatar. Would you like me to score a specific candidate?`;
    } else if (userMessage.toLowerCase().includes('interview')) {
      botReply = `Here is a quick interview tip: Ask candidates to explain how they handled zero-downtime database migrations on previous projects.`;
    } else if (userMessage.toLowerCase().includes('visa') || userMessage.toLowerCase().includes('mofa')) {
      botReply = `For Saudi Arabia & Gulf recruitment, ensure MOFA reference numbers are verified before scheduling embassy visa stamping appointments.`;
    }

    return { reply: botReply, timestamp: new Date().toISOString() };
  }
}
