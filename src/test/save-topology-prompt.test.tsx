import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let mockUser: unknown = null;
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));

import { SaveTopologyPrompt } from '../components/Onboarding/SaveTopologyPrompt';
import { telemetry } from '../utils/telemetry';

describe('SaveTopologyPrompt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockUser = null;
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays hidden until the visitor has spent time and made edits', () => {
    render(<SaveTopologyPrompt onOpenAuth={() => {}} />);
    act(() => {
      telemetry.track('Node Created', {});
      telemetry.track('Node Created', {});
    });
    expect(screen.queryByText('Keep this topology')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(91_000);
    });
    expect(screen.getByText('Keep this topology')).toBeTruthy();
  });

  it('does not show without enough edits', () => {
    render(<SaveTopologyPrompt onOpenAuth={() => {}} />);
    act(() => {
      telemetry.track('Node Created', {});
      vi.advanceTimersByTime(120_000);
    });
    expect(screen.queryByText('Keep this topology')).toBeNull();
  });

  it('never shows to signed-in users', () => {
    mockUser = { id: 'u1' };
    render(<SaveTopologyPrompt onOpenAuth={() => {}} />);
    act(() => {
      telemetry.track('Node Created', {});
      telemetry.track('Node Created', {});
      vi.advanceTimersByTime(120_000);
    });
    expect(screen.queryByText('Keep this topology')).toBeNull();
  });

  it('opens auth once and stays dismissed afterwards', () => {
    const onOpenAuth = vi.fn();
    const { rerender } = render(<SaveTopologyPrompt onOpenAuth={onOpenAuth} />);
    act(() => {
      telemetry.track('Node Created', {});
      telemetry.track('Node Removed', {});
      vi.advanceTimersByTime(91_000);
    });
    act(() => {
      screen.getByText('Save it (free)').click();
    });
    expect(onOpenAuth).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Keep this topology')).toBeNull();

    rerender(<SaveTopologyPrompt onOpenAuth={onOpenAuth} />);
    expect(screen.queryByText('Keep this topology')).toBeNull();
    expect(window.localStorage.getItem('graphflow_save_prompt_dismissed_v1')).toBe('1');
  });
});
