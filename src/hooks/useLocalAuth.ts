import { useState, useEffect } from 'react';

interface LocalUser {
  id: string;
  email: string;
  fullName?: string;
}

interface LocalAuthState {
  user: LocalUser | null;
  isAuthenticated: boolean;
}

// Local storage keys
const LOCAL_AUTH_KEY = 'byte_to_biz_local_auth';
const LOCAL_USERS_KEY = 'byte_to_biz_local_users';

export const useLocalAuth = () => {
  const [authState, setAuthState] = useState<LocalAuthState>(() => {
    const storedAuth = localStorage.getItem(LOCAL_AUTH_KEY);
    return storedAuth ? JSON.parse(storedAuth) : { user: null, isAuthenticated: false };
  });

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(authState));
  }, [authState]);

  // Local sign up function
  const signUp = async (email: string, password: string, fullName?: string): Promise<{ error: Error | null }> => {
    try {
      // Check if user already exists
      const storedUsers = localStorage.getItem(LOCAL_USERS_KEY);
      const users: Record<string, { email: string; password: string; fullName?: string }> = 
        storedUsers ? JSON.parse(storedUsers) : {};
      
      if (users[email]) {
        return { error: new Error('User already exists') };
      }

      // Create new user
      const userId = `local_${Date.now()}`;
      users[email] = { email, password, fullName };
      
      // Store updated users
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      
      // Automatically sign in the new user
      setAuthState({
        user: { id: userId, email, fullName },
        isAuthenticated: true
      });
      
      return { error: null };
    } catch (error) {
      console.error('Local sign up error:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error during sign up') };
    }
  };

  // Local sign in function
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      // Get stored users
      const storedUsers = localStorage.getItem(LOCAL_USERS_KEY);
      const users: Record<string, { email: string; password: string; fullName?: string }> = 
        storedUsers ? JSON.parse(storedUsers) : {};
      
      // Check if user exists and password matches
      const user = users[email];
      if (!user) {
        return { error: new Error('User not found') };
      }
      
      if (user.password !== password) {
        return { error: new Error('Incorrect password') };
      }
      
      // Sign in the user
      setAuthState({
        user: { id: `local_${Date.now()}`, email, fullName: user.fullName },
        isAuthenticated: true
      });
      
      return { error: null };
    } catch (error) {
      console.error('Local sign in error:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error during sign in') };
    }
  };

  // Sign out function
  const signOut = () => {
    setAuthState({ user: null, isAuthenticated: false });
  };

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    signUp,
    signIn,
    signOut
  };
};
