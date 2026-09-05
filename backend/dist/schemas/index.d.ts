import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodDefault<z.ZodOptional<z.ZodEnum<["ADMIN", "RECRUITER", "HIRING_MANAGER"]>>>;
    organizationName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "ADMIN" | "RECRUITER" | "HIRING_MANAGER";
    organizationName: string;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationName: string;
    role?: "ADMIN" | "RECRUITER" | "HIRING_MANAGER" | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const createJobSchema: z.ZodObject<{
    title: z.ZodString;
    department: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    locationType: z.ZodOptional<z.ZodEnum<["REMOTE", "HYBRID", "ONSITE"]>>;
    employmentType: z.ZodOptional<z.ZodEnum<["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]>>;
    experienceMin: z.ZodOptional<z.ZodNumber>;
    experienceMax: z.ZodOptional<z.ZodNumber>;
    salaryMin: z.ZodOptional<z.ZodNumber>;
    salaryMax: z.ZodOptional<z.ZodNumber>;
    salaryCurrency: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    requirements: z.ZodOptional<z.ZodString>;
    responsibilities: z.ZodOptional<z.ZodString>;
    benefits: z.ZodOptional<z.ZodString>;
    openings: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["DRAFT", "ACTIVE", "PAUSED", "CLOSED", "ARCHIVED"]>>>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED" | "ARCHIVED";
    title: string;
    description: string;
    openings: number;
    department?: string | undefined;
    location?: string | undefined;
    locationType?: "REMOTE" | "HYBRID" | "ONSITE" | undefined;
    employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | undefined;
    experienceMin?: number | undefined;
    experienceMax?: number | undefined;
    salaryMin?: number | undefined;
    salaryMax?: number | undefined;
    salaryCurrency?: string | undefined;
    requirements?: string | undefined;
    responsibilities?: string | undefined;
    benefits?: string | undefined;
}, {
    title: string;
    description: string;
    status?: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED" | "ARCHIVED" | undefined;
    department?: string | undefined;
    location?: string | undefined;
    locationType?: "REMOTE" | "HYBRID" | "ONSITE" | undefined;
    employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | undefined;
    experienceMin?: number | undefined;
    experienceMax?: number | undefined;
    salaryMin?: number | undefined;
    salaryMax?: number | undefined;
    salaryCurrency?: string | undefined;
    requirements?: string | undefined;
    responsibilities?: string | undefined;
    benefits?: string | undefined;
    openings?: number | undefined;
}>;
export declare const updateJobSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    location: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    locationType: z.ZodOptional<z.ZodOptional<z.ZodEnum<["REMOTE", "HYBRID", "ONSITE"]>>>;
    employmentType: z.ZodOptional<z.ZodOptional<z.ZodEnum<["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]>>>;
    experienceMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    experienceMax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salaryMin: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salaryMax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salaryCurrency: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
    requirements: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    responsibilities: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    benefits: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    openings: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodEnum<["DRAFT", "ACTIVE", "PAUSED", "CLOSED", "ARCHIVED"]>>>>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED" | "ARCHIVED" | undefined;
    title?: string | undefined;
    department?: string | undefined;
    location?: string | undefined;
    locationType?: "REMOTE" | "HYBRID" | "ONSITE" | undefined;
    employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | undefined;
    experienceMin?: number | undefined;
    experienceMax?: number | undefined;
    salaryMin?: number | undefined;
    salaryMax?: number | undefined;
    salaryCurrency?: string | undefined;
    description?: string | undefined;
    requirements?: string | undefined;
    responsibilities?: string | undefined;
    benefits?: string | undefined;
    openings?: number | undefined;
}, {
    status?: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED" | "ARCHIVED" | undefined;
    title?: string | undefined;
    department?: string | undefined;
    location?: string | undefined;
    locationType?: "REMOTE" | "HYBRID" | "ONSITE" | undefined;
    employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | undefined;
    experienceMin?: number | undefined;
    experienceMax?: number | undefined;
    salaryMin?: number | undefined;
    salaryMax?: number | undefined;
    salaryCurrency?: string | undefined;
    description?: string | undefined;
    requirements?: string | undefined;
    responsibilities?: string | undefined;
    benefits?: string | undefined;
    openings?: number | undefined;
}>;
export declare const updateCandidateSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]>>;
    notes: z.ZodOptional<z.ZodString>;
    isShortlisted: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status?: "APPLIED" | "SCREENING" | "SHORTLISTED" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED" | undefined;
    notes?: string | undefined;
    isShortlisted?: boolean | undefined;
}, {
    status?: "APPLIED" | "SCREENING" | "SHORTLISTED" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED" | undefined;
    notes?: string | undefined;
    isShortlisted?: boolean | undefined;
}>;
export declare const addTagSchema: z.ZodObject<{
    tag: z.ZodString;
    color: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tag: string;
    color?: string | undefined;
}, {
    tag: string;
    color?: string | undefined;
}>;
export declare const compareCandidatesSchema: z.ZodObject<{
    candidateIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    candidateIds: string[];
}, {
    candidateIds: string[];
}>;
export declare const generateInterviewSchema: z.ZodObject<{
    candidateId: z.ZodString;
    jobId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    candidateId: string;
    jobId?: string | undefined;
}, {
    candidateId: string;
    jobId?: string | undefined;
}>;
export declare const copilotChatSchema: z.ZodObject<{
    message: z.ZodString;
    conversationId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    conversationId?: string | undefined;
}, {
    message: string;
    conversationId?: string | undefined;
}>;
export declare const savedSearchSchema: z.ZodObject<{
    name: z.ZodString;
    filters: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    name: string;
    filters: Record<string, unknown>;
}, {
    name: string;
    filters: Record<string, unknown>;
}>;
export declare const analyzeJobSchema: z.ZodObject<{
    jobId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    jobId: string;
}, {
    jobId: string;
}>;
export declare const analyzeResumeSchema: z.ZodEffects<z.ZodObject<{
    resumeId: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    resumeId?: string | undefined;
    text?: string | undefined;
}, {
    resumeId?: string | undefined;
    text?: string | undefined;
}>, {
    resumeId?: string | undefined;
    text?: string | undefined;
}, {
    resumeId?: string | undefined;
    text?: string | undefined;
}>;
//# sourceMappingURL=index.d.ts.map