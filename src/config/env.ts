/**
 * Centralised, validated access to the app's runtime configuration.
 *
 * Expo inlines any `EXPO_PUBLIC_*` variable into the JS bundle at build time, so
 * these are the mobile equivalent of the web app's `NEXT_PUBLIC_*` values. Per
 * §6 of the onboarding guide, the anon key is *designed* to be public — RLS is
 * what protects the data — so it is safe to ship in the bundle. We never embed
 * the service-role key.
 */

function read(name: string): string {
  // Direct property access (not dynamic) so Expo's build-time inlining works.
  switch (name) {
    case 'EXPO_PUBLIC_SUPABASE_URL':
      return process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
    case 'EXPO_PUBLIC_SUPABASE_ANON_KEY':
      return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
    case 'EXPO_PUBLIC_API_BASE_URL':
      return process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
    case 'EXPO_PUBLIC_SITE_URL':
      return process.env.EXPO_PUBLIC_SITE_URL ?? '';
    case 'EXPO_PUBLIC_RAZORPAY_KEY_ID':
      return process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ?? '';
    default:
      return '';
  }
}

const supabaseUrl = read('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = read('EXPO_PUBLIC_SUPABASE_ANON_KEY');

/**
 * True when real credentials are present. The placeholder `.env` ships with a
 * dummy URL/key so the app boots and compiles; screens can use this flag to show
 * a "connect a backend" notice instead of firing doomed network calls.
 */
export const isConfigured =
  supabaseUrl.length > 0 &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes('placeholder');

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  /** Deployed Next.js API or Supabase Edge Functions base. Empty → direct-Supabase fallbacks. */
  apiBaseUrl: read('EXPO_PUBLIC_API_BASE_URL'),
  /** OAuth/deep-link redirect base. Falls back to the app scheme. */
  siteUrl: read('EXPO_PUBLIC_SITE_URL'),
  /** Razorpay publishable key id for the checkout SDK (secret stays server-side). */
  razorpayKeyId: read('EXPO_PUBLIC_RAZORPAY_KEY_ID'),
  isConfigured,
} as const;
