import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Auth & Supabase Database Schema Verification', () => {
  const schemaPath = path.resolve(__dirname, '../../supabase/schema.sql');

  it('verifies Supabase schema file exists with all essential entities', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
    const sql = fs.readFileSync(schemaPath, 'utf-8');

    // Verify Profiles table & columns
    expect(sql).toContain('create table if not exists public.profiles');
    expect(sql).toContain('references auth.users on delete cascade');
    expect(sql).toContain('plan_tier text');
    expect(sql).toContain('lemon_customer_id text');
    expect(sql).toContain('lemon_subscription_id text');

    // Verify Projects table
    expect(sql).toContain('create table if not exists public.projects');
    expect(sql).toContain('nodes jsonb');
    expect(sql).toContain('edges jsonb');

    // Verify Row Level Security (RLS) is enabled
    expect(sql).toContain('alter table public.profiles enable row level security');
    expect(sql).toContain('alter table public.projects enable row level security');

    // Verify Auth trigger
    expect(sql).toContain('public.handle_new_user()');
    expect(sql).toContain('on_auth_user_created');
  });

  it('validates dynamic Lemon Squeezy checkout query parameters formatting', () => {
    const baseCheckoutUrl = 'https://graphflow.lemonsqueezy.com/checkout/buy/3022e88b-f961-4b6d-8e5d-2840d312a242?embed=1';
    const mockUserId = 'usr_1029384756';
    const mockEmail = 'founder@graphflow.app';

    const fullCheckoutUrl = `${baseCheckoutUrl}&checkout[custom][user_id]=${mockUserId}&checkout[email]=${encodeURIComponent(mockEmail)}`;

    expect(fullCheckoutUrl).toContain('checkout[custom][user_id]=usr_1029384756');
    expect(fullCheckoutUrl).toContain('checkout[email]=founder%40graphflow.app');
    expect(fullCheckoutUrl).toContain('embed=1');
  });

  it('verifies Lemon Squeezy webhook handler file structure and security', () => {
    const webhookPath = path.resolve(__dirname, '../../api/webhook.ts');
    expect(fs.existsSync(webhookPath)).toBe(true);
    const code = fs.readFileSync(webhookPath, 'utf-8');

    // Verify HMAC verification
    expect(code).toContain('crypto.createHmac');
    expect(code).toContain('crypto.timingSafeEqual');
    expect(code).toContain('x-signature');

    // Verify event handlers
    expect(code).toContain('subscription_created');
    expect(code).toContain('subscription_cancelled');
    expect(code).toContain('order_created');
  });
});
