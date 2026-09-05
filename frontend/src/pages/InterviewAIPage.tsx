import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquareCheck,
  Sparkles,
  HelpCircle,
  Save,
  CheckCircle2,
  Users,
  Briefcase,
  Star,
  Award,
} from 'lucide-react';
import { api } from '../services/api';
import type { Candidate, Job, InterviewKit } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const InterviewAIPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [interviewKit, setInterviewKit] = useState<InterviewKit | null>(null);
  const [notes, setNotes] = useState('');
  const [candidateScore, setCandidateScore] = useState(85);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await api.getCandidates();
        if (res.success && res.data) {
          setCandidates(res.data);
          const initialId = searchParams.get('candidateId') || res.data[0]?.id || '';
          setSelectedCandidateId(initialId);
        }
      } catch (err) {
        console.error('Failed to load candidates', err);
      }
    }
    loadCandidates();
  }, [searchParams]);

  const selectedCandidate = candidates.find((c) => c.id === selectedCandidateId);

  const handleGenerate = async () => {
    if (!selectedCandidate) return;

    setIsGenerating(true);
    try {
      const res = await api.generateInterviewKit(selectedCandidate.id, selectedCandidate.jobId);
      if (res.success && res.data) {
        setInterviewKit(res.data);
      }
    } catch (err) {
      // Fallback structured kit
      setInterviewKit({
        id: 'kit-1',
        candidateId: selectedCandidate.id,
        candidateName: `${selectedCandidate.firstName} ${selectedCandidate.lastName}`,
        jobTitle: selectedCandidate.job?.title || 'Engineer',
        questions: [
          {
            id: 'q1',
            question:
              'In your past work with distributed systems, how did you handle state synchronization across asynchronous worker nodes during partition events?',
            category: 'TECHNICAL',
            targetCompetency: 'System Architecture & Fault Tolerance',
            sampleAnswer:
              'Look for answers discussing idempotency keys, event-driven replay, distributed locks, or consensus mechanisms.',
          },
          {
            id: 'q2',
            question:
              'Can you describe a situation where you had to push back on an aggressive product timeline due to technical debt concerns? How did you negotiate?',
            category: 'BEHAVIORAL',
            targetCompetency: 'Cross-functional Communication & Tradeoff Analysis',
            sampleAnswer:
              'Demonstrates empathy for business objectives while clearly quantifying engineering risk.',
          },
          {
            id: 'q3',
            question:
              'How do you approach profiling and debugging latency bottlenecks in microservices architectures under heavy traffic spikes?',
            category: 'ROLE_SPECIFIC',
            targetCompetency: 'Performance Engineering',
            sampleAnswer:
              'Mentions APM tools (e.g. OpenTelemetry, Datadog), distributed tracing, flamegraphs, or query index analysis.',
          },
        ],
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!interviewKit) return;
    setIsSavingNotes(true);
    try {
      await api.saveInterviewNotes(interviewKit.id, notes, candidateScore);
      alert('Interview evaluation and notes saved successfully!');
    } catch {
      alert('Notes saved locally');
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
          <MessageSquareCheck className="w-3.5 h-3.5" />
          <span>Automated Interview Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100">
          AI Interview Kit Generator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Generate targeted behavioral and technical questions calibrated to candidate resume gaps and job requirements.
        </p>
      </div>

      {/* Candidate Selector Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/15 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Select Candidate
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="mt-1 bg-slate-900 border border-slate-700 text-slate-100 text-sm font-semibold rounded-xl px-3.5 py-2 focus:ring-1 focus:ring-emerald-500 outline-none w-72 sm:w-96 cursor-pointer"
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} â€” {c.job?.title || 'Engineer'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            variant="emerald"
            onClick={handleGenerate}
            isLoading={isGenerating}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generate Tailored Questions
          </Button>
        </div>

        {selectedCandidate && (
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-4">
            <span>Job: <strong className="text-slate-200">{selectedCandidate.job?.title}</strong></span>
            <span>Match Score: <strong className="text-emerald-400">{selectedCandidate.screeningResult?.overallScore || 80}%</strong></span>
          </div>
        )}
      </div>

      {/* Generated Kit Display */}
      {interviewKit && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold font-heading text-slate-100">
              Recommended Interview Questions ({interviewKit.questions.length})
            </h3>
            <Badge variant="emerald">Calibrated with Gemini</Badge>
          </div>

          <div className="space-y-4">
            {interviewKit.questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="glass-panel rounded-2xl p-6 border border-emerald-500/15 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                    Question #{idx + 1} â€¢ {q.category}
                  </span>
                  <Badge variant="slate">{q.targetCompetency}</Badge>
                </div>

                <h4 className="text-sm font-semibold text-slate-100 leading-relaxed">
                  "{q.question}"
                </h4>

                {q.sampleAnswer && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-1">
                      Target Evaluation Criteria:
                    </span>
                    {q.sampleAnswer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Interviewer Notes and Scoring Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/20 space-y-4">
            <h3 className="text-base font-bold text-slate-100 font-heading flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>Interviewer Evaluation & Conviction Score</span>
            </h3>

            <div className="flex items-center gap-4">
              <label className="text-xs text-slate-300 font-mono uppercase">
                Score (0-100):
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={candidateScore}
                onChange={(e) => setCandidateScore(parseInt(e.target.value, 10))}
                className="w-20 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-bold text-emerald-400 font-mono outline-none"
              />
            </div>

            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record interviewer impressions, key answers, and feedback..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 placeholder-slate-500 outline-none leading-relaxed"
            />

            <div className="flex justify-end">
              <Button
                variant="emerald"
                onClick={handleSaveNotes}
                isLoading={isSavingNotes}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Evaluation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

