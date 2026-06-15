import { Pill } from '@/components/ui';
import type { Tier } from '@/types/db';

const LABEL: Record<Tier, { label: string; tone: 'neutral' | 'amber' | 'success' }> = {
  free: { label: 'Free', tone: 'neutral' },
  standard: { label: 'Standard', tone: 'success' },
  pro: { label: 'Pro', tone: 'amber' },
};

export function TierBadge({ tier }: { tier: Tier }) {
  const t = LABEL[tier];
  return <Pill label={t.label} tone={t.tone} />;
}
