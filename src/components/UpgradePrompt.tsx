import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Text } from '@/components/ui';
import type { Tier } from '@/types/db';
import { TIER_LABEL } from '@/lib/tier';
import { colors, spacing } from '@/theme/tokens';

/**
 * Friendly tier-gate notice. RLS is the real enforcement (§19); this just
 * explains why an action is unavailable and which tier unlocks it.
 * Presentational only — no CTA/navigation logic.
 */
export function UpgradePrompt({ requiredTier, feature }: { requiredTier: Tier; feature: string }) {
  return (
    <Card style={styles.card}>
      <View style={styles.lockCircle}>
        <Ionicons name="lock-closed" size={26} color={colors.amberDark} />
      </View>
      <Text variant="h3" style={{ textAlign: 'center', marginTop: spacing.md }}>
        Upgrade to {TIER_LABEL[requiredTier]}
      </Text>
      <Text variant="body" color={colors.muted} style={styles.subtext}>
        {feature} is available on the {TIER_LABEL[requiredTier]} plan and above.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderRadius: 16, paddingVertical: spacing.xl },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtext: { textAlign: 'center', marginTop: spacing.xs, lineHeight: 22, paddingHorizontal: spacing.lg },
});
