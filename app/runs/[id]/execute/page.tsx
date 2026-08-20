'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  PlayCircle,
  Save,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  ShieldCheck,
  RotateCw,
  ExternalLink,
  Keyboard,
  CheckCheck,
} from 'lucide-react';
import { StatusBadge, PriorityBadge, ModuleTag } from '@/components/ui/badges';
import confetti from 'canvas-confetti';

interface TestCaseInfo {
  id: number;
  title: string;
  module: string;
  priority: string;
  description: string;
  expectedResult: string;
}

interface TestResultItem {
  id: number;
  testRunId: number;
  testCaseId: number;
  status: string;
  actualResult?: string | null;
  notes?: string | null;
  executedAt?: string | null;
  testCase: TestCaseInfo;
}

interface RunData {
  run: {
    id: number;
    projectId: number;
    name: string;
    status: string;
    executedAt: string;
  };
  project?: {
    id: number;
    name: string;
  } | null;
  results: TestResultItem[];
  stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
    progressPercent: number;
  };
}

export default function RunExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const runId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [actualNotes, setActualNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const fetchRun = async (maintainIndex = true) => {
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) throw new Error('Run not found');
      const json: RunData = await res.json();
      setData(json);

      // On first load, jump to the first pending test case
      if (!maintainIndex && json.results.length > 0) {
        const firstPending = json.results.findIndex((r) => r.status === 'PENDING');
        if (firstPending !== -1) {
          setActiveIndex(firstPending);
          setActualNotes(json.results[firstPending].actualResult || '');
        } else {
          setActiveIndex(0);
          setActualNotes(json.results[0].actualResult || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun(false);
  }, [runId]);

  const currentResult = data?.results[activeIndex] || null;

  useEffect(() => {
    if (currentResult) {
      setActualNotes(currentResult.actualResult || '');
    }
  }, [activeIndex, currentResult?.id]);

  // Execute test result update
  const recordResult = useCallback(
    async (newStatus: 'PASSED' | 'FAILED' | 'SKIPPED') => {
      if (!currentResult || !data) return;
      setUpdating(true);

      try {
        const res = await fetch(`/api/runs/${runId}/results`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resultId: currentResult.id,
            status: newStatus,
            actualResult:
              actualNotes.trim() ||
              (newStatus === 'PASSED'
                ? 'Passed as expected'
                : newStatus === 'FAILED'
                ? 'Failed execution'
                : 'Skipped'),
          }),
        });

        const resJson = await res.json();
        if (resJson.success) {
          // Optimistically update local results
          const updatedResults = [...data.results];
          updatedResults[activeIndex] = {
            ...updatedResults[activeIndex],
            status: newStatus,
            actualResult: actualNotes.trim() || undefined,
          };

          const total = updatedResults.length;
          const pending = updatedResults.filter((r) => r.status === 'PENDING').length;
          const passed = updatedResults.filter((r) => r.status === 'PASSED').length;
          const failed = updatedResults.filter((r) => r.status === 'FAILED').length;
          const skipped = updatedResults.filter((r) => r.status === 'SKIPPED').length;

          setData({
            ...data,
            run: {
              ...data.run,
              status: resJson.runStatus || data.run.status,
            },
            results: updatedResults,
            stats: {
              total,
              passed,
              failed,
              skipped,
              pending,
              progressPercent: Math.round(((total - pending) / total) * 100),
            },
          });

          // If all tests are finished, trigger celebration!
          if (pending === 0) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
            setShowCompletionModal(true);
          } else {
            // Find next pending test case
            const nextPending = updatedResults.findIndex(
              (r, idx) => idx > activeIndex && r.status === 'PENDING'
            );
            if (nextPending !== -1) {
              setActiveIndex(nextPending);
            } else if (activeIndex < updatedResults.length - 1) {
              setActiveIndex(activeIndex + 1);
            }
          }
        }
      } catch (err) {
        console.error('Error saving result:', err);
      } finally {
        setUpdating(false);
      }
    },
    [currentResult, data, runId, actualNotes, activeIndex]
  );

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in a textarea or input
      const target = e.target as HTMLElement | null;
      const activeEl = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
      if (
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'INPUT' ||
        activeEl?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        recordResult('PASSED');
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        recordResult('FAILED');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        recordResult('SKIPPED');
      } else if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        if (data && activeIndex < data.results.length - 1) {
          setActiveIndex(activeIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        if (activeIndex > 0) {
          setActiveIndex(activeIndex - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordResult, activeIndex, data]);

  if (loading || !data || !currentResult) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Initializing Execution Workspace...</p>
        </div>
      </div>
    );
  }

  const { run, project, results, stats } = data;
  const uniqueModules = Array.from(new Set(results.map((r) => r.testCase.module))).filter(Boolean);

  const filteredResults = results.filter((r) => {
    const matchesSearch =
      r.testCase.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.testCase.module.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesModule = moduleFilter === 'ALL' || r.testCase.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden antialiased select-none">
      {/* TOP RUNNER NAVIGATION HEADER */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href={`/runs/${run.id}`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900"
            title="Back to Run Overview"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Exit Runner</span>
          </Link>

          <div className="h-5 w-px bg-slate-800" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white truncate max-w-sm">
                {run.name || 'Regression Run'}
              </span>
              <StatusBadge status={run.status} size="sm" />
            </div>
            {project && (
              <span className="text-[11px] text-slate-400">{project.name}</span>
            )}
          </div>
        </div>

        {/* Live Progress Bar & Ratio Counters */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end gap-1">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-bold">{stats.passed} Passed</span>
              <span className="text-rose-400 font-bold">{stats.failed} Failed</span>
              <span className="text-amber-400 font-bold">{stats.skipped} Skipped</span>
              <span className="text-slate-500 font-bold">({stats.pending} Untested)</span>
            </div>
            <div className="w-48 h-2 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
              <div
                style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                className="bg-emerald-500 transition-all duration-300"
              />
              <div
                style={{ width: `${(stats.failed / stats.total) * 100}%` }}
                className="bg-rose-500 transition-all duration-300"
              />
              <div
                style={{ width: `${(stats.skipped / stats.total) * 100}%` }}
                className="bg-amber-500 transition-all duration-300"
              />
            </div>
          </div>

          <Link
            href={`/runs/${run.id}`}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Finish / Report</span>
          </Link>
        </div>
      </header>

      {/* MAIN SPLIT-VIEW WORKSPACE */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT PANE: TEST QUEUE LIST */}
        <aside className="w-80 lg:w-96 border-r border-slate-800/80 bg-slate-950/60 flex flex-col shrink-0">
          {/* Filter Bar */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter tests in queue..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <button
                onClick={() => setModuleFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  moduleFilter === 'ALL'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({results.length})
              </button>
              {uniqueModules.map((mod) => (
                <button
                  key={mod}
                  onClick={() => setModuleFilter(mod)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono whitespace-nowrap transition-colors ${
                    moduleFilter === mod
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>

          {/* Test Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {filteredResults.map((r) => {
              const originalIndex = results.findIndex((item) => item.id === r.id);
              const isActive = originalIndex === activeIndex;

              return (
                <div
                  key={r.id}
                  onClick={() => setActiveIndex(originalIndex)}
                  className={`p-3 cursor-pointer transition-all flex items-start gap-2.5 ${
                    isActive
                      ? 'bg-slate-900 text-slate-100 border-l-4 border-cyan-400 pl-2'
                      : 'hover:bg-slate-900/40 text-slate-400'
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className="mt-0.5 shrink-0">
                    {r.status === 'PASSED' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {r.status === 'FAILED' && <XCircle className="w-4 h-4 text-rose-400" />}
                    {r.status === 'SKIPPED' && (
                      <MinusCircle className="w-4 h-4 text-amber-400" />
                    )}
                    {r.status === 'PENDING' && (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-700 flex items-center justify-center" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge priority={r.testCase.priority} size="sm" />
                      <ModuleTag module={r.testCase.module} />
                    </div>
                    <p
                      className={`text-xs leading-snug line-clamp-2 ${
                        isActive ? 'font-bold text-white' : 'font-medium text-slate-300'
                      }`}
                    >
                      {r.testCase.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hotkey Cheatsheet Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/90 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>Hotkeys:</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                P = Pass
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                F = Fail
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                S = Skip
              </span>
            </div>
          </div>
        </aside>

        {/* RIGHT PANE: ACTIVE TEST EXECUTION CONSOLE */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-y-auto">
          <div className="p-8 max-w-4xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Test Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                    Test #{activeIndex + 1} of {results.length}
                  </span>
                  <PriorityBadge priority={currentResult.testCase.priority} size="md" />
                  <ModuleTag module={currentResult.testCase.module} className="text-xs px-3 py-1" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => activeIndex > 0 && setActiveIndex(activeIndex - 1)}
                    disabled={activeIndex === 0}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
                    title="Previous Test (Left Arrow)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      activeIndex < results.length - 1 && setActiveIndex(activeIndex + 1)
                    }
                    disabled={activeIndex === results.length - 1}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
                    title="Next Test (Right Arrow)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Test Title */}
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
                  {currentResult.testCase.title}
                </h2>
              </div>

              {/* Execution Steps */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  1. Execution Steps & Pre-conditions
                </span>
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 font-mono text-sm leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30">
                  {currentResult.testCase.description || 'Follow standard module instructions.'}
                </div>
              </div>

              {/* Expected Result Card */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  2. Expected Result (Verification Target)
                </span>
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm font-medium leading-relaxed">
                  {currentResult.testCase.expectedResult}
                </div>
              </div>

              {/* Actual Result / Failure Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    3. Actual Result / Defect Notes (Optional)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Logged in execution report
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={actualNotes}
                  onChange={(e) => setActualNotes(e.target.value)}
                  placeholder="Record defect reproduction details, API error code (e.g. 500 Internal Server Error), or verification notes..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none font-mono placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* ACTION BUTTONS CONSOLE (PASS / FAIL / SKIP) */}
            <div className="pt-6 border-t border-slate-800 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {/* PASS BUTTON */}
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => recordResult('PASSED')}
                  className={`py-4 px-4 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition-all shadow-lg ${
                    currentResult.status === 'PASSED'
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-emerald-500/25'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-base">PASS</span>
                  </div>
                  <span className="text-[11px] opacity-80 font-mono">[Hotkey: P]</span>
                </button>

                {/* FAIL BUTTON */}
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => recordResult('FAILED')}
                  className={`py-4 px-4 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition-all shadow-lg ${
                    currentResult.status === 'FAILED'
                      ? 'bg-rose-500 text-white ring-4 ring-rose-500/20 shadow-rose-500/25'
                      : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span className="text-base">FAIL</span>
                  </div>
                  <span className="text-[11px] opacity-80 font-mono">[Hotkey: F]</span>
                </button>

                {/* SKIP BUTTON */}
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => recordResult('SKIPPED')}
                  className={`py-4 px-4 rounded-2xl font-bold text-sm flex flex-col items-center justify-center gap-1 transition-all shadow-lg ${
                    currentResult.status === 'SKIPPED'
                      ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-amber-500/25'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MinusCircle className="w-5 h-5" />
                    <span className="text-base">SKIP</span>
                  </div>
                  <span className="text-[11px] opacity-80 font-mono">[Hotkey: S]</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Navigate tests with Left / Right arrow keys</span>
                {currentResult.executedAt && (
                  <span className="font-mono">
                    Last recorded: {new Date(currentResult.executedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* COMPLETION MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-700 max-w-md w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-extrabold text-white">
                Regression Run Complete!
              </h3>
              <p className="text-xs text-slate-400">
                All {stats.total} test cases in this run have been executed and saved to the database.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center font-mono">
              <div>
                <div className="text-lg font-bold text-emerald-400">{stats.passed}</div>
                <div className="text-[10px] text-slate-400 uppercase">Passed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-rose-400">{stats.failed}</div>
                <div className="text-[10px] text-slate-400 uppercase">Failed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-400">{stats.skipped}</div>
                <div className="text-[10px] text-slate-400 uppercase">Skipped</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Continue Reviewing
              </button>

              <Link
                href={`/runs/${run.id}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
              >
                View Full Report
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
