import { PrismaClient, UserRole, JobStatus, CandidateStatus, MatchCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HireSense database...');

  // Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-hiresense-demo' },
    update: {},
    create: {
      id: 'org-hiresense-demo',
      name: 'TechVentures Inc.',
      domain: 'techventures.io',
      plan: 'pro',
    },
  });

  // Admin user
  const adminHash = await bcrypt.hash('Admin@123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@techventures.io' },
    update: {},
    create: {
      email: 'admin@techventures.io',
      passwordHash: adminHash,
      firstName: 'Alex',
      lastName: 'Morgan',
      role: UserRole.ADMIN,
      organizationId: org.id,
      onboardingDone: true,
    },
  });

  // Recruiter user
  const recruiterHash = await bcrypt.hash('Recruit@123456', 10);
  const recruiter = await prisma.user.upsert({
    where: { email: 'recruiter@techventures.io' },
    update: {},
    create: {
      email: 'recruiter@techventures.io',
      passwordHash: recruiterHash,
      firstName: 'Jordan',
      lastName: 'Lee',
      role: UserRole.RECRUITER,
      organizationId: org.id,
      onboardingDone: true,
    },
  });

  // Jobs
  const jobsData = [
    {
      id: 'job-nodejs-senior',
      title: 'Senior Node.js Developer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      locationType: 'HYBRID',
      employmentType: 'FULL_TIME',
      experienceMin: 4,
      experienceMax: 8,
      salaryMin: 150000,
      salaryMax: 200000,
      status: JobStatus.ACTIVE,
      description: `We are looking for a Senior Node.js Developer to join our engineering team. 
You will be responsible for building scalable backend services, RESTful APIs, and microservices.

Requirements:
- 4+ years of Node.js experience
- Strong TypeScript knowledge  
- Experience with Express.js or Fastify
- PostgreSQL and Redis experience
- Docker and Kubernetes knowledge
- CI/CD pipeline experience
- REST API design and development
- Microservices architecture experience

Preferred:
- GraphQL experience
- AWS or GCP cloud experience
- Experience with BullMQ or similar job queues
- Elasticsearch experience

You will work on our core platform serving millions of users daily.`,
      skills: ['Node.js', 'TypeScript', 'Express.js', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'REST API', 'Microservices'],
      preferredSkills: ['GraphQL', 'AWS', 'GCP', 'BullMQ', 'Elasticsearch'],
    },
    {
      id: 'job-fullstack-eng',
      title: 'Full Stack Engineer',
      department: 'Product',
      location: 'Remote',
      locationType: 'REMOTE',
      employmentType: 'FULL_TIME',
      experienceMin: 3,
      experienceMax: 6,
      salaryMin: 120000,
      salaryMax: 160000,
      status: JobStatus.ACTIVE,
      description: `Join our product team as a Full Stack Engineer. You'll work across the entire stack building features for our SaaS platform.

Requirements:
- React with TypeScript (3+ years)
- Node.js backend experience
- PostgreSQL experience
- REST API development
- Git workflow and code review
- Agile/Scrum methodology

Preferred:
- Next.js experience
- Testing with Jest/Cypress
- Figma collaboration
- AWS experience`,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'REST API', 'Git'],
      preferredSkills: ['Next.js', 'Jest', 'Cypress', 'AWS', 'Figma'],
    },
    {
      id: 'job-ai-engineer',
      title: 'AI/ML Engineer',
      department: 'AI Research',
      location: 'New York, NY',
      locationType: 'ONSITE',
      employmentType: 'FULL_TIME',
      experienceMin: 3,
      experienceMax: 7,
      salaryMin: 160000,
      salaryMax: 220000,
      status: JobStatus.ACTIVE,
      description: `We are looking for an AI/ML Engineer to build and deploy machine learning models at scale.

Requirements:
- Python (3+ years ML/AI focus)
- PyTorch or TensorFlow
- LLM fine-tuning and prompt engineering
- MLOps experience (MLflow, Weights & Biases)
- Vector databases (Pinecone, Weaviate)
- REST API development for ML services
- SQL/NoSQL databases

Preferred:
- Experience with LangChain or LlamaIndex
- RAG pipeline experience
- Kubernetes for ML workloads
- Published research or open source contributions`,
      skills: ['Python', 'PyTorch', 'TensorFlow', 'LLMs', 'MLOps', 'Vector Databases', 'REST API'],
      preferredSkills: ['LangChain', 'RAG', 'Kubernetes', 'Research'],
    },
    {
      id: 'job-react-dev',
      title: 'React Developer',
      department: 'Frontend',
      location: 'Austin, TX',
      locationType: 'HYBRID',
      employmentType: 'FULL_TIME',
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 100000,
      salaryMax: 140000,
      status: JobStatus.ACTIVE,
      description: `Frontend React Developer role focused on building beautiful, accessible user interfaces.

Requirements:
- React.js (2+ years)
- TypeScript
- CSS/Tailwind CSS
- State management (Redux, Zustand, or Jotai)
- REST API integration
- Performance optimization
- Cross-browser compatibility

Preferred:
- Framer Motion animations
- Storybook
- Testing Library
- Accessibility (WCAG) experience`,
      skills: ['React', 'TypeScript', 'CSS', 'Tailwind CSS', 'Redux', 'REST API'],
      preferredSkills: ['Framer Motion', 'Storybook', 'Testing Library', 'WCAG'],
    },
    {
      id: 'job-data-analyst',
      title: 'Data Analyst',
      department: 'Analytics',
      location: 'Chicago, IL',
      locationType: 'HYBRID',
      employmentType: 'FULL_TIME',
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 80000,
      salaryMax: 115000,
      status: JobStatus.ACTIVE,
      description: `Data Analyst to extract insights from our product and business data.

Requirements:
- SQL (advanced)
- Python or R for data analysis
- Data visualization (Tableau, Power BI, or Looker)
- Statistical analysis
- Business intelligence reporting
- Excel/Google Sheets advanced

Preferred:
- Apache Spark or Databricks
- Machine learning basics
- dbt experience
- A/B testing methodology`,
      skills: ['SQL', 'Python', 'Tableau', 'Power BI', 'Statistical Analysis', 'Business Intelligence'],
      preferredSkills: ['Apache Spark', 'dbt', 'R', 'A/B Testing'],
    },
  ];

  const createdJobs: Record<string, string> = {};
  for (const jobData of jobsData) {
    const { skills, preferredSkills, id, ...data } = jobData;
    const job = await prisma.job.upsert({
      where: { id },
      update: {},
      create: {
        id,
        ...data,
        organizationId: org.id,
        createdById: admin.id,
        aiAnalyzed: true,
        aiSummary: `Looking for an experienced ${data.title} to join the team.`,
        seniority: data.experienceMin >= 4 ? 'Senior' : 'Mid',
        domain: data.department,
      },
    });
    createdJobs[id] = job.id;

    // Create job skills
    await prisma.jobSkill.deleteMany({ where: { jobId: job.id } });
    await prisma.jobSkill.createMany({
      data: [
        ...skills.map((skill) => ({ jobId: job.id, skill, isRequired: true })),
        ...preferredSkills.map((skill) => ({ jobId: job.id, skill, isRequired: false })),
      ],
      skipDuplicates: true,
    });
  }

  // Candidates
  const candidatesData = [
    {
      firstName: 'Marcus', lastName: 'Chen', email: 'marcus.chen@gmail.com',
      phone: '+1-415-555-0101', location: 'San Francisco, CA',
      professionalTitle: 'Senior Software Engineer', yearsOfExperience: 6,
      summary: 'Full-stack engineer specializing in Node.js and React with 6 years of building production systems at scale.',
      jobId: 'job-nodejs-senior', status: CandidateStatus.SHORTLISTED,
      overallScore: 94, matchCategory: MatchCategory.EXCELLENT,
      isShortlisted: true, linkedinUrl: 'https://linkedin.com/in/marcuschen',
      githubUrl: 'https://github.com/marcuschen',
      aiRecommendation: 'Exceptional match. Strong Node.js expertise with production experience. Highly recommend for interview.',
      aiConfidence: 95,
      skills: [
        { skill: 'Node.js', proficiency: 'expert', yearsUsed: 5, isMatched: true },
        { skill: 'TypeScript', proficiency: 'expert', yearsUsed: 4, isMatched: true },
        { skill: 'Express.js', proficiency: 'expert', yearsUsed: 5, isMatched: true },
        { skill: 'PostgreSQL', proficiency: 'advanced', yearsUsed: 4, isMatched: true },
        { skill: 'Redis', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'Docker', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'React', proficiency: 'advanced', yearsUsed: 4, isBonus: true },
        { skill: 'GraphQL', proficiency: 'intermediate', yearsUsed: 2, isBonus: true },
        { skill: 'Kubernetes', proficiency: 'intermediate', yearsUsed: 1, isMissing: false },
      ],
      experience: [
        { company: 'Stripe', title: 'Senior Software Engineer', location: 'San Francisco, CA', startDate: '2021-03', isCurrent: true, description: 'Building payment infrastructure APIs serving 10M+ transactions/day. Led migration from monolith to microservices.' },
        { company: 'Airbnb', title: 'Software Engineer', location: 'San Francisco, CA', startDate: '2018-06', endDate: '2021-02', isCurrent: false, description: 'Developed core search and discovery APIs using Node.js. Improved API response time by 35%.' },
      ],
    },
    {
      firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@outlook.com',
      phone: '+1-650-555-0102', location: 'Palo Alto, CA',
      professionalTitle: 'Full Stack Developer', yearsOfExperience: 4,
      summary: 'Passionate full-stack developer with expertise in React and Node.js, building scalable web applications.',
      jobId: 'job-nodejs-senior', status: CandidateStatus.SHORTLISTED,
      overallScore: 87, matchCategory: MatchCategory.STRONG,
      isShortlisted: true,
      aiRecommendation: 'Strong candidate with solid full-stack experience. Good match for the backend-heavy role.',
      aiConfidence: 88,
      skills: [
        { skill: 'Node.js', proficiency: 'advanced', yearsUsed: 4, isMatched: true },
        { skill: 'TypeScript', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'React', proficiency: 'expert', yearsUsed: 4, isBonus: true },
        { skill: 'PostgreSQL', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'Express.js', proficiency: 'advanced', yearsUsed: 4, isMatched: true },
        { skill: 'AWS', proficiency: 'intermediate', yearsUsed: 2, isBonus: true },
        { skill: 'Redis', proficiency: 'beginner', yearsUsed: 0.5, isMatched: false },
        { skill: 'Docker', proficiency: 'intermediate', yearsUsed: 2, isMatched: true },
        { skill: 'Kubernetes', proficiency: 'beginner', yearsUsed: 0.5, isMissing: false },
      ],
      experience: [
        { company: 'Salesforce', title: 'Full Stack Developer', location: 'San Francisco, CA', startDate: '2022-01', isCurrent: true, description: 'Building CRM integrations and automation workflows using Node.js microservices and React dashboards.' },
        { company: 'Startup Y', title: 'Frontend Developer', location: 'Remote', startDate: '2020-06', endDate: '2021-12', isCurrent: false, description: 'Developed React components and integrated REST APIs.' },
      ],
    },
    {
      firstName: 'David', lastName: 'Okafor', email: 'david.okafor@proton.me',
      phone: '+1-512-555-0103', location: 'Austin, TX',
      professionalTitle: 'Backend Engineer', yearsOfExperience: 7,
      summary: 'Experienced backend engineer specializing in distributed systems and high-performance APIs.',
      jobId: 'job-nodejs-senior', status: CandidateStatus.INTERVIEW,
      overallScore: 91, matchCategory: MatchCategory.EXCELLENT,
      isShortlisted: true,
      aiRecommendation: 'Excellent technical background with deep distributed systems knowledge. Strong hire recommendation.',
      aiConfidence: 92,
      skills: [
        { skill: 'Node.js', proficiency: 'expert', yearsUsed: 6, isMatched: true },
        { skill: 'TypeScript', proficiency: 'expert', yearsUsed: 5, isMatched: true },
        { skill: 'PostgreSQL', proficiency: 'expert', yearsUsed: 6, isMatched: true },
        { skill: 'Redis', proficiency: 'expert', yearsUsed: 4, isMatched: true },
        { skill: 'Docker', proficiency: 'expert', yearsUsed: 5, isMatched: true },
        { skill: 'Kubernetes', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'Microservices', proficiency: 'expert', yearsUsed: 5, isMatched: true },
        { skill: 'gRPC', proficiency: 'advanced', yearsUsed: 2, isBonus: true },
      ],
      experience: [
        { company: 'Uber', title: 'Senior Backend Engineer', location: 'San Francisco, CA', startDate: '2020-04', isCurrent: true, description: 'Owns the trip routing microservice handling 5M trips/day. Reduced P99 latency by 60%.' },
        { company: 'Twitter', title: 'Backend Engineer', location: 'San Francisco, CA', startDate: '2017-08', endDate: '2020-03', isCurrent: false, description: 'Worked on Notification Services at massive scale.' },
      ],
    },
    {
      firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@gmail.com',
      phone: '+1-206-555-0104', location: 'Seattle, WA',
      professionalTitle: 'React Developer', yearsOfExperience: 3,
      summary: 'Creative frontend developer with a passion for building beautiful, accessible user interfaces.',
      jobId: 'job-react-dev', status: CandidateStatus.SHORTLISTED,
      overallScore: 89, matchCategory: MatchCategory.STRONG,
      isShortlisted: true,
      aiRecommendation: 'Strong frontend skills with React. Good match for the UI developer role.',
      aiConfidence: 90,
      skills: [
        { skill: 'React', proficiency: 'expert', yearsUsed: 3, isMatched: true },
        { skill: 'TypeScript', proficiency: 'advanced', yearsUsed: 2, isMatched: true },
        { skill: 'Tailwind CSS', proficiency: 'expert', yearsUsed: 2, isMatched: true },
        { skill: 'CSS', proficiency: 'expert', yearsUsed: 3, isMatched: true },
        { skill: 'Framer Motion', proficiency: 'advanced', yearsUsed: 1, isBonus: true },
        { skill: 'Redux', proficiency: 'advanced', yearsUsed: 2, isMatched: true },
        { skill: 'Storybook', proficiency: 'intermediate', yearsUsed: 1, isBonus: true },
      ],
      experience: [
        { company: 'Amazon', title: 'Frontend Developer', location: 'Seattle, WA', startDate: '2022-03', isCurrent: true, description: 'Building internal dashboard tools and customer-facing UI components for AWS console.' },
        { company: 'Design Agency XYZ', title: 'Junior Developer', location: 'Remote', startDate: '2021-01', endDate: '2022-02', isCurrent: false, description: 'Built React applications for various client projects.' },
      ],
    },
    {
      firstName: 'Arjun', lastName: 'Patel', email: 'arjun.patel@gmail.com',
      phone: '+1-408-555-0105', location: 'San Jose, CA',
      professionalTitle: 'AI/ML Engineer', yearsOfExperience: 5,
      summary: 'ML engineer with deep expertise in NLP and LLMs, building AI products from research to production.',
      jobId: 'job-ai-engineer', status: CandidateStatus.SHORTLISTED,
      overallScore: 96, matchCategory: MatchCategory.EXCELLENT,
      isShortlisted: true,
      aiRecommendation: 'Outstanding AI/ML background. Perfect fit for the role. Top candidate.',
      aiConfidence: 97,
      skills: [
        { skill: 'Python', proficiency: 'expert', yearsUsed: 5, isMatched: true },
        { skill: 'PyTorch', proficiency: 'expert', yearsUsed: 4, isMatched: true },
        { skill: 'LLMs', proficiency: 'expert', yearsUsed: 2, isMatched: true },
        { skill: 'MLOps', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'LangChain', proficiency: 'expert', yearsUsed: 1, isBonus: true },
        { skill: 'RAG', proficiency: 'advanced', yearsUsed: 1, isBonus: true },
        { skill: 'Vector Databases', proficiency: 'advanced', yearsUsed: 1, isMatched: true },
        { skill: 'Kubernetes', proficiency: 'intermediate', yearsUsed: 2, isBonus: true },
      ],
      experience: [
        { company: 'Google DeepMind', title: 'ML Engineer', location: 'Mountain View, CA', startDate: '2022-01', isCurrent: true, description: 'Working on large language model fine-tuning and deployment infrastructure.' },
        { company: 'Scale AI', title: 'AI Engineer', location: 'San Francisco, CA', startDate: '2019-06', endDate: '2021-12', isCurrent: false, description: 'Built data pipeline automation using ML models.' },
      ],
    },
    {
      firstName: 'Elena', lastName: 'Rodriguez', email: 'elena.rodriguez@gmail.com',
      phone: '+1-305-555-0106', location: 'Miami, FL',
      professionalTitle: 'Full Stack Engineer', yearsOfExperience: 4,
      summary: 'Full-stack engineer with strong React and Node.js skills, focused on delivering great user experiences.',
      jobId: 'job-fullstack-eng', status: CandidateStatus.SCREENING,
      overallScore: 82, matchCategory: MatchCategory.STRONG,
      isShortlisted: false,
      aiRecommendation: 'Good match for full-stack role. Solid React experience, backend could be stronger.',
      aiConfidence: 84,
      skills: [
        { skill: 'React', proficiency: 'expert', yearsUsed: 4, isMatched: true },
        { skill: 'TypeScript', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'Node.js', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'PostgreSQL', proficiency: 'intermediate', yearsUsed: 2, isMatched: true },
        { skill: 'Next.js', proficiency: 'advanced', yearsUsed: 2, isBonus: true },
        { skill: 'AWS', proficiency: 'intermediate', yearsUsed: 1, isBonus: true },
      ],
      experience: [
        { company: 'Shopify', title: 'Full Stack Developer', location: 'Remote', startDate: '2021-06', isCurrent: true, description: 'Building merchant dashboard features and payment integrations.' },
      ],
    },
    {
      firstName: 'James', lastName: 'Thompson', email: 'james.t@outlook.com',
      phone: '+1-312-555-0107', location: 'Chicago, IL',
      professionalTitle: 'Data Analyst', yearsOfExperience: 4,
      summary: 'Data analyst with expertise in SQL, Python analytics, and business intelligence.',
      jobId: 'job-data-analyst', status: CandidateStatus.SHORTLISTED,
      overallScore: 88, matchCategory: MatchCategory.STRONG,
      isShortlisted: true,
      aiRecommendation: 'Strong analytical background with good BI tool experience. Recommended for interview.',
      aiConfidence: 89,
      skills: [
        { skill: 'SQL', proficiency: 'expert', yearsUsed: 4, isMatched: true },
        { skill: 'Python', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'Tableau', proficiency: 'expert', yearsUsed: 3, isMatched: true },
        { skill: 'Statistical Analysis', proficiency: 'advanced', yearsUsed: 4, isMatched: true },
        { skill: 'dbt', proficiency: 'intermediate', yearsUsed: 1, isBonus: true },
        { skill: 'A/B Testing', proficiency: 'advanced', yearsUsed: 2, isBonus: true },
        { skill: 'Power BI', proficiency: 'intermediate', yearsUsed: 1, isMatched: true },
      ],
      experience: [
        { company: 'Grubhub', title: 'Senior Data Analyst', location: 'Chicago, IL', startDate: '2021-02', isCurrent: true, description: 'Analyzing delivery operations data to optimize routes and reduce costs by 18%.' },
        { company: 'Nielsen', title: 'Data Analyst', location: 'Chicago, IL', startDate: '2019-08', endDate: '2021-01', isCurrent: false, description: 'Consumer behavior analytics and market research reporting.' },
      ],
    },
    {
      firstName: 'Mei', lastName: 'Zhang', email: 'mei.zhang@gmail.com',
      phone: '+1-415-555-0108', location: 'San Francisco, CA',
      professionalTitle: 'Backend Developer', yearsOfExperience: 3,
      summary: 'Backend developer with 3 years building APIs and microservices in Node.js.',
      jobId: 'job-nodejs-senior', status: CandidateStatus.SCREENING,
      overallScore: 73, matchCategory: MatchCategory.GOOD,
      isShortlisted: false,
      aiRecommendation: 'Good fundamentals but lacks senior-level depth. Consider for mid-level roles.',
      aiConfidence: 75,
      skills: [
        { skill: 'Node.js', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'TypeScript', proficiency: 'intermediate', yearsUsed: 2, isMatched: true },
        { skill: 'Express.js', proficiency: 'advanced', yearsUsed: 3, isMatched: true },
        { skill: 'MySQL', proficiency: 'advanced', yearsUsed: 3, isMatched: false },
        { skill: 'Docker', proficiency: 'intermediate', yearsUsed: 1, isMatched: true },
        { skill: 'PostgreSQL', proficiency: 'beginner', yearsUsed: 0.5, isMissing: false },
        { skill: 'Redis', proficiency: 'beginner', yearsUsed: 0.5, isMissing: false },
        { skill: 'Kubernetes', proficiency: 'beginner', yearsUsed: 0, isMissing: true },
      ],
      experience: [
        { company: 'Startup Z', title: 'Backend Developer', location: 'San Francisco, CA', startDate: '2022-05', isCurrent: true, description: 'Building REST APIs for e-commerce platform.' },
      ],
    },
    {
      firstName: 'Carlos', lastName: 'Mendez', email: 'carlos.mendez@proton.me',
      phone: '+1-713-555-0109', location: 'Houston, TX',
      professionalTitle: 'DevOps Engineer', yearsOfExperience: 5,
      summary: 'DevOps engineer specializing in Kubernetes, CI/CD pipelines, and cloud infrastructure.',
      jobId: 'job-nodejs-senior', status: CandidateStatus.APPLIED,
      overallScore: 65, matchCategory: MatchCategory.MODERATE,
      isShortlisted: false,
      aiRecommendation: 'Infrastructure skills are strong but lacks the development background needed for this role.',
      aiConfidence: 70,
      skills: [
        { skill: 'Kubernetes', proficiency: 'expert', yearsUsed: 4, isMatched: true },
        { skill: 'Docker', proficiency: 'expert', yearsUsed: 5, isMatched: true },
        { skill: 'Node.js', proficiency: 'beginner', yearsUsed: 0.5, isMatched: false },
        { skill: 'TypeScript', proficiency: 'beginner', yearsUsed: 0, isMissing: true },
        { skill: 'AWS', proficiency: 'expert', yearsUsed: 4, isBonus: true },
        { skill: 'Terraform', proficiency: 'expert', yearsUsed: 3, isBonus: true },
        { skill: 'PostgreSQL', proficiency: 'intermediate', yearsUsed: 2, isMatched: true },
      ],
      experience: [
        { company: 'ExxonMobil', title: 'Senior DevOps Engineer', location: 'Houston, TX', startDate: '2021-01', isCurrent: true, description: 'Managing Kubernetes clusters and CI/CD pipelines for internal applications.' },
      ],
    },
    {
      firstName: 'Aisha', lastName: 'Osei', email: 'aisha.osei@gmail.com',
      phone: '+1-404-555-0110', location: 'Atlanta, GA',
      professionalTitle: 'Frontend Engineer', yearsOfExperience: 2,
      summary: 'Junior frontend engineer eager to learn and grow, with solid React foundation.',
      jobId: 'job-react-dev', status: CandidateStatus.APPLIED,
      overallScore: 68, matchCategory: MatchCategory.MODERATE,
      isShortlisted: false,
      aiRecommendation: 'Promising junior candidate. Needs more experience for senior role but shows potential.',
      aiConfidence: 72,
      skills: [
        { skill: 'React', proficiency: 'intermediate', yearsUsed: 2, isMatched: true },
        { skill: 'JavaScript', proficiency: 'advanced', yearsUsed: 2, isMatched: false },
        { skill: 'CSS', proficiency: 'advanced', yearsUsed: 2, isMatched: true },
        { skill: 'TypeScript', proficiency: 'beginner', yearsUsed: 0.5, isMatched: false },
        { skill: 'Tailwind CSS', proficiency: 'intermediate', yearsUsed: 1, isMatched: true },
      ],
      experience: [
        { company: 'Local Agency', title: 'Junior Frontend Developer', location: 'Atlanta, GA', startDate: '2023-06', isCurrent: true, description: 'Building websites and React applications for local businesses.' },
      ],
    },
  ];

  for (const candidateData of candidatesData) {
    const { skills, experience, jobId, ...data } = candidateData;

    // Create resume placeholder
    const resume = await prisma.resume.create({
      data: {
        originalName: `${data.firstName}_${data.lastName}_resume.pdf`,
        storedName: `seed_${data.firstName.toLowerCase()}_${data.lastName.toLowerCase()}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 150000 + Math.floor(Math.random() * 100000),
        filePath: `uploads/seed_${data.firstName.toLowerCase()}_${data.lastName.toLowerCase()}.pdf`,
        status: 'PARSED',
        parsedAt: new Date(),
        rawText: `${data.firstName} ${data.lastName} - ${data.professionalTitle}\n${data.summary}`,
      },
    });

    const candidate = await prisma.candidate.create({
      data: {
        ...data,
        resumeId: resume.id,
        jobId: createdJobs[jobId] || jobId,
      },
    });

    // Skills
    if (skills.length > 0) {
      await prisma.candidateSkill.createMany({
        data: skills.map((s) => ({ ...s, candidateId: candidate.id })),
        skipDuplicates: true,
      });
    }

    // Experience
    if (experience.length > 0) {
      await prisma.workExperience.createMany({
        data: experience.map((e) => ({ ...e, candidateId: candidate.id })),
      });
    }

    // Education
    await prisma.education.create({
      data: {
        candidateId: candidate.id,
        institution: ['MIT', 'Stanford', 'Carnegie Mellon', 'UC Berkeley', 'Georgia Tech'][Math.floor(Math.random() * 5)],
        degree: 'B.S.',
        field: 'Computer Science',
        startYear: 2016 + Math.floor(Math.random() * 4),
        endYear: 2020 + Math.floor(Math.random() * 3),
      },
    });

    // Screening result for screened candidates
    if (data.overallScore && data.matchCategory) {
      await prisma.screeningResult.create({
        data: {
          candidateId: candidate.id,
          jobId: createdJobs[jobId] || jobId,
          overallScore: data.overallScore,
          matchCategory: data.matchCategory,
          skillsScore: data.overallScore + Math.random() * 5 - 2,
          experienceScore: data.overallScore - Math.random() * 10,
          projectsScore: data.overallScore + Math.random() * 8 - 4,
          educationScore: data.overallScore - Math.random() * 5,
          certificationsScore: data.overallScore - Math.random() * 15,
          domainScore: data.overallScore + Math.random() * 5 - 2,
          matchedSkills: skills.filter((s) => s.isMatched).map((s) => s.skill),
          missingSkills: skills.filter((s) => s.isMissing).map((s) => s.skill),
          bonusSkills: skills.filter((s) => s.isBonus).map((s) => s.skill),
          strengths: ['Strong technical background', 'Relevant industry experience', 'Good communication skills'],
          weaknesses: skills.some((s) => s.isMissing) ? ['Missing some required skills'] : [],
          explanation: data.aiRecommendation || 'Comprehensive match analysis completed by AI.',
          aiModel: 'gemini-1.5-flash',
          processingTimeMs: 2000 + Math.floor(Math.random() * 3000),
        },
      });
    }

    // Stage history
    if (data.status !== CandidateStatus.APPLIED) {
      await prisma.stageHistory.create({
        data: {
          candidateId: candidate.id,
          fromStatus: CandidateStatus.APPLIED,
          toStatus: data.status,
          changedBy: recruiter.id,
        },
      });
    }

    // Tags for shortlisted
    if (data.isShortlisted) {
      await prisma.candidateTag.create({
        data: { candidateId: candidate.id, tag: 'High Potential', color: '#16a34a' },
      });
    }
  }

  // Sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: recruiter.id,
        type: 'SCREENING_COMPLETE',
        title: 'AI Screening Complete',
        message: '10 resumes have been analyzed for Senior Node.js Developer.',
        entityType: 'JOB',
        entityId: createdJobs['job-nodejs-senior'],
      },
      {
        userId: recruiter.id,
        type: 'CANDIDATE_SHORTLISTED',
        title: 'Top Candidates Available',
        message: '3 excellent-match candidates found for Senior Node.js Developer.',
        entityType: 'JOB',
        entityId: createdJobs['job-nodejs-senior'],
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('   Demo accounts:');
  console.log('   admin@techventures.io / Admin@123456');
  console.log('   recruiter@techventures.io / Recruit@123456');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
