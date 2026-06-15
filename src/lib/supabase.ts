import './polyfills';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';

/**
 * The single Supabase client for the mobile app — the RN analogue of the web's
 * browser client (`supabase/lib/client.ts`). Same project URL + anon key, so
 * every RLS policy that guards the web app guards mobile automatically (§6).
 *
 * Differences from web:
 *  - Session is persisted via AsyncStorage (web uses cookies). This is what the
 *    onboarding guide calls "the SDK's AsyncStorage adapter" (§7).
 *  - `detectSessionInUrl: false` — there is no browser URL to parse; OAuth comes
 *    back through a deep link we exchange manually (Task 6).
 *
 * Unlike the web server client, there is no per-request re-creation: a mobile app
 * is a single long-lived client, so module-scope instantiation is correct here.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE is required for the mobile OAuth code-exchange flow (see lib/auth.ts).
    flowType: 'pkce',
  },
});

// Per Supabase's RN guidance: only auto-refresh the JWT while the app is in the
// foreground. Refreshing in the background wastes battery and can race the OS.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
