export type SubscribeResult = 'ok' | 'invalid' | 'error';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Inserts an address into `email_signups` (insert-only for the anon key, see supabase/schema.sql). A duplicate counts as success. */
export async function subscribeEmail(raw: string, source = 'landing'): Promise<SubscribeResult> {
  const email = raw.trim();
  if (email.length < 5 || email.length > 254 || !EMAIL_RE.test(email)) return 'invalid';

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return 'error';

  try {
    const res = await fetch(`${url}/rest/v1/email_signups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ email, source }),
    });
    return res.ok || res.status === 409 ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}
