'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderGit2,
  PlayCircle,
  Plus,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
  ArrowUpRight,
  Search,
  Activity,
  ShieldCheck,
  TrendingUp,
  Clock,
  FlaskConical,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { StatusBadge, PriorityBadge } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth-context';

interface ProjectItem {
  id: number;
  key?: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  isOwner?: boolean;
  testCaseCount: number;
  runCount: number;
  lastRun?: {
    id: number;
    name: string;
    status: string;
    executedAt: string;
  } | null;
}

interface RecentRun {
  id: number;
  projectId: number;
  projectName: string;
  name: string;
  status: string;
  executedAt: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTestCases: 0,
    totalRuns: 0,
    globalPassRate: 100,
    p0Count: 0,
    p1Count: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (user?.uid) query.set('userId', user.uid);
      if (user?.email) query.set('userEmail', user.email);

      const [projRes, statsRes] = await Promise.all([
        fetch(`/api/projects?${query.toString()}`),
        fetch(`/api/dashboard/stats?${query.toString()}`),
      ]);

      const projData = await projRes.json();
      const statsData = await statsRes.json();

      if (projData.projects) setProjects(projData.projects);
      if (statsData.stats) setStats(statsData.stats);
      if (statsData.recentRuns) setRecentRuns(statsData.recentRuns);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid || 'demo-user-1',
          userEmail: user?.email || 'qa.lead@regressionhub.io',
        }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to seed:', err);
    } finally {
      setSeeding(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppShell>
      <Header
        title="Dashboard"
        subtitle="Platform metrics, active regression suites, and recent executions"
        actions={
          <div className="flex items-center gap-2">
            {projects.length === 0 && (
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{seeding ? 'Generating...' : 'Seed Sample Project'}</span>
              </button>
            )}
            <Link
              href="/projects/new"
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Projects */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                My Projects
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.totalProjects}
            </div>
            <p className="text-xs text-slate-400 mt-1">Accessible repository suites</p>
          </div>

          {/* Card 2: Test Cases */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Test Cases
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.totalTestCases}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-rose-400 font-mono font-medium">{stats.p0Count} P0 Critical</span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-amber-400 font-mono font-medium">{stats.p1Count} P1 High</span>
            </div>
          </div>

          {/* Card 3: Total Runs */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Regression Runs
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <FlaskConical className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {stats.totalRuns}
            </div>
            <p className="text-xs text-slate-400 mt-1">Executed test run cycles</p>
          </div>

          {/* Card 4: Global Pass Rate */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Global Pass Rate
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight">
              {stats.globalPassRate}%
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.globalPassRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Projects</h2>
              <p className="text-xs text-slate-400">Projects you own or have been invited to</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {projects.length === 0 && !loading ? (
            <div className="p-10 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
                <FolderGit2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">No projects found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Get started by creating your first project or generate instant sample data with our 1-click seed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{seeding ? 'Generating Sample...' : 'Seed Sample E-Commerce Project'}</span>
                </button>
                <Link
                  href="/projects/new"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700/60"
                >
                  Create Custom Project
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-cyan-500/5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/projects/${p.id}`}
                          className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                        >
                          <span>{p.name}</span>
                          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                        </Link>
                        {p.key && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {p.key}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                          p.isOwner
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {p.isOwner ? 'Owner' : 'Member'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>{p.testCaseCount} Test Cases</span>
                      <span>{p.runCount} Runs</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Link
                        href={`/projects/${p.id}/runs/new`}
                        className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Run Regression</span>
                      </Link>

                      <Link
                        href={`/projects/${p.id}`}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Regression Runs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Regression Runs</h2>
              <p className="text-xs text-slate-400">Live progress and results of recent test cycles</p>
            </div>
          </div>

          {recentRuns.length === 0 ? (
            <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-xs text-slate-500">
              No test runs have been executed yet.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3">Run Name / Project</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Test Breakdown</th>
                      <th className="px-4 py-3">Executed At</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/runs/${run.id}`}
                            className="font-semibold text-slate-200 hover:text-cyan-400 transition-colors block"
                          >
                            {run.name || 'Unnamed Run'}
                          </Link>
                          <span className="text-[11px] text-slate-500">{run.projectName}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-mono font-medium">{run.passed}P</span>
                            <span className="text-rose-400 font-mono font-medium">{run.failed}F</span>
                            <span className="text-amber-400 font-mono font-medium">{run.skipped}S</span>
                            <span className="text-slate-500 font-mono">({run.total} total)</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono">
                          {formatDate(run.executedAt)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {run.status === 'IN_PROGRESS' ? (
                              <Link
                                href={`/runs/${run.id}/execute`}
                                className="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <PlayCircle className="w-3 h-3" />
                                <span>Execute</span>
                              </Link>
                            ) : (
                              <Link
                                href={`/runs/${run.id}`}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
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
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
