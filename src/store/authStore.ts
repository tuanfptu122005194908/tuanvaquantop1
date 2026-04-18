import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  avatar_url: string | null;
  phone: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isBanned: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      const profile = data as UserProfile;
      set({ profile });
      return profile;
    }
    // If no profile row exists yet, try to create one from auth metadata
    if (error && (error.code === 'PGRST116' || error.code === '406')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user';
        const email = user.email || '';
        const { data: newProfile } = await supabase
          .from('users')
          .insert({ id: userId, username, email })
          .select('*')
          .single();
        if (newProfile) {
          const profile = newProfile as UserProfile;
          set({ profile });
          return profile;
        }
      }
    }
    return null;
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },
  isAdmin: () => get().profile?.role === 'admin',
  isBanned: () => get().profile?.status === 'banned',
}));
