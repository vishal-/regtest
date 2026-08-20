'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  FlaskConical,
  Plus,
  PlayCircle,
  Search,
  Filter,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileCode2,
  Trash2,
  Edit,
  ExternalLink,
  Users,
  UserPlus,
  ShieldCheck,
  Crown,
  Lock,
  PieChart as PieIcon,
  Activity,
  AlertTriangle,
  MinusCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { PriorityBadge, StatusBadge, ModuleTag, TestCaseCodeBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth-context';

interface TestCase {
  id: number;
  projectId: number;
  caseNumber: number;
  code: string;
  module: string;
  priority: string;
  title: string;
  description: string;
  expectedResult: string;
  createdAt: string;
  lastRunStatus?: string | null;
}

interface TestRun {
  id: number;
  projectId: number;
  name: string;
  status: string;
  executedAt: string;
  completedAt?: string | null;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
}

interface MemberItem {
  id: number;
  projectId: number;
  userId: string;
  userEmail?: string | null;
  role: string;
  addedAt: string;
}

interface ProjectData {
  project: {
    id: number;
    key: string;
    name: string;
    description: string;
    userId: string;
    createdAt: string;
  };
  isOwner: boolean;
  members: MemberItem[];
  testCases: TestCase[];
  testRuns: TestRun[];
  lastRun?: TestRun | null;
}

// SVG Pie Sector Generator Helper
function createPieSlice(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 359.99) {
    return `M ${cx - r}, ${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
  }
  const rad = Math.PI / 180;
  const a1 = (startAngle - 90) * rad;
  const a2 = (endAngle - 90) * rad;

  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'test-cases' | 'runs' | 'members'>('test-cases');

  // Filters for test cases
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  // Team Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  // Delete project
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (user?.uid) query.set('userId', user.uid);
      if (user?.email) query.set('userEmail', user.email);

      const res = await fetch(`/api/projects/${projectId}?${query.toString()}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error('Access denied to this project');
        throw new Error('Project not found');
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId, user]);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: inviteEmail.trim(),
          role: inviteRole,
          callerUserId: user?.uid || 'demo-user-1',
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to add member');

      setInviteSuccess(`Successfully added ${inviteEmail} as ${inviteRole}`);
      setInviteEmail('');
      fetchProject();
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Error adding member');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members?memberId=${memberId}&callerUserId=${user?.uid || 'demo-user-1'}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove member');
      fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}?userId=${user?.uid || 'demo-user-1'}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete project');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  if (loading || !data) {
    return (
      <AppShell>
        <Header breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loading Project...' }]} />
        <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
          Loading project data & test catalog...
        </div>
      </AppShell>
    );
  }

  const { project, isOwner, members, testCases, testRuns, lastRun } = data;

  // Filter modules and test cases
  const uniqueModules = Array.from(new Set(testCases.map((tc) => tc.module)));

  const filteredTestCases = testCases.filter((tc) => {
    const matchesSearch =
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tc.description && tc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tc.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModule === 'ALL' || tc.module === selectedModule;
    const matchesPriority = selectedPriority === 'ALL' || tc.priority === selectedPriority;
    return matchesSearch && matchesModule && matchesPriority;
  });

  // Calculate Priority Distribution for Pie Chart 1
  const totalTestCount = testCases.length || 1;
  const p0Count = testCases.filter((tc) => tc.priority === 'P0').length;
  const p1Count = testCases.filter((tc) => tc.priority === 'P1').length;
  const p2Count = testCases.filter((tc) => tc.priority === 'P2').length;
  const p3Count = testCases.filter((tc) => tc.priority === 'P3').length;

  const prioritySliceConfig = [
    { key: 'P0', label: 'P0 Critical', count: p0Count, color: '#f43f5e', hoverColor: '#fb7185' },
    { key: 'P1', label: 'P1 High', count: p1Count, color: '#f59e0b', hoverColor: '#fbbf24' },
    { key: 'P2', label: 'P2 Medium', count: p2Count, color: '#38bdf8', hoverColor: '#7dd3fc' },
    { key: 'P3', label: 'P3 Low', count: p3Count, color: '#94a3b8', hoverColor: '#cbd5e1' },
  ];

  const priorityPieSlices: {
    key: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
    path: string;
  }[] = [];

  let currentPriorityAngle = 0;
  prioritySliceConfig.forEach((slice) => {
    if (slice.count > 0) {
      const sliceAngle = (slice.count / totalTestCount) * 360;
      const start = currentPriorityAngle;
      const end = currentPriorityAngle + sliceAngle;
      priorityPieSlices.push({
        ...slice,
        percentage: Math.round((slice.count / totalTestCount) * 100),
        path: createPieSlice(70, 70, 60, start, end),
      });
      currentPriorityAngle = end;
    }
  });

  // Calculate Latest Run Status Distribution for Pie Chart 2
  const latestRun = lastRun || (testRuns.length > 0 ? testRuns[0] : null);
  const runTotal = latestRun ? latestRun.totalTests || 1 : 1;
  const runPassed = latestRun ? latestRun.passed : 0;
  const runFailed = latestRun ? latestRun.failed : 0;
  const runSkipped = latestRun ? latestRun.skipped : 0;
  const runPending = latestRun ? latestRun.pending : 0;
  const runPassRate = latestRun && runTotal > 0 ? Math.round((runPassed / runTotal) * 100) : 0;

  const runSliceConfig = [
    { key: 'PASSED', label: 'Passed', count: runPassed, color: '#10b981', hoverColor: '#34d399' },
    { key: 'FAILED', label: 'Failed', count: runFailed, color: '#f43f5e', hoverColor: '#fb7185' },
    { key: 'SKIPPED', label: 'Skipped', count: runSkipped, color: '#f59e0b', hoverColor: '#fbbf24' },
    { key: 'PENDING', label: 'Pending', count: runPending, color: '#475569', hoverColor: '#64748b' },
  ];

  const runPieSlices: {
    key: string;
    label: string;
    count: number;
    percentage: number;
    color: string;
    path: string;
  }[] = [];

  let currentRunAngle = 0;
  if (latestRun && latestRun.totalTests > 0) {
    runSliceConfig.forEach((slice) => {
      if (slice.count > 0) {
        const sliceAngle = (slice.count / runTotal) * 360;
        const start = currentRunAngle;
        const end = currentRunAngle + sliceAngle;
        runPieSlices.push({
          ...slice,
          percentage: Math.round((slice.count / runTotal) * 100),
          path: createPieSlice(70, 70, 60, start, end),
        });
        currentRunAngle = end;
      }
    });
  }

  return (
    <AppShell>
      <Header
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: project.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${project.id}/test-cases/new`}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              <span>Add Test Case</span>
            </Link>
            <Link
              href={`/projects/${project.id}/runs/new`}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-500/20"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Start Run</span>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Project Header Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/40 border border-slate-800 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {project.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  {project.key}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1 ${
                    isOwner
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {isOwner ? <Crown className="w-3 h-3 text-cyan-400" /> : <Users className="w-3 h-3 text-indigo-400" />}
                  {isOwner ? 'Project Creator / Owner' : 'Team Member'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {testCases.length} test cases
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                {project.description || 'No description provided for this project repository.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                href={`/projects/${project.id}/runs/new`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" />
                <span>New Regression Run</span>
              </Link>
            </div>
          </div>
        </div>

        {/* PROJECT STATUS BAR: TWO PIE CHARTS (TEST CASES PRIORITY & LAST RUN STATUS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* PIE CHART 1: TEST CASES PRIORITY BREAKDOWN (P0-P3) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Test Case Priorities (P0–P3)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Total: <span className="text-white font-bold">{testCases.length}</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-1">
              {/* SVG Vector Pie */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 140 140">
                  {priorityPieSlices.length === 0 ? (
                    <circle cx="70" cy="70" r="60" fill="#334155" />
                  ) : (
                    priorityPieSlices.map((slice) => (
                      <path
                        key={slice.key}
                        d={slice.path}
                        fill={slice.color}
                        className="transition-all duration-200 stroke-slate-950 stroke-[1.5]"
                      />
                    ))
                  )}
                </svg>
              </div>

              {/* Priority Legend & Summary Indexes */}
              <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs text-xs font-mono">
                {prioritySliceConfig.map((item) => (
                  <div
                    key={item.key}
                    className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-300 font-semibold">{item.key}:</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-white">{item.count}</span>
                      <span className="text-[10px] text-slate-500 ml-1">
                        ({testCases.length > 0 ? Math.round((item.count / testCases.length) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PIE CHART 2: LAST RUN STATUS (PASSED, FAILED, SKIPPED, PENDING) */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Last Run Status {latestRun ? `(${latestRun.name})` : ''}
                </h3>
              </div>
              {latestRun && (
                <Link
                  href={`/runs/${latestRun.id}`}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono font-semibold inline-flex items-center gap-1"
                >
                  <span>Report</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>

            {!latestRun ? (
              <div className="p-8 text-center space-y-2">
                <div className="text-xs text-slate-500">No regression runs executed yet.</div>
                <Link
                  href={`/projects/${project.id}/runs/new`}
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 font-semibold hover:underline"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Execute first run</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-1">
                {/* SVG Vector Pie */}
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 140 140">
                    {runPieSlices.length === 0 ? (
                      <circle cx="70" cy="70" r="60" fill="#334155" />
                    ) : (
                      runPieSlices.map((slice) => (
                        <path
                          key={slice.key}
                          d={slice.path}
                          fill={slice.color}
                          className="transition-all duration-200 stroke-slate-950 stroke-[1.5]"
                        />
                      ))
                    )}
                  </svg>
                  {/* Center Pass Rate Ring */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-sm font-extrabold text-white font-mono">
                      {runPassRate}%
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase font-semibold">Pass</span>
                  </div>
                </div>

                {/* Run Status Legend & Summary Indexes */}
                <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs text-xs font-mono">
                  {runSliceConfig.map((item) => (
                    <div
                      key={item.key}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-300 font-semibold">{item.label}:</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{item.count}</span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({runTotal > 0 ? Math.round((item.count / runTotal) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 space-x-6">
          <button
            onClick={() => setActiveTab('test-cases')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'test-cases'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Test Cases ({testCases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('runs')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'runs'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Regression Runs ({testRuns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team & Access ({members.length})</span>
          </button>
        </div>

        {/* TAB 1: TEST CASES */}
        {activeTab === 'test-cases' && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search test case code, title or steps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Module selector */}
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                >
                  <option value="ALL">All Modules</option>
                  {uniqueModules.map((m) => (
                    <option key={m} value={m}>
                      Module: {m}
                    </option>
                  ))}
                </select>

                {/* Priority selector */}
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="P0">P0 (Critical)</option>
                  <option value="P1">P1 (High)</option>
                  <option value="P2">P2 (Medium)</option>
                  <option value="P3">P3 (Low)</option>
                </select>
              </div>
            </div>

            {/* Test Cases Table */}
            {filteredTestCases.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-slate-300">No test cases match filter</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {testCases.length === 0
                    ? 'Start building your test catalog by adding your first test case.'
                    : 'Try clearing your search query or selecting "All Modules".'}
                </p>
                {testCases.length === 0 && (
                  <Link
                    href={`/projects/${project.id}/test-cases/new`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Test Case</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3 w-24">Code</th>
                      <th className="px-4 py-3 w-16">Priority</th>
                      <th className="px-4 py-3 w-28">Module</th>
                      <th className="px-4 py-3">Test Case Title & Expected Result</th>
                      <th className="px-4 py-3 w-32">Last Run Result</th>
                      <th className="px-4 py-3 w-28">Created</th>
                      <th className="px-4 py-3 text-right w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTestCases.map((tc) => (
                      <tr key={tc.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-4 py-3.5 align-top">
                          <TestCaseCodeBadge code={tc.code} />
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <PriorityBadge priority={tc.priority} />
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <ModuleTag module={tc.module} />
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <Link
                            href={`/projects/${project.id}/test-cases/${tc.id}`}
                            className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors block text-sm mb-1"
                          >
                            {tc.title}
                          </Link>
                          <div className="text-xs text-slate-400 line-clamp-2">
                            <span className="text-slate-500 font-semibold">Expected:</span>{' '}
                            {tc.expectedResult}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          {tc.lastRunStatus ? (
                            <StatusBadge status={tc.lastRunStatus} />
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono italic">Untested</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-top text-slate-400 font-mono text-[11px]">
                          {formatDate(tc.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 align-top text-right">
                          <Link
                            href={`/projects/${project.id}/test-cases/${tc.id}`}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-md transition-colors inline-block"
                            title="Edit / View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGRESSION RUNS */}
        {activeTab === 'runs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Executed Runs History
                </h3>
                <p className="text-xs text-slate-400">
                  Track pass rates and defect distributions over time.
                </p>
              </div>
              <Link
                href={`/projects/${project.id}/runs/new`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors shadow-sm shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Run</span>
              </Link>
            </div>

            {testRuns.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-slate-300">No regression runs executed yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Execute your first regression test run against this test catalog.
                </p>
                <Link
                  href={`/projects/${project.id}/runs/new`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Start First Run</span>
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-4 py-3">Run Name</th>
                      <th className="px-4 py-3 w-32">Status</th>
                      <th className="px-4 py-3 text-center w-28">Pass Rate</th>
                      <th className="px-4 py-3 text-center w-24">Passed</th>
                      <th className="px-4 py-3 text-center w-24">Failed</th>
                      <th className="px-4 py-3 text-center w-24">Skipped</th>
                      <th className="px-4 py-3 w-36">Executed</th>
                      <th className="px-4 py-3 text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {testRuns.map((r) => {
                      const completed = r.passed + r.failed;
                      const passRate =
                        r.totalTests > 0
                          ? Math.round((r.passed / r.totalTests) * 100)
                          : 0;
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-4 py-3.5 font-semibold text-slate-200">
                            <Link
                              href={`/runs/${r.id}`}
                              className="hover:text-cyan-400 transition-colors"
                            >
                              {r.name || `Run #${r.id}`}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-cyan-400">
                            {passRate}%
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-400">
                            {r.passed}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-400">
                            {r.failed}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-400">
                            {r.skipped}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                            {formatDate(r.executedAt)}
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-2">
                            <Link
                              href={`/runs/${r.id}`}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold inline-block"
                            >
                              Report
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEAM & ACCESS CONTROL */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Invite Form (Owner Only) */}
            {isOwner ? (
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Invite Member to Project
                  </h3>
                </div>

                {inviteError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {inviteError}
                  </div>
                )}
                {inviteSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                    {inviteSuccess}
                  </div>
                )}

                <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Enter team member's email address..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="MEMBER">Role: Member</option>
                    <option value="ADMIN">Role: Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {inviting ? 'Adding...' : 'Add Member'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Only the project creator has permissions to invite or remove team members.</span>
              </div>
            )}

            {/* Current Members List */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Project Members ({members.length})
                </h4>
              </div>

              <div className="divide-y divide-slate-800/60">
                {members.map((m) => {
                  const isMemberOwner = m.role === 'OWNER';
                  return (
                    <div
                      key={m.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                          {m.userEmail ? m.userEmail.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-2">
                            <span>{m.userEmail || `User (${m.userId})`}</span>
                            {isMemberOwner && (
                              <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                                CREATOR
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Joined {formatDate(m.addedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {m.role}
                        </span>
                        {isOwner && !isMemberOwner && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Danger Zone: Delete Project (Owner Only) */}
            {isOwner && (
              <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                      Danger Zone
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Permanently delete this project and all its test cases, runs, and results.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition-colors border border-rose-500/30"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Project</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{project.name}</strong>?
              This will remove all associated test cases and test run history. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
