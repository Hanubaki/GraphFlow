import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  Github,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User as UserIcon,
  Crown,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const {
    user,
    planTier,
    isConfigured,
    signInWithOAuth,
    signInWithMagicLink,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'magic') {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        setMessage({ text: 'Magic link sent. Check your email inbox to verify.', type: 'success' });
      } else if (mode === 'signup') {
        const { error } = await signUpWithPassword(email, password);
        if (error) throw error;
        setMessage({
          text: 'Account created successfully. Please check your email to confirm registration.',
          type: 'success',
        });
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
        setMessage({ text: 'Authentication successful.', type: 'success' });
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setMessage({
        text: err?.message || 'Authentication error. Please verify your credentials.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setMessage(null);
    setLoading(true);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;
    } catch (err: any) {
      setMessage({
        text: err?.message || `OAuth sign-in with ${provider} failed.`,
        type: 'error',
      });
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="bg-dark-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-transparent relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            GraphFlow Account
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">
            {user ? 'Account Settings' : mode === 'signup' ? 'Create Your Account' : 'Sign in to GraphFlow'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {user
              ? 'Manage your cloud synchronization and subscription plan.'
              : 'Save architectures to the cloud, access Pro features, and sync across devices.'}
          </p>
        </div>

        {/* Unconfigured Warning Notice */}
        {!isConfigured && !user && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">Supabase Environment Unlinked:</span> Please configure{' '}
              <code className="bg-amber-950 px-1 py-0.5 rounded text-[11px] font-mono text-amber-200">
                VITE_SUPABASE_URL
              </code>{' '}
              and{' '}
              <code className="bg-amber-950 px-1 py-0.5 rounded text-[11px] font-mono text-amber-200">
                VITE_SUPABASE_ANON_KEY
              </code>{' '}
              in your environment to enable real-time cloud authentication.
            </div>
          </div>
        )}

        {/* Logged In View */}
        {user ? (
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-dark-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {user.email?.[0]?.toUpperCase() || <UserIcon className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-200 truncate">{user.email}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {user.id.slice(0, 18)}...</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Subscription Tier:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                    planTier === 'pro' || planTier === 'team'
                      ? 'bg-cyan-950/60 border border-cyan-700/60 text-cyan-200'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {(planTier === 'pro' || planTier === 'team') && <Crown className="w-3 h-3 text-amber-400" />}
                  {planTier.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <div className="p-6 space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-dark-950 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => {
                  setMode('signin');
                  setMessage(null);
                }}
                className={`py-1.5 rounded-lg transition-colors ${
                  mode === 'signin' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setMessage(null);
                }}
                className={`py-1.5 rounded-lg transition-colors ${
                  mode === 'signup' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => {
                  setMode('magic');
                  setMessage(null);
                }}
                className={`py-1.5 rounded-lg transition-colors ${
                  mode === 'magic' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Magic Link
              </button>
            </div>

            {/* Social OAuth Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={loading || !isConfigured}
                className="py-2 px-3 rounded-xl border border-slate-800 bg-dark-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Github className="w-3.5 h-3.5 text-slate-100" />
                <span>GitHub</span>
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading || !isConfigured}
                className="py-2 px-3 rounded-xl border border-slate-800 bg-dark-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative bg-dark-900 px-3 text-[11px] uppercase font-mono text-slate-500">
                Or with email
              </span>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="architect@domain.com"
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {mode !== 'magic' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>
              )}

              {message && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                      : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !isConfigured}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                <span>
                  {loading
                    ? 'Processing...'
                    : mode === 'signup'
                    ? 'Create Account'
                    : mode === 'magic'
                    ? 'Send Magic Link'
                    : 'Sign In to Studio'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
