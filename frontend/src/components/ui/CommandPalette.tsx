import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Sparkles,
  Briefcase,
  Users,
  GitPullRequest,
  FileSearch,
  MessageSquareCheck,
  Bot,
  BarChart3,
  Settings,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Handled in parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { title: 'AI Screening', category: 'Navigation', icon: Sparkles, to: '/screening' },
    { title: 'Recruitment Dashboard', category: 'Navigation', icon: LayoutDashboard, to: '/dashboard' },
    { title: 'Job Openings', category: 'Navigation', icon: Briefcase, to: '/jobs' },
    { title: 'Candidates Directory', category: 'Navigation', icon: Users, to: '/candidates' },
    { title: 'Pipeline Kanban Board', category: 'Navigation', icon: GitPullRequest, to: '/pipeline' },
    { title: 'Resume Quality Analyzer', category: 'Navigation', icon: FileSearch, to: '/resume-analyzer' },
    { title: 'Interview Question Generator', category: 'Navigation', icon: MessageSquareCheck, to: '/interview-ai' },
    { title: 'AI Recruiter Copilot', category: 'Navigation', icon: Bot, to: '/copilot' },
    { title: 'Talent Analytics & Insights', category: 'Navigation', icon: BarChart3, to: '/analytics' },
    { title: 'Settings & Integrations', category: 'Navigation', icon: Settings, to: '/settings' },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (to: string) => {
    navigate(to);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-emerald-500/25 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-emerald-500/15 bg-slate-950/40">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            placeholder="Type a command or search destination..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <span className="text-[10px] font-mono text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            Esc
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No actions matching "{query}"
            </div>
          ) : (
            filtered.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(action.to)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs text-slate-300 hover:text-white hover:bg-emerald-500/10 hover:border hover:border-emerald-500/20 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-slate-900 text-slate-400 group-hover:text-emerald-400 border border-slate-800 group-hover:border-emerald-500/30">
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 group-hover:text-emerald-300 block">
                      {action.title}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {action.category}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
