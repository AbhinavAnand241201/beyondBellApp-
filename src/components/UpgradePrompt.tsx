import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Text } from '@/components/ui';
import type { Tier } from '@/types/db';
import { TIER_LABEL } from '@/lib/tier';
import { colors, spacing } from '@/theme/tokens';

/**
 * Friendly tier-gate notice. RLS is the real enforcement (§19); this just
 * explains why an action is unavailable and which tier unlocks it.
 */
export function UpgradePrompt({ requiredTier, feature }: { requiredTier: Tier; feature: string }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.amberDark} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="label">Upgrade to {TIER_LABEL[requiredTier]}</Text>
          <Text variant="body" color={colors.muted}>
            {feature} is available on the {TIER_LABEL[requiredTier]} plan and above.
          </Text>
        </View>
      </View>
    </Card>
  );
}
