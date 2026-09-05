import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Building2,
  Sliders,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

export const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState('Technology & Software');
  const [teamSize, setTeamSize] = useState('10-50 employees');
  const [screeningStrictness, setScreeningStrictness] = useState('BALANCED');
  const [jobTitle, setJobTitle] = useState('Senior Full-Stack Engineer');
  const [department, setDepartment] = useState('Engineering');
  const [isLoading, setIsLoading] = useState(false);

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      // Create initial job if provided
      if (jobTitle) {
        await api.createJob({
          title: jobTitle,
          department,
          location: 'San Francisco, CA (Hybrid)',
          employmentType: 'FULL_TIME',
          status: 'ACTIVE',
          description: `We are seeking an exceptional ${jobTitle} to join our ${department} team. You will lead development of high-throughput scalable applications, collaborate with product, and optimize performance.`,
          requirements: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'System Architecture'],
          responsibilities: ['Design and implement robust APIs', 'Build responsive UIs', 'Collaborate across teams'],
        }).catch(() => {});
      }

      await completeOnboarding();
      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding finish error:', err);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D0B] text-slate-100 flex flex-col justify-center py-12 px-6 sm:px-8 relative overflow-hidden">
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center relative z-10 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-xl shadow-emerald-950/60 mb-3">
          <Sparkles className="w-6 h-6 text-slate-950 fill-current" />
        </div>
        <h2 className="text-3xl font-extrabold font-heading text-slate-100">
          Welcome to HireSense, {user?.firstName || 'Recruiter'}!
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Let's configure your recruitment workspace in 3 quick steps
        </p>

        {/* Steps Progress */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all ${
                  step === s
                    ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-900/40'
                    : step > s
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="glass-panel rounded-3xl p-8 border border-emerald-500/20 shadow-2xl space-y-6">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase">
                <Building2 className="w-4 h-4" />
                <span>Step 1: Organization Preferences</span>
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-100">
                Tell us about your team
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Primary Hiring Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none"
                >
                  <option>Technology & Software</option>
                  <option>Fintech & Financial Services</option>
                  <option>Healthcare & Biotech</option>
                  <option>AI & Deep Tech</option>
                  <option>E-commerce & Consumer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Company Size
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none"
                >
                  <option>1-10 employees (Seed stage)</option>
                  <option>10-50 employees (Series A/B)</option>
                  <option>50-250 employees (Growth)</option>
                  <option>250+ employees (Enterprise)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  variant="emerald"
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase">
                <Sliders className="w-4 h-4" />
                <span>Step 2: AI Screening Engine Thresholds</span>
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-100">
                Configure candidate matching sensitivity
              </h3>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: 'LENIENT',
                    name: 'Lenient',
                    desc: 'Prioritizes high recall. Considers potential and adjacent skills.',
                    icon: Zap,
                  },
                  {
                    id: 'BALANCED',
                    name: 'Balanced',
                    desc: 'Standard production benchmark. Balances hard skills with experience.',
                    icon: Sparkles,
                  },
                  {
                    id: 'STRICT',
                    name: 'High Precision',
                    desc: 'Strict skill match required. Minimizes false positives.',
                    icon: Shield,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScreeningStrictness(item.id)}
                    className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                      screeningStrictness === item.id
                        ? 'bg-emerald-950/30 border-emerald-400 shadow-md shadow-emerald-950'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 mb-2 ${
                        screeningStrictness === item.id ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <h4 className="text-xs font-bold text-slate-100 mb-1">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="emerald"
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase">
                <Briefcase className="w-4 h-4" />
                <span>Step 3: Initial Job Requisition</span>
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-100">
                Create your first active job opening
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Our AI engine will automatically parse requirements and calibrate semantic scoring for this role.
                </span>
              </div>

              <div className="pt-4 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  variant="emerald"
                  onClick={handleFinish}
                  isLoading={isLoading}
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Enter Workspace
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
