'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  Clock,
  ExternalLink,
  History,
  Layers,
  FileCode2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Header } from '@/components/layout/header';
import { PriorityBadge, StatusBadge, ModuleTag } from '@/components/ui/badges';
import { formatDate } from '@/lib/utils';

interface TestCaseDetail {
  id: number;
  projectId: number;
  module: string;
  priority: string;
  title: string;
  description: string;
  expectedResult: string;
  createdAt: string;
}

interface RunHistoryItem {
  resultId: number;
  status: string;
  actualResult?: string | null;
  notes?: string | null;
  executedAt?: string | null;
  runId: number;
  runName: string;
  runExecutedAt: string;
}

export default function TestCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; testId: string }>;
}) {
  const resolvedParams = use(params);
  const { id: projectId, testId } = resolvedParams;
  const router = useRouter();

  const [testCase, setTestCase] = useState<TestCaseDetail | null>(null);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editModule, setEditModule] = useState('');
  const [editPriority, setEditPriority] = useState('P1');
  const [editDescription, setEditDescription] = useState('');
  const [editExpectedResult, setEditExpectedResult] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/test-cases/${testId}`);
      if (!res.ok) throw new Error('Test case not found');
      const data = await res.json();
      setTestCase(data.testCase);
      setHistory(data.history || []);

      if (data.testCase) {
        setEditTitle(data.testCase.title);
        setEditModule(data.testCase.module);
        setEditPriority(data.testCase.priority);
        setEditDescription(data.testCase.description || '');
        setEditExpectedResult(data.testCase.expectedResult);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [projectId, testId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/test-cases/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          module: editModule.trim(),
          priority: editPriority,
          description: editDescription.trim(),
          expectedResult: editExpectedResult.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to update test case');
      setIsEditing(false);
      await fetchDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this test case and all its historical results?')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/test-cases/${testId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      router.push(`/projects/${projectId}`);
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  if (loading || !testCase) {
    return (
      <AppShell>
        <Header breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Loading...' }]} />
        <div className="p-12 text-center text-slate-500 text-sm animate-pulse">
          Loading test case details...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Project', href: `/projects/${projectId}` },
          { label: testCase.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-400" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Project</span>
          </Link>
        </div>

        {isEditing ? (
          /* EDIT FORM */
          <form onSubmit={handleSave} className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-5">
              <h2 className="text-base font-bold text-white">Edit Test Case</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Module
                  </label>
                  <input
                    type="text"
                    required
                    value={editModule}
                    onChange={(e) => setEditModule(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono"
                  >
                    <option value="P0">P0 (Critical)</option>
                    <option value="P1">P1 (High)</option>
                    <option value="P2">P2 (Medium)</option>
                    <option value="P3">P3 (Low)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Execution Steps
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Expected Result
                </label>
                <textarea
                  rows={3}
                  required
                  value={editExpectedResult}
                  onChange={(e) => setEditExpectedResult(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* READ-ONLY DETAIL CARD */
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <PriorityBadge priority={testCase.priority} size="md" />
                <ModuleTag module={testCase.module} className="text-xs px-3 py-1" />
                <span className="text-xs text-slate-500 font-mono">
                  Created {formatDate(testCase.createdAt)}
                </span>
              </div>

              <div>
                <h1 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {testCase.title}
                </h1>
              </div>

              {/* Execution Steps */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Execution Steps & Pre-conditions
                </h3>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                  {testCase.description || 'No specific steps specified.'}
                </div>
              </div>

              {/* Expected Result */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Expected Result
                </h3>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-sm text-emerald-300 leading-relaxed">
                  {testCase.expectedResult}
                </div>
              </div>
            </div>

            {/* Run History Section */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Execution History</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {history.length} runs
                </span>
              </div>

              {history.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center text-xs text-slate-500">
                  This test case has not been included in any completed regression runs yet.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3">Regression Run</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actual Result / Notes</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Run Report</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {history.map((h) => (
                        <tr key={h.resultId} className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-4 py-3.5 font-semibold text-slate-200">
                            {h.runName}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={h.status} />
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">
                            {h.actualResult || (
                              <span className="text-slate-600 italic">No notes logged</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                            {formatDate(h.executedAt || h.runExecutedAt)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Link
                              href={`/runs/${h.runId}`}
                              className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                            >
                              <span>View Run</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
