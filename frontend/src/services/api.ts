import api from '../lib/axios';
import { Resume, Job, DashboardMetrics, ResumeStatus } from '../types';

export const authApi = {
  login: async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    return res.data.data;
  },
  register: async (userData: any) => {
    const res = await api.post('/auth/register', userData);
    return res.data.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (data: any) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
  changePassword: async (data: any) => {
    const res = await api.patch('/auth/change-password', data);
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await api.patch('/auth/profile', data);
    return res.data.data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
};

export const resumeApi = {
  getResumes: async (status?: string, search?: string): Promise<Resume[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const res = await api.get(`/resumes?${params.toString()}`);
    return res.data.data;
  },

  getCandidates: async () => {
    const res = await api.get('/resumes');
    return res.data.data;
  },

  getResumeById: async (id: string): Promise<Resume> => {
    const res = await api.get(`/resumes/${id}`);
    return res.data.data;
  },

  createResume: async (data: any): Promise<Resume> => {
    const res = await api.post('/resumes', data);
    return res.data.data;
  },

  updateStatus: async (id: string, status: ResumeStatus): Promise<Resume> => {
    const res = await api.patch(`/resumes/${id}/status`, { status });
    return res.data.data;
  },

  deleteResume: async (id: string): Promise<void> => {
    await api.delete(`/resumes/${id}`);
  },

  getMetrics: async (): Promise<DashboardMetrics> => {
    const res = await api.get('/resumes/metrics');
    return res.data.data;
  },
};

export const jobApi = {
  getJobs: async (): Promise<Job[]> => {
    const res = await api.get('/jobs');
    return res.data.data;
  },

  getJobById: async (id: string): Promise<Job> => {
    const res = await api.get(`/jobs/${id}`);
    return res.data.data;
  },

  createJob: async (data: any): Promise<Job> => {
    const res = await api.post('/jobs', data);
    return res.data.data;
  },
};

export const dashboardApi = {
  getHRMetrics: async () => {
    const res = await api.get('/dashboard/metrics');
    return res.data.data;
  },
};

export const documentApi = {
  uploadDocument: async (data: any) => {
    const res = await api.post('/documents/upload', data);
    return res.data.data;
  },

  getDocuments: async (documentType?: string, candidateId?: string) => {
    const params = new URLSearchParams();
    if (documentType) params.append('documentType', documentType);
    if (candidateId) params.append('candidateId', candidateId);

    const res = await api.get(`/documents?${params.toString()}`);
    return res.data.data;
  },

  getVersionHistory: async (candidateId: string, documentType: string) => {
    const res = await api.get(`/documents/history/${candidateId}/${documentType}`);
    return res.data.data;
  },

  replaceDocument: async (id: string, newFileData: any) => {
    const res = await api.post(`/documents/${id}/replace`, newFileData);
    return res.data.data;
  },

  deleteDocument: async (id: string) => {
    const res = await api.delete(`/documents/${id}`);
    return res.data.data;
  },
};

export const aiBuilderApi = {
  generateFullResume: async (data: any) => {
    const res = await api.post('/ai-builder/generate-resume', data);
    return res.data.data;
  },
  generateSummary: async (data: any) => {
    const res = await api.post('/ai-builder/generate-summary', data);
    return res.data.data;
  },
  generateObjective: async (data: any) => {
    const res = await api.post('/ai-builder/generate-objective', data);
    return res.data.data;
  },
  improveExperience: async (data: any) => {
    const res = await api.post('/ai-builder/improve-experience', data);
    return res.data.data;
  },
  generateResponsibilities: async (data: { jobTitle: string }) => {
    const res = await api.post('/ai-builder/generate-responsibilities', data);
    return res.data.data;
  },
  improveSkills: async (data: any) => {
    const res = await api.post('/ai-builder/improve-skills', data);
    return res.data.data;
  },
  correctGrammar: async (text: string) => {
    const res = await api.post('/ai-builder/correct-grammar', { text });
    return res.data.data;
  },
  translateNepali: async (nepaliText: string) => {
    const res = await api.post('/ai-builder/translate-nepali', { nepaliText });
    return res.data.data;
  },
  atsScore: async (resumeData: any) => {
    const res = await api.post('/ai-builder/ats-score', { resumeData });
    return res.data.data;
  },
  generateCoverLetter: async (data: any) => {
    const res = await api.post('/ai-builder/generate-cover-letter', data);
    return res.data.data;
  },
};

export const pdfApi = {
  downloadPDF: async (htmlContent: string, options: any = {}) => {
    const response = await api.post(
      '/pdf/generate-pdf',
      { htmlContent, ...options },
      { responseType: 'blob' },
    );
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', options.filename || `Resume_A4_Export_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export const employerApi = {
  getEmployers: async (search?: string, country?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (country) params.append('country', country);

    const res = await api.get(`/employers?${params.toString()}`);
    return res.data.data;
  },

  getEmployerById: async (id: string) => {
    const res = await api.get(`/employers/${id}`);
    return res.data.data;
  },

  createEmployer: async (data: any) => {
    const res = await api.post('/employers', data);
    return res.data.data;
  },

  updateEmployer: async (id: string, data: any) => {
    const res = await api.patch(`/employers/${id}`, data);
    return res.data.data;
  },

  deleteEmployer: async (id: string) => {
    const res = await api.delete(`/employers/${id}`);
    return res.data.data;
  },
};

export const demandApi = {
  getDemands: async (status?: string, employerId?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (employerId) params.append('employerId', employerId);

    const res = await api.get(`/demands?${params.toString()}`);
    return res.data.data;
  },

  getDemandMetrics: async () => {
    const res = await api.get('/demands/metrics');
    return res.data.data;
  },

  getDemandById: async (id: string) => {
    const res = await api.get(`/demands/${id}`);
    return res.data.data;
  },

  createDemand: async (data: any) => {
    const res = await api.post('/demands', data);
    return res.data.data;
  },

  assignCandidate: async (demandId: string, candidateId: string) => {
    const res = await api.post(`/demands/${demandId}/assign`, { candidateId });
    return res.data.data;
  },

  updateStatus: async (id: string, status: string) => {
    const res = await api.patch(`/demands/${id}/status`, { status });
    return res.data.data;
  },
};

export const medicalApi = {
  scheduleOrUpdate: async (data: any) => {
    const res = await api.post('/medicals/schedule', data);
    return res.data.data;
  },

  getMedicals: async (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const res = await api.get(`/medicals?${params.toString()}`);
    return res.data.data;
  },

  getMetrics: async () => {
    const res = await api.get('/medicals/metrics');
    return res.data.data;
  },

  getMedicalById: async (id: string) => {
    const res = await api.get(`/medicals/${id}`);
    return res.data.data;
  },
};

export const visaApi = {
  saveVisa: async (data: any) => {
    const res = await api.post('/visas/save-visa', data);
    return res.data.data;
  },

  saveMOFA: async (data: any) => {
    const res = await api.post('/visas/save-mofa', data);
    return res.data.data;
  },

  getVisas: async (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const res = await api.get(`/visas?${params.toString()}`);
    return res.data.data;
  },

  getMetrics: async () => {
    const res = await api.get('/visas/metrics');
    return res.data.data;
  },
};

export const aiAssistantApi = {
  evaluateCandidate: async (data: any) => {
    const res = await api.post('/ai-assistant/evaluate-candidate', data);
    return res.data.data;
  },
  matchJob: async (data: any) => {
    const res = await api.post('/ai-assistant/match-job', data);
    return res.data.data;
  },
  recommendEmployers: async (data: any) => {
    const res = await api.post('/ai-assistant/recommend-employers', data);
    return res.data.data;
  },
  generateInterviewQuestions: async (data: any) => {
    const res = await api.post('/ai-assistant/interview-questions', data);
    return res.data.data;
  },
  ocrDocument: async (data: any) => {
    const res = await api.post('/ai-assistant/ocr-document', data);
    return res.data.data;
  },
  parseResume: async (data: any) => {
    const res = await api.post('/ai-assistant/parse-resume', data);
    return res.data.data;
  },
  chat: async (message: string) => {
    const res = await api.post('/ai-assistant/chat', { message });
    return res.data.data;
  },
};
