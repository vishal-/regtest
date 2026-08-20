'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  PlayCircle,
  Sparkles,
  CheckSquare,
  Square,
  ShieldAlert,
  Layers,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { PriorityBadge, ModuleTag, TestCaseCodeBadge } from '@/components/ui/badges';

interface TestCase {
  id: number;
  projectId: number;
  code?: string;
  module: string;
  priority: string;
  title: string;
  description: string;
  expectedResult: string;
}

export default function NewRunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [projectName, setProjectName] = useState('Project');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [runName, setRunName] = useState(
    `Regression Run - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.project) setProjectName(data.project.name);
        if (data.testCases) {
          setTestCases(data.testCases);
          // Default select all
          setSelectedIds(data.testCases.map((tc: TestCase) => tc.id));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [projectId]);

  // Preset Selection Handlers
  const selectAll = () => {
    setSelectedIds(testCases.map((tc) => tc.id));
  };

  const selectSmokeP0 = () => {
    setSelectedIds(testCases.filter((tc) => tc.priority === 'P0').map((tc) => tc.id));
  };

  const selectP0P1 = () => {
    setSelectedIds(
      testCases.filter((tc) => tc.priority === 'P0' || tc.priority === 'P1').map((tc) => tc.id)
    );
  };

  const selectByModule = (mod: string) => {
    setSelectedIds(testCases.filter((tc) => tc.module === mod).map((tc) => tc.id));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError('Please select at least 1 test case for this regression run.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/projects/${projectId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: runName.trim() || 'Regression Run',
          testCaseIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start run');

      // Directly jump into the interactive tester execution console!
      router.push(`/runs/${data.runId}/execute`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error starting run');
      setSubmitting(false);
    }
  };

  const uniqueModules = Array.from(new Set(testCases.map((tc) => tc.module))).filter(Boolean);

  return (
    <AppShell>
      <Header
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: projectName, href: `/projects/${projectId}` },
          { label: 'New Regression Run' },
        ]}
      />

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {projectName}</span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Configure Regression Run
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pick target test cases, name your run, and launch the real-time execution console.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleStartRun} className="space-y-6">
          {/* Run Settings Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Run Name / Label <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
                placeholder="e.g. Release v2.4.0 Smoke Suite, Sprint 25 Regression"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            {/* Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quick Selection Presets
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  ⚡ Select All ({testCases.length})
                </button>
                <button
                  type="button"
                  onClick={selectSmokeP0}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                >
                  🔥 Smoke Only (P0 Blocker)
                </button>
                <button
                  type="button"
                  onClick={selectP0P1}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                >
                  ✨ P0 + P1 High Priority
                </button>

                {uniqueModules.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectByModule(m)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono border border-slate-800 transition-colors"
                  >
                    Module: {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Case Selection Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Select Test Cases to Execute</h3>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {selectedIds.length} of {testCases.length} selected
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-slate-500 hover:text-slate-300"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {testCases.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No test cases available in this project. Please add test cases before creating a run.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
                  {testCases.map((tc) => {
                    const isSelected = selectedIds.includes(tc.id);
                    return (
                      <div
                        key={tc.id}
                        onClick={() => toggleSelect(tc.id)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-500/5 hover:bg-cyan-500/10'
                            : 'hover:bg-slate-800/40 text-slate-400'
                        }`}
                      >
                        <div className="mt-0.5 text-cyan-400">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <TestCaseCodeBadge code={tc.code || `TC-${tc.id}`} />
                            <PriorityBadge priority={tc.priority} />
                            <ModuleTag module={tc.module} />
                            <span className="font-semibold text-xs text-slate-200 truncate">
                              {tc.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            <span className="text-slate-500">Expected:</span> {tc.expectedResult}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <Link
              href={`/projects/${projectId}`}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || selectedIds.length === 0}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{submitting ? 'Initializing Run...' : `Launch Run (${selectedIds.length} Tests)`}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
