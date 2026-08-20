'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Plus, Play, Sparkles } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, breadcrumbs, actions }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center space-x-1.5 text-xs text-slate-400">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.label + idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-cyan-400 transition-colors font-medium"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-slate-200 font-semibold truncate max-w-xs' : ''}>
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        ) : (
          <div>
            {title && <h1 className="text-base font-semibold text-slate-100">{title}</h1>}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {actions}
      </div>
    </header>
  );
}
