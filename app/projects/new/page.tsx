'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderGit2,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Building2,
  Layers,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { useAuth } from '@/lib/firebase/auth-context';

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          userId: user?.uid || 'demo-user-1',
          userEmail: user?.email || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      router.push(`/projects/${data.project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating project');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (tplName: string, tplDesc: string) => {
    setName(tplName);
    setDescription(tplDesc);
  };

  return (
    <AppShell>
      <Header
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'New Project' },
        ]}
      />

      <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create New Project</h1>
          <p className="text-xs text-slate-400 mt-1">
            Set up a regression testing repository for your app or microservice.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-5">
            {/* Project Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Project Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <FolderGit2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mobile Banking App, Checkout API, Admin Portal"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the platform scope, target environments (Staging/Prod), or team ownership..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

          {/* Quick starter templates */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Or Pick a Quick Starter</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'SaaS Billing & Subscriptions',
                    'Regression suite for Stripe webhooks, tier upgrades, invoices, and payment retry logic.'
                  )
                }
                className="p-3 rounded-xl bg-slate-950/50 hover:bg-slate-900 border border-slate-800 text-left transition-colors group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
                  💳 SaaS Billing
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Stripe, subscriptions, invoices.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Customer Auth & IAM Service',
                    'SSO, Google OAuth, password reset, 2FA, session tokens, and RBAC permissions.'
                  )
                }
                className="p-3 rounded-xl bg-slate-950/50 hover:bg-slate-900 border border-slate-800 text-left transition-colors group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
                  🔐 Auth & IAM
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  OAuth, 2FA, session security.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyTemplate(
                    'Core Mobile App (iOS / Android)',
                    'Onboarding, deep linking, push notifications, offline cache, and native camera sync.'
                  )
                }
                className="p-3 rounded-xl bg-slate-950/50 hover:bg-slate-900 border border-slate-800 text-left transition-colors group"
              >
                <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-400">
                  📱 Mobile Suite
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  Native flows, push, offline sync.
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
