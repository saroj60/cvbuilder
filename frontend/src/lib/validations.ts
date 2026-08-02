import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleName: z.enum(['ADMIN', 'RECRUITER', 'EMPLOYER', 'AGENT', 'CANDIDATE', 'AUDITOR']).default('RECRUITER'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export const resumeSchema = z.object({
  candidateName: z.string().min(2, 'Candidate name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  summary: z.string().optional(),
  skills: z.string().transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean)),
  experienceYrs: z.coerce.number().min(0, 'Years of experience cannot be negative'),
  education: z.string().optional(),
  jobId: z.string().optional(),
});

export const jobSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  department: z.string().min(2, 'Department is required'),
  location: z.string().min(2, 'Location is required'),
  description: z.string().min(10, 'Provide a detailed job description'),
  skills: z.string().transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean)),
});

export const employerSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  companyEmail: z.string().email('Please enter a valid email address'),
  companyPhone: z.string().min(6, 'Valid contact phone number is required'),
  country: z.string().min(2, 'Country is required'),
  address: z.string().optional(),
  contactPerson: z.string().min(2, 'Primary contact person is required'),
  website: z.string().url('Must be a valid website URL').optional().or(z.literal('')),
  isVerified: z.boolean().default(true),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ResumeFormData = z.infer<typeof resumeSchema>;
export type JobFormData = z.infer<typeof jobSchema>;
export type EmployerFormData = z.infer<typeof employerSchema>;
