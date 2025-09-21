import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isLocalMode } = useAuth();
  const [useLocalMode, setUseLocalMode] = useState(isLocalMode);
  
  // Initialize local auth
  const localAuth = useLocalAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (useLocalMode) {
        // Use local authentication
        if (isLogin) {
          const { error } = await localAuth.signIn(email, password);
          if (error) throw error;
          onAuthSuccess();
        } else {
          const { error } = await localAuth.signUp(email, password, fullName);
          if (error) throw error;
          onAuthSuccess();
        }
      } else {
        // Use Supabase authentication
        try {
          if (isLogin) {
            const { error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (error) throw error;
            onAuthSuccess();
          } else {
            const { error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: 'http://localhost:8082/',
                data: {
                  full_name: fullName,
                },
              },
            });
            
            if (error) throw error;
            
            setError('Please check your email to confirm your account.');
          }
        } catch (supabaseError: Error | unknown) {
          console.error('Supabase authentication error:', supabaseError);
          
          // If Supabase fails with a network error, suggest local mode
          if (supabaseError instanceof Error && 
              (supabaseError.message?.includes('fetch') || 
               supabaseError.message?.includes('network'))) {
            setError('Network connection error with Supabase. Try using Local Mode for offline development.');
          } else {
            throw supabaseError;
          }
        }
      }
    } catch (error: Error | unknown) {
      console.error('Authentication error:', error);
      if (error instanceof Error && error.message) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          setError('Network connection error. Please check your internet connection and try again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unknown error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Sign in to generate amazing websites' 
              : 'Join thousands creating websites with AI'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="local-mode"
                checked={useLocalMode}
                onCheckedChange={setUseLocalMode}
              />
              <Label htmlFor="local-mode" className="text-sm">
                Use Local Mode {useLocalMode && "(Data stored in browser only)"}
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};