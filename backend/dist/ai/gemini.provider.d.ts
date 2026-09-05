import { AIProvider, JobDescriptionAnalysis, ParsedResume, MatchResult, InterviewQuestionsResult, ResumeQualityResult, CopilotContext } from './provider.interface';
export declare class GeminiProvider implements AIProvider {
    private client;
    private model;
    constructor();
    private generateJSON;
    analyzeJobDescription(jd: string): Promise<JobDescriptionAnalysis>;
    parseResume(resumeText: string): Promise<ParsedResume>;
    matchCandidateToJob(resumeText: string, jobDescription: string, jobSkills: string[]): Promise<MatchResult>;
    generateInterviewQuestions(candidateProfile: ParsedResume, jobDescription: string): Promise<InterviewQuestionsResult>;
    analyzeResumeQuality(resumeText: string): Promise<ResumeQualityResult>;
    copilotChat(message: string, context: CopilotContext): Promise<string>;
}
//# sourceMappingURL=gemini.provider.d.ts.map