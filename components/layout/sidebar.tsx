'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderGit2,
  PlayCircle,
  PlusCircle,
  LogOut,
  Layers,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  FileCode2,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { cn } from '@/lib/utils';

interface ProjectOption {
  id: number;
  name: string;
  isOwner?: boolean;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [projectsList, setProjectsList] = useState<ProjectOption[]>([]);

  useEffect(() => {
    if (!user) return;
    const query = new URLSearchParams();
    if (user.uid) query.set('userId', user.uid);
    if (user.email) query.set('userEmail', user.email);

    fetch(`/api/projects?${query.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) {
          setProjectsList(
            data.projects.map((p: { id: number; name: string; isOwner?: boolean }) => ({
              id: p.id,
              name: p.name,
              isOwner: p.isOwner,
            }))
          );
        }
      })
      .catch(() => {});
  }, [pathname, user]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      label: 'New Project',
      href: '/projects/new',
      icon: PlusCircle,
      active: pathname === '/projects/new',
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen text-slate-300">
      {/* Brand Header */}
      <div className="h-16 border-b border-slate-800/80 flex items-center justify-between px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight flex items-center gap-1.5 text-base">
              RegTest <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">Hub</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
        {/* Main Nav */}
        <div className="space-y-1">
          <div className="px-3 text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  item.active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                )}
              >
                <Icon className={cn('w-4 h-4', item.active ? 'text-cyan-400' : 'text-slate-400')} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Projects Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3">
            <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
              My Projects ({projectsList.length})
            </span>
            <Link
              href="/projects/new"
              className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
              title="Create Project"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
            {projectsList.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-600 italic">No accessible projects</div>
            ) : (
              projectsList.map((p) => {
                const isActive = pathname.startsWith(`/projects/${p.id}`);
                return (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors group',
                      isActive
                        ? 'bg-slate-800/90 text-cyan-300 font-semibold border-l-2 border-cyan-400'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FolderGit2 className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400" />
                      <span className="truncate">{p.name}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-500 transition-opacity" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Pro / Help Box */}
        <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-900/80 to-slate-900/30 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Runner</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Execute regression runs in real-time with hotkeys <kbd className="px-1 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">P</kbd>, <kbd className="px-1 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">F</kbd>, <kbd className="px-1 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">S</kbd>.
          </p>
        </div>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.displayName || 'User'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {user?.email || 'user@company.com'}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
