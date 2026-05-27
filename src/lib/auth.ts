import { supabase } from '@/lib/supabase';
import { AdminUser, AuthSession } from '@/types';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message, session: null };
  }

  if (data.session) {
    return { session: data.session, error: null };
  }

  return { error: 'No session returned', session: null };
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  // Fetch admin user details from admin_users table
  let { data: adminUser, error: userError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  // If admin user doesn't exist, create one automatically
  if (userError && userError.code === 'PGRST116') {
    try {
      const { data: newAdmin, error: createError } = await supabase
        .from('admin_users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: 'Admin User',
            role: 'super_admin',
            status: 'active',
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('Error creating admin user:', createError);
        return null;
      }

      return newAdmin as AdminUser;
    } catch (e) {
      console.error('Error creating admin user:', e);
      return null;
    }
  }

  if (userError) {
    console.error('Error fetching admin user:', userError);
    return null;
  }

  return adminUser as AdminUser;
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      return null;
    }

    // Create a basic admin user from the session
    // In production, fetch from admin_users table
    const adminUser: AdminUser = {
      id: data.session.user.id,
      email: data.session.user.email || '',
      name: 'Admin',
      role: 'super_admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      user: adminUser,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();

  if (error || !data.session) {
    return { error: error?.message || 'Failed to refresh session', session: null };
  }

  return { session: data.session, error: null };
}

export async function resetPassword(email: string) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });
}

export async function updatePassword(newPassword: string) {
  return await supabase.auth.updateUser({ password: newPassword });
}

export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
