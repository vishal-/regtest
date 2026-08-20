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
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { PriorityBadge, StatusBadge, ModuleTag } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth-context';

interface TestCase {
  id: number;
  projectId: number;
  module: string;
  priority: string;
  title: string;
  description: string;
  expectedResult: string;
  createdAt: string;
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
    name: string;
    description: string;
    userId: string;
    createdAt: string;
  };
  isOwner: boolean;
  members: MemberItem[];
  testCases: TestCase[];
  testRuns: TestRun[];
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
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Add Member Form
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState('');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (user?.uid) query.set('userId', user.uid);
      if (user?.email) query.set('userEmail', user.email);

      const res = await fetch(`/api/projects/${projectId}?${query.toString()}`);
      if (!res.ok) {
        if (res.status === 403) {
          alert('Access denied: You are not a member of this project.');
          router.push('/dashboard');
          return;
        }
        throw new Error('Project not found');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProject();
    }
  }, [projectId, user]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) {
      setMemberError('Please enter user email');
      return;
    }
    setAddingMember(true);
    setMemberError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerUserId: user?.uid,
          userEmail: newMemberEmail.trim(),
          role: newMemberRole,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to add member');
      }

      setNewMemberEmail('');
      await fetchProject();
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : 'Error adding member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/members?memberId=${memberId}&callerUserId=${user?.uid}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to remove member');
      await fetchProject();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return (
      <AppShell>
        <Header breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loading...' }]} />
        <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
          Loading project workspace...
        </div>
      </AppShell>
    );
  }

  const { project, isOwner, members, testCases, testRuns } = data;

  // Extract unique modules
  const uniqueModules = Array.from(new Set(testCases.map((tc) => tc.module))).filter(Boolean);

  // Filter test cases
  const filteredTestCases = testCases.filter((tc) => {
    const matchesSearch =
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tc.description && tc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tc.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModule === 'ALL' || tc.module === selectedModule;
    const matchesPriority = selectedPriority === 'ALL' || tc.priority === selectedPriority;
    return matchesSearch && matchesModule && matchesPriority;
  });

  const p0Count = testCases.filter((tc) => tc.priority === 'P0').length;
  const p1Count = testCases.filter((tc) => tc.priority === 'P1').length;

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
                  {testCases.length} tests
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                {project.description || 'No description provided for this project repository.'}
              </p>
            </div>

            {/* Quick stats badges */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <div className="text-xs text-rose-400 font-bold font-mono">{p0Count}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">P0 Critical</div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <div className="text-xs text-amber-400 font-bold font-mono">{p1Count}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">P1 High</div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <div className="text-xs text-cyan-400 font-bold font-mono">{testRuns.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Runs</div>
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                <div className="text-xs text-violet-400 font-bold font-mono">{members.length}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Members</div>
              </div>
            </div>
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
                    placeholder="Search test case title or steps..."
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
                      <th className="px-4 py-3 w-16">Priority</th>
                      <th className="px-4 py-3 w-28">Module</th>
                      <th className="px-4 py-3">Test Case Title & Expected Result</th>
                      <th className="px-4 py-3 w-32">Created</th>
                      <th className="px-4 py-3 text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTestCases.map((tc) => (
                      <tr key={tc.id} className="hover:bg-slate-800/30 transition-colors group">
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
                <h3 className="text-sm font-bold text-white">Regression Run History</h3>
                <p className="text-xs text-slate-400">All executions tracked for this project</p>
              </div>

              <Link
                href={`/projects/${project.id}/runs/new`}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-500/20"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>+ Launch New Run</span>
              </Link>
            </div>

            {testRuns.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-slate-300">No regression runs yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Launch a test run to execute your test cases in real-time.
                </p>
                <Link
                  href={`/projects/${project.id}/runs/new`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Start Regression Run</span>
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3">Run Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Results Ratio</th>
                      <th className="px-4 py-3">Executed At</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {testRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/runs/${run.id}`}
                            className="font-semibold text-slate-100 hover:text-cyan-400 transition-colors block text-sm"
                          >
                            {run.name || 'Unnamed Run'}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-mono font-bold">{run.passed}P</span>
                            <span className="text-rose-400 font-mono font-bold">{run.failed}F</span>
                            <span className="text-amber-400 font-mono font-bold">{run.skipped}S</span>
                            {run.pending > 0 && (
                              <span className="text-cyan-400 font-mono font-bold">
                                {run.pending} Pending
                              </span>
                            )}
                            <span className="text-slate-500 font-mono">({run.totalTests} total)</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                          {formatDate(run.executedAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {run.status === 'IN_PROGRESS' ? (
                              <Link
                                href={`/runs/${run.id}/execute`}
                                className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Execute</span>
                              </Link>
                            ) : (
                              <Link
                                href={`/runs/${run.id}`}
                                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                              >
                                View Report
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEAM & ACCESS (MEMBERS) */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Owner Section: Add Member */}
            {isOwner ? (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-cyan-400" />
                      <span>Invite User to Project</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Only you (the project creator) can grant other users access to this regression repository.
                    </p>
                  </div>
                </div>

                {memberError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                    {memberError}
                  </div>
                )}

                <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      required
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="Enter user email (e.g. sdet@company.com)"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  >
                    <option value="MEMBER">Role: Member (Tester)</option>
                    <option value="ADMIN">Role: Admin</option>
                  </select>

                  <button
                    type="submit"
                    disabled={addingMember}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{addingMember ? 'Adding...' : 'Add Member'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 text-indigo-300 text-xs">
                <Lock className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  You are participating as a <strong>Team Member</strong>. Only the project creator has permission to invite or remove members.
                </span>
              </div>
            )}

            {/* Members Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm space-y-2">
              <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Current Project Members ({members.length})
                </span>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">User Email / ID</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined Date</th>
                    {isOwner && <th className="px-5 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-[11px]">
                            {m.userEmail ? m.userEmail.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200">
                              {m.userEmail || m.userId}
                            </span>
                            {m.userId === project.userId && (
                              <span className="ml-2 text-[10px] text-cyan-400 font-mono">
                                (Creator)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                            m.role === 'OWNER'
                              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {m.role === 'OWNER' && <Crown className="w-3 h-3 text-cyan-400" />}
                          {m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {formatDate(m.addedAt)}
                      </td>
                      {isOwner && (
                        <td className="px-5 py-3.5 text-right">
                          {m.role !== 'OWNER' && m.userId !== project.userId && (
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                              title="Remove Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
