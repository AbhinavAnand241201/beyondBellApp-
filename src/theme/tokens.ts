/**
 * Design tokens — the RN port of the web app's `bb-*` Tailwind tokens (§10).
 *
 * Brand rules carried over verbatim:
 *  - Amber (#F5A400) is used *sparingly*: CTAs, active nav, Morning Briefing card.
 *  - The Morning Briefing card is ALWAYS amber bg + black text (never white) — hard rule.
 *  - Cards: 12px radius, soft shadow. Headings Poppins, body Inter.
 */

export const colors = {
  amber: '#F5A400', // primary — CTAs, active nav, morning-briefing bg
  amberDark: '#D98E00',
  navy: '#1A2D4E', // brand navy (headers, accents) — brief §2.5
  ink: '#111111', // near-black text
  canvas: '#F7F7F7', // grey app background
  surface: '#FFFFFF', // card / sheet background
  border: '#E8E4DC', // card borders
  success: '#22A06B',
  danger: '#D92D20',
  muted: '#6B6B6B', // secondary text
  mutedLight: '#9A9A9A',
  overlay: 'rgba(17,17,17,0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12, // standard card radius
  lg: 16,
  pill: 999,
} as const;

export const fonts = {
  // Loaded in app/_layout.tsx via expo-font (Task 5). Fall back to system until then.
  heading: 'Poppins_600SemiBold',
  headingBold: 'Poppins_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;

export const shadow = {
  // Soft card shadow (iOS) + elevation (Android).
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;

export type ColorName = keyof typeof colors;
