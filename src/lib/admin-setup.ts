import { supabase } from '@/lib/supabase';

export async function createAdminAccount() {
  try {
    // First, try to sign up the admin user
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: 'admin@askend.com',
      password: 'admin123',
      options: {
        data: {
          role: 'admin',
        },
      },
    });

    if (signupError) {
      console.error('Signup error:', signupError);
      // If the user already exists, try to sign in instead
      if (signupError.message.includes('already registered')) {
        console.log('Admin account already exists');
        return;
      }
      throw signupError;
    }

    if (!signupData.user) {
      console.error('No user returned from signup');
      return;
    }

    const adminId = signupData.user.id;

    // Now create the admin user record in the admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .insert([
        {
          id: adminId,
          email: 'admin@askend.com',
          name: 'Admin User',
          role: 'super_admin',
          status: 'active',
        },
      ])
      .select()
      .single();

    if (adminError) {
      console.error('Error creating admin user:', adminError);
      throw adminError;
    }

    console.log('Admin account created successfully:', adminUser);
    return adminUser;
  } catch (error) {
    console.error('Failed to create admin account:', error);
    throw error;
  }
}

// Utility function to verify admin account exists
export async function checkAdminAccount() {
  try {
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', 'admin@askend.com')
      .single();

    if (error) {
      console.log('Admin account does not exist');
      return false;
    }

    console.log('Admin account exists:', adminUser);
    return true;
  } catch (error) {
    console.error('Error checking admin account:', error);
    return false;
  }
}
