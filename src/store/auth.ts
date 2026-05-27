import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminUser, AuthSession } from '@/types';
import { getSession, signOut as supabaseSignOut, getCurrentUser } from '@/lib/auth';

interface AuthStore {
  user: AdminUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  setUser: (user: AdminUser | null) => void;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          // First check if we have a persisted session
          const persistedSession = JSON.parse(
            typeof window !== 'undefined' ? localStorage.getItem('auth-storage') || '{}' : '{}'
          );
          
          if (persistedSession.state?.session && persistedSession.state?.user) {
            set({ 
              session: persistedSession.state.session, 
              user: persistedSession.state.user, 
              isAuthenticated: true, 
              error: null 
            });
            set({ isLoading: false });
            return;
          }

          // If no persisted session, try to get from Supabase
          const session = await getSession();
          if (session) {
            set({ session, user: session.user, isAuthenticated: true, error: null });
          } else {
            set({ session: null, user: null, isAuthenticated: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Auth initialization failed',
            session: null,
            user: null,
            isAuthenticated: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshUser: async () => {
        try {
          const user = await getCurrentUser();
          set({ user });
        } catch (error) {
          console.error('Error refreshing user:', error);
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await supabaseSignOut();
          set({ user: null, session: null, isAuthenticated: false, error: null });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Logout failed' });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
