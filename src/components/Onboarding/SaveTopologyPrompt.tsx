import React, { useEffect, useRef, useState } from 'react';
import { Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { telemetry } from '../../utils/telemetry';

const DISMISS_KEY = 'graphflow_save_prompt_dismissed_v1';
const MIN_SESSION_MS = 90_000;
const MIN_EDITS = 2;
const EDIT_EVENTS = new Set(['Node Created', 'Node Removed', 'Architecture Imported']);

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // Storage can be blocked; the prompt then only hides for this session.
  }
}

interface SaveTopologyPromptProps {
  onOpenAuth: () => void;
}

/**
 * One-time, dismissible offer shown after the visitor has actually used the studio
 * (time on canvas plus real edits). Sign-up is asked for only once there is something worth saving.
 */
export const SaveTopologyPrompt: React.FC<SaveTopologyPromptProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(readDismissed);
  const editsRef = useRef(0);
  const readyRef = useRef(false);
  const shownRef = useRef(false);

  useEffect(() => {
    if (user || dismissed) return;

    const maybeShow = () => {
      if (shownRef.current || !readyRef.current || editsRef.current < MIN_EDITS) return;
      shownRef.current = true;
      setVisible(true);
      telemetry.track('Signup Prompt Shown', { edits: editsRef.current });
    };

    const timer = window.setTimeout(() => {
      readyRef.current = true;
      maybeShow();
    }, MIN_SESSION_MS);

    const unsubscribe = telemetry.subscribe(event => {
      if (!EDIT_EVENTS.has(event.name)) return;
      editsRef.current += 1;
      maybeShow();
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [user, dismissed]);

  if (!visible || user || dismissed) return null;

  const handleDismiss = () => {
    writeDismissed();
    setDismissed(true);
    setVisible(false);
    telemetry.track('Signup Prompt Dismissed');
  };

  const handleSave = () => {
    writeDismissed();
    setDismissed(true);
    setVisible(false);
    telemetry.track('Signup Prompt Clicked');
    onOpenAuth();
  };

  return (
    <aside
      role="complementary"
      aria-label="Save your topology"
      className="hidden md:block absolute left-4 bottom-4 z-30 w-72 rounded-xl border border-slate-700 bg-slate-950/95 p-3.5 shadow-xl"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="text-[13px] font-semibold text-slate-100 pr-5">Keep this topology</div>
      <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
        Your canvas lives only in this browser. Sign in with your email (free) to save it to your account and
        open it on any device.
      </p>
      <button
        type="button"
        onClick={handleSave}
        className="mt-2.5 w-full h-8 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[12px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
      >
        <Save className="w-3.5 h-3.5" />
        <span>Save it (free)</span>
      </button>
    </aside>
  );
};
