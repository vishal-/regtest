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
  Layers,
  PieChart as PieIcon,
  Table as TableIcon,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Filter,
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

interface ModuleBreakdown {
  module: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  passRate: number;
  completed: number;
}

// SVG Pie Sector Generator Helper
function createPieSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  // If slice is full 360 degrees
  if (endAngle - startAngle >= 359.99) {
    return `M ${cx - r}, ${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
  }
  const rad = Math.PI / 180;
  // Offset by -90 deg so top is 0 deg
  const a1 = (startAngle - 90) * rad;
  const a2 = (endAngle - 90) * rad;

  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
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
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedResultId, setExpandedResultId] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

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
          Loading regression run report & analytics...
        </div>
      </AppShell>
    );
  }

  const { run, project, results, stats } = data;

  // Compute Module-wise breakdown
  const moduleMap = new Map<string, ModuleBreakdown>();

  results.forEach((r) => {
    const mod = r.testCase.module || 'Unassigned';
    if (!moduleMap.has(mod)) {
      moduleMap.set(mod, {
        module: mod,
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        pending: 0,
        passRate: 0,
        completed: 0,
      });
    }
    const current = moduleMap.get(mod)!;
    current.total += 1;
    if (r.status === 'PASSED') current.passed += 1;
    else if (r.status === 'FAILED') current.failed += 1;
    else if (r.status === 'SKIPPED') current.skipped += 1;
    else current.pending += 1;
  });

  const moduleBreakdownList: ModuleBreakdown[] = Array.from(moduleMap.values()).map((m) => {
    const completed = m.passed + m.failed;
    const passRate = completed > 0 ? Math.round((m.passed / completed) * 100) : m.passed > 0 ? 100 : 0;
    return {
      ...m,
      completed,
      passRate,
    };
  });

  // Calculate execution duration
  let durationFormatted = 'In Progress';
  if (run.executedAt && run.completedAt) {
    try {
      const start = new Date(run.executedAt).getTime();
      const end = new Date(run.completedAt).getTime();
      const diffSecs = Math.max(0, Math.round((end - start) / 1000));
      if (diffSecs < 60) {
        durationFormatted = `${diffSecs}s`;
      } else {
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        durationFormatted = `${mins}m ${secs}s`;
      }
    } catch {
      durationFormatted = 'N/A';
    }
  }

  // Filtered detailed results
  const filteredResults = results.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesModule = moduleFilter === 'ALL' || r.testCase.module === moduleFilter;
    const matchesSearch =
      r.testCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.testCase.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.actualResult && r.actualResult.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesModule && matchesSearch;
  });

  // SVG Pie Chart Slice Angles
  const total = stats.total || 1;
  const pieSlices: {
    key: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
    hoverColor: string;
    path: string;
  }[] = [];

  let currentAngle = 0;
  const sliceConfig = [
    { key: 'PASSED', label: 'Passed', count: stats.passed, color: '#10b981', hoverColor: '#34d399' },
    { key: 'FAILED', label: 'Failed', count: stats.failed, color: '#f43f5e', hoverColor: '#fb7185' },
    { key: 'SKIPPED', label: 'Skipped', count: stats.skipped, color: '#f59e0b', hoverColor: '#fbbf24' },
    { key: 'PENDING', label: 'Pending', count: stats.pending, color: '#475569', hoverColor: '#64748b' },
  ];

  sliceConfig.forEach((slice) => {
    if (slice.count > 0) {
      const sliceAngle = (slice.count / total) * 360;
      const start = currentAngle;
      const end = currentAngle + sliceAngle;
      pieSlices.push({
        ...slice,
        percentage: Math.round((slice.count / total) * 100),
        path: createPieSlice(90, 90, 80, start, end),
      });
      currentAngle = end;
    }
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

      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Navigation & Header */}
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
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {run.name || 'Regression Run Report'}
                </h1>
                <StatusBadge status={run.status} size="md" />
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Executed: {formatDate(run.executedAt)}
                {run.completedAt && ` • Completed: ${formatDate(run.completedAt)}`}
                {` • Duration: ${durationFormatted}`}
              </p>
            </div>

            <Link
              href={`/runs/${run.id}/execute`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 shrink-0"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Execute / Update Run</span>
            </Link>
          </div>
        </div>

        {/* SECTION 1: PIE CHART STATUS GRAPH & SUMMARY INDEXES */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Overall Run Status & Execution Metrics
              </h2>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Pass Rate: <span className="text-emerald-400 font-bold">{stats.passRate}%</span> ({stats.passed}/{stats.total - stats.pending} executed)
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Vector Pie Chart */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full drop-shadow-md" viewBox="0 0 180 180">
                  {pieSlices.length === 0 ? (
                    <circle cx="90" cy="90" r="80" fill="#334155" />
                  ) : (
                    pieSlices.map((slice) => {
                      const isHovered = hoveredSlice === slice.key;
                      return (
                        <path
                          key={slice.key}
                          d={slice.path}
                          fill={isHovered ? slice.hoverColor : slice.color}
                          className="transition-all duration-200 cursor-pointer stroke-slate-950 stroke-[1.5]"
                          onMouseEnter={() => setHoveredSlice(slice.key)}
                          onMouseLeave={() => setHoveredSlice(null)}
                        />
                      );
                    })
                  )}
                </svg>
              </div>

              {/* Pie Chart Legend with Click-to-filter */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
                {sliceConfig.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === item.key ? 'ALL' : item.key)}
                    onMouseEnter={() => setHoveredSlice(item.key)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all ${
                      statusFilter === item.key
                        ? 'bg-slate-800 ring-1 ring-cyan-400 text-white'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold">{item.label}:</span>
                    <span className="font-bold">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Summary Indexes & Numerical Tiles */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Metric 1: Total Tests */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Total Tests</span>
                  <Layers className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white font-mono">{stats.total}</div>
                  <span className="text-[10px] text-slate-500 font-mono">100% of run</span>
                </div>
              </div>

              {/* Metric 2: Passed */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Passed</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">{stats.passed}</div>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    {Math.round((stats.passed / total) * 100)}% of total
                  </span>
                </div>
              </div>

              {/* Metric 3: Failed (Defects) */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between">
                <div className="flex items-center justify-between text-rose-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Failed</span>
                  <XCircle className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-rose-400 font-mono">{stats.failed}</div>
                  <span className="text-[10px] text-rose-400/80 font-mono">
                    {Math.round((stats.failed / total) * 100)}% defects
                  </span>
                </div>
              </div>

              {/* Metric 4: Skipped */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
                <div className="flex items-center justify-between text-amber-400 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Skipped</span>
                  <MinusCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-400 font-mono">{stats.skipped}</div>
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    {Math.round((stats.skipped / total) * 100)}% skipped
                  </span>
                </div>
              </div>

              {/* Progress Summary Strip */}
              <div className="col-span-2 sm:col-span-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Run Progress ({stats.total - stats.pending}/{stats.total} Executed)</span>
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {stats.progressPercent}% Completed
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  {stats.passed > 0 && (
                    <div
                      style={{ width: `${(stats.passed / stats.total) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`${stats.passed} Passed`}
                    />
                  )}
                  {stats.failed > 0 && (
                    <div
                      style={{ width: `${(stats.failed / stats.total) * 100}%` }}
                      className="bg-rose-500 transition-all duration-500"
                      title={`${stats.failed} Failed`}
                    />
                  )}
                  {stats.skipped > 0 && (
                    <div
                      style={{ width: `${(stats.skipped / stats.total) * 100}%` }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`${stats.skipped} Skipped`}
                    />
                  )}
                  {stats.pending > 0 && (
                    <div
                      style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                      className="bg-slate-800 transition-all duration-500"
                      title={`${stats.pending} Untested`}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: MODULE-WISE STATUS REPORT TABLE */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Module-Wise Status Breakdown ({moduleBreakdownList.length} Modules)
              </h2>
            </div>
            {moduleFilter !== 'ALL' && (
              <button
                onClick={() => setModuleFilter('ALL')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold"
              >
                Clear Filter (Showing {moduleFilter}) ✕
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Module Name</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center text-emerald-400">Passed</th>
                  <th className="px-4 py-3 text-center text-rose-400">Failed</th>
                  <th className="px-4 py-3 text-center text-amber-400">Skipped</th>
                  <th className="px-4 py-3 text-center text-slate-400">Pending</th>
                  <th className="px-5 py-3">Module Health / Pass Rate</th>
                  <th className="px-4 py-3 text-right">Quick Filter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {moduleBreakdownList.map((m) => {
                  const isSelected = moduleFilter === m.module;
                  return (
                    <tr
                      key={m.module}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isSelected ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-200">
                        <ModuleTag module={m.module} className="text-xs px-2.5 py-1" />
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-200">
                        {m.total}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-400">
                        {m.passed > 0 ? `${m.passed}` : <span className="text-slate-600">0</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-400">
                        {m.failed > 0 ? `${m.failed}` : <span className="text-slate-600">0</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-400">
                        {m.skipped > 0 ? `${m.skipped}` : <span className="text-slate-600">0</span>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                        {m.pending > 0 ? `${m.pending}` : <span className="text-slate-600">0</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-28 h-2 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                            <div
                              style={{ width: `${m.passRate}%` }}
                              className={`h-full transition-all duration-500 ${
                                m.failed > 0
                                  ? 'bg-rose-500'
                                  : m.passRate === 100
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                          </div>
                          <span
                            className={`font-mono font-bold text-xs ${
                              m.failed > 0
                                ? 'text-rose-400'
                                : m.passRate === 100
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {m.passRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setModuleFilter(isSelected ? 'ALL' : m.module)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Filter'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: DETAILED TEST CASE RESULTS LIST */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search result by title or defect notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto flex-wrap">
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
