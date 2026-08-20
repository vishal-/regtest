'use client';

import React from 'react';
import { Sidebar } from './sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950/40">
        {children}
      </main>
    </div>
  );
}
