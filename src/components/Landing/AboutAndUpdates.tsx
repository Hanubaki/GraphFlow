import React, { useState } from 'react';
import { subscribeEmail } from '../../services/emailSignup';
import type { LegalTab } from '../Modals/LegalComplianceModal';

const GITHUB_URL = 'https://github.com/Hanubaki/GraphFlow';
const display = 'font-semibold tracking-[-0.035em] [font-stretch:112%] text-slate-50';

const UPDATES = [
  { date: 'Nov 11', text: 'Unknown addresses now return a real 404 page instead of the app shell.' },
  { date: 'Nov 11', text: 'Payment webhooks are retry-safe and map to the right plan.' },
  { date: 'Nov 9', text: 'Studio layout rebuilt for phones. Fit zooms to a readable size and panning is smoother.' },
];

interface Props {
  onOpenLegal?: (tab: LegalTab) => void;
}

export const AboutAndUpdates: React.FC<Props> = ({ onOpenLegal }) => {
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'invalid' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trap) {
      setState('ok'); // bots fill the hidden field; pretend it worked
      return;
    }
    setState('sending');
    setState(await subscribeEmail(email));
  };

  return (
    <section className="relative z-10 border-t border-slate-800/70">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-24 grid md:grid-cols-3 gap-12 md:gap-16">
        <div>
          <h2 className={`${display} text-2xl`}>Who's behind this</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
            Built by Berke Akdemir in Istanbul. Bugs and ideas go in{' '}
            <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noreferrer" className="text-slate-200 underline underline-offset-4 hover:text-white">
              GitHub issues
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className={`${display} text-2xl`}>What's new</h2>
          <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-400">
            {UPDATES.map(u => (
              <li key={u.text} className="flex gap-3">
                <span className="font-mono text-[13px] text-slate-500 shrink-0 w-12 pt-0.5">{u.date}</span>
                <span>{u.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={`${display} text-2xl`}>Release notes by email</h2>
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3" noValidate>
            <label htmlFor="release-email" className="sr-only">Email address</label>
            <input
              id="release-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-10 rounded-lg bg-slate-950 border border-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
            />
            <input
              type="text"
              name="website"
              value={trap}
              onChange={e => setTrap(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <button
              type="submit"
              disabled={state === 'sending' || state === 'ok'}
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-slate-50 hover:bg-white disabled:opacity-60 text-slate-950 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200"
            >
              {state === 'ok' ? 'Subscribed' : 'Subscribe'}
            </button>
            <p role="status" aria-live="polite" className="text-[13px] text-slate-400 min-h-[1.25rem]">
              {state === 'ok' && 'You are on the list.'}
              {state === 'invalid' && 'That does not look like an email address.'}
              {state === 'error' && 'Could not save that. Try again in a moment.'}
            </p>
          </form>
          <p className="text-[13px] text-slate-500">
            Release notes only. See the{' '}
            <button type="button" onClick={() => onOpenLegal?.('privacy')} className="underline underline-offset-4 hover:text-slate-300">
              Privacy Policy
            </button>
            .
          </p>
        </div>
      </div>
    </section>
  );
};
