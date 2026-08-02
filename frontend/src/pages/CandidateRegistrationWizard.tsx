import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import {
  fullCandidateRegistrationSchema,
  personalInfoSchema,
  passportSchema,
  educationSchema,
  experienceSchema,
  skillsSchema,
  certificatesSchema,
  languagesSchema,
  documentsSchema,
  CandidateWizardFormData,
} from '../lib/candidateFormValidation';
import { resumeApi } from '../services/api';
import { useToast } from '../components/ui/toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  User,
  FileText,
  GraduationCap,
  Briefcase,
  Sparkles,
  Award,
  Globe,
  UploadCloud,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Save,
} from 'lucide-react';

const STORAGE_KEY = 'candidate_registration_wizard_draft';

const STEPS = [
  { id: 1, name: 'Personal Info', icon: User },
  { id: 2, name: 'Passport', icon: FileText },
  { id: 3, name: 'Education', icon: GraduationCap },
  { id: 4, name: 'Experience', icon: Briefcase },
  { id: 5, name: 'Skills', icon: Sparkles },
  { id: 6, name: 'Certificates', icon: Award },
  { id: 7, name: 'Languages', icon: Globe },
  { id: 8, name: 'Documents', icon: UploadCloud },
  { id: 9, name: 'Preview & Submit', icon: CheckCircle2 },
];

const defaultInitialValues: CandidateWizardFormData = {
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    dob: '',
    nationality: 'American',
    maritalStatus: 'SINGLE',
    address: '',
  },
  passport: {
    passportNumber: '',
    placeOfIssue: '',
    issueDate: '',
    expiryDate: '',
  },
  education: {
    educations: [
      {
        degree: 'Bachelor of Science',
        fieldOfStudy: 'Computer Science',
        institution: 'State University',
        startDate: '2019-09-01',
        endDate: '2023-06-01',
        isCurrent: false,
        grade: '3.8 GPA',
      },
    ],
  },
  experience: {
    experiences: [
      {
        companyName: 'TechCorp Solutions',
        jobTitle: 'Software Engineer',
        startDate: '2023-07-01',
        isCurrent: true,
        responsibilities: 'Full stack development with React, Node.js and PostgreSQL',
      },
    ],
  },
  skills: {
    skills: [
      { name: 'TypeScript', yearsExperience: 3, proficiency: 'ADVANCED' },
      { name: 'React.js', yearsExperience: 3, proficiency: 'ADVANCED' },
    ],
  },
  certificates: {
    certificates: [
      {
        title: 'AWS Certified Developer',
        issuingOrganization: 'Amazon Web Services',
        issueDate: '2024-01-15',
      },
    ],
  },
  languages: {
    languages: [{ name: 'English', proficiency: 'NATIVE' }],
  },
  documents: {
    documents: [
      {
        title: 'Official Resume PDF',
        documentType: 'RESUME_PDF',
        fileUrl: 'https://example.com/resumes/candidate.pdf',
      },
    ],
  },
};

export function CandidateRegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Load initial draft from localStorage if present
  const getSavedValues = (): CandidateWizardFormData => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultInitialValues;
      }
    }
    return defaultInitialValues;
  };

  const methods = useForm<CandidateWizardFormData>({
    resolver: zodResolver(fullCandidateRegistrationSchema),
    defaultValues: getSavedValues(),
    mode: 'onChange',
  });

  const { register, control, handleSubmit, watch, getValues, formState: { errors } } = methods;

  // Dynamic Array Handlers
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education.educations' });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experience.experiences' });
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control, name: 'skills.skills' });
  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control, name: 'certificates.certificates' });
  const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({ control, name: 'languages.languages' });
  const { fields: docFields, append: appendDoc, remove: removeDoc } = useFieldArray({ control, name: 'documents.documents' });

  // Autosave effect
  const formValues = watch();
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
      setLastSavedTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearTimeout(timer);
  }, [formValues]);

  // Step Validation before Next
  const validateStep = async (step: number): Promise<boolean> => {
    const values = getValues();
    try {
      if (step === 1) await personalInfoSchema.parseAsync(values.personal);
      if (step === 2) await passportSchema.parseAsync(values.passport);
      if (step === 3) await educationSchema.parseAsync(values.education);
      if (step === 4) await experienceSchema.parseAsync(values.experience);
      if (step === 5) await skillsSchema.parseAsync(values.skills);
      if (step === 6) await certificatesSchema.parseAsync(values.certificates);
      if (step === 7) await languagesSchema.parseAsync(values.languages);
      if (step === 8) await documentsSchema.parseAsync(values.documents);
      return true;
    } catch (err: any) {
      toast({
        type: 'error',
        title: `Validation Error in Step ${step}`,
        message: 'Please complete required fields before proceeding.',
      });
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onFinalSubmit = async (data: CandidateWizardFormData) => {
    setIsSubmitting(true);
    try {
      // Create Candidate via Resume API
      await resumeApi.createResume({
        candidateName: `${data.personal.firstName} ${data.personal.lastName}`,
        email: data.personal.email,
        phone: data.personal.phone,
        summary: `Passport: ${data.passport.passportNumber}. Nationality: ${data.personal.nationality}. Address: ${data.personal.address}`,
        skills: data.skills.skills.map((s) => s.name),
        experienceYrs: data.experience.experiences.length * 2,
        education: data.education.educations[0]?.degree || '',
      });

      localStorage.removeItem(STORAGE_KEY);
      toast({
        type: 'success',
        title: 'Candidate Profile Registered!',
        message: 'Multi-step candidate registration complete and AI screened.',
      });
      navigate('/resumes');
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Registration Failed',
        message: error.response?.data?.message || 'Could not complete registration.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header & Autosave Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Candidate Registration Wizard</h1>
          <p className="text-sm text-muted-foreground">9-Step comprehensive candidate profile builder</p>
        </div>
        {lastSavedTime && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border">
            <Save className="h-3.5 w-3.5 text-emerald-500" />
            <span>Autosaved draft at {lastSavedTime}</span>
          </div>
        )}
      </div>

      {/* Progress Bar & Step Indicators */}
      <div className="border rounded-2xl p-4 bg-card shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={async () => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                  else if (step.id === currentStep + 1) {
                    const valid = await validateStep(currentStep);
                    if (valid) setCurrentStep(step.id);
                  }
                }}
                className={`flex flex-col items-center min-w-[80px] p-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : isCompleted
                    ? 'text-emerald-500 hover:bg-muted'
                    : 'text-muted-foreground opacity-60 hover:opacity-100'
                }`}
              >
                <div className="p-2 rounded-lg bg-background/20 mb-1">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] whitespace-nowrap">{step.name}</span>
              </button>
            );
          })}
        </div>

        {/* Linear Progress Indicator */}
        <div className="w-full bg-secondary h-2 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Wizard Form Body */}
      <Card className="border shadow-lg">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-xl flex items-center gap-2">
            Step {currentStep}: {STEPS[currentStep - 1].name}
          </CardTitle>
          <CardDescription>Fill out candidate details for step {currentStep} of 9</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onFinalSubmit)}>
          <CardContent className="p-6">
            {/* STEP 1: Personal Info */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="First Name" error={errors.personal?.firstName?.message} {...register('personal.firstName')} />
                <Input label="Last Name" error={errors.personal?.lastName?.message} {...register('personal.lastName')} />
                <Input label="Email Address" type="email" error={errors.personal?.email?.message} {...register('personal.email')} />
                <Input label="Phone Number" placeholder="+1 555-0123" error={errors.personal?.phone?.message} {...register('personal.phone')} />
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Gender</label>
                  <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" {...register('personal.gender')}>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <Input label="Date of Birth" type="date" error={errors.personal?.dob?.message} {...register('personal.dob')} />
                <Input label="Nationality" error={errors.personal?.nationality?.message} {...register('personal.nationality')} />
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Marital Status</label>
                  <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" {...register('personal.maritalStatus')}>
                    <option value="SINGLE">SINGLE</option>
                    <option value="MARRIED">MARRIED</option>
                    <option value="DIVORCED">DIVORCED</option>
                    <option value="WIDOWED">WIDOWED</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Input label="Residential Address" placeholder="123 Main St, City, Country" {...register('personal.address')} />
                </div>
              </div>
            )}

            {/* STEP 2: Passport */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Passport Number" placeholder="A12345678" error={errors.passport?.passportNumber?.message} {...register('passport.passportNumber')} />
                <Input label="Place of Issue" placeholder="Department of State / Embassy" error={errors.passport?.placeOfIssue?.message} {...register('passport.placeOfIssue')} />
                <Input label="Issue Date" type="date" error={errors.passport?.issueDate?.message} {...register('passport.issueDate')} />
                <Input label="Expiry Date" type="date" error={errors.passport?.expiryDate?.message} {...register('passport.expiryDate')} />
              </div>
            )}

            {/* STEP 3: Education */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {eduFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-xl bg-card space-y-4 relative">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-sm">Education Record #{index + 1}</span>
                      {eduFields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeEdu(index)} className="text-destructive">
                          <Trash2 className="h-4 w-4" /> Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Degree / Qualification" placeholder="B.Sc Computer Science" {...register(`education.educations.${index}.degree`)} />
                      <Input label="Field of Study" placeholder="Software Engineering" {...register(`education.educations.${index}.fieldOfStudy`)} />
                      <Input label="Institution" placeholder="Stanford University" {...register(`education.educations.${index}.institution`)} />
                      <Input label="Grade / GPA" placeholder="3.9 GPA" {...register(`education.educations.${index}.grade`)} />
                      <Input label="Start Date" type="date" {...register(`education.educations.${index}.startDate`)} />
                      <Input label="End Date" type="date" {...register(`education.educations.${index}.endDate`)} />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendEdu({ degree: '', fieldOfStudy: '', institution: '', startDate: '', isCurrent: false })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Another Education
                </Button>
              </div>
            )}

            {/* STEP 4: Experience */}
            {currentStep === 4 && (
              <div className="space-y-4">
                {expFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-xl bg-card space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-sm">Work Experience #{index + 1}</span>
                      {expFields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeExp(index)} className="text-destructive">
                          <Trash2 className="h-4 w-4" /> Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Company Name" placeholder="Google LLC" {...register(`experience.experiences.${index}.companyName`)} />
                      <Input label="Job Title" placeholder="Senior Developer" {...register(`experience.experiences.${index}.jobTitle`)} />
                      <Input label="Start Date" type="date" {...register(`experience.experiences.${index}.startDate`)} />
                      <Input label="End Date" type="date" {...register(`experience.experiences.${index}.endDate`)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">Key Responsibilities</label>
                      <textarea rows={3} className="w-full p-3 border rounded-md bg-background text-sm" placeholder="Summarize key achievements..." {...register(`experience.experiences.${index}.responsibilities`)} />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendExp({ companyName: '', jobTitle: '', startDate: '', isCurrent: false })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Experience Record
                </Button>
              </div>
            )}

            {/* STEP 5: Skills */}
            {currentStep === 5 && (
              <div className="space-y-4">
                {skillFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-xl bg-card flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                      <Input label="Skill Name" placeholder="React.js / Node.js" {...register(`skills.skills.${index}.name`)} />
                    </div>
                    <div className="w-full md:w-40">
                      <Input label="Years Exp." type="number" {...register(`skills.skills.${index}.yearsExperience`)} />
                    </div>
                    <div className="w-full md:w-48">
                      <label className="text-sm font-medium block mb-1">Proficiency</label>
                      <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" {...register(`skills.skills.${index}.proficiency`)}>
                        <option value="BEGINNER">BEGINNER</option>
                        <option value="INTERMEDIATE">INTERMEDIATE</option>
                        <option value="ADVANCED">ADVANCED</option>
                        <option value="FLUENT">FLUENT</option>
                        <option value="NATIVE">NATIVE</option>
                      </select>
                    </div>
                    {skillFields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSkill(index)} className="text-destructive mt-6">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendSkill({ name: '', yearsExperience: 1, proficiency: 'INTERMEDIATE' })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Skill
                </Button>
              </div>
            )}

            {/* STEP 6: Certificates */}
            {currentStep === 6 && (
              <div className="space-y-4">
                {certFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-xl bg-card space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-sm">Certificate #{index + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeCert(index)} className="text-destructive">
                        <Trash2 className="h-4 w-4" /> Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Certificate Title" placeholder="PMP Certified" {...register(`certificates.certificates.${index}.title`)} />
                      <Input label="Issuing Organization" placeholder="PMI Institute" {...register(`certificates.certificates.${index}.issuingOrganization`)} />
                      <Input label="Issue Date" type="date" {...register(`certificates.certificates.${index}.issueDate`)} />
                      <Input label="Credential URL / ID" placeholder="https://credential.id" {...register(`certificates.certificates.${index}.credentialUrl`)} />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendCert({ title: '', issuingOrganization: '', issueDate: '' })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Certificate
                </Button>
              </div>
            )}

            {/* STEP 7: Languages */}
            {currentStep === 7 && (
              <div className="space-y-4">
                {langFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-xl bg-card flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                      <Input label="Language Name" placeholder="English / Spanish" {...register(`languages.languages.${index}.name`)} />
                    </div>
                    <div className="w-full md:w-64">
                      <label className="text-sm font-medium block mb-1">Proficiency</label>
                      <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" {...register(`languages.languages.${index}.proficiency`)}>
                        <option value="BEGINNER">BEGINNER</option>
                        <option value="INTERMEDIATE">INTERMEDIATE</option>
                        <option value="ADVANCED">ADVANCED</option>
                        <option value="FLUENT">FLUENT</option>
                        <option value="NATIVE">NATIVE</option>
                      </select>
                    </div>
                    {langFields.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLang(index)} className="text-destructive mt-6">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendLang({ name: '', proficiency: 'INTERMEDIATE' })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Language
                </Button>
              </div>
            )}

            {/* STEP 8: Documents */}
            {currentStep === 8 && (
              <div className="space-y-4">
                {docFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-xl bg-card space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-bold text-sm">Document #{index + 1}</span>
                      {docFields.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeDoc(index)} className="text-destructive">
                          <Trash2 className="h-4 w-4" /> Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <Input label="Document Title" placeholder="Resume PDF / Passport Copy" {...register(`documents.documents.${index}.title`)} />
                      <div>
                        <label className="text-sm font-medium block mb-1">Document Type</label>
                        <select className="w-full h-10 px-3 rounded-md border bg-background text-sm" {...register(`documents.documents.${index}.documentType`)}>
                          <option value="RESUME_PDF">RESUME PDF</option>
                          <option value="PASSPORT">PASSPORT</option>
                          <option value="VISA">VISA</option>
                          <option value="MEDICAL_REPORT">MEDICAL REPORT</option>
                          <option value="CERTIFICATE">CERTIFICATE</option>
                          <option value="PHOTO">PHOTO</option>
                          <option value="CONTRACT">CONTRACT</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>
                      <Input label="File URL / Path" placeholder="https://example.com/doc.pdf" {...register(`documents.documents.${index}.fileUrl`)} />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => appendDoc({ title: 'New File', documentType: 'OTHER', fileUrl: 'https://example.com/file.pdf' })}>
                  <Plus className="mr-2 h-4 w-4" /> Add Document
                </Button>
              </div>
            )}

            {/* STEP 9: Preview & Submit */}
            {currentStep === 9 && (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Please review candidate information before final submission.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="p-4 border rounded-xl space-y-2 bg-card">
                    <h4 className="font-bold border-b pb-2 text-primary">Personal Details</h4>
                    <p><strong>Name:</strong> {formValues.personal.firstName} {formValues.personal.lastName}</p>
                    <p><strong>Email:</strong> {formValues.personal.email}</p>
                    <p><strong>Phone:</strong> {formValues.personal.phone}</p>
                    <p><strong>Nationality:</strong> {formValues.personal.nationality}</p>
                  </div>

                  <div className="p-4 border rounded-xl space-y-2 bg-card">
                    <h4 className="font-bold border-b pb-2 text-primary">Passport Info</h4>
                    <p><strong>Passport #:</strong> {formValues.passport.passportNumber}</p>
                    <p><strong>Place of Issue:</strong> {formValues.passport.placeOfIssue}</p>
                    <p><strong>Expiry Date:</strong> {formValues.passport.expiryDate}</p>
                  </div>

                  <div className="p-4 border rounded-xl space-y-2 bg-card md:col-span-2">
                    <h4 className="font-bold border-b pb-2 text-primary">Skills & Languages</h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formValues.skills.skills.map((s, idx) => (
                        <Badge key={idx} variant="outline">{s.name} ({s.proficiency})</Badge>
                      ))}
                      {formValues.languages.languages.map((l, idx) => (
                        <Badge key={idx} variant="secondary">{l.name} ({l.proficiency})</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          {/* Wizard Footer Controls */}
          <CardFooter className="flex justify-between border-t p-6">
            <Button type="button" variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous Step
            </Button>

            {currentStep < 9 ? (
              <Button type="button" onClick={handleNext}>
                Next Step <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Submit Candidate Profile
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
