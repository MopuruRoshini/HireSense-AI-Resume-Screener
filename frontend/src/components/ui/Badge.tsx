import React from 'react';
import type { CandidateStage, JobStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'slate' | 'rose' | 'teal';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
}) => {
  const styles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    teal: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border tracking-wide uppercase font-mono ${styles} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};

export const StageBadge: React.FC<{ stage: CandidateStage; className?: string }> = ({
  stage,
  className = '',
}) => {
  const map: Record<CandidateStage, { label: string; variant: 'emerald' | 'amber' | 'slate' | 'rose' | 'teal' }> = {
    APPLIED: { label: 'Applied', variant: 'slate' },
    SCREENED: { label: 'Screened', variant: 'teal' },
    INTERVIEW_1: { label: 'Interview I', variant: 'amber' },
    INTERVIEW_2: { label: 'Interview II', variant: 'amber' },
    OFFER: { label: 'Offer Sent', variant: 'emerald' },
    HIRED: { label: 'Hired', variant: 'emerald' },
    REJECTED: { label: 'Archived', variant: 'rose' },
  };

  const item = map[stage] || { label: stage, variant: 'slate' };
  return (
    <Badge variant={item.variant} className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {item.label}
    </Badge>
  );
};

export const JobStatusBadge: React.FC<{ status: JobStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  const map: Record<JobStatus, { label: string; variant: 'emerald' | 'amber' | 'slate' | 'rose' }> = {
    ACTIVE: { label: 'Active', variant: 'emerald' },
    DRAFT: { label: 'Draft', variant: 'slate' },
    PAUSED: { label: 'Paused', variant: 'amber' },
    CLOSED: { label: 'Closed', variant: 'rose' },
  };

  const item = map[status] || { label: status, variant: 'slate' };
  return (
    <Badge variant={item.variant} className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {item.label}
    </Badge>
  );
};

export const RecommendationBadge: React.FC<{ recommendation: string; className?: string }> = ({
  recommendation,
  className = '',
}) => {
  if (recommendation === 'STRONG_HIRE') {
    return <Badge variant="emerald" className={className}>â˜… Strong Hire</Badge>;
  }
  if (recommendation === 'HIRE') {
    return <Badge variant="emerald" className={className}>âœ“ Hire</Badge>;
  }
  if (recommendation === 'CONSIDER') {
    return <Badge variant="amber" className={className}>? Consider</Badge>;
  }
  return <Badge variant="rose" className={className}>âœ• Pass</Badge>;
};

