import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Cpu,
  FileCheck2,
  Users2,
  FileText,
  Star,
} from 'lucide-react';
import { ScoreRing } from '../components/ui/ScoreRing';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090D0B] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed top-96 right-10 w-[400px] h-[400px] bg-amber-600/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-emerald-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-900/40">
            <Sparkles className="w-5 h-5 text-slate-950 fill-current" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight font-heading text-slate-100">
              HIRE<span className="text-emerald-400">SENSE</span>
            </span>
            <span className="block text-[10px] tracking-wider uppercase font-mono text-emerald-500/80 font-bold -mt-1">
              AI Recruitment Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button
            variant="emerald"
            size="sm"
            onClick={() => navigate('/login')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Launch Platform
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-8 animate-emerald-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Next-Generation AI Resume Screening Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight max-w-5xl mx-auto leading-[1.1] text-slate-100">
          Screen 100 Resumes in Seconds.{' '}
          <span className="text-gradient-emerald block mt-2">Zero Guesswork. Total Precision.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          HireSense extracts deep candidate intelligence, matches skills with semantic LLM vectors,
          and generates automated interview kits. Built for elite talent acquisition teams.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="emerald"
            size="lg"
            onClick={() => navigate('/login')}
            leftIcon={<Zap className="w-5 h-5" />}
          >
            Start Screening Free
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/login')}
            leftIcon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
          >
            View Demo Recruiter Space
          </Button>
        </div>

        {/* Live Interactive Preview Card */}
        <div className="mt-16 max-w-4xl mx-auto glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/25 shadow-2xl relative overflow-hidden text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-500/15">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="emerald">Live Screening Preview</Badge>
                <span className="text-xs text-slate-400 font-mono">Job: Senior Staff AI Architect</span>
              </div>
              <h3 className="text-xl font-bold text-slate-100 font-heading">
                Candidate: Marcus Sterling
              </h3>
              <p className="text-xs text-slate-400">12 Years Exp • Distributed Systems & LLM Fine-Tuning</p>
            </div>

            <div className="flex items-center gap-4">
              <ScoreRing score={94} size="lg" />
              <div>
                <span className="text-xs font-bold text-emerald-400 font-mono block">STRONG MATCH</span>
                <span className="text-[11px] text-slate-400 block">AI Recommendation: ★ Strong Hire</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block mb-2">Matched Competencies</span>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20">
                  PyTorch
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20">
                  Distributed Training
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[11px] font-mono border border-emerald-500/20">
                  RAG Systems
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block mb-2">Key Strengths</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Led 100M+ parameter model serving infrastructure at scale with 99.99% uptime SLA.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block mb-2">Interview Focus</span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Verify hands-on experience optimizing latency in multi-GPU inference clusters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="relative z-10 border-y border-emerald-500/10 bg-[#0C120F]/50 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">92%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Screening Time Saved
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono">5.2x</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Faster Shortlisting
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">99.4%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Extraction Accuracy
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-200 font-mono">10,000+</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Resumes Processed
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-slate-100">
            Engineered for Modern Talent Teams
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Every feature is designed to eliminate manual screening overhead and accelerate high-conviction hiring.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/15 hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-heading mb-2">Semantic AI Matching</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Looks beyond naive keywords. Understands equivalent technologies, project scope, seniority depth, and real domain knowledge.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/15 hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-heading mb-2">Batch Resume Ingestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload dozens of PDF, DOCX, and TXT resumes simultaneously. Real-time background extraction and instant structured dossiers.
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/15 hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 font-heading mb-2">Dynamic Interview Kits</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated generation of targeted technical and situational questions tailored specifically to each candidate's gaps and strengths.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-emerald-500/10 py-8 text-center text-xs text-slate-500">
        <p>© 2026 HireSense Intelligence Engine. All rights reserved.</p>
      </footer>
    </div>
  );
};
