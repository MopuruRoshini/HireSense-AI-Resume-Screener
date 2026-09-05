import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitPullRequest,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '../services/api';
import type { Candidate, Job, CandidateStage } from '../types';
import { ScoreRing } from '../components/ui/ScoreRing';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const PIPELINE_STAGES: Array<{ id: CandidateStage; label: string; color: string }> = [
  { id: 'APPLIED', label: 'Applied', color: 'border-slate-700/60' },
  { id: 'SCREENED', label: 'Screened', color: 'border-teal-500/40' },
  { id: 'INTERVIEW_1', label: 'Interview I', color: 'border-amber-500/40' },
  { id: 'INTERVIEW_2', label: 'Interview II', color: 'border-amber-500/60' },
  { id: 'OFFER', label: 'Offer Sent', color: 'border-emerald-500/50' },
  { id: 'HIRED', label: 'Hired', color: 'border-emerald-400' },
];

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [cRes, jRes] = await Promise.all([
          api.getCandidates(),
          api.getJobs(),
        ]);
        if (cRes.success && cRes.data) setCandidates(cRes.data);
        if (jRes.success && jRes.data) setJobs(jRes.data);
      } catch (err) {
        console.error('Failed to load pipeline data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const moveCandidate = async (candidateId: string, currentStage: CandidateStage, direction: 'next' | 'prev') => {
    const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === currentStage);
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= PIPELINE_STAGES.length) return;

    const newStage = PIPELINE_STAGES[newIndex].id;

    // Optimistically update UI
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: newStage } : c))
    );

    try {
      await api.updateCandidateStage(candidateId, newStage);
    } catch (err) {
      console.error('Failed to update stage in database', err);
      // Revert on error
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, stage: currentStage } : c))
      );
    }
  };

  const filteredCandidates = candidates.filter((c) =>
    selectedJobId === 'ALL' ? true : c.jobId === selectedJobId
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100">
            Recruitment Pipeline Kanban
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visual stage progression with real-time PostgreSQL state persistence.
          </p>
        </div>

        {/* Job Requisition Filter */}
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-100 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="ALL">All Active Requisitions</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
        {PIPELINE_STAGES.map((stage) => {
          const stageCandidates = filteredCandidates.filter((c) => c.stage === stage.id);

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-72 glass-panel rounded-2xl border border-emerald-500/10 flex flex-col max-h-[calc(100vh-220px)] shadow-xl"
            >
              {/* Column Header */}
              <div
                className={`p-3.5 border-b border-emerald-500/10 flex items-center justify-between bg-[#0C120F] rounded-t-2xl border-t-2 ${stage.color}`}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                    {stage.label}
                  </h3>
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono font-bold">
                    {stageCandidates.length}
                  </span>
                </div>
              </div>

              {/* Candidate Cards List */}
              <div className="p-2.5 overflow-y-auto flex-1 space-y-2.5">
                {stageCandidates.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-600 font-mono">
                    No candidates
                  </div>
                ) : (
                  stageCandidates.map((candidate) => {
                    const score = candidate.screeningResult?.overallScore || 75;
                    const stageIndex = PIPELINE_STAGES.findIndex((s) => s.id === stage.id);

                    return (
                      <div
                        key={candidate.id}
                        className="glass-card rounded-xl p-3 border border-slate-800/80 hover:border-emerald-500/30 transition-all space-y-2.5 shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            onClick={() => navigate(`/candidates/${candidate.id}`)}
                            className="cursor-pointer group flex-1 min-w-0"
                          >
                            <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 truncate transition-colors">
                              {candidate.firstName} {candidate.lastName}
                            </h4>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                              {candidate.job?.title || 'Engineer'}
                            </p>
                          </div>
                          <ScoreRing score={score} size="sm" showLabel={false} />
                        </div>

                        {/* Card Footer with Quick Move Buttons */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                          <button
                            disabled={stageIndex === 0}
                            onClick={() => moveCandidate(candidate.id, stage.id, 'prev')}
                            className="p-1 text-slate-500 hover:text-emerald-400 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                            title="Move to previous stage"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => navigate(`/candidates/${candidate.id}`)}
                            className="text-[10px] font-mono text-slate-400 hover:text-emerald-300 transition-colors"
                          >
                            Dossier
                          </button>

                          <button
                            disabled={stageIndex === PIPELINE_STAGES.length - 1}
                            onClick={() => moveCandidate(candidate.id, stage.id, 'next')}
                            className="p-1 text-slate-500 hover:text-emerald-400 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                            title="Advance to next stage"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

