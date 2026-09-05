import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  AIProvider,
  JobDescriptionAnalysis,
  ParsedResume,
  MatchResult,
  InterviewQuestionsResult,
  ResumeQualityResult,
  CopilotContext,
} from './provider.interface';
import { config } from '../config';
import { logger } from '../config/logger';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    this.client = new GoogleGenerativeAI(config.ai.apiKey);
    this.model = this.client.getGenerativeModel({ model: config.ai.model });
  }

  private async generateJSON<T>(prompt: string): Promise<T> {
    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1].trim() : text.trim();
      return JSON.parse(jsonText) as T;
    } catch (err) {
      logger.error('Gemini JSON generation error', { err });
      throw new Error('AI processing failed. Please try again.');
    }
  }

  async analyzeJobDescription(jd: string): Promise<JobDescriptionAnalysis> {
    const prompt = `
You are an expert HR analyst and job description parser.

Analyze the following job description and extract structured information.

Job Description:
"""
${jd}
"""

Return a JSON object with this exact structure:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "responsibilities": ["resp1", "resp2"],
  "minExperience": 3,
  "maxExperience": 7,
  "educationRequired": "Bachelor's in Computer Science or related",
  "certifications": ["AWS", "PMP"],
  "seniority": "Senior",
  "domain": "Backend Engineering",
  "keywords": ["keyword1", "keyword2"],
  "summary": "A brief 2-3 sentence summary of what the ideal candidate looks like."
}

Rules:
- requiredSkills: hard requirements mentioned explicitly
- preferredSkills: nice-to-have or "preferred" skills
- minExperience/maxExperience: number of years (null if not specified)
- seniority: Junior/Mid/Senior/Lead/Principal/Director
- domain: the technical domain (Backend, Frontend, Full Stack, Data Science, etc.)
- keywords: important terms for ATS matching
Return ONLY valid JSON, no other text.
`;
    return this.generateJSON<JobDescriptionAnalysis>(prompt);
  }

  async parseResume(resumeText: string): Promise<ParsedResume> {
    const prompt = `
You are an expert resume parser with 15 years of recruitment experience.

Parse the following resume and extract all structured information.

Resume:
"""
${resumeText.substring(0, 8000)}
"""

Return a JSON object with this EXACT structure:
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "location": "San Francisco, CA",
  "professionalTitle": "Senior Software Engineer",
  "summary": "Experienced engineer with...",
  "yearsOfExperience": 5,
  "skills": [
    {"name": "Node.js", "proficiency": "expert", "yearsUsed": 4},
    {"name": "React", "proficiency": "advanced", "yearsUsed": 3}
  ],
  "experience": [
    {
      "company": "TechCorp",
      "title": "Senior Engineer",
      "location": "San Francisco, CA",
      "startDate": "2021-01",
      "endDate": null,
      "isCurrent": true,
      "description": "Led development of..."
    }
  ],
  "education": [
    {
      "institution": "Stanford University",
      "degree": "B.S.",
      "field": "Computer Science",
      "startYear": 2016,
      "endYear": 2020,
      "gpa": 3.8
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Built a ...",
      "techStack": ["Node.js", "React"],
      "url": "https://github.com/..."
    }
  ],
  "certifications": [
    {
      "name": "AWS Solutions Architect",
      "issuer": "Amazon",
      "issuedDate": "2023-06",
      "expiryDate": "2026-06",
      "credentialId": "ABC123"
    }
  ],
  "achievements": ["Led team of 5 engineers", "Increased performance by 40%"],
  "linkedinUrl": "https://linkedin.com/in/...",
  "githubUrl": "https://github.com/...",
  "portfolioUrl": null
}

Rules:
- If a field is not found, use null (for strings) or [] (for arrays) or 0 (for numbers)
- yearsOfExperience: estimate total professional experience in years
- proficiency: one of "beginner", "intermediate", "advanced", "expert"
- Be thorough and extract all information present
Return ONLY valid JSON, no other text.
`;
    return this.generateJSON<ParsedResume>(prompt);
  }

  async matchCandidateToJob(
    resumeText: string,
    jobDescription: string,
    jobSkills: string[]
  ): Promise<MatchResult> {
    const prompt = `
You are an expert AI recruitment analyst with deep understanding of technical skills and job requirements.

Perform a comprehensive semantic analysis comparing this candidate's resume against the job requirements.

JOB DESCRIPTION:
"""
${jobDescription.substring(0, 3000)}
"""

REQUIRED JOB SKILLS: ${jobSkills.join(', ')}

CANDIDATE RESUME:
"""
${resumeText.substring(0, 5000)}
"""

Perform a deep semantic match. Consider:
- Equivalent technologies (e.g., "REST APIs" = "Express.js backend services")
- Related domains and transferable skills
- Experience depth and relevance
- Project relevance
- Overall suitability

Return a JSON object with this EXACT structure:
{
  "overallScore": 87,
  "matchCategory": "STRONG",
  "breakdown": {
    "skills": 90,
    "experience": 85,
    "projects": 88,
    "education": 82,
    "certifications": 75,
    "domain": 92
  },
  "matchedSkills": ["Node.js", "React", "PostgreSQL"],
  "missingSkills": ["Docker", "Kubernetes"],
  "bonusSkills": ["GraphQL", "Redis"],
  "strengths": ["Strong backend engineering background", "Relevant project experience"],
  "weaknesses": ["No containerization experience", "Limited cloud experience"],
  "explanation": "This candidate demonstrates strong alignment with the position requirements. Their extensive experience with Node.js and React directly matches the core technical stack. The candidate's project work shows practical application of REST API development which aligns with the backend requirements. However, there are notable gaps in containerization and cloud infrastructure experience which are listed as preferred qualifications.",
  "recommendation": "Highly recommended for interview. Strong technical match with proven project experience.",
  "confidence": 92
}

Rules:
- overallScore: 0-100, based on weighted analysis
- matchCategory: EXCELLENT (90-100), STRONG (80-89), GOOD (70-79), MODERATE (60-69), WEAK (<60)
- breakdown scores: 0-100 each
- matchedSkills: skills from job requirements found in resume (including semantic matches)
- missingSkills: required skills not found in resume
- bonusSkills: candidate skills not in requirements but valuable
- confidence: how confident the AI is in this assessment (0-100)
- Be precise and evidence-based in the explanation
Return ONLY valid JSON, no other text.
`;
    return this.generateJSON<MatchResult>(prompt);
  }

  async generateInterviewQuestions(
    candidateProfile: ParsedResume,
    jobDescription: string
  ): Promise<InterviewQuestionsResult> {
    const prompt = `
You are a senior technical recruiter and interview expert.

Generate comprehensive, personalized interview questions for this candidate based on their profile and the job requirements.

JOB DESCRIPTION:
"""
${jobDescription.substring(0, 2000)}
"""

CANDIDATE PROFILE:
Name: ${candidateProfile.firstName} ${candidateProfile.lastName}
Title: ${candidateProfile.professionalTitle}
Experience: ${candidateProfile.yearsOfExperience} years
Key Skills: ${candidateProfile.skills.slice(0, 10).map(s => s.name).join(', ')}
Recent Role: ${candidateProfile.experience[0]?.company} - ${candidateProfile.experience[0]?.title}

Generate 15 interview questions across categories.

Return JSON with this structure:
{
  "questions": [
    {
      "category": "TECHNICAL",
      "question": "Describe your experience with Node.js event loop and how you've optimized async operations in production.",
      "whyItMatters": "Tests deep understanding of Node.js internals relevant to our backend architecture.",
      "expectedAnswer": "Should discuss event loop phases, microtasks vs macrotasks, practical async/await patterns, and real optimization examples.",
      "evaluationCriteria": "Look for: specific examples, understanding of non-blocking I/O, performance mindset",
      "difficulty": "HARD",
      "orderIndex": 1
    }
  ]
}

Categories to include:
- TECHNICAL: 6 questions (deep technical knowledge)
- BEHAVIORAL: 3 questions (past behavior, STAR format)
- SITUATIONAL: 2 questions (hypothetical scenarios)
- RESUME_BASED: 2 questions (specific to their resume/projects)
- ROLE_SPECIFIC: 2 questions (specific to this role)

difficulty: EASY, MEDIUM, or HARD
Return ONLY valid JSON, no other text.
`;
    return this.generateJSON<InterviewQuestionsResult>(prompt);
  }

  async analyzeResumeQuality(resumeText: string): Promise<ResumeQualityResult> {
    const prompt = `
You are an expert resume coach and ATS specialist.

Analyze the following resume for quality, ATS compatibility, and effectiveness.

Resume:
"""
${resumeText.substring(0, 6000)}
"""

Return JSON with this structure:
{
  "overallScore": 78,
  "atsScore": 72,
  "readabilityScore": 85,
  "structureScore": 80,
  "skillClarityScore": 75,
  "achievementScore": 70,
  "keywordScore": 68,
  "recommendations": [
    "Add quantifiable metrics to at least 3 bullet points",
    "Include a dedicated skills section for better ATS parsing"
  ],
  "missingKeywords": ["cloud", "agile", "CI/CD"],
  "improvements": [
    {"section": "Experience", "suggestion": "Add measurable impact to project descriptions (e.g., 'Reduced load time by 40%')"},
    {"section": "Summary", "suggestion": "Tailor summary to target role with specific keywords"}
  ]
}

Evaluate:
- Overall quality (comprehensive, compelling, professional)
- ATS compatibility (parseable, keyword-rich, standard formatting)
- Readability (clear, concise, well-structured)
- Structure (proper sections, consistent formatting)
- Skill clarity (skills clearly listed and categorized)
- Achievement quality (quantified results, impact-focused)
- Keyword relevance (industry-standard terms)
Return ONLY valid JSON, no other text.
`;
    return this.generateJSON<ResumeQualityResult>(prompt);
  }

  async copilotChat(message: string, context: CopilotContext): Promise<string> {
    const systemContext = `
You are HireSense Copilot, an AI recruitment intelligence assistant.

You have access to the following recruitment data for this session:

${context.recentCandidates && context.recentCandidates.length > 0
  ? `Recent Candidates:
${context.recentCandidates.slice(0, 10).map(c => `- ${c.name}: ${c.score}% match for ${c.job}`).join('\n')}`
  : 'No candidate data available.'}

${context.recentJobs && context.recentJobs.length > 0
  ? `Active Jobs:
${context.recentJobs.slice(0, 5).map(j => `- ${j.title}: ${j.candidateCount} candidates`).join('\n')}`
  : 'No active jobs.'}

${context.conversationHistory && context.conversationHistory.length > 0
  ? `Previous conversation:
${context.conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')}`
  : ''}

You are a senior recruiter assistant. Be helpful, concise, and data-driven.
When referring to candidates or jobs, use the data above.
If you don't have specific data, say so honestly but offer to help with general recruitment advice.
`;

    try {
      const result = await this.model.generateContent(`${systemContext}\n\nRecruiter: ${message}\n\nAssistant:`);
      return result.response.text();
    } catch (err) {
      logger.error('Copilot chat error', { err });
      throw new Error('AI assistant is temporarily unavailable.');
    }
  }
}
