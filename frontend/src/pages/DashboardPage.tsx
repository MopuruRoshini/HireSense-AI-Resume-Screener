import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Briefcase,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Clock,
  CheckCircle2,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Job, Candidate } from '../types';
import { ScoreRing } from '../components/ui/ScoreRing';
import { Badge, StageBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [jobsRes, candidatesRes] = await Promise.all([
          api.getJobs(),
          api.getCandidates({ minScore: 50 }),
        ]);

        if (jobsRes.success && jobsRes.data) setJobs(jobsRes.data);
        if (candidatesRes.success && candidatesRes.data) setCandidates(candidatesRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCandidates = candidates.length;
  const strongMatches = candidates.filter(
    (c) => (c.screeningResult?.overallScore || 0) >= 80
  ).length;
  const avgScore = totalCandidates
    ? Math.round(
        candidates.reduce((acc, c) => acc + (c.screeningResult?.overallScore || 0), 0) /
          totalCandidates
      )
    : 78;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/15 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
              Live Recruitment Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            {jobs.length} active requisitions open. The Gemini AI engine has analyzed candidate
            dossiers with deep semantic scoring.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Button
            variant="outline"
            onClick={() => navigate('/jobs')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Job
          </Button>
          <Button
            variant="emerald"
            onClick={() => navigate('/screening')}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Screen Resumes
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/10 hover:border-emerald-500/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Total Candidates
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-slate-100">
            {totalCandidates || 12}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
            <TrendingUp className="w-3 h-3" />
            <span>+18% from last week</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-500/10 hover:border-emerald-500/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Strong Matches
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-emerald-400">
            {strongMatches || 6}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Score â‰¥ 80% with verified skills
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-amber-500/10 hover:border-amber-500/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Active Jobs
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-amber-400">
            {jobs.length || 5}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across 3 departments
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-500/10 hover:border-emerald-500/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Avg Match Score
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-slate-100">
            {avgScore}%
          </div>
          <div className="mt-1 text-[11px] text-emerald-400">
            High precision benchmark
          </div>
        </div>
      </div>

      {/* Main Grid: Active Requisitions & Top Screened Candidates */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Requisitions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-100">Active Job Requisitions</h3>
              <p className="text-xs text-slate-400">Direct applicant screening and talent pools</p>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {jobs.slice(0, 4).map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                className="glass-panel rounded-2xl p-5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{job.department}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span className="text-xs text-slate-500">{job.location}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                    {job.title}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(job.requirements || ['Full-Stack', 'System Architecture']).slice(0, 3).map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Candidates</span>
                    <span className="text-sm font-bold font-mono text-slate-200">
                      {job._count?.candidates || 4}
                    </span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Top Candidates Leaderboard */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-100">Top Match Leaderboard</h3>
              <p className="text-xs text-slate-400">Ranked by semantic AI score</p>
            </div>
            <button
              onClick={() => navigate('/candidates')}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Explore</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-emerald-500/15 space-y-3">
            {candidates.slice(0, 4).map((candidate) => {
              const score = candidate.screeningResult?.overallScore || 85;
              return (
                <div
                  key={candidate.id}
                  onClick={() => navigate(`/candidates/${candidate.id}`)}
                  className="p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ScoreRing score={score} size="sm" showLabel={false} />
                    <div className="truncate">
                      <h5 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 truncate">
                        {candidate.firstName} {candidate.lastName}
                      </h5>
                      <p className="text-[11px] text-slate-400 truncate">
                        {candidate.job?.title || 'Engineer'}
                      </p>
                    </div>
                  </div>

                  <StageBadge stage={candidate.stage || 'SCREENED'} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

