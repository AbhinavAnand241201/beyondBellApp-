import type { Tier } from '@/types/db';

/**
 * Plan catalog (checklist 2.133–2.137). Prices are display-only; the real
 * checkout runs through the payment gateway (Razorpay/EasyPay) server-side. The
 * tier source of truth stays the DB (a webhook flips `users.tier`).
 *
 * Founding Member: first 500 signups get Standard locked at ₹1,999/yr for life.
 */
export interface PlanFeature {
  text: string;
}

export interface Plan {
  tier: Exclude<Tier, 'free'>;
  name: string;
  monthly: number; // ₹
  annual: number; // ₹ / year
  foundingAnnual?: number; // ₹ / year for founding members
  highlight: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    tier: 'standard',
    name: 'Standard',
    monthly: 199,
    annual: 1999,
    foundingAnnual: 1999,
    highlight: 'For active teachers',
    features: [
      'Unlimited Lesson, Assessment & Parent tools',
      'Event Architect',
      'Post links & unlimited community posting',
      '5 direct messages / day',
      'Upload to the Resource Library',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    monthly: 299,
    annual: 2999,
    highlight: 'For school leaders',
    features: [
      'Everything in Standard',
      'Principal Desk (policy advisor)',
      'Compliance Generator (SQAA & policies)',
      'Leadership Lounge access',
      'Unlimited direct messages',
      '2× Circle Points',
    ],
  },
];

export function annualSavingsPct(plan: Plan): number {
  const monthlyYear = plan.monthly * 12;
  if (monthlyYear <= 0) return 0;
  return Math.round(((monthlyYear - plan.annual) / monthlyYear) * 100);
}
