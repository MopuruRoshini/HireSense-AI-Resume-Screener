import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Briefcase,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import type { Candidate, Job, CandidateStage } from '../types';
import { ScoreRing } from '../components/ui/ScoreRing';
import { StageBadge, RecommendationBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const CandidatesPage: React.FC = () => {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');

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
        console.error('Failed to load candidates', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = candidates.filter((c) => {
    if (jobFilter !== 'ALL' && c.jobId !== jobFilter) return false;
    if (stageFilter !== 'ALL' && c.stage !== stageFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const skills = (c.skills || []).join(' ').toLowerCase();
      const email = (c.email || '').toLowerCase();
      if (!name.includes(q) && !skills.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hiresense_candidates_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100">
            Candidate Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Global talent database with multi-dimensional match scores & parsed resumes.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleExport}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export JSON
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-emerald-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search candidates by name, email, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Job Filter */}
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Requisitions</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">All Stages</option>
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

      {/* Candidates Table */}
      <div className="glass-panel rounded-3xl border border-emerald-500/15 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0C120F]/90 border-b border-emerald-500/10 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Candidate</th>
                <th className="py-3.5 px-4">Job Requisition</th>
                <th className="py-3.5 px-4">Match Score</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4">AI Recommendation</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No candidates found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((candidate) => {
                  const score = candidate.screeningResult?.overallScore || 75;
                  return (
                    <tr
                      key={candidate.id}
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 font-mono text-xs">
                            {candidate.firstName?.[0]}
                            {candidate.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                              {candidate.firstName} {candidate.lastName}
                            </div>
                            <div className="text-[11px] text-slate-500">{candidate.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-300">
                        {candidate.job?.title || 'Engineer'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <ScoreRing score={score} size="sm" showLabel={false} />
                          <span className="font-mono font-bold text-slate-200">{score}%</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <StageBadge stage={candidate.stage} />
                      </td>

                      <td className="py-4 px-4">
                        {candidate.screeningResult?.recommendation ? (
                          <RecommendationBadge
                            recommendation={candidate.screeningResult.recommendation}
                          />
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Evaluating</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 inline-flex items-center gap-1">
                          <span>View Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

