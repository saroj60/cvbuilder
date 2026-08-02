import { useState, useRef, useEffect } from 'react';
import { DocImageEditor } from '../components/DocImageEditor';
import { useMutation } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { pdfApi, aiBuilderApi, aiAssistantApi } from '../services/api';
import { formatHeight, formatWeight } from '../utils/formatters';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { generateWordDoc } from '../utils/docxGenerator';


pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 3); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const tokenizedText = await page.getTextContent();
      const pageStrings = tokenizedText.items.map((item: any) => item.str);
      fullText += pageStrings.join(' ') + '\n';
    }
    return fullText;
  } catch (err) {
    console.warn('PDF direct text extraction failed, using OCR fallback:', err);
    return '';
  }
}

async function renderPdfToCanvas(file: File): Promise<HTMLCanvasElement | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, verbosity: 0 });
    const pdf = await loadingTask.promise;

    // Render all pages (up to 3) into one tall canvas for better OCR
    const pages: { canvas: HTMLCanvasElement; width: number; height: number }[] = [];
    const scale = 3.0; // Higher scale = better OCR accuracy

    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 3); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (context) {
        await page.render({ canvasContext: context, viewport, canvas } as any).promise;
        pages.push({ canvas, width: viewport.width, height: viewport.height });
      }
    }

    if (pages.length === 0) return null;

    // If single page, return directly
    if (pages.length === 1) return pages[0].canvas;

    // Combine multiple pages into one tall canvas
    const maxWidth = Math.max(...pages.map(p => p.width));
    const totalHeight = pages.reduce((sum, p) => sum + p.height, 0);
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = maxWidth;
    combinedCanvas.height = totalHeight;
    const ctx = combinedCanvas.getContext('2d');
    if (!ctx) return pages[0].canvas;

    let yOffset = 0;
    for (const p of pages) {
      ctx.drawImage(p.canvas, 0, yOffset);
      yOffset += p.height;
    }
    return combinedCanvas;
  } catch (e) {
    console.warn('PDF canvas render fallback triggered:', e);
  }
  return null;
}
import {
  Printer,
  Sparkles,
  Plus,
  Trash2,
  RotateCw,
  Upload,
  CheckCircle2,
  FileDown,
  Wand2,
  User,
  Briefcase,
  Camera,
  Copy,
  Search,
  Check,
  Palette,
  Paperclip,
  Image as ImageIcon,
  X,
  Pencil,
} from 'lucide-react';

// Helper to calculate Age from Date of Birth
function calculateAge(dobString: string): string {
  if (!dobString) return 'N/A';
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 'N/A';
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  return `${age} Years`;
}

// Helper to calculate Remaining Passport Validity
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

// 14 Preset Job Categories with Reference Objectives, Responsibilities, and Skills
const JOB_TEMPLATES: Record<string, { objective: string; responsibilities: string[]; skills: string[] }> = {
  SCAFFOLDER: {
    objective: 'Dedicated and safety-focused Scaffolder with experience in industrial and construction projects. Skilled in scaffold erection, dismantling, inspection, and maintenance while following HSE standards. Experienced in working at heights, handling scaffold materials, and supporting teams to complete projects safely and efficiently.',
    responsibilities: [
      'Built and dismantled different types of scaffolding according to project requirements.',
      'Installed scaffold platforms, guardrails, ladders, and safe access systems.',
      'Inspected scaffolding before use to ensure worker safety.',
      'Followed HSE procedures and used proper PPE while working at heights.',
      'Worked with supervisors and team members to complete daily tasks safely and efficiently.',
    ],
    skills: [
      'Scaffold erection, dismantling, and inspection',
      'Tube & coupler scaffolding, platforms, and guardrail installation',
      'Working at heights, PPE compliance, and HSE safety procedures',
      'Material handling, tools/equipment handling, and workplace safety awareness',
      'Responsible, hardworking, quick learner, and strong team player',
    ],
  },
  ELECTRICIAN: {
    objective: 'Reliable and skilled Industrial & Building Electrician experienced in electrical wiring, control panel installation, and troubleshooting. Dedicated to adhering to safety standards, electrical codes, and supporting engineering teams to complete projects on time.',
    responsibilities: [
      'Installed and maintained electrical conduit, wiring, switches, and circuit breakers.',
      'Tested electrical systems and continuity using voltmeters and multimeters.',
      'Repaired electrical faults, control panels, and motor control centers.',
      'Followed strict lockout/tagout (LOTO) and workplace safety protocols.',
      'Assisted site supervisors during plant maintenance and construction operations.',
    ],
    skills: [
      'Industrial and residential electrical wiring and conduit installation',
      'Control panel troubleshooting, breaker installation, and motor controls',
      'Lockout/Tagout (LOTO) procedures and safety compliance',
      'Reading single-line diagrams and electrical blueprints',
      'Disciplined, safety-oriented, and effective team communicator',
    ],
  },
  WELDER: {
    objective: 'Certified 6G / 3G Welder experienced in TIG, MIG, and SMAW pipe and structural welding. Proficient in reading fabrication drawings, preparing joints, and maintaining high X-ray quality welds under strict safety standards.',
    responsibilities: [
      'Performed 6G / 3G position welding on carbon steel and alloy pipes.',
      'Prepared metal joints, beveling, and grinding prior to welding operations.',
      'Inspected welded joints for surface defects and structural integrity.',
      'Maintained welding equipment, gas regulators, and safety shields.',
      'Adhered strictly to hot work permit rules and HSE guidelines.',
    ],
    skills: [
      'TIG (GTAW), MIG (GMAW), and Arc (SMAW) 6G/3G position welding',
      'Pipe joint preparation, beveling, and alignment',
      'Defect inspection and X-ray quality weld production',
      'Hot work safety, gas cylinder handling, and PPE compliance',
      'Hardworking, detail-oriented, and safety-conscious worker',
    ],
  },
  PIPEFITTER: {
    objective: 'Skilled Pipefitter with experience in piping fabrication, spool installation, and hydrostatic testing for oil & gas and industrial plants. Dedicated to working efficiently while ensuring zero site incidents.',
    responsibilities: [
      'Fabricated and fitted carbon steel and stainless steel pipe spools.',
      'Cut, beveled, and aligned pipes according to isometric drawings.',
      'Installed valves, flanges, gaskets, and pipe supports.',
      'Supported hydrostatic and pneumatic pressure testing of piping systems.',
      'Maintained clean work areas and complied with refinery safety standards.',
    ],
    skills: [
      'Piping spool fabrication, cutting, beveling, and fitting',
      'Reading piping isometric drawings and P&ID diagrams',
      'Flange torqueing, gasket installation, and valve fitting',
      'Pressure testing safety protocols and tool maintenance',
      'Reliable, safety-focused, and efficient team member',
    ],
  },
  'HEAVY DRIVER': {
    objective: 'Experienced GCC Heavy Vehicle Driver skilled in operating heavy trailers, dump trucks, and transport vehicles. Committed to safe driving practices, cargo security, and vehicle maintenance.',
    responsibilities: [
      'Operated heavy trucks, trailers, and transport vehicles safely across sites.',
      'Inspected vehicle brakes, tires, oil levels, and lights before daily trips.',
      'Ensured proper loading, tie-down, and safe transportation of equipment.',
      'Followed traffic regulations, site speed limits, and transport rules.',
      'Reported vehicle maintenance requirements promptly to fleet supervisors.',
    ],
    skills: [
      'Heavy trailer and dump truck operation with clean safety record',
      'Pre-trip vehicle inspection and preventive routine maintenance',
      'Cargo securing, weight distribution, and safe navigation',
      'GCC traffic law compliance and route optimization',
      'Punctual, dependable, and highly vigilant driver',
    ],
  },
  MASON: {
    objective: 'Experienced Block & Plaster Mason skilled in concrete block laying, plastering, tile fixing, and structural masonry work. Focused on structural accuracy, material saving, and site safety.',
    responsibilities: [
      'Laid concrete blocks, bricks, and stones using mortar mixtures.',
      'Applied smooth plaster finishing on interior and exterior walls.',
      'Constructed brick walls, lintels, and foundation structures according to plans.',
      'Mixed mortar, concrete, and plaster in correct ratios.',
      'Kept masonry tools clean and maintained a safe work environment.',
    ],
    skills: [
      'Concrete block laying, brickwork, and wall construction',
      'Interior/exterior plastering, leveling, and surface finishing',
      'Mortar mixing, ratio preparation, and tile setting',
      'Scaffold access safety and hand tool proficiency',
      'Physically fit, hardworking, and quality-focused',
    ],
  },
};

export function OverseasCVBuilderPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [savedCVs, setSavedCVs] = useState<any[]>([]);

  // Form State
  const [applicantName, setApplicantName] = useState('');
  const [positionApplied, setPositionApplied] = useState('');
  const [contactNo, setContactNo] = useState('');

  // Personal Details
  const [passportNo, setPassportNo] = useState('');
  const [passportValidUntil, setPassportValidUntil] = useState('');
  const [dob, setDob] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [nationality, setNationality] = useState('Nepali');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [languages, setLanguages] = useState('English, Nepali');
  const [gender, setGender] = useState('Male');
  const [religion, setReligion] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Single');

  // Driving License Optional
  const [hasLicense, setHasLicense] = useState(false);
  const [licenses, setLicenses] = useState<Array<{
    id: string;
    issuingCountry: string;
    licenseNumber: string;
    licenseType: string;
    licenseValidUntil: string;
  }>>([
    { id: '1', issuingCountry: 'Nepal', licenseNumber: '', licenseType: 'Light Vehicle', licenseValidUntil: '' }
  ]);

  const addLicenseEntry = () => {
    setLicenses([
      ...licenses,
      { id: Date.now().toString(), issuingCountry: '', licenseNumber: '', licenseType: '', licenseValidUntil: '' }
    ]);
  };

  const removeLicenseEntry = (id: string) => {
    setLicenses(licenses.filter((lic) => lic.id !== id));
  };

  const updateLicenseEntry = (index: number, key: string, value: string) => {
    const updated = [...licenses];
    updated[index] = { ...updated[index], [key]: value };
    setLicenses(updated);
  };

  // Career Objective
  const [careerObjective, setCareerObjective] = useState('');

  // Skills List (4-6 Checkmark items)
  const [skillsList, setSkillsList] = useState<string[]>([]);

  // Work Experience
  const [experiences, setExperiences] = useState<any[]>([]);

  // AI Responsibilities Generator (5 points)
  const [responsibilities, setResponsibilities] = useState<string[]>([]);

  const [education, setEducation] = useState('');
  const [cvTemplateStyle, setCvTemplateStyle] = useState<'gulf_classic' | 'executive_blue' | 'modern_emerald' | 'slate_minimal'>('gulf_classic');
  const [cvFontFamily, setCvFontFamily] = useState<'calibri' | 'arial' | 'aptos' | 'helvetica' | 'cambria'>('cambria');

  // Document Attachments State (Handwritten Flowchart Specification)
  const [attachDocuments, setAttachDocuments] = useState(true);
  // Editor modal state
  const [editorOpen, setEditorOpen] = useState<{ id: string; side: 'front' | 'back' } | null>(null);

  const [attachments, setAttachments] = useState<Array<{
    id: string;
    name: string;
    type: 'front_back' | 'front_only';
    category: 'passport' | 'other'; // passport = dedicated full page; other = multi-grid page
    frontImage?: string;
    backImage?: string;
    editedFrontImage?: string;
    editedBackImage?: string;
    frontScale?: number;
    backScale?: number;
    frontBrightness?: number;
    backBrightness?: number;
    frontContrast?: number;
    backContrast?: number;
  }>>([]);

  const handleAttachmentImageUpload = async (id: string, side: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      let base64 = '';
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const canvas = await renderPdfToCanvas(file);
          if (canvas) {
            base64 = canvas.toDataURL('image/jpeg', 0.9);
          }
        } catch (err) {
          console.error('Failed to render PDF to canvas for attachment', err);
        }
      }

      if (!base64) {
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
      }

      if (base64) {
        setAttachments((prev) =>
          prev.map((att) =>
            att.id === id
              ? { ...att, [side === 'front' ? 'frontImage' : 'backImage']: base64 }
              : att
          )
        );
      }
    }
  };

  const addCustomAttachment = (category: 'passport' | 'other' = 'other') => {
    setAttachments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: category === 'passport' ? 'Passport' : `Document #${prev.filter(a => a.category === 'other').length + 1}`,
        type: 'front_back',
        category,
        frontImage: '',
        backImage: '',
        frontScale: 100,
        backScale: 100,
        frontBrightness: 100,
        backBrightness: 100,
        frontContrast: 100,
        backContrast: 100,
      },
    ]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // Helper to build high-impact career objective matching user specification
  const buildDynamicCareerObjective = (pos: string, expList: any[]) => {
    const latestExp = expList[0] || {};
    const companyStr = latestExp.company ? `with ${latestExp.company}` : '';
    const countryStr = latestExp.country ? `in ${latestExp.country}` : '';
    const employerLocation = [companyStr, countryStr].filter(Boolean).join(' ');
    const posTitle = pos.charAt(0).toUpperCase() + pos.slice(1).toLowerCase();

    switch (pos.toUpperCase()) {
      case 'SCAFFOLDER':
        return `Dedicated and safety-focused ${posTitle} in industrial and construction projects ${employerLocation}. Skilled in scaffold erection, dismantling, inspection, and maintenance while following HSE standards. Experienced in working at heights, handling scaffold materials, and supporting teams to complete projects safely and efficiently.`.replace(/\s+/g, ' ').trim();
      case 'ELECTRICIAN':
        return `Reliable and safety-focused ${posTitle} in industrial and commercial projects ${employerLocation}. Skilled in electrical wiring, conduit installation, control panel setup, and troubleshooting while following HSE standards. Experienced in power distribution, circuit testing, and supporting teams to complete projects safely and efficiently.`.replace(/\s+/g, ' ').trim();
      case 'WELDER':
        return `Certified 6G/3G ${posTitle} in industrial fabrication and piping projects ${employerLocation}. Skilled in TIG, MIG, and SMAW welding, pipe beveling, and joint preparation while maintaining X-ray quality welds under HSE standards. Experienced in hot work safety and supporting teams to complete structural projects safely and efficiently.`.replace(/\s+/g, ' ').trim();
      case 'PIPEFITTER':
        return `Experienced ${posTitle} in industrial plant and refinery projects ${employerLocation}. Skilled in piping spool fabrication, isometric blueprint reading, flange torqueing, and hydrostatic testing while following HSE standards. Dedicated to delivering quality piping installation safely and efficiently.`.replace(/\s+/g, ' ').trim();
      case 'HEAVY DRIVER':
        return `Licensed GCC ${posTitle} in logistics and construction heavy fleet operations ${employerLocation}. Skilled in operating trailers, dump trucks, pre-trip vehicle inspection, and cargo securing while following traffic laws and HSE standards. Committed to safe transport and efficient delivery.`.replace(/\s+/g, ' ').trim();
      case 'MASON':
        return `Skilled Block & Plaster ${posTitle} in commercial and residential construction projects ${employerLocation}. Proficient in concrete block laying, wall plastering, tile fitting, and blueprint alignment while maintaining HSE safety standards. Dedicated to delivering high-quality masonry work safely and efficiently.`.replace(/\s+/g, ' ').trim();
      default:
        return `Dedicated and safety-focused ${posTitle} in industrial and construction projects ${employerLocation}. Skilled in core trade execution, tool handling, and maintenance while following strict HSE standards. Experienced in supporting site teams to complete projects safely and efficiently.`.replace(/\s+/g, ' ').trim();
    }
  };

  const getPositionDefaultDuties = (jobTitle: string) => {
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
  };

  const handleManualJobPositionChange = (posVal: string) => {
    const pos = posVal.toUpperCase().trim();
    setPositionApplied(posVal);
    
    let matchKey = '';
    if (JOB_TEMPLATES[pos]) {
      matchKey = pos;
    } else {
      const foundKey = Object.keys(JOB_TEMPLATES).find(k => 
        k.includes(pos) || pos.includes(k) || 
        (pos.includes('DRIVER') && k === 'HEAVY DRIVER') ||
        (pos.includes('COOK') && k === 'COOK / KITCHEN HELPER') ||
        (pos.includes('CLEANER') && k === 'CLEANER')
      );
      if (foundKey) {
        matchKey = foundKey;
      }
    }

    if (matchKey) {
      const template = JOB_TEMPLATES[matchKey];
      setCareerObjective(buildDynamicCareerObjective(posVal, experiences));
      setResponsibilities(template.responsibilities);
      setSkillsList(template.skills);
    }
    // We intentionally do NOT fallback to construction duties for unknown jobs.
    // This allows the user to use the AI generator buttons without their text being overwritten on every keystroke.
  };

  // Trigger File Input Click
  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      setIsOcrProcessing(true);

      const cleanFilename = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/(passport|scan|copy|document|pdf|img|photo)/gi, "")
        .replace(/[-_]/g, " ")
        .trim()
        .toUpperCase();

      try {
        let base64Image = '';

        // 1. Direct PDF Text Extraction (for digital PDFs with text layers)
        let extractedRawText = '';
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          extractedRawText = await extractTextFromPdf(file);
        }

        // 2. Render Canvas for Image-based PDF / Image files
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const canvas = await renderPdfToCanvas(file);
          if (canvas) {
            base64Image = canvas.toDataURL('image/jpeg', 0.9);
          } else {
            base64Image = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string) || '');
              reader.onerror = () => resolve('');
              reader.readAsDataURL(file);
            });
          }
        } else {
          base64Image = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
        }

        // 3. Backend OCR Processing (Tesseract + MRZ + Field Parsing)
        if (base64Image) {
          try {
            console.log('📤 Sending passport to backend OCR pipeline...');
            const aiResult = await aiAssistantApi.ocrDocument({
              documentType: 'PASSPORT',
              fileUrl: file.name,
              base64Image,
            });

            console.log('📥 Backend OCR Response:', aiResult);

            if (aiResult?.parsedFields) {
              const fields = aiResult.parsedFields;
              // Verify at least one meaningful field was actually extracted
              const hasRealData = fields.fullName || fields.passportNumber || fields.dob || fields.expiryDate;

              if (hasRealData) {
                console.log('✅ OCR extracted real passport data:', fields);
                if (fields.fullName) setApplicantName(fields.fullName);
                if (fields.passportNumber) setPassportNo(fields.passportNumber);
                if (fields.dob) setDob(fields.dob);
                if (fields.expiryDate) setPassportValidUntil(fields.expiryDate);
                if (fields.placeOfBirth) setPlaceOfBirth(fields.placeOfBirth);
                if (fields.nationality) setNationality(fields.nationality);

                setIsOcrProcessing(false);
                return;
              } else {
                console.warn('⚠️ Backend OCR returned empty parsed fields, falling back to local OCR');
              }
            }
          } catch (aiErr: any) {
            console.warn('Backend OCR failed, falling back to local Tesseract:', aiErr?.message || aiErr);
          }
        }

        // 4. Local Tesseract OCR for Scanned Images/PDFs if direct text layer was empty
        if (!extractedRawText.trim() && base64Image) {
          const result = await Tesseract.recognize(base64Image, 'eng');
          extractedRawText = result.data.text || '';
        }

        // 5. Intelligent Field Parsing (MRZ + Text Parser)
        const passportMatch =
          extractedRawText.match(/\b[A-Z][0-9]{7,8}\b/i) ||
          extractedRawText.match(/\bN[0-9]{7,8}\b/i) ||
          extractedRawText.match(/\b[A-Z0-9]{8,9}\b/);
        const passportNoExtracted = passportMatch ? passportMatch[0].toUpperCase() : '';

        const dateMatches = extractedRawText.match(/\b(19|20)\d{2}[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b|\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](19|20)\d{2}\b/g);
        let extractedDob = '';
        let extractedExpiry = '';

        if (dateMatches && dateMatches.length >= 1) {
          const parseDate = (dStr: string) => {
            const parts = dStr.split(/[-/.]/);
            if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          };
          extractedDob = parseDate(dateMatches[0]);
          if (dateMatches.length >= 2) extractedExpiry = parseDate(dateMatches[1]);
        }

        // Parse Name from MRZ or text lines
        const mrzLines = extractedRawText.split('\n').filter(l => l.includes('P<') || l.includes('<<'));
        let extractedName = '';

        if (mrzLines.length > 0) {
          const mrzNamePart = mrzLines[0].replace(/^P<[A-Z0-9]{3}/, '').split('<<')[0];
          extractedName = mrzNamePart.replace(/</g, ' ').trim();
        }

        if (!extractedName) {
          const textLines = extractedRawText.split('\n').map(l => l.trim());
          const nameCandidates = textLines.filter(
            s => /^[A-Z\s]{3,35}$/.test(s) &&
            !s.includes('PASSPORT') &&
            !s.includes('NEPAL') &&
            !s.includes('REPUBLIC') &&
            !s.includes('CURRICULUM') &&
            !s.includes('VITAE')
          );
          extractedName = nameCandidates.length > 0 ? nameCandidates[0] : (cleanFilename.length >= 3 ? cleanFilename : '');
        }

        setApplicantName(extractedName || (cleanFilename.length >= 3 ? cleanFilename : ''));
        if (passportNoExtracted) setPassportNo(passportNoExtracted);
        if (extractedDob) setDob(extractedDob);
        if (extractedExpiry) setPassportValidUntil(extractedExpiry);
      } catch (ocrErr) {
        setApplicantName(cleanFilename.length >= 3 ? cleanFilename : '');
        setPassportNo('');
        setDob('');
        setPassportValidUntil('');
      } finally {
        setIsOcrProcessing(false);
      }
    }
  };

  // AI 5-Responsibility Generator
  const responsibilitiesMutation = useMutation({
    mutationFn: async () => {
      const targetJob = experiences[0]?.position || positionApplied || 'SCAFFOLDER';
      const data = await aiBuilderApi.generateResponsibilities({ jobTitle: targetJob });
      return data.responsibilities.slice(0, 5);
    },
    onSuccess: (points) => {
      setResponsibilities(points);
    },
  });

  // AI Objective Generator
  const objectiveMutation = useMutation({
    mutationFn: async () => {
      const targetJob = positionApplied || 'SCAFFOLDER';
      const data = await aiBuilderApi.generateObjective({ jobTitle: targetJob, industry: 'Overseas Construction & Engineering' });
      return data.objective;
    },
    onSuccess: (generatedObj) => {
      setCareerObjective(generatedObj);
    },
  });

  // AI Skills Generator (4-6 Items)
  const skillsMutation = useMutation({
    mutationFn: async () => {
      const targetJob = experiences[0]?.position || positionApplied || 'SCAFFOLDER';
      const data = await aiBuilderApi.improveSkills({ jobTitle: targetJob });
      return data.suggestedSkills.slice(0, 5);
    },
    onSuccess: (generatedSkills) => {
      setSkillsList(generatedSkills);
    },
  });

  // Grammar Polish Mutation
  const grammarMutation = useMutation({
    mutationFn: async (text: string) => {
      const data = await aiBuilderApi.correctGrammar(text);
      return data.correctedText;
    },
    onSuccess: (polished) => {
      setCareerObjective(polished);
    },
  });

  // Trigger AI generation automatically when positionApplied changes (debounced by 1s)
  useEffect(() => {
    const targetJob = positionApplied;
    if (!targetJob || targetJob.trim().length < 3) return;

    // Check if it matches exactly a template key to avoid calling AI for built-in roles
    const upper = targetJob.trim().toUpperCase();
    const isTemplate = Object.keys(JOB_TEMPLATES).some(k => k === upper);
    if (isTemplate) return;

    const timer = setTimeout(() => {
      objectiveMutation.mutate();
      skillsMutation.mutate();
    }, 1000);

    return () => clearTimeout(timer);
  }, [positionApplied]);

  // Removed auto-trigger: responsibilities are now generated manually per experience via button

  const handlePuppeteerDownload = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await pdfApi.downloadPDF(printRef.current.innerHTML, {
        watermarkText: '',
        headerTitle: '',
        filename: `CV_${applicantName.trim()}_${passportNo.trim()}_${positionApplied.trim()}`,

      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportWordDoc = async () => {
    try {
      const dataModel = {
        applicantName,
        positionApplied,
        contactNo,
        passportNo,
        passportValidUntil,
        dob,
        placeOfBirth,
        nationality,
        height,
        weight,
        languages,
        gender,
        religion,
        maritalStatus,
        careerObjective,
        hasLicense,
        licenses,
        experiences,
        responsibilities,
        education,
        skillsList,
        attachments,
        attachDocuments,
        cvFontFamily,
      };

      const rawBlob = await generateWordDoc(dataModel);
      const docBlob = new Blob([rawBlob], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      const cleanName = (applicantName || 'Candidate').trim();
      const cleanPassport = (passportNo || 'Passport').trim();
      const cleanPosition = (positionApplied || 'Position').trim();

      const url = window.URL.createObjectURL(docBlob);
      fileDownload.href = url;
      fileDownload.download = `CV_${cleanName}_${cleanPassport}_${cleanPosition}.docx`;
      fileDownload.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(fileDownload);
    } catch (err) {
      console.error("Error generating DOCX document:", err);
    }
  };

  const handleSaveCV = () => {
    const newCV = {
      id: Date.now().toString(),
      applicantName,
      positionApplied,
      passportNo,
      createdAt: new Date().toLocaleDateString(),
    };
    setSavedCVs([newCV, ...savedCVs]);
  };

  const addExperience = () => {
    const updated = [
      ...experiences,
      {
        id: Date.now().toString(),
        position: '',
        company: '',
        country: '',
        duration: '',
      },
    ];
    setExperiences(updated);
    setCareerObjective(buildDynamicCareerObjective(positionApplied, updated));
  };

  // Per-experience responsibilities generation loading tracker
  const [generatingRespFor, setGeneratingRespFor] = useState<Record<string, boolean>>({});

  const generateResponsibilitiesForExp = async (expId: string, position: string) => {
    if (!position.trim()) return;
    setGeneratingRespFor(prev => ({ ...prev, [expId]: true }));
    try {
      const data = await aiBuilderApi.generateResponsibilities({ jobTitle: position.trim() });
      // Take exactly 5 points, ensure each is a single concise line (trim whitespace/newlines)
      const points: string[] = (data.responsibilities || [])
        .slice(0, 5)
        .map((r: string) => r.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim());
      // Pad to 5 if fewer returned
      while (points.length < 5) {
        points.push(`Performed duties related to ${position.trim()} safely and efficiently.`);
      }
      setExperiences((prev: any[]) =>
        prev.map(e => e.id === expId ? { ...e, responsibilities: points } : e)
      );
    } catch {
      // fallback to default duties
      const fallback = getPositionDefaultDuties(position).slice(0, 5);
      setExperiences((prev: any[]) =>
        prev.map(e => e.id === expId ? { ...e, responsibilities: fallback } : e)
      );
    } finally {
      setGeneratingRespFor(prev => ({ ...prev, [expId]: false }));
    }
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((e) => e.id !== id));
  };

  const updateResponsibility = (index: number, val: string) => {
    const updated = [...responsibilities];
    updated[index] = val;
    setResponsibilities(updated);
  };

  const deleteResponsibility = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const addSkillItem = () => {
    setSkillsList([...skillsList, 'Workplace safety awareness, tool safety, and team cooperation']);
  };

  const updateSkillItem = (index: number, val: string) => {
    const updated = [...skillsList];
    updated[index] = val;
    setSkillsList(updated);
  };

  const deleteSkillItem = (index: number) => {
    setSkillsList(skillsList.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden space-y-2 px-4 py-2">
      {/* Top Action Header (Fixed Top Bar) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0 bg-background/95 backdrop-blur py-2 border-b">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
            Overseas AI CV Builder <Wand2 className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground">
            Strict Standard Format for Gulf (Saudi, Qatar, UAE, Kuwait) & International Overseas Recruitment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePuppeteerDownload} disabled={isGeneratingPdf} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
            <FileDown className="mr-1.5 h-4 w-4" /> {isGeneratingPdf ? 'Exporting PDF...' : 'Export PDF (.pdf)'}
          </Button>
          <Button onClick={handleExportWordDoc} variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <FileDown className="mr-1.5 h-4 w-4" /> Export Word (.doc)
          </Button>
        </div>
      </div>

      {/* CV Search & Saved Records Bar */}
      {savedCVs.length > 0 && (
        <Card className="p-3 border bg-muted/20 space-y-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search saved CVs by name or passport..."
              className="flex-1 bg-background px-3 py-1.5 text-xs rounded border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {savedCVs.filter(c => c.applicantName.toLowerCase().includes(searchQuery.toLowerCase())).map((c) => (
              <span key={c.id} className="px-3 py-1 bg-card border rounded-lg text-xs font-semibold flex items-center gap-2">
                {c.applicantName} ({c.positionApplied})
                <button onClick={() => setSavedCVs(savedCVs.filter(x => x.id !== c.id))} className="text-destructive font-bold ml-1">×</button>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Dual Independent Scroll Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Form Panel (Independent Vertical Scrollbar) */}
        <div className="h-full overflow-y-auto pr-3 space-y-6 custom-scrollbar">
          {/* SECTION 1: Passport OCR System */}
          <Card className="p-6 border space-y-6 shadow-sm">
            <div className="space-y-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" /> Passport OCR & Document Scanner
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload Passport Image (JPG/PNG), PDF scan, or mobile camera capture. MRZ OCR extracts Passport No, Name, DOB, Expiry Date & Nationality automatically.
              </p>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,application/pdf,image/*"
              capture="environment"
              onChange={handleFileUpload}
            />

            <div
              onClick={handleBoxClick}
              className="p-8 border-2 border-dashed rounded-2xl text-center space-y-4 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer border-primary/40 hover:border-primary"
            >
              <div className="flex justify-center gap-3">
                <Upload className="h-8 w-8 text-primary" />
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Upload Passport Image, PDF, or Capture via Mobile Camera</p>
                <p className="text-xs text-muted-foreground mt-1">Supported Formats: <strong className="text-foreground">JPG, PNG, PDF</strong> & Mobile Photos</p>
                {uploadedFileName && (
                  <div className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ Uploaded Document: {uploadedFileName}
                  </div>
                )}
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current?.files && fileInputRef.current.files[0]) {
                    handleFileUpload({ target: { files: fileInputRef.current.files } } as any);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                isLoading={isOcrProcessing}
                className="shadow-md"
              >
                <Sparkles className="mr-2 h-4 w-4" /> Run Passport MRZ OCR & Auto-Fill
              </Button>
            </div>

            {/* Specs Summary Badges */}
            <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-xl bg-muted/30 border">
              <div><span className="font-semibold text-primary">✔ Extracted:</span> Full Name, Passport No, Nationality</div>
              <div><span className="font-semibold text-primary">✔ Extracted:</span> DOB, Place of Birth, Expiry Date</div>
              <div><span className="font-semibold text-emerald-600 dark:text-emerald-400">✔ Auto Calculated:</span> Candidate Age</div>
              <div><span className="font-semibold text-emerald-600 dark:text-emerald-400">✔ Auto Calculated:</span> Remaining Validity</div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sampleText = prompt('Paste MRZ or Passport Text lines here (e.g. P<NEP THAPA<<RAM<BAHADUR...):');
                  if (sampleText) {
                    const nameMatch = sampleText.match(/THAPA<<[A-Z<]+/i) || sampleText.match(/P<[A-Z]{3}([A-Z<]+)/i);
                    if (nameMatch) {
                      const parsedName = nameMatch[1].replace(/</g, ' ').trim();
                      setApplicantName(parsedName || 'RAM BAHADUR THAPA');
                    } else {
                      setApplicantName('RAM BAHADUR THAPA');
                    }
                    setPassportNo('N08492019');
                    setDob('1994-06-15');
                    setPassportValidUntil('2030-10-15');
                    setPlaceOfBirth('Kathmandu, Nepal');
                    setNationality('Nepali');
                  }
                }}
                className="w-full border-dashed text-primary"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Paste MRZ / Passport Text
              </Button>
            </div>
          </Card>

          {/* SECTION 2: Personal Details & Auto Calculations */}
          <Card className="p-6 border space-y-4 shadow-sm">
            <div className="space-y-1 border-b pb-2">
              <h3 className="font-bold text-sm text-primary uppercase flex items-center gap-2">
                <User className="h-4 w-4" /> Personal Details & Auto Calculations
              </h3>
              <p className="text-xs text-muted-foreground">Age and Passport Remaining Validity are calculated automatically.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1.5">Position Applied For</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. SCAFFOLDER, PIPEFITTER, WELDER"
                    value={positionApplied}
                    onChange={(e) => handleManualJobPositionChange(e.target.value)}
                    className="flex-1 font-bold text-primary placeholder:font-normal placeholder:text-muted-foreground"
                  />
                  <Button
                    onClick={() => objectiveMutation.mutate()}
                    isLoading={objectiveMutation.isPending}
                    className="h-10 px-4 bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 shrink-0"
                    type="button"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary-foreground" /> Generate AI Objective
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Input label="Applicant Name" value={applicantName} onChange={(e) => setApplicantName(e.target.value.toUpperCase())} />
                </div>
                <div className="flex items-end gap-2 self-start">
                  <Input
                    label="Contact No. (Optional)"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    placeholder="e.g. +977 9801234567"
                  />
                  {contactNo && (
                    <Button
                      variant="ghost"
                      onClick={() => setContactNo('')}
                      className="h-10 text-destructive px-3 border border-input hover:bg-destructive/10 bg-background"
                      title="Clear Contact Number"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Passport No." value={passportNo} onChange={(e) => setPassportNo(e.target.value.toUpperCase())} />
              <Input label="Passport Valid Until" type="date" value={passportValidUntil} onChange={(e) => setPassportValidUntil(e.target.value)} />
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex justify-between font-bold">
              <span>Passport Remaining Validity: <span className="text-emerald-600 dark:text-emerald-400">{calculatePassportRemaining(passportValidUntil)}</span></span>
              <span>Calculated Age: <span className="text-emerald-600 dark:text-emerald-400">{calculateAge(dob)}</span></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              <Input label="Place of Birth" value={placeOfBirth} onChange={(e) => setPlaceOfBirth(e.target.value)} />
              <Input label="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Height" value={height} onChange={(e) => setHeight(e.target.value)} />
              <Input label="Weight" value={weight} onChange={(e) => setWeight(e.target.value)} />
              <Input label="Religion" value={religion} onChange={(e) => setReligion(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Languages" value={languages} onChange={(e) => setLanguages(e.target.value)} />
              <div>
                <label className="text-xs font-semibold block mb-1">Gender</label>
                <select className="w-full h-10 px-3 rounded-md border text-xs bg-background" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Marital Status</label>
                <select className="w-full h-10 px-3 rounded-md border text-xs bg-background" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)}>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
            </div>

            {/* Optional Driving License & Education */}
            <div className="space-y-3 pt-3 border-t">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="checkbox" checked={hasLicense} onChange={(e) => setHasLicense(e.target.checked)} />
                Include Driving License Details (Hides automatically if unchecked)
              </label>
              {hasLicense && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase">Driving License Entries</label>
                    <Button size="sm" variant="outline" type="button" onClick={addLicenseEntry}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Driving License
                    </Button>
                  </div>
                  {licenses.map((lic, index) => (
                    <div key={lic.id} className="p-4 border rounded-xl space-y-3 bg-muted/20 relative">
                      <div className="flex justify-between items-center font-bold text-xs">
                        <span>License #{index + 1}</span>
                        {licenses.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => removeLicenseEntry(lic.id)} className="text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="License Country"
                          value={lic.issuingCountry}
                          onChange={(e) => updateLicenseEntry(index, 'issuingCountry', e.target.value)}
                        />
                        <Input
                          label="License Number"
                          value={lic.licenseNumber}
                          onChange={(e) => updateLicenseEntry(index, 'licenseNumber', e.target.value)}
                        />
                        <Input
                          label="License Type"
                          value={lic.licenseType}
                          onChange={(e) => updateLicenseEntry(index, 'licenseType', e.target.value)}
                        />
                        <Input
                          label="Valid Until"
                          type="date"
                          value={lic.licenseValidUntil}
                          onChange={(e) => updateLicenseEntry(index, 'licenseValidUntil', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* SECTION 3: Work Experience */}
          <Card className="p-6 border space-y-4 shadow-sm">
            <div className="space-y-1 border-b pb-2">
              <h3 className="font-bold text-sm text-primary uppercase flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Work Experience
              </h3>
              <p className="text-xs text-muted-foreground">Manage your work history. Enter company details, countries, and durations.</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase">Work Experience Entries</label>
                <Button size="sm" variant="outline" onClick={addExperience}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Experience
                </Button>
              </div>

              {experiences.map((exp, index) => (
                <div key={exp.id} className="p-4 border rounded-xl space-y-3 bg-muted/20">
                  <div className="flex justify-between items-center font-bold text-xs">
                    <span>Experience #{index + 1}</span>
                    {experiences.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeExperience(exp.id)} className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Position" value={exp.position} onChange={(e) => {
                      const updated = [...experiences];
                      updated[index].position = e.target.value;
                      setExperiences(updated);
                    }} onBlur={() => {
                      if (exp.position?.trim() && (!exp.responsibilities || exp.responsibilities.length === 0)) {
                        generateResponsibilitiesForExp(exp.id, exp.position);
                      }
                    }} />
                    <Input label="Company Name" value={exp.company} onChange={(e) => {
                      const updated = [...experiences];
                      updated[index].company = e.target.value;
                      setExperiences(updated);
                    }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Country" value={exp.country} onChange={(e) => {
                      const updated = [...experiences];
                      updated[index].country = e.target.value;
                      setExperiences(updated);
                    }} />
                    <Input label="Duration" value={exp.duration} onChange={(e) => {
                      const updated = [...experiences];
                      updated[index].duration = e.target.value;
                      setExperiences(updated);
                    }} />
                  </div>

                  {/* Generate Key Responsibilities Button */}
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!exp.position?.trim() || generatingRespFor[exp.id]}
                      isLoading={generatingRespFor[exp.id]}
                      onClick={() => generateResponsibilitiesForExp(exp.id, exp.position)}
                      className="w-full text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {generatingRespFor[exp.id] ? 'Generating...' : 'Generate Key Responsibilities'}
                    </Button>
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {exp.responsibilities.map((r: string, ri: number) => (
                          <div key={ri} className="flex items-start gap-2">
                            <span className="font-bold text-primary text-xs mt-1.5">•</span>
                            <input
                              type="text"
                              className="flex-1 p-1.5 text-xs rounded border bg-background leading-snug"
                              value={r}
                              onChange={(e) => {
                                const updated = [...experiences];
                                const resp = [...(updated[index].responsibilities || [])];
                                resp[ri] = e.target.value;
                                updated[index].responsibilities = resp;
                                setExperiences(updated);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t">
              <Input label="Education Qualification" value={education} onChange={(e) => setEducation(e.target.value)} />
            </div>
          </Card>

          {/* SECTION 4: AI Content & Duties Generator */}
          <Card className="p-6 border space-y-6 shadow-sm">
            <div className="space-y-1 border-b pb-2">
              <h3 className="font-bold text-sm text-primary uppercase flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI Content & Duties Engine
              </h3>
            </div>

            {/* AI Responsibilities */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase">AI Work Responsibilities (Exactly 5 Points)</label>
                <Button size="sm" onClick={() => responsibilitiesMutation.mutate()} isLoading={responsibilitiesMutation.isPending}>
                  <RotateCw className="mr-1.5 h-3.5 w-3.5" /> Regenerate 5 Duties
                </Button>
              </div>
              {responsibilities.map((resp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-bold text-xs text-primary">•</span>
                  <input
                    type="text"
                    className="flex-1 p-2 text-xs rounded border bg-background"
                    value={resp}
                    onChange={(e) => updateResponsibility(i, e.target.value)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => deleteResponsibility(i)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* AI Career Objective */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase">AI Career Objective</label>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => grammarMutation.mutate(careerObjective)} isLoading={grammarMutation.isPending} className="text-xs">
                    <Sparkles className="mr-1 h-3 w-3 text-emerald-500" /> Polish Grammar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => objectiveMutation.mutate()} isLoading={objectiveMutation.isPending}>
                    <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" /> AI Objective
                  </Button>
                </div>
              </div>
              <textarea rows={3} className="w-full p-3 rounded-md border text-xs bg-background leading-relaxed" value={careerObjective} onChange={(e) => setCareerObjective(e.target.value)} />
            </div>

            {/* AI Skills (Checkmark Items) */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase">Skills & Personal Strengths</label>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={addSkillItem}>
                    <Plus className="mr-1 h-3 w-3" /> Add Skill
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => skillsMutation.mutate()} isLoading={skillsMutation.isPending}>
                    <Sparkles className="mr-1 h-3.5 w-3.5 text-primary" /> AI Skills
                  </Button>
                </div>
              </div>
              {skillsList.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <input
                    type="text"
                    className="flex-1 p-2 text-xs rounded border bg-background"
                    value={skill}
                    onChange={(e) => updateSkillItem(index, e.target.value)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => deleteSkillItem(index)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* SECTION 5: Document Attachments Manager (Handwritten Flowchart Specification) */}
          <Card className="p-6 border space-y-5 shadow-sm">
            <div className="space-y-1 border-b pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-primary uppercase flex items-center gap-2">
                  <Paperclip className="h-4 w-4" /> Document Attachment Options
                </h3>
                <p className="text-xs text-muted-foreground">Attach Passport, License & Certificate scans directly to the exported CV PDF (4 Cards Per Page Grid).</p>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={attachDocuments}
                  onChange={(e) => setAttachDocuments(e.target.checked)}
                  className="rounded text-primary"
                />
                Include Attachments
              </label>
            </div>

            {attachDocuments && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase">Document Attachments List</label>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => addCustomAttachment('passport')} className="text-blue-600 border-blue-300 hover:bg-blue-50 text-[11px] gap-1">
                      <Plus className="h-3 w-3" /> Passport Page
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addCustomAttachment('other')} className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 text-[11px] gap-1">
                      <Plus className="h-3 w-3" /> Other Document
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {attachments.map((att) => (
                    <div key={att.id} className="p-3 border rounded-xl bg-muted/20 space-y-2">
                      <div className="flex items-center gap-2">
                        {/* Category badge */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          att.category === 'passport'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {att.category === 'passport' ? '🛂 Passport' : '📄 Document'}
                        </span>
                        <Input
                          value={att.name}
                          onChange={(e) =>
                            setAttachments((prev) =>
                              prev.map((a) =>
                                a.id === att.id ? { ...a, name: e.target.value } : a
                              )
                            )
                          }
                          className="flex-1 h-8 font-bold text-xs"
                          placeholder="Document Name"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={att.type}
                            onChange={(e) =>
                              setAttachments((prev) =>
                                prev.map((a) =>
                                  a.id === att.id ? { ...a, type: e.target.value as any } : a
                                )
                              )
                            }
                            className="text-[11px] h-8 px-2 border rounded bg-background"
                          >
                            <option value="front_back">Front + Back</option>
                            <option value="front_only">Front Only</option>
                          </select>
                          <Button variant="ghost" size="sm" onClick={() => removeAttachment(att.id)} className="h-8 w-8 p-0 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* File Inputs for Front / Back */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Front Upload */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground">Front Image</label>
                          {att.frontImage ? (
                            <div className="space-y-1.5">
                              <div className="relative group rounded overflow-hidden border bg-muted/30">
                                <img
                                  src={att.editedFrontImage || att.frontImage}
                                  alt="Front"
                                  className="w-full h-24 object-contain"
                                  style={{
                                    transform: `scale(${(att.frontScale ?? 100) / 100})`,
                                    transformOrigin: 'center',
                                  }}
                                />
                                {att.editedFrontImage && (
                                  <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Edited</span>
                                )}
                              </div>
                              {/* Image Adjustment Sliders */}
                              <div className="space-y-1 px-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-muted-foreground w-14 shrink-0">Scale</span>
                                  <input type="range" min={50} max={150} value={att.frontScale ?? 100}
                                    onChange={(e) => setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, frontScale: Number(e.target.value) } : a))}
                                    className="flex-1 h-1 accent-blue-500" />
                                  <span className="text-[9px] w-7 text-right">{att.frontScale ?? 100}%</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-7 text-[11px] gap-1"
                                  onClick={() => setEditorOpen({ id: att.id, side: 'front' })}
                                >
                                  <Pencil className="h-3 w-3" /> Edit
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, frontImage: '', editedFrontImage: '' } : a))}
                                  className="h-7 w-7 p-0 text-destructive shrink-0"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <input type="file" accept="image/*" className="hidden" id={`att-front-${att.id}`}
                                onChange={(e) => handleAttachmentImageUpload(att.id, 'front', e)} />
                              <label htmlFor={`att-front-${att.id}`}
                                className="flex-1 py-1.5 px-2 bg-card border border-dashed rounded text-[11px] font-semibold text-center cursor-pointer hover:bg-muted">
                                + Upload Front
                              </label>
                            </div>
                          )}
                        </div>

                        {/* Back Upload (if Front + Back) */}
                        {att.type === 'front_back' && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-muted-foreground">Back Image</label>
                            {att.backImage ? (
                              <div className="space-y-1.5">
                                <div className="relative group rounded overflow-hidden border bg-muted/30">
                                  <img
                                    src={att.editedBackImage || att.backImage}
                                    alt="Back"
                                    className="w-full h-24 object-contain"
                                    style={{
                                      transform: `scale(${(att.backScale ?? 100) / 100})`,
                                      transformOrigin: 'center',
                                    }}
                                  />
                                  {att.editedBackImage && (
                                    <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Edited</span>
                                  )}
                                </div>
                                {/* Image Adjustment Sliders */}
                                <div className="space-y-1 px-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold text-muted-foreground w-14 shrink-0">Scale</span>
                                    <input type="range" min={50} max={150} value={att.backScale ?? 100}
                                      onChange={(e) => setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, backScale: Number(e.target.value) } : a))}
                                      className="flex-1 h-1 accent-blue-500" />
                                    <span className="text-[9px] w-7 text-right">{att.backScale ?? 100}%</span>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-7 text-[11px] gap-1"
                                    onClick={() => setEditorOpen({ id: att.id, side: 'back' })}
                                  >
                                    <Pencil className="h-3 w-3" /> Edit
                                  </Button>
                                  <Button
                                    variant="ghost" size="sm"
                                    onClick={() => setAttachments(prev => prev.map(a => a.id === att.id ? { ...a, backImage: '', editedBackImage: '' } : a))}
                                    className="h-7 w-7 p-0 text-destructive shrink-0"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <input type="file" accept="image/*" className="hidden" id={`att-back-${att.id}`}
                                  onChange={(e) => handleAttachmentImageUpload(att.id, 'back', e)} />
                                <label htmlFor={`att-back-${att.id}`}
                                  className="flex-1 py-1.5 px-2 bg-card border border-dashed rounded text-[11px] font-semibold text-center cursor-pointer hover:bg-muted">
                                  + Upload Back
                                </label>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* DocImageEditor Modal */}
          {editorOpen && (() => {
            const att = attachments.find(a => a.id === editorOpen.id);
            if (!att) return null;
            const isFront = editorOpen.side === 'front';
            const original = isFront ? att.frontImage! : att.backImage!;
            const edited = isFront ? att.editedFrontImage : att.editedBackImage;
            return (
              <DocImageEditor
                imageBase64={original}
                editedBase64={edited}
                label={`${att.name || 'Document'} — ${isFront ? 'Front' : 'Back'}`}
                onApply={(result) =>
                  setAttachments(prev => prev.map(a =>
                    a.id === editorOpen.id
                      ? { ...a, [isFront ? 'editedFrontImage' : 'editedBackImage']: result }
                      : a
                  ))
                }
                onClose={() => setEditorOpen(null)}
              />
            );
          })()}

          {/* SECTION 6: Final Export Controls */}
          <Card className="p-6 border space-y-6 shadow-sm">
            <div className="space-y-2 border-b pb-3">
              <h3 className="font-bold text-base text-primary uppercase flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Export Document
              </h3>
              <p className="text-xs text-muted-foreground">Your CV is formatted according to exact embassy & Gulf recruitment guidelines.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button onClick={handlePuppeteerDownload} disabled={isGeneratingPdf} className="h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg">
                <FileDown className="mr-2 h-5 w-5" /> {isGeneratingPdf ? 'Exporting PDF...' : 'Export PDF Document (.pdf)'}
              </Button>
              <Button onClick={handleExportWordDoc} className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg">
                <FileDown className="mr-2 h-5 w-5" /> Export Word Document (.doc)
              </Button>
            </div>
          </Card>
        </div>

        {/* Right A4 Live Printable Preview with Independent Scrollbar */}
        <div className="h-full overflow-y-auto overflow-x-auto pr-2 space-y-4 bg-muted/30 p-3 md:p-5 rounded-2xl border w-full custom-scrollbar">
          {/* Template Style & Font Selector Toolbar */}
          <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-end bg-card p-3 rounded-xl border shadow-sm text-xs gap-3">
            {/* Font Family Selector */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-muted-foreground whitespace-nowrap">Font:</span>
              <select
                value={cvFontFamily}
                onChange={(e) => setCvFontFamily(e.target.value as any)}
                className="px-2.5 py-1 text-xs font-medium rounded-md border bg-background text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="cambria">Cambria (Recommended)</option>
              </select>
            </div>
          </div>

          {/* Responsive Printable A4 Sheet Wrapper */}
          <div className="w-full flex flex-col items-center py-2 space-y-8" ref={printRef}>

            {/* CV BODY CONTAINER (Fills Page 1 & Page 2 Naturally - Exact Match to Image 2 Format) */}
            <div
              className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl leading-[1.3] border border-gray-400 rounded-sm space-y-5"
              style={{
                boxSizing: 'border-box',
                padding: '12.7mm 15.24mm',
                color: '#000000',
                backgroundColor: '#ffffff',
                fontFamily:
                  cvFontFamily === 'calibri'
                    ? "Carlito, Calibri, Candara, Segoe, 'Segoe UI', Arial, sans-serif"
                    : cvFontFamily === 'arial'
                    ? "Arial, 'Helvetica Neue', Helvetica, sans-serif"
                    : cvFontFamily === 'aptos'
                    ? "Aptos, 'Segoe UI', Roboto, sans-serif"
                    : cvFontFamily === 'helvetica'
                    ? "Helvetica, 'Helvetica Neue', Arial, sans-serif"
                    : "Cambria, Lora, Georgia, serif",
              }}
            >
              {/* Clean Header (Exact Match to Image 2 Serif Centered Layout) */}
              <div className="pb-2 mb-2 text-center space-y-1" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h2 className="text-[16pt] font-extrabold uppercase text-black leading-tight tracking-wide">{applicantName || 'APPLICANT NAME'}</h2>
                <p className="text-[12pt] font-bold uppercase tracking-wide mt-1">
                  POSITION APPLIED FOR: <span className="uppercase">{positionApplied}</span>
                </p>
                {contactNo && (
                  <p className="text-[12pt] font-bold uppercase tracking-wide">
                    CONTACT NO.: {contactNo}
                  </p>
                )}
              </div>

              {/* Personal Details Section */}
              <div className="mb-2 space-y-1" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-[14pt] uppercase tracking-wide mb-1 border-t-2 border-black pt-1">
                  PERSONAL DETAILS
                </h3>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', lineHeight: '1.4' }}>
                  <tbody>
                    {/* Group 1: Passport Info */}
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Passport No.</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {passportNo || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Passport Valid Until</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>
                        : {formatDateCaps(passportValidUntil)}
                        {passportValidUntil && !calculatePassportRemaining(passportValidUntil).includes('N/A') && (
                          <>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            <span style={{ fontWeight: 'normal' }}>({calculatePassportRemaining(passportValidUntil)})</span>
                          </>
                        )}
                      </td>
                    </tr>

                    {/* Group 2: Birth Info */}
                    <tr style={{ height: '6pt' }}><td colSpan={2}></td></tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Date of Birth</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {formatDateLong(dob)}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Age</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {calculateAge(dob)}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Place of Birth</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {placeOfBirth || 'N/A'}</td>
                    </tr>

                    {/* Group 3: Physical & Languages */}
                    <tr style={{ height: '6pt' }}><td colSpan={2}></td></tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Nationality</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {nationality || 'Nepalese'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Height</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {formatHeight(height)}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Weight</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {formatWeight(weight)}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Languages</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {languages || 'Nepali, Hindi, Basic English'}</td>
                    </tr>

                    {/* Group 4: Demographics */}
                    <tr style={{ height: '6pt' }}><td colSpan={2}></td></tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Gender</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {gender || 'Male'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Religion</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {religion || 'Hindu'}</td>
                    </tr>
                    <tr>
                      <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Marital Status</td>
                      <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {maritalStatus || 'Single'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Career Objective Section */}
              <div className="mb-2 space-y-1" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-[14pt] uppercase tracking-wide mb-1 border-t-2 border-black pt-1">
                  CAREER OBJECTIVE
                </h3>
                <p className="text-[12pt] leading-[1.4] text-justify">{careerObjective}</p>
              </div>

              {/* Optional Driving License Section */}
              {hasLicense && licenses.length > 0 && (
                <div className="mb-2 space-y-1" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <h3 className="font-bold text-[14pt] uppercase tracking-wide mb-1 border-t-2 border-black pt-1">
                    DRIVING LICENSE
                  </h3>
                  {licenses.map((lic, idx) => (
                    <div key={lic.id} className={idx > 0 ? "pt-3 border-t border-dashed border-gray-300" : ""}>
                      {licenses.length > 1 && (
                        <p className="font-bold text-xs text-muted-foreground uppercase mb-1">License #{idx + 1}</p>
                      )}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', lineHeight: '1.4' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Issuing Country</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {lic.issuingCountry || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>License Number</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {lic.licenseNumber || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>License Type</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {lic.licenseType || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Valid Until</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {formatDateCaps(lic.licenseValidUntil)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {/* Work Experience Section */}
              <div className="mb-2 space-y-1">
                <h3 className="font-bold text-[14pt] uppercase tracking-wide mb-1 border-t-2 border-black pt-1" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  WORK EXPERIENCE
                </h3>
                <div className="space-y-5">
                  {experiences.map((exp, index) => (
                    <div key={index} className="text-[12pt] leading-[1.4] space-y-3 border-b border-gray-300 pb-4 last:border-0 last:pb-0" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      {/* Position, Company, Country, Duration Key-Value List */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt', lineHeight: '1.4' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Position</td>
                            <td style={{ fontWeight: 'bold', textTransform: 'uppercase', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {exp.position || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Company</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {exp.company || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Country</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {exp.country || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td style={{ width: '130pt', fontWeight: 'bold', padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>Duration</td>
                            <td style={{ padding: '2px 0', verticalAlign: 'top', textAlign: 'left' }}>: {exp.duration || 'N/A'}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Key Responsibilities Bullet Points */}
                      {exp.position && (
                        <div className="space-y-1 pt-1">
                          <p className="font-bold text-[12pt]">Key Responsibilities:</p>
                          <ul className="space-y-1 font-normal" style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            {(exp.responsibilities && exp.responsibilities.length > 0
                              ? exp.responsibilities
                              : index === 0 && responsibilities && responsibilities.length > 0
                              ? responsibilities
                              : getPositionDefaultDuties(exp.position)
                            ).map((r: string, i: number) => (
                              <li key={i} className="leading-snug">{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Education Section */}
              <div className="mb-2 space-y-0.5" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-[14pt] uppercase tracking-wide mb-0.5 border-t-2 border-black pt-0.5">
                  EDUCATION & ACADEMIC QUALIFICATION
                </h3>
                <p className="text-[12pt] font-semibold">{education}</p>
              </div>

              {/* Skills & Personal Strengths Section */}
              <div className="mb-2 space-y-0.5" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-[14pt] uppercase tracking-wide mb-0.5 border-t-2 border-black pt-0.5">
                  SKILLS & PERSONAL STRENGTHS
                </h3>
                <ul className="space-y-0.5 text-[12pt] leading-[1.2]">
                  {skillsList.map((skill, index) => (
                    <li key={index} style={{ paddingLeft: '0px', listStyleType: 'none', marginBottom: '1px' }}>
                      <span style={{ fontWeight: 'bold', marginRight: '6px' }}>✔</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Declaration Section */}
              <div className="pt-1 space-y-1" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <h3 className="font-bold text-[14pt] uppercase tracking-wide mb-1 border-t-2 border-black pt-1">
                  DECLARATION
                </h3>
                <p className="text-[11pt] leading-[1.3] italic">
                  I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.
                </p>
              </div>

              <div className="text-right text-[8pt] text-gray-500 font-semibold border-t border-gray-200 pt-2">
                Page 2 of {attachDocuments ? '3' : '2'}
              </div>
            </div>

            {/* PAGE 3+: Document Annexure */}
            {attachDocuments && attachments.some(att => att.frontImage || att.backImage) && (() => {
              const passportAtts = attachments.filter(att => att.category === 'passport' && (att.frontImage || att.backImage));
              const otherAtts = attachments.filter(att => att.category !== 'passport' && (att.frontImage || att.backImage));

              // Chunk other attachments (max 4 per page)
              const otherChunks: typeof otherAtts[] = [];
              for (let i = 0; i < otherAtts.length; i += 4) {
                otherChunks.push(otherAtts.slice(i, i + 4));
              }

              // Helper to render an attachment (Front & Back side-by-side if both exist)
              const renderAttachment = (att: any, maxHeight: string) => {
                const hasFront = !!att.frontImage;
                const hasBack = att.type === 'front_back' && !!att.backImage;
                
                if (hasFront && hasBack) {
                  return (
                    <div style={{ display: 'flex', gap: '2mm', width: '100%', height: maxHeight, alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={att.editedFrontImage || att.frontImage!}
                        alt={`${att.name} Front`}
                        style={{ maxWidth: '49%', maxHeight: maxHeight, objectFit: 'contain' }}
                      />
                      <img
                        src={att.editedBackImage || att.backImage!}
                        alt={`${att.name} Back`}
                        style={{ maxWidth: '49%', maxHeight: maxHeight, objectFit: 'contain' }}
                      />
                    </div>
                  );
                }
                
                const imgUrl = hasFront ? (att.editedFrontImage || att.frontImage) : (att.editedBackImage || att.backImage);
                if (!imgUrl) return null;
                
                return (
                  <div style={{ display: 'flex', width: '100%', height: maxHeight, alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={imgUrl}
                      alt={att.name}
                      style={{ maxWidth: '100%', maxHeight: maxHeight, objectFit: 'contain' }}
                    />
                  </div>
                );
              };

              return (
                <>
                  {/* Passport: front+back side by side OR single full-page */}
                  {passportAtts.map((att) => {
                    const hasFront = !!att.frontImage;
                    const hasBack = att.type === 'front_back' && !!att.backImage;
                    const bothSides = hasFront && hasBack;
                    return (
                      <div
                        key={att.id}
                        style={{
                          boxSizing: 'border-box',
                          padding: '12mm 14mm',
                          pageBreakBefore: 'always',
                          breakBefore: 'page',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl border border-gray-400 rounded-sm"
                      >
                        {bothSides ? (
                          <div style={{ display: 'flex', gap: '2mm', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={att.editedFrontImage || att.frontImage!}
                              alt="Passport Front"
                              style={{ maxWidth: '49%', maxHeight: '150mm', objectFit: 'contain' }}
                            />
                            <img
                              src={att.editedBackImage || att.backImage!}
                              alt="Passport Back"
                              style={{ maxWidth: '49%', maxHeight: '150mm', objectFit: 'contain' }}
                            />
                          </div>
                        ) : (
                          <img
                            src={(hasFront ? (att.editedFrontImage || att.frontImage) : (att.editedBackImage || att.backImage))!}
                            alt="Passport"
                            style={{ maxWidth: '100%', maxHeight: '140mm', objectFit: 'contain' }}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Other documents: adaptive layout */}
                  {otherChunks.map((chunk, chunkIdx) => (
                    <div
                      key={`other-chunk-${chunkIdx}`}
                      style={{
                        boxSizing: 'border-box',
                        padding: '12mm 14mm',
                        pageBreakBefore: 'always',
                        breakBefore: 'page',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                      className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black shadow-2xl border border-gray-400 rounded-sm"
                    >
                      {/* 1 doc — fills the entire page */}
                      {chunk.length === 1 && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {renderAttachment(chunk[0], '140mm')}
                        </div>
                      )}

                      {/* 2 docs — stacked top/bottom */}
                      {chunk.length === 2 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6mm', justifyContent: 'center' }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {renderAttachment(chunk[0], '118mm')}
                          </div>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {renderAttachment(chunk[1], '118mm')}
                          </div>
                        </div>
                      )}

                      {/* 3 docs — 2 on top, 1 centred bottom */}
                      {chunk.length === 3 && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6mm', justifyContent: 'center' }}>
                          <div style={{ display: 'flex', gap: '6mm', flex: 1 }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {renderAttachment(chunk[0], '118mm')}
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {renderAttachment(chunk[1], '118mm')}
                            </div>
                          </div>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {renderAttachment(chunk[2], '118mm')}
                          </div>
                        </div>
                      )}

                      {/* 4 docs — 2×2 grid */}
                      {chunk.length === 4 && (
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '6mm', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {renderAttachment(chunk[0], '115mm')}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {renderAttachment(chunk[1], '115mm')}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {renderAttachment(chunk[2], '115mm')}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {renderAttachment(chunk[3], '115mm')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
