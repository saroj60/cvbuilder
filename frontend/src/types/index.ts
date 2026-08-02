export type Role = 'RECRUITER' | 'ADMIN' | 'CANDIDATE';

export type ResumeStatus = 'PENDING' | 'PARSED' | 'SHORTLISTED' | 'REJECTED' | 'INTERVIEWED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role | string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  skills: string[];
  department: string;
  location: string;
  status: string;
  createdAt: string;
  _count?: {
    resumes: number;
  };
}

export interface Resume {
  id: string;
  candidateName: string;
  email: string;
  phone?: string;
  summary?: string;
  skills: string[];
  experienceYrs: number;
  education?: string;
  fileUrl?: string;
  matchScore: number;
  aiFeedback?: string;
  status: ResumeStatus;
  jobId?: string;
  job?: Job;
  createdAt: string;
}

export interface DashboardMetrics {
  totalResumes: number;
  shortlisted: number;
  interviewed: number;
  rejected: number;
  averageMatchScore: number;
}
