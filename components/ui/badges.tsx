import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, MinusCircle, ShieldAlert, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PriorityBadge({ priority, className, size = 'sm' }: PriorityBadgeProps) {
  const p = priority?.toUpperCase() || 'P2';
  
  const styles: Record<string, string> = {
    P0: 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25',
    P1: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25',
    P2: 'bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25',
    P3: 'bg-slate-500/15 text-slate-400 border-slate-500/30 hover:bg-slate-500/25',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border transition-colors',
        styles[p] || styles.P2,
        sizes[size],
        className
      )}
    >
      {p === 'P0' && <ShieldAlert className="w-3 h-3 text-rose-400" />}
      {p}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, className, size = 'sm' }: StatusBadgeProps) {
  const s = status?.toUpperCase() || 'PENDING';

  const config: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
    PASSED: {
      label: 'Passed',
      style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    FAILED: {
      label: 'Failed',
      style: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    SKIPPED: {
      label: 'Skipped',
      style: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: <MinusCircle className="w-3.5 h-3.5" />,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      style: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 animate-pulse',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    PENDING: {
      label: 'Pending',
      style: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      icon: <Clock className="w-3.5 h-3.5" />,
    },
  };

  const current = config[s] || {
    label: status,
    style: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-medium',
    lg: 'text-sm px-3.5 py-1.5 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        current.style,
        sizes[size],
        className
      )}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
}

export function ModuleTag({ module, className }: { module: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-violet-500/10 text-violet-300 border border-violet-500/20',
        className
      )}
    >
      {module}
    </span>
  );
}

export function TestCaseCodeBadge({ code, className }: { code?: string | null; className?: string }) {
  if (!code) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 tracking-wide',
        className
      )}
    >
      {code}
    </span>
  );
}
