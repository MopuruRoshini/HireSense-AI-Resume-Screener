import axios, { AxiosError } from 'axios';
import type { Job, Candidate, User, AnalyticsData, NotificationItem, InterviewKit } from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401s
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if checking auth status or already on auth page
      const isAuthPath = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register');
      if (!isAuthPath && !error.config?.url?.includes('/auth/me')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }) {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
  }) {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async completeOnboarding() {
    const res = await apiClient.patch('/auth/onboarding');
    return res.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Jobs
  async getJobs(params?: { department?: string; status?: string; search?: string }) {
    const res = await apiClient.get('/jobs', { params });
    return res.data;
  },

  async getJob(id: string) {
    const res = await apiClient.get(`/jobs/${id}`);
    return res.data;
  },

  async createJob(jobData: Record<string, unknown>) {
    const res = await apiClient.post('/jobs', jobData);
    return res.data;
  },

  async updateJob(id: string, jobData: Record<string, unknown>) {
    const res = await apiClient.put(`/jobs/${id}`, jobData);
    return res.data;
  },

  async deleteJob(id: string) {
    const res = await apiClient.delete(`/jobs/${id}`);
    return res.data;
  },

  async analyzeJobDescription(description: string) {
    const res = await apiClient.post('/jobs/analyze', { description });
    return res.data;
  },

  // Resumes & Screening
  async uploadResumes(jobId: string, files: File[]) {
    const formData = new FormData();
    formData.append('jobId', jobId);
    files.forEach((file) => {
      formData.append('resumes', file);
    });

    const res = await apiClient.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async getBatchProgress(batchId: string) {
    const res = await apiClient.get(`/resumes/batch/${batchId}`);
    return res.data;
  },

  // Candidates
  async getCandidates(params?: {
    jobId?: string;
    stage?: string;
    search?: string;
    minScore?: number;
  }) {
    const res = await apiClient.get('/candidates', { params });
    return res.data;
  },

  async getCandidate(id: string) {
    const res = await apiClient.get(`/candidates/${id}`);
    return res.data;
  },

  async updateCandidateStage(id: string, stage: string) {
    const res = await apiClient.patch(`/candidates/${id}/stage`, { stage });
    return res.data;
  },

  async updateCandidate(id: string, data: Partial<Candidate>) {
    const res = await apiClient.put(`/candidates/${id}`, data);
    return res.data;
  },

  async deleteCandidate(id: string) {
    const res = await apiClient.delete(`/candidates/${id}`);
    return res.data;
  },

  // Interviews
  async generateInterviewKit(candidateId: string, jobId: string) {
    const res = await apiClient.post('/interviews/generate', { candidateId, jobId });
    return res.data;
  },

  async getInterviewKit(id: string) {
    const res = await apiClient.get(`/interviews/${id}`);
    return res.data;
  },

  async saveInterviewNotes(id: string, notes: string, score?: number) {
    const res = await apiClient.patch(`/interviews/${id}`, { notes, score });
    return res.data;
  },

  // Copilot
  async sendCopilotMessage(message: string, context?: any) {
    const res = await apiClient.post('/copilot/chat', { message, context });
    return res.data;
  },

  // Analytics
  async getAnalytics(): Promise<{ data: AnalyticsData }> {
    const res = await apiClient.get('/analytics/overview');
    return res.data;
  },

  // Standalone Resume Analyzer
  async analyzeStandaloneResume(file: File, targetRole?: string) {
    const formData = new FormData();
    formData.append('resume', file);
    if (targetRole) formData.append('targetRole', targetRole);

    const res = await apiClient.post('/misc/analyze-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Notifications
  async getNotifications() {
    const res = await apiClient.get('/misc/notifications');
    return res.data;
  },

  async markNotificationRead(id: string) {
    const res = await apiClient.patch(`/misc/notifications/${id}/read`);
    return res.data;
  },

  // Audit Logs
  async getAuditLogs() {
    const res = await apiClient.get('/misc/audit-logs');
    return res.data;
  },
};

