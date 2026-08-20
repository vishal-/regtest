'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Layers,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  ListOrdered,
  FileText,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { PriorityBadge } from '@/components/ui/badges';

export default function NewTestCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [projectName, setProjectName] = useState('Project');
  const [existingModules, setExistingModules] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [module, setModule] = useState('Auth');
  const [customModule, setCustomModule] = useState('');
  const [priority, setPriority] = useState('P1');
  const [description, setDescription] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.project) setProjectName(data.project.name);
        if (data.testCases) {
          const mods = Array.from(
            new Set(data.testCases.map((tc: { module: string }) => tc.module))
          ).filter(Boolean) as string[];
          setExistingModules(mods);
          if (mods.length > 0) setModule(mods[0]);
        }
      })
      .catch(() => {});
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalModule = module === '__CUSTOM__' ? customModule.trim() : module.trim();
    if (!title.trim() || !finalModule || !expectedResult.trim()) {
      setError('Title, Module and Expected Result are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/projects/${projectId}/test-cases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          module: finalModule,
          priority,
          description: description.trim(),
          expectedResult: expectedResult.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create test case');
      }

      router.push(`/projects/${projectId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating test case');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyExample = () => {
    setTitle('Verify password reset link expires after 15 minutes');
    setModule('Auth');
    setPriority('P1');
    setDescription(
      '1. Trigger password reset for valid email account\n2. Wait 16 minutes\n3. Click link from reset email in browser\n4. Attempt to enter and submit new password'
    );
    setExpectedResult('System displays "Password reset token expired" and rejects the new password.');
  };

  return (
    <AppShell>
      <Header
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: projectName, href: `/projects/${projectId}` },
          { label: 'New Test Case' },
        ]}
      />

      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {projectName}</span>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">Create Test Case</h1>
            <p className="text-xs text-slate-400 mt-1">
              Add a reproducible functional test case to the regression catalog.
            </p>
          </div>

          <button
            type="button"
            onClick={handleApplyExample}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Example</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Test Case Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Verify checkout completes when payment 3DS challenge succeeds"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
              />
            </div>

            {/* Module & Priority 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Module */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Module / Feature Domain <span className="text-rose-400">*</span>
                </label>
                <div className="space-y-2">
                  <select
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  >
                    {existingModules.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    {!existingModules.includes('Auth') && <option value="Auth">Auth</option>}
                    {!existingModules.includes('Billing') && <option value="Billing">Billing</option>}
                    {!existingModules.includes('Checkout') && <option value="Checkout">Checkout</option>}
                    {!existingModules.includes('Cart') && <option value="Cart">Cart</option>}
                    {!existingModules.includes('Settings') && <option value="Settings">Settings</option>}
                    <option value="__CUSTOM__">+ New Custom Module</option>
                  </select>

                  {module === '__CUSTOM__' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter new module name (e.g. Notifications)"
                      value={customModule}
                      onChange={(e) => setCustomModule(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-cyan-500/50 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                    />
                  )}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Severity Priority <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'P0', label: 'P0 Blocker', desc: 'Critical smoke' },
                    { id: 'P1', label: 'P1 High', desc: 'Major flow' },
                    { id: 'P2', label: 'P2 Med', desc: 'Standard' },
                    { id: 'P3', label: 'P3 Low', desc: 'Minor / UI' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        priority === p.id
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <PriorityBadge priority={p.id} />
                      <span className="text-[10px] text-slate-400 mt-1 font-mono">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description / Steps */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Pre-Conditions & Execution Steps (Markdown supported)
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={'1. Navigate to /checkout\n2. Select payment method "Card"\n3. Enter 4000000000003220 for 3DS challenge'}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none leading-relaxed"
              />
            </div>

            {/* Expected Result */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Expected Result <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="Order confirmation screen displays with Order ID #, receipt email is dispatched, and cart is cleared."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/projects/${projectId}`}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Create Test Case'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
