import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['ADMIN', 'RECRUITER', 'HIRING_MANAGER']).optional().default('RECRUITER'),
  organizationName: z.string().min(1, 'Organization name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
});

// Helper: coerce string[] → joined string, or pass through string as-is
const textOrArray = z
  .union([
    z.string(),
    z.array(z.string()).transform((arr) => arr.join('\n')),
  ])
  .optional();

export const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  department: z.string().optional(),
  location: z.string().optional(),
  locationType: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
  experienceMin: z.number().int().min(0).optional(),
  experienceMax: z.number().int().min(0).optional(),
  // Accept both salaryMin/salaryMax (frontend) and salaryMin/salaryMax (DB name) as well as minSalary/maxSalary
  salaryMin: z.number().int().min(0).optional(),
  salaryMax: z.number().int().min(0).optional(),
  minSalary: z.number().int().min(0).optional(),
  maxSalary: z.number().int().min(0).optional(),
  salaryCurrency: z.string().optional(),
  currency: z.string().optional(),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  // Accept both string and string[] for requirements/responsibilities
  requirements: textOrArray,
  responsibilities: textOrArray,
  benefits: textOrArray,
  openings: z.number().int().min(1).default(1),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED']).optional().default('DRAFT'),
});

export const updateJobSchema = createJobSchema.partial();

export const updateCandidateSchema = z.object({
  status: z.enum(['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).optional(),
  notes: z.string().optional(),
  isShortlisted: z.boolean().optional(),
});

export const addTagSchema = z.object({
  tag: z.string().min(1).max(50),
  color: z.string().optional(),
});

export const compareCandidatesSchema = z.object({
  candidateIds: z.array(z.string().uuid()).min(2, 'At least 2 candidates required').max(4, 'Maximum 4 candidates'),
});

export const generateInterviewSchema = z.object({
  candidateId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
});

export const copilotChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000),
  conversationId: z.string().uuid().optional(),
});

export const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  filters: z.record(z.unknown()),
});

// /jobs/analyze accepts either a jobId (analyze saved job) OR a raw description (pre-creation)
export const analyzeJobSchema = z.union([
  z.object({
    jobId: z.string().uuid(),
    description: z.string().optional(),
  }),
  z.object({
    description: z.string().min(10, 'Description must be at least 10 characters'),
    jobId: z.string().optional(),
  }),
]);

export const analyzeResumeSchema = z.object({
  resumeId: z.string().uuid().optional(),
  text: z.string().optional(),
}).refine((data) => data.resumeId || data.text, {
  message: 'Either resumeId or text is required',
});
