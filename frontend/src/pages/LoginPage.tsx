import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { extractErrorMessage } from '../services/api';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser && !loggedInUser.onboardingDone) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#090D0B] text-slate-100 flex flex-col justify-center py-12 px-6 sm:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-xl shadow-emerald-950/60 mb-4">
          <Sparkles className="w-6 h-6 text-slate-950 fill-current" />
        </div>
        <h2 className="text-3xl font-extrabold font-heading tracking-tight text-slate-100">
          Sign In to HireSense
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          AI Resume Screening & Recruitment Intelligence Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel rounded-2xl p-8 border border-emerald-500/20 shadow-2xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recruiter@techventures.io"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-100 placeholder-slate-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="emerald"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* 1-Click Demo Accounts Quick-Fill */}
          <div className="pt-4 border-t border-emerald-500/10 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono block text-center">
              Quick 1-Click Demo Access
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('recruiter@techventures.io', 'Recruit@123456')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900/70 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/30 text-xs text-slate-300 hover:text-emerald-300 transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Recruiter</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@techventures.io', 'Admin@123456')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900/70 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/30 text-xs text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-400 hover:underline font-medium">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
