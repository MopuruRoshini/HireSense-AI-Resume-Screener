import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Users,
  MapPin,
  Clock,
  Sparkles,
  ArrowUpRight,
  Trash2,
  Edit,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import type { Job } from '../types';
import { Badge, JobStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Create Job Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Engineering',
    location: 'San Francisco, CA (Hybrid)',
    employmentType: 'FULL_TIME',
    description: '',
    requirements: [] as string[],
    responsibilities: [] as string[],
    salaryMin: 120000,
    salaryMax: 180000,
    salaryCurrency: 'USD',
  });

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getJobs();
      if (res.success && res.data) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  // AI JD Analyzer
  const handleAnalyzeJD = async () => {
    if (!newJob.description || newJob.description.length < 20) {
      alert('Please enter a more detailed job description first.');
      return;
    }

    setIsAnalyzingJD(true);
    try {
      const res = await api.analyzeJobDescription(newJob.description);
      if (res.success && res.data) {
        setNewJob((prev) => ({
          ...prev,
          title: prev.title || res.data.title || prev.title,
          department: res.data.department || prev.department,
          requirements: res.data.requirements || prev.requirements,
          responsibilities: res.data.responsibilities || prev.responsibilities,
        }));
      }
    } catch (err) {
      console.error('AI JD Analysis error', err);
    } finally {
      setIsAnalyzingJD(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.description) return;

    setFormError(null);
    setIsSubmitting(true);
    try {
      // Build the payload using backend field names
      const payload = {
        title: newJob.title,
        department: newJob.department,
        location: newJob.location,
        employmentType: newJob.employmentType,
        description: newJob.description,
        // Convert string[] to newline-joined string for Prisma Text fields
        requirements: newJob.requirements.length > 0 ? newJob.requirements.join('\n') : undefined,
        responsibilities: newJob.responsibilities.length > 0 ? newJob.responsibilities.join('\n') : undefined,
        salaryMin: newJob.salaryMin,
        salaryMax: newJob.salaryMax,
        salaryCurrency: newJob.salaryCurrency,
        status: 'ACTIVE' as const,
      };
      await api.createJob(payload);
      setIsModalOpen(false);
      loadJobs();
    } catch (err: unknown) {
      // Extract real validation message from backend
      const axiosErr = err as { response?: { data?: { error?: { message?: string; details?: Array<{ field: string; message: string }> } } } };
      const backendError = axiosErr?.response?.data?.error;
      if (backendError) {
        const detail = backendError.details?.map((d) => `${d.field}: ${d.message}`).join(', ');
        setFormError(detail || backendError.message || 'Failed to create job');
      } else {
        setFormError('Failed to create job. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (departmentFilter !== 'ALL' && job.department !== departmentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.department.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const departments = ['ALL', ...Array.from(new Set(jobs.map((j) => j.department)))];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100">
            Job Requisitions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your open positions, requirements, and candidate pipelines.
          </p>
        </div>

        <Button
          variant="emerald"
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Requisition
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-2xl p-4 border border-emerald-500/15">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by role, department, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium font-mono uppercase transition-colors cursor-pointer shrink-0 ${
                departmentFilter === dept
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Catalog Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            onClick={() => navigate(`/jobs/${job.id}`)}
            className="glass-panel rounded-2xl p-6 border border-emerald-500/15 hover:border-emerald-500/35 transition-all cursor-pointer flex flex-col justify-between group space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <JobStatusBadge status={job.status} />
                <span className="text-[11px] font-mono text-slate-400">{job.department}</span>
              </div>

              <h3 className="text-lg font-bold font-heading text-slate-100 group-hover:text-emerald-300 transition-colors">
                {job.title}
              </h3>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {job.employmentType}
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {job.description}
              </p>

              {job.requirements && job.requirements.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.requirements.slice(0, 3).map((r, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-emerald-400"
                    >
                      {r}
                    </span>
                  ))}
                  {job.requirements.length > 3 && (
                    <span className="text-[10px] text-slate-500 self-center">
                      +{job.requirements.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-emerald-500/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{job._count?.candidates || 0} Candidates</span>
              </div>

              <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                <span>View Job</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Job Modal with AI JD Parser */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Job Requisition"
        subtitle="Let Google Gemini AI parse requirements automatically from your JD"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateJob} className="space-y-4">
          {formError && (
            <div className="px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-mono">
              ⚠ {formError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Job Title
              </label>
              <input
                type="text"
                required
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                placeholder="e.g. Senior Machine Learning Engineer"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Department
              </label>
              <input
                type="text"
                required
                value={newJob.department}
                onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                placeholder="Engineering"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Location & Workplace
              </label>
              <input
                type="text"
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                placeholder="San Francisco, CA (Hybrid)"
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Employment Type
              </label>
              <select
                value={newJob.employmentType}
                onChange={(e) => setNewJob({ ...newJob, employmentType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Job Description
              </label>
              <button
                type="button"
                onClick={handleAnalyzeJD}
                disabled={isAnalyzingJD}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-mono font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzingJD ? 'Extracting with AI...' : 'AI Extract Skills & Requirements'}</span>
              </button>
            </div>
            <textarea
              rows={5}
              required
              value={newJob.description}
              onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              placeholder="Paste or write the job description here. Click 'AI Extract Skills' above to automatically parse requirements..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 outline-none leading-relaxed"
            />
          </div>

          {newJob.requirements.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                Extracted Skills & Requirements:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {newJob.requirements.map((r, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20"
                  >
                    âœ“ {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="emerald" type="submit" isLoading={isSubmitting}>
              Publish Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

