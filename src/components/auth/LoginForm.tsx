'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { usePlatformSettings } from '@/hooks/useQueries';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const { setUser, setSession, setLoading, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setFormError] = useState('');
  const { data: settings } = usePlatformSettings();
  const platformName = settings?.platform_name || 'Survey Admin';
  const platformInitials = useMemo(() => {
    return platformName
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [platformName]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');

    try {
      const { error, session } = await signInWithEmail(email, password);

      if (error) {
        setFormError(error);
        toast.error(error);
        return;
      }

      if (session) {
        setLoading(true);
        setUser(session.user as any);
        setSession({ user: session.user as any, access_token: session.access_token });
        toast.success('Login successful!');
        router.push('/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setFormError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
              <span className="text-sm font-bold text-white">{platformInitials || 'SA'}</span>
            </div>
            <h1 className="text-xl font-bold">{platformName}</h1>
          </div>

          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Demo credentials:</p>
            <p>Email: admin@askend.com</p>
            <p>Password: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
