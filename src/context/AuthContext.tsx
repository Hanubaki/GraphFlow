import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { UserProfile, PlanTier } from '../types/auth';
import {
  supabase,
  isSupabaseConfigured,
  getUserProfile,
  signInWithOAuth as supabaseOAuth,
  signInWithMagicLink as supabaseMagicLink,
  signInWithPassword as supabaseSignInPassword,
  signUpWithPassword as supabaseSignUpPassword,
  signOut as supabaseSignOut,
} from '../services/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  planTier: PlanTier;
  isPro: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setDevPlanTierOverride: (tier: PlanTier | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devTierOverride, setDevTierOverride] = useState<PlanTier | null>(() => {
    try {
      const stored = localStorage.getItem('graphflow_dev_plan_override');
      return (stored as PlanTier) || null;
    } catch {
      return null;
    }
  });

  const loadUserProfile = useCallback(async (currentUserId: string, email = '') => {
    const prof = await getUserProfile(currentUserId);
    if (prof) {
      setProfile(prof);
    } else {
      setProfile({
        id: currentUserId,
        email,
        plan_tier: 'free',
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await loadUserProfile(user.id, user.email || '');
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        loadUserProfile(currentUser.id, currentUser.email || '').finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser.id, currentUser.email || '');
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const setDevPlanTierOverride = useCallback((tier: PlanTier | null) => {
    setDevTierOverride(tier);
    if (tier) {
      localStorage.setItem('graphflow_dev_plan_override', tier);
    } else {
      localStorage.removeItem('graphflow_dev_plan_override');
    }
  }, []);

  const activePlanTier: PlanTier = devTierOverride || profile?.plan_tier || 'free';
  const isPro = activePlanTier === 'pro' || activePlanTier === 'team';

  const signInWithOAuth = useCallback(async (provider: 'github' | 'google') => {
    return await supabaseOAuth(provider);
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    return await supabaseMagicLink(email);
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabaseSignInPassword(email, password);
    return { error };
  }, []);

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabaseSignUpPassword(email, password);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabaseSignOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        planTier: activePlanTier,
        isPro,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signInWithOAuth,
        signInWithMagicLink,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        refreshProfile,
        setDevPlanTierOverride,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
