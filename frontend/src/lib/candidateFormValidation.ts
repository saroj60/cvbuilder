import { z } from 'zod';

export const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Valid phone number is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dob: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(2, 'Nationality is required'),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
  address: z.string().optional(),
});

export const passportSchema = z.object({
  passportNumber: z.string().min(5, 'Passport number is required'),
  placeOfIssue: z.string().min(2, 'Place of issue is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
});

export const educationItemSchema = z.object({
  degree: z.string().min(2, 'Degree is required'),
  fieldOfStudy: z.string().min(2, 'Field of study is required'),
  institution: z.string().min(2, 'Institution name is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  grade: z.string().optional(),
});

export const educationSchema = z.object({
  educations: z.array(educationItemSchema).min(1, 'At least one education record is required'),
});

export const experienceItemSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  jobTitle: z.string().min(2, 'Job title is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  responsibilities: z.string().optional(),
});

export const experienceSchema = z.object({
  experiences: z.array(experienceItemSchema).min(1, 'At least one experience record is required'),
});

export const skillItemSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  yearsExperience: z.coerce.number().min(1, 'Years must be at least 1'),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'FLUENT', 'NATIVE']),
});

export const skillsSchema = z.object({
  skills: z.array(skillItemSchema).min(1, 'At least one skill is required'),
});

export const certificateItemSchema = z.object({
  title: z.string().min(2, 'Certificate title is required'),
  issuingOrganization: z.string().min(2, 'Issuing organization is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().optional(),
});

export const certificatesSchema = z.object({
  certificates: z.array(certificateItemSchema).default([]),
});

export const languageItemSchema = z.object({
  name: z.string().min(2, 'Language name is required'),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'FLUENT', 'NATIVE']),
});

export const languagesSchema = z.object({
  languages: z.array(languageItemSchema).min(1, 'At least one language is required'),
});

export const documentItemSchema = z.object({
  title: z.string().min(2, 'Document title is required'),
  documentType: z.enum([
    'PASSPORT',
    'VISA',
    'MEDICAL_REPORT',
    'CERTIFICATE',
    'RESUME_PDF',
    'PHOTO',
    'CONTRACT',
    'OTHER',
  ]),
  fileUrl: z.string().url('Must be a valid URL or path'),
});

export const documentsSchema = z.object({
  documents: z.array(documentItemSchema).min(1, 'At least one document is required'),
});

export const fullCandidateRegistrationSchema = z.object({
  personal: personalInfoSchema,
  passport: passportSchema,
  education: educationSchema,
  experience: experienceSchema,
  skills: skillsSchema,
  certificates: certificatesSchema,
  languages: languagesSchema,
  documents: documentsSchema,
});

export type CandidateWizardFormData = z.infer<typeof fullCandidateRegistrationSchema>;
