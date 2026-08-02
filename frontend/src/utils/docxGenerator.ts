import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun
} from "docx";
import { formatHeight, formatWeight } from "./formatters";

let docFont = "Cambria";

// =========================================================================
// DATE & AGE HELPER FUNCTIONS (MATCHING ON-SCREEN PREVIEW LOGIC)
// =========================================================================

function calculateAge(dobString: string): string {
  if (!dobString) return 'N/A';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 'N/A';
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  return `${age} Years`;
}

function calculatePassportRemaining(expiryString: string): string {
  if (!expiryString) return 'N/A';
  const expiry = new Date(expiryString);
  const now = new Date();

  if (isNaN(expiry.getTime())) return 'N/A';
  if (expiry < now) return 'Expired';

  let years = expiry.getFullYear() - now.getFullYear();
  let months = expiry.getMonth() - now.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  let text = '';
  if (years === 0) {
    text = `${months} Month${months !== 1 ? 's' : ''}`;
  } else if (months === 0) {
    text = `${years} Year${years !== 1 ? 's' : ''}`;
  } else {
    text = `${years} Year${years !== 1 ? 's' : ''} ${months} Month${months !== 1 ? 's' : ''}`;
  }
  return `Remaining To Expire: ${text}`;
}

function getPositionDefaultDuties(jobTitle: string): string[] {
  const title = (jobTitle || '').trim().toUpperCase();
  if (title.includes('SCAFFOLD')) {
    return [
      'Built and dismantled different types of scaffolding according to project requirements.',
      'Installed scaffold platforms, guardrails, ladders, and safe access systems.',
      'Inspected scaffolding before use to ensure worker safety.',
      'Followed HSE procedures and used proper PPE while working at heights.',
      'Worked with supervisors and team members to complete daily tasks safely and efficiently.'
    ];
  } else if (title.includes('ELECTRIC')) {
    return [
      'Installed and maintained electrical conduit, wiring, switches, and circuit breakers.',
      'Tested electrical systems and continuity using voltmeters and multimeters.',
      'Repaired electrical faults, control panels, and motor control centers.',
      'Followed strict lockout/tagout (LOTO) and workplace safety protocols.',
      'Assisted site supervisors during plant maintenance and construction operations.'
    ];
  } else if (title.includes('WELD')) {
    return [
      'Performed 6G / 3G position welding on carbon steel and alloy pipes.',
      'Prepared metal joints, beveling, and grinding prior to welding operations.',
      'Inspected welded joints for defects and structural integrity.',
      'Maintained welding equipment, gas regulators, and safety shields.',
      'Adhered strictly to hot work permit rules and HSE guidelines.'
    ];
  } else if (title.includes('PIPE')) {
    return [
      'Fabricated and fitted carbon steel and stainless steel pipe spools.',
      'Cut, beveled, and aligned pipes according to isometric drawings.',
      'Installed valves, flanges, gaskets, and pipe supports.',
      'Supported hydrostatic and pneumatic pressure testing of piping systems.',
      'Maintained clean work areas and complied with refinery safety standards.'
    ];
  } else if (title.includes('DRIV') || title.includes('OPERAT')) {
    return [
      'Operated commercial heavy vehicles, trucks, or trailers safely across sites.',
      'Inspected vehicle brakes, tires, oil levels, and lights before daily trips.',
      'Ensured proper loading, tie-down, and safe transportation of equipment.',
      'Followed traffic regulations, site speed limits, and transport rules.',
      'Reported vehicle maintenance requirements promptly to fleet supervisors.'
    ];
  } else if (title.includes('MASON')) {
    return [
      'Laid concrete blocks, bricks, and stones using standard mortar mixtures.',
      'Applied smooth plaster finishing on interior and exterior walls.',
      'Prepared mortar and concrete ratios according to structural specifications.',
      'Leveled and aligned masonry courses using plumb lines, levels, and tools.',
      'Maintained cleanliness of masonry tools and complied with safety rules.'
    ];
  } else if (title.includes('COOK') || title.includes('KITCHEN')) {
    return [
      'Prepared and cooked a variety of meals following menus and recipe guidelines.',
      'Maintained strict kitchen hygiene, food safety, and sanitation standards.',
      'Managed food inventory, stored ingredients properly, and monitored freshness.',
      'Operated commercial kitchen appliances, ovens, and slicers safely.',
      'Cleaned cooking equipment, work stations, and utensils continuously.'
    ];
  } else if (title.includes('CLEAN')) {
    return [
      'Cleaned, vacuumed, and sanitized offices, corridors, and work sites.',
      'Handled and disposed of waste, trash, and hazardous materials safely.',
      'Replenished cleaning supplies, soaps, and paper products in designated areas.',
      'Operated industrial cleaning equipment, buffers, and vacuums safely.',
      'Followed chemical safety guidelines and material data sheet instructions.'
    ];
  } else if (title.includes('CARPENTER')) {
    return [
      'Constructed, installed, and dismantled wooden formworks for concrete pouring.',
      'Measured, cut, and shaped wood, timber, and boards according to plans.',
      'Aligned and leveled shuttering panels using support props and bracing.',
      'Operated circular saws, drills, hammers, and carpentry hand tools safely.',
      'Complied with carpentry safety procedures and housekeeping guidelines.'
    ];
  } else if (title.includes('STEEL') || title.includes('FIXER')) {
    return [
      'Positioned, bent, and tied steel rebars and wire mesh for concrete reinforcement.',
      'Read and interpreted structural drawings for steel specifications and spacing.',
      'Operated bar cutters, bending machines, and steel tying hand tools safely.',
      'Secured rebar structures using wire ties, spacers, and concrete blocks.',
      'Followed strict material handling guidelines and safety standards.'
    ];
  } else if (title.includes('PLUMB')) {
    return [
      'Installed, repaired, and maintained water supply, drainage, and waste disposal systems.',
      'Read and interpreted blueprints and drawings to plan plumbing layouts and installations.',
      'Measured, cut, bent, and threaded pipes using hand and power tools.',
      'Inspected and pressure-tested plumbing systems for leaks and structural integrity.',
      'Adhered strictly to local plumbing codes, building regulations, and safety standards.'
    ];
  }

  return [
    'Assisted in daily operations and supported site teams to complete tasks.',
    'Handled specialized tools, machinery, and equipment safely and efficiently.',
    'Followed strict project specifications, blueprints, and instructions.',
    'Maintained a clean, organized, and hazard-free work environment.',
    'Complied fully with all company safety rules and HSE regulations.'
  ];
}

function formatDateLong(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatDateCaps(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const mStr = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${day} ${mStr} ${year}`;
}

/**
 * Applies scale, brightness, and contrast to an image using an offscreen canvas.
 * Returns a new base64 data URL with the effects baked in.
 */
async function applyImageAdjustments(
  src: string,
  scale: number = 100,
  brightness: number = 100,
  contrast: number = 100
): Promise<string> {
  // If no adjustments needed, return original
  if (scale === 100 && brightness === 100 && contrast === 100) return src;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scaleFactor = scale / 100;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scaleFactor);
      canvas.height = Math.round(img.naturalHeight * scaleFactor);
      const ctx = canvas.getContext('2d')!;
      // Apply CSS filter equivalents via canvas filter
      ctx.filter = `brightness(${brightness / 100}) contrast(${contrast / 100})`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(src); // fallback to original on error
    img.src = src;
  });
}

/** Returns natural image dimensions from a base64 or URL string */
async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 240, height: 185 }); // fallback
    img.src = src;
  });
}

/** Scales image to fit within maxW×maxH while preserving aspect ratio */
function fitDimensions(naturalW: number, naturalH: number, maxW: number, maxH: number): { width: number; height: number } {
  const ratio = Math.min(maxW / naturalW, maxH / naturalH);
  return {
    width: Math.round(naturalW * ratio),
    height: Math.round(naturalH * ratio),
  };
}

async function fetchImageAsUint8Array(url: string): Promise<Uint8Array> {
  if (url.startsWith("data:")) {
    const base64Data = url.split(",")[1] || url;
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else {
    let fetchUrl = url;
    if (url.startsWith("/")) {
      const backendUrl = (import.meta as any).env.VITE_API_URL || "http://localhost:5000/api/v1";
      const origin = new URL(backendUrl).origin;
      fetchUrl = `${origin}${url}`;
    }
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error("Failed to fetch image");
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}

function getImageTypeFromBase64(base64: string): "png" | "jpg" | "gif" | "bmp" {
  if (base64.startsWith("data:image/png")) return "png";
  if (base64.startsWith("data:image/gif")) return "gif";
  if (base64.startsWith("data:image/bmp")) return "bmp";
  return "jpg";
}

function isValidImage(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // PNG: 89 50 4E 47
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return true;
  // JPEG: FF D8 FF
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return true;
  // GIF: 47 49 46 (GIF)
  if (bytes[0] === 71 && bytes[1] === 73 && bytes[2] === 70) return true;
  // BMP: 66 77 (BM)
  if (bytes[0] === 66 && bytes[1] === 77) return true;
  return false;
}

function isPdfDocument(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  // %PDF: 25 50 44 46 in hex, which is 37 80 68 70 in decimal
  return bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70;
}


// =========================================================================
// REUSABLE DOCUMENT SUB-BUILDERS
// =========================================================================

/**
 * Creates a standard top-bordered heading section for resume categories.
 * 28pt (14pt), bold, uppercase, black top border, spacing before=300 after=120.
 */
function buildSectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    keepNext: true,
    border: {
      top: {
        style: BorderStyle.SINGLE,
        size: 12, // ~1.5pt thickness
        space: 4,
        color: "000000",
      },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: docFont,
        size: 28, // 14pt
        bold: true,
        color: "000000",
      }),
    ],
  });
}

/**
 * Creates a details key-value TableRow with borderless table cells.
 * Left col: 2800 DXA (label), right col: 7400 DXA (value). Both 22pt.
 */
function createDetailsRow(key: string, value: string, isValueBold = false): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 2800, type: WidthType.DXA }, // label column
        borders: {
          top: { style: BorderStyle.NIL },
          bottom: { style: BorderStyle.NIL },
          left: { style: BorderStyle.NIL },
          right: { style: BorderStyle.NIL },
        },
        children: [
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: key,
                font: docFont,
                size: 24, // 12pt
                bold: true,
                color: "000000",
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: 7400, type: WidthType.DXA }, // value column
        borders: {
          top: { style: BorderStyle.NIL },
          bottom: { style: BorderStyle.NIL },
          left: { style: BorderStyle.NIL },
          right: { style: BorderStyle.NIL },
        },
        children: [
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: value,
                font: docFont,
                size: 24, // 12pt
                bold: isValueBold,
                color: "000000",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates a table spacing row to separate details groups.
 */
function createTableSpacingRow(): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 10200, type: WidthType.DXA },
        columnSpan: 2,
        children: [
          new Paragraph({
            spacing: { before: 180, after: 120 },
            children: [],
          }),
        ],
      }),
    ],
  });
}

export function buildHeader(data: any): Paragraph[] {
  const hasContact = !!data.contactNo;

  // Name: 32pt (size=64 half-points), bold, centered, uppercase
  const headerParagraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: (data.applicantName || "APPLICANT NAME").toUpperCase(),
          font: docFont,
          size: 64, // 32pt
          bold: true,
          color: "000000",
        }),
      ],
    }),
    // Position Applied: 12pt (size=24), bold, centered, uppercase
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: hasContact ? 40 : 60 },
      children: [
        new TextRun({
          text: `POSITION APPLIED FOR: ${(data.positionApplied || "").toUpperCase()}`,
          font: docFont,
          size: 24, // 12pt
          bold: true,
          color: "000000",
        }),
      ],
    }),
  ];

  if (hasContact) {
    // Contact No: 12pt (size=24), bold, centered
    headerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 60 },
        children: [
          new TextRun({
            text: `CONTACT NO.: ${data.contactNo}`,
            font: docFont,
            size: 24, // 12pt
            bold: true,
            color: "000000",
          }),
        ],
      })
    );
  }

  return headerParagraphs;
}

export function buildPersonalDetails(data: any): (Paragraph | Table)[] {
  const rows: TableRow[] = [];

  // Group 1: Passport Info
  rows.push(createDetailsRow("Passport No.", `: ${data.passportNo || "N/A"}`));
  const remainingPassport = calculatePassportRemaining(data.passportValidUntil);
  const remainingStr = remainingPassport && data.passportValidUntil && !remainingPassport.includes("N/A") ? ` (${remainingPassport})` : "";
  rows.push(createDetailsRow("Passport Valid Until", `: ${formatDateCaps(data.passportValidUntil)}${remainingStr}`));

  // Group 2: Birth Info
  rows.push(createTableSpacingRow());
  rows.push(createDetailsRow("Date of Birth", `: ${formatDateLong(data.dob)}`));
  rows.push(createDetailsRow("Age", `: ${calculateAge(data.dob)}`));
  rows.push(createDetailsRow("Place of Birth", `: ${data.placeOfBirth || "N/A"}`));

  // Group 3: Physical & Languages
  rows.push(createTableSpacingRow());
  rows.push(createDetailsRow("Nationality", `: ${data.nationality || "Nepalese"}`));
  rows.push(createDetailsRow("Height", `: ${formatHeight(data.height)}`));
  rows.push(createDetailsRow("Weight", `: ${formatWeight(data.weight)}`));
  rows.push(createDetailsRow("Languages", `: ${data.languages || "Nepali, Hindi, Basic English"}`));

  // Group 4: Demographics
  rows.push(createTableSpacingRow());
  rows.push(createDetailsRow("Gender", `: ${data.gender || "Male"}`));
  rows.push(createDetailsRow("Religion", `: ${data.religion || "Hindu"}`));
  rows.push(createDetailsRow("Marital Status", `: ${data.maritalStatus || "Single"}`));

  const detailsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NIL },
      bottom: { style: BorderStyle.NIL },
      left: { style: BorderStyle.NIL },
      right: { style: BorderStyle.NIL },
      insideHorizontal: { style: BorderStyle.NIL },
      insideVertical: { style: BorderStyle.NIL },
    },
    rows,
  });

  return [
    buildSectionHeading("PERSONAL DETAILS"),
    detailsTable,
  ];
}

export function buildCareerObjective(data: any): Paragraph[] {
  return [
    buildSectionHeading("CAREER OBJECTIVE"),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({
          text: data.careerObjective || "",
          font: docFont,
          size: 24, // 12pt
          color: "000000",
        }),
      ],
    }),
  ];
}

export function buildDrivingLicense(data: any): (Paragraph | Table)[] {
  if (!data.hasLicense || !data.licenses || data.licenses.length === 0) return [];

  const children: any[] = [
    buildSectionHeading("DRIVING LICENSE"),
  ];

  data.licenses.forEach((lic: any, idx: number) => {
    if (idx > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [],
        })
      );
    }

    if (data.licenses.length > 1) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          keepNext: true,
          children: [
            new TextRun({
              text: `LICENSE #${idx + 1}:`,
              font: docFont,
              size: 24,
              bold: true,
              color: "555555",
            }),
          ],
        })
      );
    }

    const rows: TableRow[] = [
      createDetailsRow("Issuing Country", `: ${lic.issuingCountry || "N/A"}`),
      createDetailsRow("License Number", `: ${lic.licenseNumber || "N/A"}`),
      createDetailsRow("License Type", `: ${lic.licenseType || "N/A"}`),
      createDetailsRow("Valid Until", `: ${formatDateCaps(lic.licenseValidUntil)}`),
    ];

    const licenseTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NIL },
        bottom: { style: BorderStyle.NIL },
        left: { style: BorderStyle.NIL },
        right: { style: BorderStyle.NIL },
        insideHorizontal: { style: BorderStyle.NIL },
        insideVertical: { style: BorderStyle.NIL },
      },
      rows,
    });

    children.push(licenseTable);
  });

  return children;
}

export function buildExperience(data: any): (Paragraph | Table)[] {
  const children: any[] = [
    buildSectionHeading("WORK EXPERIENCE"),
  ];

  (data.experiences || []).forEach((exp: any, index: number) => {
    const rows: TableRow[] = [
      createDetailsRow("Position", `: ${exp.position || "N/A"}`, true),
      createDetailsRow("Company", `: ${exp.company || "N/A"}`),
      createDetailsRow("Country", `: ${exp.country || "N/A"}`),
      createDetailsRow("Duration", `: ${exp.duration || "N/A"}`),
    ];

    const expTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NIL },
        bottom: { style: BorderStyle.NIL },
        left: { style: BorderStyle.NIL },
        right: { style: BorderStyle.NIL },
        insideHorizontal: { style: BorderStyle.NIL },
        insideVertical: { style: BorderStyle.NIL },
      },
      rows,
    });

    children.push(expTable);

    // Key responsibilities list
    if (exp.position) {
      const responsibilitiesList = exp.responsibilities && exp.responsibilities.length > 0
        ? exp.responsibilities
        : index === 0 && data.responsibilities && data.responsibilities.length > 0
        ? data.responsibilities
        : getPositionDefaultDuties(exp.position);

      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          keepNext: true,
          children: [
            new TextRun({
              text: "Key Responsibilities:",
              font: docFont,
              size: 24,
              bold: true,
              color: "000000",
            }),
          ],
        })
      );

      responsibilitiesList.forEach((resp: string) => {
        children.push(
          new Paragraph({
            indent: { left: 360, hanging: 200 },
            spacing: { before: 40, after: 40 },
            children: [
              new TextRun({
                text: "•  ",
                font: docFont,
                size: 24,
                bold: true,
                color: "000000",
              }),
              new TextRun({
                text: resp,
                font: docFont,
                size: 24,
                color: "000000",
              }),
            ],
          })
        );
      });
    }

    if (index < (data.experiences.length - 1)) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          children: [],
        })
      );
    }
  });

  return children;
}

export function buildEducation(data: any): (Paragraph | Table)[] {
  return [
    buildSectionHeading("EDUCATION & ACADEMIC QUALIFICATION"),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: data.education || "Under SLC",
          font: docFont,
          size: 24,
          bold: true,
          color: "000000",
        }),
      ],
    }),
  ];
}

export function buildSkills(data: any): (Paragraph | Table)[] {
  const children: Paragraph[] = [
    buildSectionHeading("SKILLS & PERSONAL STRENGTHS"),
  ];

  (data.skillsList || []).forEach((skill: string) => {
    children.push(
      new Paragraph({
        indent: { left: 360, hanging: 200 },
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: "✔  ",
            font: docFont,
            size: 24,
            bold: true,
            color: "000000",
          }),
          new TextRun({
            text: skill,
            font: docFont,
            size: 24,
            color: "000000",
          }),
        ],
      })
    );
  });

  return children;
}

export function buildDeclaration(_data?: any): Paragraph[] {
  return [
    buildSectionHeading("DECLARATION"),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({
          text: "I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.",
          font: docFont,
          size: 22, // 11pt italic
          italics: true,
          color: "000000",
        }),
      ],
    }),
  ];
}

export async function buildAnnexure(data: any): Promise<(Paragraph | Table)[]> {
  if (!data.attachDocuments || !data.attachments || data.attachments.length === 0) {
    return [];
  }
 
  // Check if there are any uploaded images
  const hasImages = data.attachments.some((att: any) => att.frontImage || att.backImage);
  if (!hasImages) {
    return [];
  }
 
  const children: any[] = [];
 
  for (let i = 0; i < data.attachments.length; i++) {
    const att = data.attachments[i];
    if (!att.frontImage && !att.backImage) {
      continue;
    }
 
    // page break before every attachment to ensure distinct pages
    children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
 
    const isTwoSided = att.type === 'front_back' && att.backImage;
 
    if (isTwoSided) {
      const paragraphChildren: any[] = [];
 
      // Front Image
      const rawSrc = att.editedFrontImage || att.frontImage;
      const imgSrc = await applyImageAdjustments(rawSrc, att.frontScale, att.frontBrightness, att.frontContrast);
      try {
        const imgBytes = await fetchImageAsUint8Array(imgSrc);
        if (isValidImage(imgBytes)) {
          const dims = await getImageDimensions(imgSrc);
          const fitted = fitDimensions(dims.width, dims.height, 310, 390);
          paragraphChildren.push(
            new ImageRun({
              data: imgBytes,
              transformation: { width: fitted.width, height: fitted.height },
              type: getImageTypeFromBase64(imgSrc),
            })
          );
        }
      } catch (err) {
        console.error("Error loading image in docx:", err);
      }
 
      // Small spacer run for minimum distance between front and back
      paragraphChildren.push(new TextRun({ text: "  " }));
 
      // Back Image
      const rawBackSrc = att.editedBackImage || att.backImage;
      const backSrc = await applyImageAdjustments(rawBackSrc, att.backScale, att.backBrightness, att.backContrast);
      try {
        const imgBytes = await fetchImageAsUint8Array(backSrc);
        if (isValidImage(imgBytes)) {
          const dims = await getImageDimensions(backSrc);
          const fitted = fitDimensions(dims.width, dims.height, 310, 390);
          paragraphChildren.push(
            new ImageRun({
              data: imgBytes,
              transformation: { width: fitted.width, height: fitted.height },
              type: getImageTypeFromBase64(backSrc),
            })
          );
        }
      } catch (err) {
        console.error("Error loading image in docx:", err);
      }
 
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: paragraphChildren,
        })
      );
    } else {
      // Single Image
      const paragraphChildren: any[] = [];
      const rawSrc = att.editedFrontImage || att.frontImage || att.editedBackImage || att.backImage;
      const imgSrc = await applyImageAdjustments(rawSrc, att.frontScale || 100, att.frontBrightness || 100, att.frontContrast || 100);
      try {
        const imgBytes = await fetchImageAsUint8Array(imgSrc);
        if (isValidImage(imgBytes)) {
          const dims = await getImageDimensions(imgSrc);
          const fitted = fitDimensions(dims.width, dims.height, 550, 500);
          paragraphChildren.push(
            new ImageRun({
              data: imgBytes,
              transformation: { width: fitted.width, height: fitted.height },
              type: getImageTypeFromBase64(imgSrc),
            })
          );
        }
      } catch (err) {
        console.error("Error loading image in docx:", err);
      }
 
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: paragraphChildren,
        })
      );
    }
  }
 
  return children;
}
 
// =========================================================================
// MAIN ENTRY GENERATION FUNCTION
// =========================================================================
 
export async function generateWordDoc(data: any): Promise<Blob> {
  docFont = data.cvFontFamily === 'cambria' ? 'Cambria' :
            data.cvFontFamily === 'arial' ? 'Arial' :
            data.cvFontFamily === 'aptos' ? 'Aptos' :
            data.cvFontFamily === 'helvetica' ? 'Helvetica' :
            'Cambria';
 
  const children: any[] = [];
 
  children.push(...buildHeader(data));
  children.push(...buildPersonalDetails(data));
  children.push(...buildCareerObjective(data));
  children.push(...buildDrivingLicense(data));
  children.push(...buildExperience(data));
  children.push(...buildEducation(data));
  children.push(...buildSkills(data));
  children.push(...buildDeclaration(data));
  children.push(...(await buildAnnexure(data)));
 
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: docFont,
            size: 24, // 12pt default
            color: "000000",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,  // A4 width in twips
              height: 16838, // A4 height in twips
            },
            margin: {
              top: 720,    // 0.5 inch
              right: 864,  // 0.6 inch
              bottom: 720, // 0.5 inch
              left: 864,   // 0.6 inch
            },
          },
        },
        children: children,
      },
    ],
  });
 
  return await Packer.toBlob(doc);
}
