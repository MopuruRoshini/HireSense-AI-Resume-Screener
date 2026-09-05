"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeResumeSchema = exports.analyzeJobSchema = exports.savedSearchSchema = exports.copilotChatSchema = exports.generateInterviewSchema = exports.compareCandidatesSchema = exports.addTagSchema = exports.updateCandidateSchema = exports.updateJobSchema = exports.createJobSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    firstName: zod_1.z.string().min(1, 'First name is required').max(50),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50),
    role: zod_1.z.enum(['ADMIN', 'RECRUITER', 'HIRING_MANAGER']).optional().default('RECRUITER'),
    organizationName: zod_1.z.string().min(1, 'Organization name is required').max(100),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters'),
});
// Helper: coerce string[] → joined string, or pass through string as-is
const textOrArray = zod_1.z
    .union([
    zod_1.z.string(),
    zod_1.z.array(zod_1.z.string()).transform((arr) => arr.join('\n')),
])
    .optional();
exports.createJobSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Job title is required').max(200),
    department: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    locationType: zod_1.z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
    employmentType: zod_1.z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
    experienceMin: zod_1.z.number().int().min(0).optional(),
    experienceMax: zod_1.z.number().int().min(0).optional(),
    // Accept both salaryMin/salaryMax (frontend) and salaryMin/salaryMax (DB name) as well as minSalary/maxSalary
    salaryMin: zod_1.z.number().int().min(0).optional(),
    salaryMax: zod_1.z.number().int().min(0).optional(),
    minSalary: zod_1.z.number().int().min(0).optional(),
    maxSalary: zod_1.z.number().int().min(0).optional(),
    salaryCurrency: zod_1.z.string().optional(),
    currency: zod_1.z.string().optional(),
    description: zod_1.z.string().min(10, 'Job description must be at least 10 characters'),
    // Accept both string and string[] for requirements/responsibilities
    requirements: textOrArray,
    responsibilities: textOrArray,
    benefits: textOrArray,
    openings: zod_1.z.number().int().min(1).default(1),
    status: zod_1.z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED']).optional().default('DRAFT'),
});
exports.updateJobSchema = exports.createJobSchema.partial();
exports.updateCandidateSchema = zod_1.z.object({
    status: zod_1.z.enum(['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).optional(),
    notes: zod_1.z.string().optional(),
    isShortlisted: zod_1.z.boolean().optional(),
});
exports.addTagSchema = zod_1.z.object({
    tag: zod_1.z.string().min(1).max(50),
    color: zod_1.z.string().optional(),
});
exports.compareCandidatesSchema = zod_1.z.object({
    candidateIds: zod_1.z.array(zod_1.z.string().uuid()).min(2, 'At least 2 candidates required').max(4, 'Maximum 4 candidates'),
});
exports.generateInterviewSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    jobId: zod_1.z.string().uuid().optional(),
});
exports.copilotChatSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, 'Message cannot be empty').max(2000),
    conversationId: zod_1.z.string().uuid().optional(),
});
exports.savedSearchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    filters: zod_1.z.record(zod_1.z.unknown()),
});
// /jobs/analyze accepts either a jobId (analyze saved job) OR a raw description (pre-creation)
exports.analyzeJobSchema = zod_1.z.union([
    zod_1.z.object({
        jobId: zod_1.z.string().uuid(),
        description: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
        jobId: zod_1.z.string().optional(),
    }),
]);
exports.analyzeResumeSchema = zod_1.z.object({
    resumeId: zod_1.z.string().uuid().optional(),
    text: zod_1.z.string().optional(),
}).refine((data) => data.resumeId || data.text, {
    message: 'Either resumeId or text is required',
});
//# sourceMappingURL=index.js.map