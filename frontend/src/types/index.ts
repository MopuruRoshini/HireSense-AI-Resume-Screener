export type Role = 'ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'VIEWER';

export type JobStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export type CandidateStage =
  | 'APPLIED'
  | 'SCREENED'
  | 'INTERVIEW_1'
  | 'INTERVIEW_2'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId?: string;
  organization?: {
    id: string;
    name: string;
  };
  onboardingDone: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  status: JobStatus;
  description: string;
  requirements: string[];
  responsibilities: string[];
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  organizationId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    candidates: number;
  };
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  currentRole?: string;
  currentCompany?: string;
  yearsOfExperience?: number;
  skills: string[];
  education?: Array<{ degree: string; institution: string; year?: string }>;
  experience?: Array<{ role: string; company: string; duration?: string; description?: string }>;
  jobId: string;
  job?: {
    id: string;
    title: string;
    department: string;
  };
  resumeId?: string;
  resume?: {
    id: string;
    originalName: string;
    fileUrl: string;
    fileType: string;
    extractedText?: string;
  };
  screeningResult?: ScreeningResult;
  stage: CandidateStage;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningResult {
  id: string;
  candidateId: string;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  educationScore: number;
  cultureScore?: number;
  matchLevel: 'STRONG_MATCH' | 'GOOD_MATCH' | 'MODERATE_MATCH' | 'WEAK_MATCH' | 'NO_MATCH';
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  matchingSkills: string[];
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'CONSIDER' | 'DO_NOT_HIRE';
  interviewQuestions: Array<{ question: string; category: string; targetCompetency: string }>;
  createdAt: string;
}

export interface InterviewKit {
  id: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  questions: Array<{
    id: string;
    question: string;
    category: 'TECHNICAL' | 'BEHAVIORAL' | 'SITUATIONAL' | 'ROLE_SPECIFIC';
    targetCompetency: string;
    sampleAnswer?: string;
    evaluationCriteria?: string;
  }>;
  rubrics?: Array<{
    criteria: string;
    weight: number;
    description: string;
  }>;
  notes?: string;
  score?: number;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    type?: 'JOB_ANALYSIS' | 'CANDIDATE_SUMMARY' | 'EMAIL_DRAFT' | 'INTERVIEW_PREP';
    data?: any;
  };
}

export interface AnalyticsData {
  overview: {
    totalCandidates: number;
    activeJobs: number;
    avgMatchScore: number;
    timeToScreenHours: number;
    screeningAccuracyRate: number;
    interviewsScheduled: number;
  };
  stageDistribution: Array<{ stage: CandidateStage; count: number; label: string }>;
  scoreDistribution: Array<{ range: string; count: number }>;
  topSkillsInDemand: Array<{ skill: string; count: number }>;
  hiringTrend: Array<{ month: string; candidates: number; hired: number }>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}
