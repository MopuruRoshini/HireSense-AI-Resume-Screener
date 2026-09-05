import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  Users,
  Eye,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import type { Job, Candidate } from '../types';
import { ScoreRing } from '../components/ui/ScoreRing';
import { Badge, JobStatusBadge, StageBadge, RecommendationBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadJobDetails() {
      if (!id) return;
      setIsLoading(true);
      try {
        const [jobRes, candidatesRes] = await Promise.all([
          api.getJob(id),
          api.getCandidates({ jobId: id }),
        ]);

        if (jobRes.success && jobRes.data) setJob(jobRes.data);
        if (candidatesRes.success && candidatesRes.data) setCandidates(candidatesRes.data);
      } catch (err) {
        console.error('Failed to load job details', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadJobDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs font-mono text-emerald-400">
        Loading Requisition Details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-20 text-center">
        <h3 className="text-lg font-bold text-slate-200">Requisition Not Found</h3>
        <Button variant="ghost" onClick={() => navigate('/jobs')} className="mt-4">
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </button>

        <Button
          variant="emerald"
          onClick={() => navigate(`/screening?jobId=${job.id}`)}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Screen Candidates for this Role
        </Button>
      </div>

      {/* Main Job Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/20 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <JobStatusBadge status={job.status} />
              <Badge variant="emerald">{job.department}</Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-100">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {job.employmentType}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Opened: {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center shrink-0">
            <span className="text-xs text-slate-400 font-mono uppercase block">Active Pipeline</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400">
              {candidates.length}
            </span>
            <span className="text-[11px] text-slate-500 block">Candidates</span>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-2 pt-4 border-t border-emerald-500/10">
          <h3 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
            Role Overview
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
            {job.description}
          </p>
        </div>

        {/* Target Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-emerald-500/10">
            <h3 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
              Semantic AI Matching Criteria
            </h3>
            <div className="flex flex-wrap gap-2">
              {job.requirements.map((req, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs"
                >
                  âœ“ {req}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Associated Candidates Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-heading text-slate-100">
              Applicants & Screened Candidates ({candidates.length})
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated against this role's semantic requirement profile
            </p>
          </div>
        </div>

        {candidates.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              No resumes screened for this role yet.{' '}
              <button
                onClick={() => navigate(`/screening?jobId=${job.id}`)}
                className="text-emerald-400 underline font-semibold"
              >
                Upload resumes now
              </button>
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {candidates.map((candidate) => {
              const score = candidate.screeningResult?.overallScore || 70;
              return (
                <div
                  key={candidate.id}
                  className="glass-panel rounded-2xl p-5 border border-emerald-500/15 hover:border-emerald-500/35 transition-all flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <ScoreRing score={score} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        {candidate.firstName} {candidate.lastName}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {candidate.currentRole || candidate.phone || 'Candidate'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <StageBadge stage={candidate.stage} />
                        {candidate.screeningResult?.recommendation && (
                          <RecommendationBadge
                            recommendation={candidate.screeningResult.recommendation}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/candidates/${candidate.id}`)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Dossier
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

