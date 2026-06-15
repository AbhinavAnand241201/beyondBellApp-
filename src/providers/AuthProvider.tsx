import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import * as auth from '@/lib/auth';
import type { AuthResult } from '@/lib/auth';

/**
 * The mobile app needs an auth context because, unlike the web app, there are no
 * server components to read the user per-request (§10/§18.2). This provider owns
 * the Supabase session and exposes the auth operations to the whole tree.
 */
export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the persisted session has been restored from AsyncStorage. */
  initializing: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithPhone: (phone: string) => Promise<AuthResult>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /** Email verified? Unverified users can use AI tools but cannot post (§2.8). */
  emailVerified: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Restore any persisted session on launch.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setInitializing(false);
    });

    // 2. Keep state in sync with future auth events (refresh, sign-in, sign-out).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      initializing,
      signInWithEmail: auth.signInWithEmail,
      signUpWithEmail: auth.signUpWithEmail,
      signInWithGoogle: auth.signInWithGoogle,
      signInWithPhone: auth.signInWithPhone,
      verifyPhoneOtp: auth.verifyPhoneOtp,
      resetPassword: auth.resetPassword,
      updatePassword: auth.updatePassword,
      signOut: auth.signOut,
      // Phone-OTP users have a confirmed phone; email users need email_confirmed_at.
      emailVerified: !!(session?.user.email_confirmed_at || session?.user.phone_confirmed_at),
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
