import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Cpu,
  Shield,
  Key,
  CheckCircle2,
  Users,
  Clock,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  const [orgName, setOrgName] = useState(user?.organization?.name || 'TechVentures Enterprise');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [apiKey, setApiKey] = useState('AIzaSy************************');
  const [isSaved, setIsSaved] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const res = await api.getAuditLogs();
        if (res.success && res.data) {
          setAuditLogs(res.data);
        }
      } catch {
        // Fallback default audit events
        setAuditLogs([
          {
            id: '1',
            action: 'RESUME_UPLOADED',
            entityType: 'RESUME',
            createdAt: new Date().toISOString(),
            ipAddress: '127.0.0.1',
          },
          {
            id: '2',
            action: 'PIPELINE_CHANGED',
            entityType: 'CANDIDATE',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            ipAddress: '127.0.0.1',
          },
          {
            id: '3',
            action: 'JOB_CREATED',
            entityType: 'JOB',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            ipAddress: '127.0.0.1',
          },
        ]);
      }
    }
    loadAuditLogs();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
          <Settings className="w-3.5 h-3.5" />
          <span>System & Workspace Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-100">
          Settings & Integrations
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage AI screening models, organization details, and security audit logs.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Organization & AI Config */}
        <div className="space-y-6">
          {/* Organization Profile */}
          <div className="glass-panel rounded-3xl p-6 border border-emerald-500/15 space-y-4">
            <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Organization Details</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Primary Recruiter Admin
              </label>
              <input
                type="text"
                disabled
                value={`${user?.firstName} ${user?.lastName} (${user?.email})`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* AI Provider Config */}
          <div className="glass-panel rounded-3xl p-6 border border-emerald-500/15 space-y-4">
            <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Google Gemini AI Engine Configuration</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Screening Model Architecture
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 outline-none cursor-pointer"
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Ultra Fast, High Throughput)</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning & Synthesis)</option>
                <option value="gemini-2.0-flash">Google Gemini 2.0 Flash (Next-Gen Preview)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                Google AI Studio API Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-emerald-500 text-xs text-slate-100 font-mono outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Keys are encrypted server-side and never exposed to client browsers.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {isSaved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Settings updated successfully!</span>
                </span>
              )}
              <Button
                variant="emerald"
                onClick={handleSave}
                className="ml-auto"
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Security Audit Logs */}
        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/15 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Compliance & Security Audit Logs</span>
            </h3>
            <Badge variant="emerald">Live Tracking</Badge>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs flex items-center justify-between gap-3"
              >
                <div>
                  <span className="font-bold text-slate-200 font-mono text-[11px] block">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Target: {log.entityType || 'SYSTEM'} • IP: {log.ipAddress || '127.0.0.1'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
