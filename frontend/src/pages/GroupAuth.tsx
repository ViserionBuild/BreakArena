import { useState } from 'react';
import { Users, Lock, Eye, EyeOff, ArrowRight, Plus, RefreshCw, ChevronLeft, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

type Mode = 'signin' | 'create' | 'reset';

// ─── Field helpers defined OUTSIDE the page component ───────────────────────
// Defining them inside would make React treat them as new component types on
// every render, causing unmount/remount and focus steal on every keystroke.

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

function TextField({ label, value, onChange, onSubmit, placeholder, autoFocus = false }: TextFieldProps) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40 block mb-1.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder={placeholder}
        className="input-field"
        autoFocus={autoFocus}
      />
    </div>
  );
}

interface PasscodeFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}

function PasscodeField({ label, value, onChange, onSubmit, show, onToggle, placeholder }: PasscodeFieldProps) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40 block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder={placeholder ?? '••••••••'}
          className="input-field pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GroupAuth() {
  const { groupSignIn, groupCreate, groupResetPasscode, isSaving, error, clearError } = useAppStore();

  const [mode,           setMode]           = useState<Mode>('signin');
  const [groupName,      setGroupName]      = useState('');
  const [passcode,       setPasscode]       = useState('');
  const [curPasscode,    setCurPasscode]    = useState('');
  const [newPasscode,    setNewPasscode]    = useState('');
  const [confirmPass,    setConfirmPass]    = useState('');
  const [showPass,       setShowPass]       = useState(false);
  const [showNewPass,    setShowNewPass]    = useState(false);
  const [localError,     setLocalError]     = useState<string | null>(null);
  const [resetSuccess,   setResetSuccess]   = useState(false);

  const displayError = localError || error;

  const switchMode = (next: Mode) => {
    setMode(next);
    setLocalError(null);
    clearError();
    setResetSuccess(false);
    setPasscode('');
    setCurPasscode('');
    setNewPasscode('');
    setConfirmPass('');
    setShowPass(false);
    setShowNewPass(false);
  };

  const handleSignIn = async () => {
    setLocalError(null);
    clearError();
    if (!groupName.trim()) return setLocalError('Group name is required');
    if (!passcode.trim())  return setLocalError('Passcode is required');
    try {
      await groupSignIn(groupName.trim(), passcode.trim());
    } catch { /* surfaced via store */ }
  };

  const handleCreate = async () => {
    setLocalError(null);
    clearError();
    if (!groupName.trim())         return setLocalError('Group name is required');
    if (passcode.trim().length < 4) return setLocalError('Passcode must be at least 4 characters');
    if (passcode !== confirmPass)  return setLocalError('Passcodes do not match');
    try {
      await groupCreate(groupName.trim(), passcode.trim());
    } catch { /* surfaced via store */ }
  };

  const handleReset = async () => {
    setLocalError(null);
    clearError();
    if (!groupName.trim())           return setLocalError('Group name is required');
    if (!curPasscode.trim())         return setLocalError('Current passcode is required');
    if (newPasscode.trim().length < 4) return setLocalError('New passcode must be at least 4 characters');
    if (newPasscode !== confirmPass) return setLocalError('New passcodes do not match');
    try {
      await groupResetPasscode(groupName.trim(), curPasscode.trim(), newPasscode.trim());
      setResetSuccess(true);
      setTimeout(() => switchMode('signin'), 2200);
    } catch { /* surfaced via store */ }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink-950 relative overflow-hidden px-4">

      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[520px] h-[520px] rounded-full bg-gold-500/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-48 -right-24 w-[420px] h-[420px] rounded-full bg-violet-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-1/4 w-[280px] h-[280px] rounded-full bg-jade-500/4 blur-3xl" />
      </div>

      {/* Floating card suits */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        {(['♠', '♥', '♦', '♣'] as const).map((suit, i) => (
          <span
            key={suit}
            className="absolute text-6xl opacity-[0.025]"
            style={{
              top:  `${15 + i * 22}%`,
              left: `${8  + i * 24}%`,
              animation: `float ${7 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            {suit}
          </span>
        ))}
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-4"
            style={{ boxShadow: '0 0 40px rgba(251,191,36,0.15)' }}
          >
            <span className="text-3xl">♠</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">BreakArena</h1>
          <p className="text-white/40 text-sm mt-1">Call Break Scoreboard</p>
        </div>

        {/* Panel */}
        <div className="glass-card rounded-3xl p-8 animate-slide-up" style={{ animationDelay: '0.05s' }}>

          {/* ── Sign In ── */}
          {mode === 'signin' && (
            <>
              <div className="mb-7">
                <h2 className="font-display text-xl font-bold text-white">Sign in to your Group</h2>
                <p className="text-white/40 text-sm mt-1">Enter your group name and passcode to continue</p>
              </div>

              <div className="space-y-4">
                <TextField
                  label="Group Name"
                  value={groupName}
                  onChange={setGroupName}
                  onSubmit={handleSignIn}
                  placeholder="e.g. Sunday Warriors"
                  autoFocus
                />
                <PasscodeField
                  label="Passcode"
                  value={passcode}
                  onChange={setPasscode}
                  onSubmit={handleSignIn}
                  show={showPass}
                  onToggle={() => setShowPass((v) => !v)}
                />
              </div>

              {displayError && (
                <div className="mt-4 p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-sm">
                  {displayError}
                </div>
              )}

              <button
                onClick={handleSignIn}
                disabled={isSaving}
                className="btn-primary w-full mt-6 rounded-2xl py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? <span className="w-4 h-4 border-2 border-ink-950/40 border-t-ink-950 rounded-full animate-spin" />
                  : <ArrowRight size={18} />}
                {isSaving ? 'Signing in…' : 'Sign In'}
              </button>

              <div className="mt-5 pt-5 border-t border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => switchMode('create')}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-gold-400 hover:bg-gold-500/5 transition-all"
                >
                  <Plus size={15} />
                  Create a new group
                </button>
                <button
                  onClick={() => switchMode('reset')}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
                >
                  <RefreshCw size={13} />
                  Forgot / Reset Passcode
                </button>
              </div>
            </>
          )}

          {/* ── Create Group ── */}
          {mode === 'create' && (
            <>
              <div className="flex items-center gap-2 mb-7">
                <button onClick={() => switchMode('signin')} className="text-white/30 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Create a Group</h2>
                  <p className="text-white/40 text-sm mt-0.5">Set up a shared scoreboard for your crew</p>
                </div>
              </div>

              <div className="space-y-4">
                <TextField
                  label="Group Name"
                  value={groupName}
                  onChange={setGroupName}
                  onSubmit={handleCreate}
                  placeholder="e.g. Sunday Warriors"
                  autoFocus
                />
                <PasscodeField
                  label="Passcode"
                  value={passcode}
                  onChange={setPasscode}
                  onSubmit={handleCreate}
                  show={showPass}
                  onToggle={() => setShowPass((v) => !v)}
                  placeholder="Min. 4 characters"
                />
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40 block mb-1.5">
                    Confirm Passcode
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="••••••••"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="mt-4 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/30 text-xs flex items-start gap-2">
                <Users size={12} className="mt-0.5 shrink-0 text-gold-400/60" />
                <span>Share the group name &amp; passcode with teammates so they can sign in on their devices.</span>
              </div>

              {displayError && (
                <div className="mt-4 p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-sm">
                  {displayError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="btn-primary w-full mt-6 rounded-2xl py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSaving
                  ? <span className="w-4 h-4 border-2 border-ink-950/40 border-t-ink-950 rounded-full animate-spin" />
                  : <Plus size={18} />}
                {isSaving ? 'Creating…' : 'Create Group'}
              </button>
            </>
          )}

          {/* ── Reset Passcode ── */}
          {mode === 'reset' && (
            <>
              <div className="flex items-center gap-2 mb-7">
                <button onClick={() => switchMode('signin')} className="text-white/30 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Reset Passcode</h2>
                  <p className="text-white/40 text-sm mt-0.5">You must know the current passcode to reset</p>
                </div>
              </div>

              {resetSuccess ? (
                <div className="flex flex-col items-center py-8 gap-3 animate-scale-in">
                  <CheckCircle size={48} className="text-jade-400" />
                  <p className="text-white font-semibold">Passcode updated!</p>
                  <p className="text-white/40 text-sm">Redirecting to sign in…</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <TextField
                      label="Group Name"
                      value={groupName}
                      onChange={setGroupName}
                      onSubmit={handleReset}
                      placeholder="Your group name"
                      autoFocus
                    />
                    <PasscodeField
                      label="Current Passcode"
                      value={curPasscode}
                      onChange={setCurPasscode}
                      onSubmit={handleReset}
                      show={showPass}
                      onToggle={() => setShowPass((v) => !v)}
                    />
                    <div className="border-t border-white/10 pt-4 space-y-4">
                      <PasscodeField
                        label="New Passcode"
                        value={newPasscode}
                        onChange={setNewPasscode}
                        onSubmit={handleReset}
                        show={showNewPass}
                        onToggle={() => setShowNewPass((v) => !v)}
                        placeholder="Min. 4 characters"
                      />
                      <div>
                        <label className="text-[11px] font-semibold uppercase tracking-widest text-white/40 block mb-1.5">
                          Confirm New Passcode
                        </label>
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={confirmPass}
                          onChange={(e) => setConfirmPass(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                          placeholder="••••••••"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>

                  {displayError && (
                    <div className="mt-4 p-3 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 text-sm">
                      {displayError}
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    disabled={isSaving}
                    className="btn-primary w-full mt-6 rounded-2xl py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSaving
                      ? <span className="w-4 h-4 border-2 border-ink-950/40 border-t-ink-950 rounded-full animate-spin" />
                      : <Lock size={18} />}
                    {isSaving ? 'Updating…' : 'Update Passcode'}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <p className="text-center text-white/15 text-xs mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          BreakArena · Call Break Scoreboard
        </p>
      </div>
    </div>
  );
}
