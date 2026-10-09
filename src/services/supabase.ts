import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { UserProfile, CloudProject } from '../types/auth';
import { GraphNode, GraphEdge } from '../types/graph';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Fetch profile for a user from public.profiles table
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If profile does not exist yet (e.g. trigger didn't fire), create default profile
      if (error.code === 'PGRST116') {
        const { data: userAuth } = await supabase.auth.getUser();
        const email = userAuth?.user?.email || '';
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, email, plan_tier: 'free' })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile fallback:', insertError);
          return null;
        }
        return newProfile as UserProfile;
      }
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (err) {
    console.error('Profile query failed:', err);
    return null;
  }
}

/**
 * Sign in using OAuth (GitHub / Google)
 */
export async function signInWithOAuth(provider: 'github' | 'google'): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.') };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  });

  return { error };
}

/**
 * Sign in with email magic link
 */
export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  return { error };
}

/**
 * Sign in with Email and Password
 */
export async function signInWithPassword(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  if (!supabase) {
    return { user: null, error: new Error('Supabase is not configured.') };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data?.user || null, error };
}

/**
 * Sign up with Email and Password
 */
export async function signUpWithPassword(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  if (!supabase) {
    return { user: null, error: new Error('Supabase is not configured.') };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  return { user: data?.user || null, error };
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: Error | null }> {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Fetch cloud-saved projects for the current user
 */
export async function fetchCloudProjects(userId: string): Promise<CloudProject[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to load cloud projects:', error);
      return [];
    }

    return (data as CloudProject[]) || [];
  } catch (err) {
    console.error('Cloud projects query exception:', err);
    return [];
  }
}

/**
 * Save or update project in Supabase cloud
 */
export async function saveCloudProject(
  userId: string,
  title: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  description = '',
  existingId?: string
): Promise<CloudProject | null> {
  if (!supabase) return null;

  try {
    const payload = {
      user_id: userId,
      title: title.trim() || 'Untitled Architecture',
      description,
      nodes,
      edges,
      updated_at: new Date().toISOString(),
    };

    if (existingId) {
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', existingId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as CloudProject;
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as CloudProject;
    }
  } catch (err) {
    console.error('Failed to save project to Supabase:', err);
    return null;
  }
}

/**
 * Delete a cloud-saved project
 */
export async function deleteCloudProject(projectId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete cloud project:', err);
    return false;
  }
}
