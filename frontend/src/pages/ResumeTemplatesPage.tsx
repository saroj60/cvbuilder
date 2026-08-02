import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { pdfApi, resumeApi } from '../services/api';
import {
  Palette,
  Type,
  Eye,
  EyeOff,
  QrCode,
  Printer,
  Check,
  Edit3,
  UserCheck,
  FileBadge,
} from 'lucide-react';

const COLOR_PALETTES = [
  { name: 'Royal Blue', hex: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Emerald Green', hex: '#059669', bg: 'bg-emerald-600' },
  { name: 'Indigo Purple', hex: '#4f46e5', bg: 'bg-indigo-600' },
  { name: 'Amber Gold', hex: '#d97706', bg: 'bg-amber-600' },
  { name: 'Rose Red', hex: '#e11d48', bg: 'bg-rose-600' },
  { name: 'Slate Dark', hex: '#334155', bg: 'bg-slate-700' },
];

const FONTS = [
  { name: 'Inter (Sans)', class: 'font-sans' },
  { name: 'Georgia (Serif)', class: 'font-serif' },
  { name: 'Monospace Code', class: 'font-mono' },
];

const TEMPLATES = [
  { id: 'overseas_gulf', name: 'Overseas Official Gulf CV', tag: 'Strict Embassy & Gulf Standard', desc: 'Curriculum Vitae header, Passport validity countdown, Age, Career Objective, optional License & 5 safety duties' },
  { id: 'modern', name: 'Modern Minimal', tag: 'Global Standard', desc: 'Clean two-column layout with subtle accent headers' },
  { id: 'gulf', name: 'Saudi / Qatar / UAE Executive', tag: 'Middle East Visa Format', desc: 'Passport details, embassy verification QR code & photo frame' },
  { id: 'ats', name: 'Strict ATS Standard', tag: '100% Parser Friendly', desc: 'Single-column structured plain format optimized for ATS software' },
  { id: 'europass', name: 'European International', tag: 'Europe / UK Format', desc: 'Competency matrix, language proficiencies & digital signature' },
  { id: 'creative', name: 'Creative / Japan CV', tag: 'Visual Portfolio Format', desc: 'Dynamic accent sidebar, QR code badge & digital stamp seal' },
];

// Helper to calculate Age from Date of Birth
function calculateAge(dobString: string): string {
  if (!dobString) return 'N/A';
  const dob = new Date(dobString);
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  return isNaN(age) ? '30 Years' : `${age} Years`;
}

// Helper to calculate Remaining Passport Validity
function calculatePassportRemaining(expiryString: string): string {
  if (!expiryString) return '4 Years 5 Months';
  const expiry = new Date(expiryString);
  const now = new Date();

  if (expiry < now) return 'Expired';

  let years = expiry.getFullYear() - now.getFullYear();
  let months = expiry.getMonth() - now.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years > 0) {
    return `${years} Year${years > 1 ? 's' : ''} ${months} Month${months > 1 ? 's' : ''}`;
  }
  return `${months} Month${months > 1 ? 's' : ''}`;
}

export function ResumeTemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('overseas_gulf');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [selectedFont, setSelectedFont] = useState('font-sans');
  const [showPhoto, setShowPhoto] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [isEditingContent, setIsEditingContent] = useState(false);

  // Resume Data State
  const [candidateData, setCandidateData] = useState({
    name: 'RAM BAHADUR THAPA',
    jobTitle: 'SCAFFOLDER',
    contactNo: '+977 9801234567',
    email: 'ram.thapa@example.com',
    phone: '+977 9801234567',
    location: 'Kathmandu, Nepal / Available for Overseas Deployment',
    passportNumber: 'N08492019',
    passportValidUntil: '2030-10-15',
    dob: '1994-06-15',
    placeOfBirth: 'Kathmandu, Nepal',
    nationality: 'Nepali',
    height: "5' 8\"",
    weight: '68 kg',
    languages: 'English, Nepali, Basic Arabic',
    gender: 'Male',
    religion: 'Hindu',
    maritalStatus: 'Married',
    summary:
      'Dedicated and safety-focused Scaffolder with experience in industrial and construction projects. Skilled in scaffold erection, dismantling, inspection, and maintenance while following HSE standards. Experienced in working at heights, handling scaffold materials, and supporting teams to complete projects safely and efficiently.',
    hasLicense: false,
    issuingCountry: 'Nepal',
    licenseNumber: '01-06-0049281',
    licenseType: 'Light Vehicle (Category B)',
    licenseValidUntil: '2028-12-31',
    skillsText: 'Scaffold Erection, Dismantling, Inspection, HSE Compliance, Working at Heights, Material Handling, Teamwork',
    experienceText: 'Scaffolder — Al Habtoor Engineering Co. (UAE, 4 Years)\nAssistant Scaffolder — Nepal Infrastructure Pvt Ltd (Nepal, 2 Years)',
    responsibilitiesList: [
      'Built and dismantled different types of scaffolding according to project requirements.',
      'Installed scaffold platforms, guardrails, ladders, and safe access systems.',
      'Inspected scaffolding before use to ensure worker safety.',
      'Followed HSE procedures and used proper PPE while working at heights.',
      'Worked with supervisors and team members to complete daily tasks safely and efficiently.',
    ],
    education: 'SEE / SLC Passed',
  });

  const printRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { data: candidates } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => resumeApi.getCandidates(),
  });

  const handlePrint = () => {
    window.print();
  };

  const handlePuppeteerDownload = async () => {
    if (!printRef.current) return;
    setIsGeneratingPdf(true);
    try {
      await pdfApi.downloadPDF(printRef.current.innerHTML, {
        watermarkText: 'VERIFIED OVERSEAS RECRUITMENT DOSSIER',
        headerTitle: 'CURRICULUM VITAE - OVERSEAS RECRUITMENT',
        filename: `${candidateData.name.replace(/\s+/g, '_')}_Overseas_CV_${Date.now()}`,
      });
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSelectCandidate = (candId: string) => {
    const found = candidates?.find((c: any) => c.id === candId);
    if (found) {
      setCandidateData({
        ...candidateData,
        name: `${found.firstName} ${found.lastName}`.toUpperCase(),
        jobTitle: (found.demand?.title || 'SCAFFOLDER').toUpperCase(),
        email: found.email,
        phone: found.phone,
        contactNo: found.phone,
        location: `${found.address || found.nationality} / Available for Deployment`,
        passportNumber: found.passport?.passportNumber || 'N08492019',
        passportValidUntil: found.passport?.expiryDate ? new Date(found.passport.expiryDate).toISOString().split('T')[0] : '2030-10-15',
        dob: found.dob ? new Date(found.dob).toISOString().split('T')[0] : '1994-06-15',
        nationality: found.nationality || 'Nepali',
        gender: found.gender || 'Male',
        maritalStatus: found.maritalStatus || 'Single',
        summary: `Dedicated and safety-focused ${found.demand?.title || 'Professional'} candidate with experience in industrial and commercial projects. Expert in adhering to HSE standards and overseas deployment requirements.`,
        skillsText: found.skills?.map((s: any) => s.skill?.name || s).join(', ') || candidateData.skillsText,
      });
    }
  };

  const skillsList = candidateData.skillsText.split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Premium Resume Templates & Customizer <FileBadge className="h-7 w-7 text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Official A4 Print-Ready layouts for Overseas Gulf Recruitment, Saudi, Qatar, UAE & Global Standards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsEditingContent(!isEditingContent)} variant="outline">
            <Edit3 className="mr-2 h-4 w-4" /> {isEditingContent ? 'Hide Form' : 'Edit Resume Text'}
          </Button>
          <Button onClick={handlePrint} variant="outline" className="shadow-sm">
            <Printer className="mr-2 h-4 w-4" /> Quick Print
          </Button>
          <Button onClick={handlePuppeteerDownload} isLoading={isGeneratingPdf} className="shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white">
            <Printer className="mr-2 h-4 w-4" /> Download High-Res A4 PDF
          </Button>
        </div>
      </div>

      {/* Candidate Selector Bar */}
      {candidates && candidates.length > 0 && (
        <Card className="p-3 border bg-muted/20 flex items-center gap-3">
          <UserCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase text-muted-foreground">Load Registered Candidate:</span>
          <select
            className="h-8 px-3 rounded-md border text-xs bg-background font-semibold"
            onChange={(e) => handleSelectCandidate(e.target.value)}
          >
            <option value="">Select candidate to populate template...</option>
            {candidates.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} ({c.email})
              </option>
            ))}
          </select>
        </Card>
      )}

      {/* Edit Content Form */}
      {isEditingContent && (
        <Card className="p-6 border bg-card space-y-4 shadow-md">
          <h3 className="font-bold text-sm text-primary uppercase border-b pb-2 flex items-center gap-2">
            <Edit3 className="h-4 w-4" /> Live Resume Content Form
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Applicant Name" value={candidateData.name} onChange={(e) => setCandidateData({ ...candidateData, name: e.target.value.toUpperCase() })} />
            <Input label="Position Applied For" value={candidateData.jobTitle} onChange={(e) => setCandidateData({ ...candidateData, jobTitle: e.target.value.toUpperCase() })} />
            <Input label="Contact No." value={candidateData.contactNo} onChange={(e) => setCandidateData({ ...candidateData, contactNo: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Passport No." value={candidateData.passportNumber} onChange={(e) => setCandidateData({ ...candidateData, passportNumber: e.target.value.toUpperCase() })} />
            <Input label="Passport Valid Until" type="date" value={candidateData.passportValidUntil} onChange={(e) => setCandidateData({ ...candidateData, passportValidUntil: e.target.value })} />
            <Input label="Date of Birth" type="date" value={candidateData.dob} onChange={(e) => setCandidateData({ ...candidateData, dob: e.target.value })} />
            <Input label="Nationality" value={candidateData.nationality} onChange={(e) => setCandidateData({ ...candidateData, nationality: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Height" value={candidateData.height} onChange={(e) => setCandidateData({ ...candidateData, height: e.target.value })} />
            <Input label="Weight" value={candidateData.weight} onChange={(e) => setCandidateData({ ...candidateData, weight: e.target.value })} />
            <Input label="Religion" value={candidateData.religion} onChange={(e) => setCandidateData({ ...candidateData, religion: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="checkbox" checked={candidateData.hasLicense} onChange={(e) => setCandidateData({ ...candidateData, hasLicense: e.target.checked })} />
              Include Driving License Information
            </label>
          </div>
          {candidateData.hasLicense && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/20 p-3 rounded-lg border">
              <Input label="License Country" value={candidateData.issuingCountry} onChange={(e) => setCandidateData({ ...candidateData, issuingCountry: e.target.value })} />
              <Input label="License Number" value={candidateData.licenseNumber} onChange={(e) => setCandidateData({ ...candidateData, licenseNumber: e.target.value })} />
              <Input label="License Type" value={candidateData.licenseType} onChange={(e) => setCandidateData({ ...candidateData, licenseType: e.target.value })} />
              <Input label="Valid Until" type="date" value={candidateData.licenseValidUntil} onChange={(e) => setCandidateData({ ...candidateData, licenseValidUntil: e.target.value })} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold block mb-1">Career Objective</label>
            <textarea rows={3} className="w-full p-3 rounded-md border text-xs bg-background" value={candidateData.summary} onChange={(e) => setCandidateData({ ...candidateData, summary: e.target.value })} />
          </div>
        </Card>
      )}

      {/* Control Panel */}
      <Card className="border p-4 bg-card shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Template Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Select Template Layout
            </label>
            <select
              className="w-full h-10 px-3 rounded-md border bg-background text-xs font-bold text-primary"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.tag})
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-primary" /> Accent Color
            </label>
            <div className="flex items-center gap-1.5">
              {COLOR_PALETTES.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setAccentColor(c.hex)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all flex items-center justify-center ${
                    accentColor === c.hex ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  }`}
                >
                  {accentColor === c.hex && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Font Selector */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5 flex items-center gap-1">
              <Type className="h-3.5 w-3.5 text-primary" /> Font Family
            </label>
            <select
              className="w-full h-10 px-3 rounded-md border bg-background text-xs font-medium"
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
            >
              {FONTS.map((f) => (
                <option key={f.class} value={f.class}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Feature Toggles */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1.5">
              Layout Elements
            </label>
            <div className="flex items-center gap-1 overflow-x-auto">
              <Button variant={showPhoto ? 'primary' : 'outline'} size="sm" className="text-xs h-8 px-2.5" onClick={() => setShowPhoto(!showPhoto)}>
                {showPhoto ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />} Photo
              </Button>
              <Button variant={showQrCode ? 'primary' : 'outline'} size="sm" className="text-xs h-8 px-2.5" onClick={() => setShowQrCode(!showQrCode)}>
                <QrCode className="h-3.5 w-3.5 mr-1" /> QR
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* A4 Resume Live Canvas */}
      <div className="flex justify-center bg-muted/40 p-4 md:p-8 rounded-2xl border overflow-x-auto">
        <div
          ref={printRef}
          className={`w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl p-8 md:p-12 transition-all ${selectedFont}`}
          style={{ boxSizing: 'border-box' }}
        >
          {/* TEMPLATE 0: Overseas Official Gulf CV Structure */}
          {selectedTemplate === 'overseas_gulf' && (
            <div className="space-y-6 leading-relaxed">
              {/* Header Section */}
              <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                <h1 className="text-2xl font-black tracking-widest uppercase">CURRICULUM VITAE</h1>
                <h2 className="text-xl font-bold uppercase mt-1" style={{ color: accentColor }}>{candidateData.name}</h2>
                <div className="mt-2 text-xs font-bold text-slate-800 space-y-0.5">
                  <p>POSITION APPLIED FOR: <span className="underline font-extrabold">{candidateData.jobTitle}</span></p>
                  {candidateData.contactNo && <p>CONTACT NO.: {candidateData.contactNo}</p>}
                </div>
              </div>

              {/* Personal Details */}
              <div className="mb-6">
                <h3 className="font-extrabold text-sm uppercase tracking-wider border-b border-slate-800 pb-1 mb-3">
                  PERSONAL DETAILS
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-800 font-medium">
                  <div><span className="font-bold">Passport No. :</span> {candidateData.passportNumber}</div>
                  <div><span className="font-bold">Passport Valid Until :</span> {candidateData.passportValidUntil}</div>
                  <div><span className="font-bold">Remaining To Expire :</span> {calculatePassportRemaining(candidateData.passportValidUntil)}</div>
                  <div><span className="font-bold">Date of Birth :</span> {candidateData.dob}</div>
                  <div><span className="font-bold">Age :</span> {calculateAge(candidateData.dob)}</div>
                  <div><span className="font-bold">Place of Birth :</span> {candidateData.placeOfBirth}</div>
                  <div><span className="font-bold">Nationality :</span> {candidateData.nationality}</div>
                  <div><span className="font-bold">Height :</span> {candidateData.height}</div>
                  <div><span className="font-bold">Weight :</span> {candidateData.weight}</div>
                  <div><span className="font-bold">Languages :</span> {candidateData.languages}</div>
                  <div><span className="font-bold">Gender :</span> {candidateData.gender}</div>
                  <div><span className="font-bold">Religion :</span> {candidateData.religion}</div>
                  <div><span className="font-bold">Marital Status :</span> {candidateData.maritalStatus}</div>
                </div>
              </div>

              {/* Career Objective */}
              <div className="mb-6">
                <h3 className="font-extrabold text-sm uppercase tracking-wider border-b border-slate-800 pb-1 mb-2">
                  CAREER OBJECTIVE
                </h3>
                <p className="text-xs text-slate-800 leading-relaxed text-justify">{candidateData.summary}</p>
              </div>

              {/* Driving License Optional */}
              {candidateData.hasLicense && (
                <div className="mb-6">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider border-b border-slate-800 pb-1 mb-2">
                    DRIVING LICENSE
                  </h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-800">
                    <div><span className="font-bold">Issuing Country :</span> {candidateData.issuingCountry}</div>
                    <div><span className="font-bold">License Number :</span> {candidateData.licenseNumber}</div>
                    <div><span className="font-bold">License Type :</span> {candidateData.licenseType}</div>
                    <div><span className="font-bold">Valid Until :</span> {candidateData.licenseValidUntil}</div>
                  </div>
                </div>
              )}

              {/* Work Experience */}
              <div className="mb-6">
                <h3 className="font-extrabold text-sm uppercase tracking-wider border-b border-slate-800 pb-1 mb-3">
                  WORK EXPERIENCE
                </h3>
                <div className="text-xs space-y-1 whitespace-pre-line text-slate-800">
                  {candidateData.experienceText}
                </div>

                <div className="mt-3 text-xs">
                  <p className="font-bold text-slate-900 mb-1.5">Key Responsibilities:</p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-800">
                    {candidateData.responsibilitiesList.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Education */}
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider border-b border-slate-800 pb-1 mb-2">
                  EDUCATION
                </h3>
                <p className="text-xs text-slate-800 font-semibold">{candidateData.education}</p>
              </div>
            </div>
          )}

          {/* TEMPLATE 1: Modern Minimal */}
          {selectedTemplate === 'modern' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b-2 pb-6" style={{ borderColor: accentColor }}>
                <div className="space-y-1">
                  <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: accentColor }}>
                    {candidateData.name}
                  </h1>
                  <p className="text-base font-semibold text-slate-600">{candidateData.jobTitle}</p>
                  <p className="text-xs text-slate-500">{candidateData.email} • {candidateData.phone} • {candidateData.location}</p>
                </div>
                {showPhoto && (
                  <div className="w-20 h-20 rounded-xl bg-slate-200 border-2 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-400">
                    PHOTO
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                    Professional Summary
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{candidateData.summary}</p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>
                    Work Experience
                  </h3>
                  <div className="space-y-3 text-xs text-slate-700 whitespace-pre-line">
                    {candidateData.experienceText}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
                    Technical Competencies
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 2: Saudi / Qatar / UAE Gulf Executive Format */}
          {selectedTemplate === 'gulf' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl text-white flex justify-between items-center" style={{ backgroundColor: accentColor }}>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">
                    Middle East Overseas Deployment CV
                  </span>
                  <h1 className="text-2xl font-extrabold">{candidateData.name}</h1>
                  <p className="text-xs font-medium text-white/90">{candidateData.jobTitle}</p>
                  <p className="text-[11px] text-white/80">Passport: {candidateData.passportNumber} • Nationality: {candidateData.nationality}</p>
                </div>
                {showPhoto && (
                  <div className="w-20 h-24 rounded border-2 border-white/40 bg-white/10 flex items-center justify-center text-[10px] font-bold">
                    PASSPORT PHOTO
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-6 text-xs">
                <div className="col-span-2 space-y-4">
                  <div>
                    <h4 className="font-bold border-b pb-1 mb-2" style={{ color: accentColor }}>EXECUTIVE SUMMARY</h4>
                    <p className="text-slate-700 leading-relaxed">{candidateData.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-bold border-b pb-1 mb-2" style={{ color: accentColor }}>EMPLOYMENT HISTORY</h4>
                    <p className="whitespace-pre-line text-slate-700">{candidateData.experienceText}</p>
                  </div>
                </div>

                <div className="space-y-4 border-l pl-4">
                  {showQrCode && (
                    <div className="p-3 border rounded-lg text-center space-y-1 bg-slate-50">
                      <QrCode className="mx-auto h-12 w-12" style={{ color: accentColor }} />
                      <p className="text-[9px] font-bold text-slate-600">Embassy Verification QR</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold mb-2" style={{ color: accentColor }}>SKILLS</h4>
                    <ul className="space-y-1 text-[11px]">
                      {skillsList.map((s, i) => (
                        <li key={i} className="flex items-center gap-1">✓ {s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 3: Strict ATS Standard */}
          {selectedTemplate === 'ats' && (
            <div className="space-y-5 text-slate-900 text-xs font-sans">
              <div className="text-center border-b pb-4">
                <h1 className="text-2xl font-bold uppercase">{candidateData.name}</h1>
                <p className="font-semibold text-slate-700">{candidateData.jobTitle}</p>
                <p className="text-[11px] text-slate-600">{candidateData.email} | {candidateData.phone} | {candidateData.location}</p>
              </div>

              <div>
                <h2 className="font-bold uppercase border-b border-slate-300 pb-0.5 mb-1.5" style={{ color: accentColor }}>PROFESSIONAL SUMMARY</h2>
                <p className="text-slate-800">{candidateData.summary}</p>
              </div>

              <div>
                <h2 className="font-bold uppercase border-b border-slate-300 pb-0.5 mb-2" style={{ color: accentColor }}>WORK EXPERIENCE</h2>
                <p className="whitespace-pre-line text-slate-800">{candidateData.experienceText}</p>
              </div>

              <div>
                <h2 className="font-bold uppercase border-b border-slate-300 pb-0.5 mb-1.5" style={{ color: accentColor }}>TECHNICAL SKILLS</h2>
                <p className="text-slate-800">{skillsList.join(', ')}</p>
              </div>
            </div>
          )}

          {/* TEMPLATE 4: European Europass / International */}
          {selectedTemplate === 'europass' && (
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center border-b-4 pb-4" style={{ borderColor: accentColor }}>
                <div>
                  <h1 className="text-2xl font-extrabold">{candidateData.name}</h1>
                  <p className="font-bold" style={{ color: accentColor }}>Europass CV Format</p>
                  <p className="text-[11px] text-slate-500">{candidateData.email} • {candidateData.phone}</p>
                </div>
                <Badge variant="outline" className="text-xs px-3 py-1 font-bold">EU International</Badge>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                  <div>
                    <h3 className="font-bold uppercase border-b pb-1 mb-2" style={{ color: accentColor }}>Work Experience</h3>
                    <p className="whitespace-pre-line text-slate-700">{candidateData.experienceText}</p>
                  </div>
                </div>

                <div className="space-y-4 border-l pl-4">
                  <div>
                    <h3 className="font-bold uppercase mb-2" style={{ color: accentColor }}>Skills & Languages</h3>
                    <p className="text-slate-700">{skillsList.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATE 5: Creative / Japan CV Format */}
          {selectedTemplate === 'creative' && (
            <div className="space-y-6 text-xs">
              <div className="p-6 rounded-2xl border-2 flex items-center justify-between" style={{ borderColor: accentColor }}>
                <div className="space-y-1">
                  <h1 className="text-3xl font-extrabold">{candidateData.name}</h1>
                  <p className="font-semibold text-slate-600">{candidateData.jobTitle}</p>
                </div>
                {showQrCode && <QrCode className="h-10 w-10" style={{ color: accentColor }} />}
              </div>

              <div>
                <h3 className="font-extrabold uppercase mb-2" style={{ color: accentColor }}>Core Competencies</h3>
                <div className="grid grid-cols-4 gap-2">
                  {skillsList.map((s, i) => (
                    <div key={i} className="p-2 text-center rounded border font-bold text-[11px] bg-slate-50">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
