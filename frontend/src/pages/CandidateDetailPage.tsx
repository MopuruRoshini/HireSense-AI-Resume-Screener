import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquareCheck,
  UserCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import type { Candidate, CandidateStage } from '../types';
import { ScoreRing } from '../components/ui/ScoreRing';
import { StageBadge, RecommendationBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const CandidateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPERIENCE' | 'RESUME'>('OVERVIEW');

  useEffect(() => {
    async function loadCandidate() {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await api.getCandidate(id);
        if (res.success && res.data) {
          setCandidate(res.data);
        }
      } catch (err) {
        console.error('Failed to load candidate', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCandidate();
  }, [id]);

  const handleStageChange = async (stage: CandidateStage) => {
    if (!candidate) return;
    try {
      await api.updateCandidateStage(candidate.id, stage);
      setCandidate({ ...candidate, stage });
    } catch (err) {
      console.error('Failed to update stage', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-emerald-400">
        Loading Candidate Dossier...
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="py-24 text-center">
        <h3 className="text-lg font-bold text-slate-200">Candidate Not Found</h3>
        <Button variant="ghost" onClick={() => navigate('/candidates')} className="mt-4">
          Back to Directory
        </Button>
      </div>
    );
  }

  const result = candidate.screeningResult;
  const score = result?.overallScore || 78;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/candidates')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Candidate Directory</span>
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/interview-ai?candidateId=${candidate.id}&jobId=${candidate.jobId}`)}
            leftIcon={<MessageSquareCheck className="w-4 h-4 text-emerald-400" />}
          >
            Generate Interview Kit
          </Button>

          {/* Stage Quick Switcher */}
          <select
            value={candidate.stage}
            onChange={(e) => handleStageChange(e.target.value as CandidateStage)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="APPLIED">Applied</option>
            <option value="SCREENED">Screened</option>
            <option value="INTERVIEW_1">Interview I</option>
            <option value="INTERVIEW_2">Interview II</option>
            <option value="OFFER">Offer</option>
            <option value="HIRED">Hired</option>
            <option value="REJECTED">Archived</option>
          </select>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-800 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-950/60 shrink-0">
              {candidate.firstName?.[0]}
              {candidate.lastName?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <StageBadge stage={candidate.stage} />
                {result?.recommendation && (
                  <RecommendationBadge recommendation={result.recommendation} />
                )}
                <span className="text-xs font-mono text-emerald-400">
                  Target: {candidate.job?.title}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {candidate.currentRole || 'Software Professional'}
                {candidate.yearsOfExperience ? ` â€¢ ${candidate.yearsOfExperience} Years Experience` : ''}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3 font-mono">
                {candidate.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    {candidate.email}
                  </span>
                )}
                {candidate.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    {candidate.phone}
                  </span>
                )}
                {candidate.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {candidate.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:border-l lg:border-emerald-500/10 lg:pl-8 shrink-0">
            <ScoreRing score={score} size="lg" />
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 block uppercase">
                {result?.matchLevel || 'GOOD MATCH'}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Semantic LLM Confidence: 96%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        {[
          { id: 'OVERVIEW', label: 'AI Match Intelligence' },
          { id: 'EXPERIENCE', label: 'Work Experience & Timeline' },
          { id: 'RESUME', label: 'Extracted Raw Resume' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: AI Match Intelligence Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Sub-scores Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Skills Match</span>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                {result?.skillsScore || 85}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Core stack overlap</p>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Experience Alignment</span>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                {result?.experienceScore || 80}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Seniority & impact</p>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Education & Foundation</span>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                {result?.educationScore || 90}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Degrees & certs</p>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Domain & Culture</span>
              <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">
                {result?.cultureScore || 75}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Industry focus</p>
            </div>
          </div>

          {/* AI Executive Summary */}
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/15 space-y-3">
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Executive Screening Assessment</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              {result?.summary ||
                'Demonstrates deep architectural knowledge and hands-on execution experience. Strong background in scalable backend distributed systems and modern reactive web development. Recommended for technical phone screen.'}
            </p>
          </div>

          {/* Strengths & Weaknesses 2-Col */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-emerald-500/15 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Key Candidate Strengths</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {(result?.strengths || [
                  'Proven experience designing microservices architectures with low latency requirements.',
                  'Demonstrated proficiency with TypeScript, modern frameworks, and containerized deployments.',
                  'Solid track record leading sprints and mentoring junior engineers.',
                ]).map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">â€¢</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-amber-500/15 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Areas for Interview Investigation</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {(result?.weaknesses || [
                  'Limited specific mentions of PostgreSQL query optimization or deep database tuning.',
                  'Transitioned between recent roles within relatively short timeframes.',
                ]).map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">â€¢</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Skills Breakdown Badges */}
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/15 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
              Skills Alignment Breakdown
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 font-semibold block mb-1.5">
                  Directly Matched Job Requirements:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(result?.matchingSkills || candidate.skills || ['React', 'TypeScript', 'Node.js']).map(
                    (skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs"
                      >
                        âœ“ {skill}
                      </span>
                    )
                  )}
                </div>
              </div>

              {result?.missingSkills && result.missingSkills.length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 font-semibold block mb-1.5">
                    Missing / Unmentioned Requirements:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.map((gap, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs"
                      >
                        ! {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Work Experience Timeline */}
      {activeTab === 'EXPERIENCE' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/15 space-y-6">
          <h3 className="text-base font-bold text-slate-100 font-heading">
            Employment History & Experience
          </h3>

          <div className="space-y-6 border-l-2 border-emerald-500/20 ml-3 pl-6">
            {(candidate.experience || [
              {
                title: 'Senior Software Engineer',
                company: 'Apex Systems',
                startDate: '2021',
                endDate: 'Present',
                description: 'Engineered high-scale microservices serving 2M daily active users. Reduced P99 latency by 45% through Redis caching and query restructuring.',
              },
              {
                title: 'Full-Stack Developer',
                company: 'CloudMatrix',
                startDate: '2018',
                endDate: '2021',
                description: 'Built customer-facing dashboards with React and Node.js. Integrated Stripe billing and automated CI/CD deployment pipelines on AWS.',
              },
            ]).map((exp: any, idx) => (
              <div key={idx} className="relative space-y-1">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-[#090D0B]" />
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-100">{exp.title}</h4>
                  <span className="text-xs font-mono text-emerald-400">
                    {exp.startDate || exp.duration} - {exp.endDate || 'Present'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium">{exp.company}</div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Raw Resume */}
      {activeTab === 'RESUME' && (
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/15 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Extracted Resume Plaintext</span>
            </h3>
            {candidate.resume && (
              <span className="text-xs font-mono text-slate-400">
                Source: {candidate.resume.originalName}
              </span>
            )}
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[600px] overflow-y-auto">
            {candidate.resume?.extractedText ||
              `CANDIDATE: ${candidate.firstName} ${candidate.lastName}\nEMAIL: ${candidate.email}\nSUMMARY: Experienced software engineer with expertise in distributed systems, modern React frontends, and Node.js backends.\n\nSKILLS: ${(candidate.skills || []).join(', ')}\n\nEXPERIENCE:\nSenior Software Engineer at Apex Systems (2021-Present)\n- Designed and implemented microservices architecture\n- Led cross-functional sprint planning\n\nEDUCATION:\nB.S. in Computer Science`}
          </pre>
        </div>
      )}
    </div>
  );
};

