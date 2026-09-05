// AI Provider Interface - abstraction layer for any AI provider
export interface AIProvider {
  analyzeJobDescription(jd: string): Promise<JobDescriptionAnalysis>;
  parseResume(resumeText: string): Promise<ParsedResume>;
  matchCandidateToJob(resumeText: string, jobDescription: string, jobSkills: string[]): Promise<MatchResult>;
  generateInterviewQuestions(candidateProfile: ParsedResume, jobDescription: string): Promise<InterviewQuestionsResult>;
  analyzeResumeQuality(resumeText: string): Promise<ResumeQualityResult>;
  copilotChat(message: string, context: CopilotContext): Promise<string>;
}

export interface JobDescriptionAnalysis {
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  minExperience: number | null;
  maxExperience: number | null;
  educationRequired: string | null;
  certifications: string[];
  seniority: string;
  domain: string;
  keywords: string[];
  summary: string;
}

export interface ParsedResume {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  professionalTitle: string | null;
  summary: string | null;
  yearsOfExperience: number;
  skills: { name: string; proficiency?: string; yearsUsed?: number }[];
  experience: {
    company: string;
    title: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    isCurrent: boolean;
    description?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field?: string;
    startYear?: number;
    endYear?: number;
    gpa?: number;
  }[];
  projects: {
    name: string;
    description?: string;
    techStack: string[];
    url?: string;
  }[];
  certifications: {
    name: string;
    issuer?: string;
    issuedDate?: string;
    expiryDate?: string;
    credentialId?: string;
  }[];
  achievements: string[];
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
}

export interface MatchResult {
  overallScore: number;
  matchCategory: 'EXCELLENT' | 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK';
  breakdown: {
    skills: number;
    experience: number;
    projects: number;
    education: number;
    certifications: number;
    domain: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  bonusSkills: string[];
  strengths: string[];
  weaknesses: string[];
  explanation: string;
  recommendation: string;
  confidence: number;
}

export interface InterviewQuestionsResult {
  questions: {
    category: string;
    question: string;
    whyItMatters: string;
    expectedAnswer: string;
    evaluationCriteria: string;
    difficulty: string;
    orderIndex: number;
  }[];
}

export interface ResumeQualityResult {
  overallScore: number;
  atsScore: number;
  readabilityScore: number;
  structureScore: number;
  skillClarityScore: number;
  achievementScore: number;
  keywordScore: number;
  recommendations: string[];
  missingKeywords: string[];
  improvements: { section: string; suggestion: string }[];
}

export interface CopilotContext {
  userId: string;
  organizationId?: string;
  recentCandidates?: { name: string; score: number; job: string }[];
  recentJobs?: { title: string; candidateCount: number }[];
  conversationHistory?: { role: string; content: string }[];
}
