'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  AlertTriangle,
  FolderGit2,
  RotateCw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { StatusBadge, PriorityBadge, ModuleTag } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';

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
    completedAt?: string | null;
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
    passRate: number;
  };
}

export default function RunOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const runId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedResultId, setExpandedResultId] = useState<number | null>(null);

  const fetchRun = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) throw new Error('Run not found');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun();
  }, [runId]);

  if (loading || !data) {
    return (
      <AppShell>
        <Header breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loading Run...' }]} />
        <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
          Loading regression run report...
        </div>
      </AppShell>
    );
  }

  const { run, project, results, stats } = data;

  const filteredResults = results.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesSearch =
      r.testCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.testCase.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.actualResult && r.actualResult.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <AppShell>
      <Header
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          ...(project ? [{ label: project.name, href: `/projects/${project.id}` }] : []),
          { label: run.name || 'Run Report' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/runs/${run.id}/execute`}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-500/20"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>{run.status === 'IN_PROGRESS' ? 'Resume Execution' : 'Open Runner'}</span>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Navigation & Title */}
        <div>
          {project && (
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {project.name}</span>
            </Link>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {run.name || 'Regression Run Report'}
                </h1>
                <StatusBadge status={run.status} size="md" />
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Started {formatDate(run.executedAt)}
                {run.completedAt && ` • Completed ${formatDate(run.completedAt)}`}
              </p>
            </div>

            <Link
              href={`/runs/${run.id}/execute`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Execute / Edit Run</span>
            </Link>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
            {/* Total */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xl font-bold text-white font-mono">{stats.total}</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                Total Tests
              </div>
            </div>

            {/* Passed */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-xl font-bold text-emerald-400 font-mono">{stats.passed}</div>
              <div className="text-[11px] text-emerald-400/80 uppercase tracking-wider font-semibold mt-0.5">
                Passed
              </div>
            </div>

            {/* Failed */}
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="text-xl font-bold text-rose-400 font-mono">{stats.failed}</div>
              <div className="text-[11px] text-rose-400/80 uppercase tracking-wider font-semibold mt-0.5">
                Failed
              </div>
            </div>

            {/* Skipped */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-xl font-bold text-amber-400 font-mono">{stats.skipped}</div>
              <div className="text-[11px] text-amber-400/80 uppercase tracking-wider font-semibold mt-0.5">
                Skipped
              </div>
            </div>

            {/* Pass Rate */}
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 col-span-2 sm:col-span-1">
              <div className="text-xl font-bold text-cyan-400 font-mono">{stats.passRate}%</div>
              <div className="text-[11px] text-cyan-400/80 uppercase tracking-wider font-semibold mt-0.5">
                Pass Rate
              </div>
            </div>
          </div>

          {/* Progress Breakdown Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Run Execution Progress</span>
              <span className="font-mono font-semibold text-slate-200">
                {stats.progressPercent}% Completed ({stats.total - stats.pending}/{stats.total})
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              {stats.passed > 0 && (
                <div
                  style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                  className="bg-emerald-500 transition-all duration-300"
                  title={`${stats.passed} Passed`}
                />
              )}
              {stats.failed > 0 && (
                <div
                  style={{ width: `${(stats.failed / stats.total) * 100}%` }}
                  className="bg-rose-500 transition-all duration-300"
                  title={`${stats.failed} Failed`}
                />
              )}
              {stats.skipped > 0 && (
                <div
                  style={{ width: `${(stats.skipped / stats.total) * 100}%` }}
                  className="bg-amber-500 transition-all duration-300"
                  title={`${stats.skipped} Skipped`}
                />
              )}
              {stats.pending > 0 && (
                <div
                  style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                  className="bg-slate-800 transition-all duration-300"
                  title={`${stats.pending} Untested`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Results List Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search result by title or module..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: `All (${results.length})` },
                { id: 'PASSED', label: `Passed (${stats.passed})` },
                { id: 'FAILED', label: `Failed (${stats.failed})` },
                { id: 'SKIPPED', label: `Skipped (${stats.skipped})` },
                { id: 'PENDING', label: `Pending (${stats.pending})` },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === filter.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test Results Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3 w-16">Priority</th>
                  <th className="px-4 py-3 w-28">Module</th>
                  <th className="px-4 py-3">Test Case</th>
                  <th className="px-4 py-3 w-32">Status</th>
                  <th className="px-4 py-3">Tester Notes / Actual Result</th>
                  <th className="px-4 py-3 text-right w-16">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredResults.map((r) => {
                  const isExpanded = expandedResultId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        onClick={() => setExpandedResultId(isExpanded ? null : r.id)}
                        className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3.5 align-top">
                          <PriorityBadge priority={r.testCase.priority} />
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <ModuleTag module={r.testCase.module} />
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <div className="font-semibold text-slate-200">{r.testCase.title}</div>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3.5 align-top text-slate-300">
                          {r.actualResult ? (
                            <span className="text-slate-200">{r.actualResult}</span>
                          ) : (
                            <span className="text-slate-600 italic">No notes recorded</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-top text-right text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 inline" />
                          ) : (
                            <ChevronDown className="w-4 h-4 inline" />
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-950/60 border-b border-slate-800">
                          <td colSpan={6} className="px-6 py-4 space-y-3 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                                  Execution Steps & Pre-conditions:
                                </span>
                                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-300 whitespace-pre-wrap">
                                  {r.testCase.description || 'N/A'}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                                  Expected Result:
                                </span>
                                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300">
                                  {r.testCase.expectedResult}
                                </div>
                              </div>
                            </div>

                            {project && (
                              <div className="pt-2 text-right">
                                <Link
                                  href={`/projects/${project.id}/test-cases/${r.testCase.id}`}
                                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-semibold"
                                >
                                  <span>Open full test case</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
