'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  PlayCircle,
  Database,
  Terminal,
} from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsDemoUser } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: string) => {
    if (role === 'lead') {
      signInAsDemoUser('Sarah Chen (QA Lead)', 'sarah.lead@regtest.dev');
    } else {
      signInAsDemoUser('Alex Mercer (SDET)', 'alex.sdet@regtest.dev');
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center relative overflow-hidden selection:bg-cyan-500/30">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full px-6 py-12 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left column: Brand & value proposition */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Regression Suite</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Test execution <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                at the speed of thought.
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-lg leading-relaxed">
              Organize functional modules, create targeted test runs, and execute regression test cycles with zero latency powered by Turso distributed SQLite.
            </p>
          </div>

          {/* Value feature list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2 text-cyan-400">
                <PlayCircle className="w-5 h-5" />
                <span className="font-semibold text-sm text-slate-200">Interactive Runner</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Dedicated split-screen console with keyboard shortcuts for rapid Pass/Fail testing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2 text-indigo-400">
                <Database className="w-5 h-5" />
                <span className="font-semibold text-sm text-slate-200">Drizzle + Turso DB</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Type-safe ORM schema with distributed SQLite edge replication and zero connection bottlenecks.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Auth Card */}
        <div className="lg:col-span-5">
          <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-2xl shadow-black/50 space-y-6">
            <div className="space-y-1 text-center">
              <div className="flex justify-center mb-2">
                <img
                  src="/logo-main.png"
                  alt="RegTest App Logo"
                  className="w-12 h-12 rounded-xl object-contain drop-shadow-md"
                />
              </div>
              <h2 className="text-xl font-bold text-white">
                {isSignUp ? 'Create your account' : 'Sign in to RegTest'}
              </h2>
              <p className="text-xs text-slate-400">
                {isSignUp ? 'Start managing regression suites in seconds' : 'Access your regression test runs & reports'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-sm font-medium flex items-center justify-center gap-3 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 absolute">
                Or with email
              </span>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Chen"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tester@company.com"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>

            {/* Fast 1-Click Demo Sandbox Login */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <div className="text-center">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Instant Demo Access
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('lead')}
                  className="py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 transition-colors text-center"
                >
                  🚀 QA Lead Demo
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('sdet')}
                  className="py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-[11px] font-medium text-indigo-300 hover:text-indigo-200 transition-colors text-center"
                >
                  ⚡ SDET Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
