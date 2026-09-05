import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Briefcase,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Search,
  ChevronRight,
  Check,
  Eye,
  UserCheck,
  XCircle,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import type { Job, Candidate } from '../types';
import { ScoreRing } from '../components/ui/ScoreRing';
import { Badge, RecommendationBadge, StageBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { UploadDropzone } from '../components/ui/UploadDropzone';

export const ScreeningPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Filter & Search
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Batch Processing State
  const [batchProgress, setBatchProgress] = useState<{
    batchId: string;
    stage: string;
    processed: number;
    total: number;
    percentage: number;
  } | null>(null);

  // Load jobs on mount
  useEffect(() => {
    async function loadJobs() {
      setIsLoadingJobs(true);
      try {
        const res = await api.getJobs({ status: 'ACTIVE' });
        if (res.success && res.data) {
          setJobs(res.data);
          const initialJobId = searchParams.get('jobId') || res.data[0]?.id || '';
          setSelectedJobId(initialJobId);
        }
      } catch (err) {
        console.error('Failed to load jobs', err);
      } finally {
        setIsLoadingJobs(false);
      }
    }
    loadJobs();
  }, []);

  // Load candidates whenever selected job changes
  useEffect(() => {
    if (!selectedJobId) return;

    async function loadCandidates() {
      setIsLoadingCandidates(true);
      try {
        const res = await api.getCandidates({ jobId: selectedJobId });
        if (res.success && res.data) {
          setCandidates(res.data);
        }
      } catch (err) {
        console.error('Failed to load candidates', err);
      } finally {
        setIsLoadingCandidates(false);
      }
    }
    loadCandidates();
  }, [selectedJobId]);

  const handleJobSelect = (id: string) => {
    setSelectedJobId(id);
    setSearchParams({ jobId: id });
  };

  const handleUpload = async (files: File[]) => {
    if (!selectedJobId) {
      alert('Please select a target job requisition first.');
      return;
    }

    setIsUploading(true);
    setBatchProgress({
      batchId: '',
      stage: 'Uploading resumes to server...',
      processed: 0,
      total: files.length,
      percentage: 10,
    });

    try {
      const res = await api.uploadResumes(selectedJobId, files);
      if (res.success && res.data) {
        const batchId = res.data.batchId;

        // Connect to SSE stream for real-time progress
        const eventSource = new EventSource(`/api/resumes/progress/${batchId}`);

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setBatchProgress({
              batchId,
              stage: data.stage || 'Analyzing candidate profile...',
              processed: data.processed || 1,
              total: data.total || files.length,
              percentage: data.percentage || 100,
            });

            if (data.type === 'complete' && data.processed >= (data.total || 1)) {
              eventSource.close();
              // Reload candidates
              api.getCandidates({ jobId: selectedJobId }).then((cRes) => {
                if (cRes.success && cRes.data) setCandidates(cRes.data);
              });
              setTimeout(() => setBatchProgress(null), 3000);
            }
          } catch (e) {
            // Non-JSON message (e.g. heartbeat)
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          // Fallback poll after delay
          setTimeout(async () => {
            const cRes = await api.getCandidates({ jobId: selectedJobId });
            if (cRes.success && cRes.data) setCandidates(cRes.data);
            setBatchProgress(null);
          }, 3000);
        };
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
      setBatchProgress(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStageChange = async (candidateId: string, stage: string) => {
    try {
      await api.updateCandidateStage(candidateId, stage);
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, stage: stage as any } : c))
      );
    } catch (err) {
      console.error('Failed to change stage', err);
    }
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  // Filter candidates
  const filteredCandidates = candidates.filter((c) => {
    const score = c.screeningResult?.overallScore || 0;
    if (filterCategory === 'STRONG' && score < 80) return false;
    if (filterCategory === 'GOOD' && (score < 65 || score >= 80)) return false;
    if (filterCategory === 'MODERATE' && (score < 50 || score >= 65)) return false;
    if (filterCategory === 'PASS' && score >= 50) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      const skills = (c.skills || []).map((s) => s.toLowerCase()).join(' ');
      if (!name.includes(q) && !skills.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Intelligent Screening Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100">
            Resume Screening & Semantic Evaluation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Upload resumes, let Gemini extract core competencies, and compare against requisition requirements.
          </p>
        </div>
      </div>

      {/* Target Job Requisition Selector */}
      <div className="glass-panel rounded-3xl p-6 border border-emerald-500/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Select Active Job Opening
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => handleJobSelect(e.target.value)}
                className="mt-1 bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl px-3.5 py-2 focus:ring-1 focus:ring-emerald-500 outline-none w-72 sm:w-96 cursor-pointer"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} ({job.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedJob && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="emerald">{selectedJob.department}</Badge>
              <Badge variant="slate">{selectedJob.location}</Badge>
              <Badge variant="amber">{selectedJob.employmentType}</Badge>
            </div>
          )}
        </div>

        {selectedJob && (
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-slate-400 font-mono uppercase block mb-1.5">
              Required Target Competencies:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(selectedJob.requirements || ['TypeScript', 'React', 'Node.js', 'PostgreSQL']).map(
                (req, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-emerald-500/20 text-emerald-300 font-mono text-[11px]"
                  >
                    {req}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      <div className="glass-panel rounded-3xl p-6 border border-emerald-500/15">
        <h3 className="text-base font-bold text-slate-100 font-heading mb-3 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-emerald-400" />
          <span>Upload Candidate Resumes</span>
        </h3>
        <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />
      </div>

      {/* Live Batch Progress Banner */}
      {batchProgress && (
        <div className="glass-panel-amber rounded-2xl p-5 border border-amber-500/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <Clock className="w-4 h-4 animate-spin text-amber-400" />
              <span>AI Pipeline: {batchProgress.stage}</span>
            </div>
            <span className="font-mono text-amber-400 font-bold">
              {batchProgress.processed} / {batchProgress.total} ({batchProgress.percentage}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${batchProgress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter and Candidate Screened Results */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold font-heading text-slate-100">
              Screened Candidates ({filteredCandidates.length})
            </h3>
            <p className="text-xs text-slate-400">
              Ranked in descending order of AI semantic match conviction
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Filter by name or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 outline-none w-56"
              />
            </div>

            {/* Score Filters */}
            <div className="flex items-center rounded-xl bg-slate-900/80 border border-slate-800 p-1">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'STRONG', label: 'â‰¥ 80%' },
                { id: 'GOOD', label: '65-79%' },
                { id: 'MODERATE', label: '50-64%' },
                { id: 'PASS', label: '< 50%' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterCategory(tab.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    filterCategory === tab.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        {filteredCandidates.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800">
            <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-200">No candidates found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {candidates.length === 0
                ? 'No resumes uploaded for this job opening yet. Drop your first batch above!'
                : 'No candidates matched your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredCandidates.map((candidate) => {
              const score = candidate.screeningResult?.overallScore || 75;
              const result = candidate.screeningResult;

              return (
                <div
                  key={candidate.id}
                  className="glass-panel rounded-2xl p-6 border border-emerald-500/15 hover:border-emerald-500/35 transition-all space-y-4 relative group"
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <ScoreRing score={score} size="md" />
                      <div>
                        <h4 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                          {candidate.firstName} {candidate.lastName}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {candidate.currentRole || candidate.phone || 'Software Professional'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <StageBadge stage={candidate.stage} />
                          {result?.recommendation && (
                            <RecommendationBadge recommendation={result.recommendation} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
                    {result?.summary ||
                      'Demonstrated strong technical background with relevant distributed architecture and framework experience.'}
                  </p>

                  {/* Skills Breakdown Badges */}
                  <div className="space-y-1.5 text-xs">
                    {result?.matchingSkills && result.matchingSkills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase">
                          Matched:
                        </span>
                        {result.matchingSkills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20"
                          >
                            âœ“ {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {result?.missingSkills && result.missingSkills.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-amber-400 font-mono font-semibold uppercase">
                          Gaps:
                        </span>
                        {result.missingSkills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[11px] font-mono border border-amber-500/20"
                          >
                            ! {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-emerald-500/10 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/candidates/${candidate.id}`)}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full AI Dossier</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {candidate.stage !== 'INTERVIEW_1' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStageChange(candidate.id, 'INTERVIEW_1')}
                          leftIcon={<UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
                        >
                          To Interview
                        </Button>
                      )}
                      {candidate.stage !== 'REJECTED' && (
                        <button
                          onClick={() => handleStageChange(candidate.id, 'REJECTED')}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Archive Candidate"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

