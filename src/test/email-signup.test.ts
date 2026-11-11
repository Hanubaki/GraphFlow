import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeEmail } from '../services/emailSignup';

describe('subscribeEmail', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('rejects malformed addresses without calling the network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await subscribeEmail('not-an-email')).toBe('invalid');
    expect(await subscribeEmail('a@b')).toBe('invalid');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts a trimmed address to the email_signups table', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    vi.stubGlobal('fetch', fetchMock);
    expect(await subscribeEmail('  dev@example.com ')).toBe('ok');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.supabase.co/rest/v1/email_signups');
    expect(JSON.parse(init.body)).toEqual({ email: 'dev@example.com', source: 'landing' });
  });

  it('treats a duplicate (409) as success and other failures as an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 409 }));
    expect(await subscribeEmail('dev@example.com')).toBe('ok');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    expect(await subscribeEmail('dev@example.com')).toBe('error');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await subscribeEmail('dev@example.com')).toBe('error');
  });
});
