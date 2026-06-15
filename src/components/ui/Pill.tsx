import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

type Tone = 'neutral' | 'amber' | 'success' | 'danger';

const TONE: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#EFEBE3', fg: colors.muted },
  amber: { bg: '#FCE8B8', fg: '#7A5A00' },
  success: { bg: '#D8F2E6', fg: '#0F6B47' },
  danger: { bg: '#FBE3E1', fg: '#8B231B' },
};

export interface PillProps {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
}

/** Small rounded tag — tier badges, post types, filters. */
export function Pill({ label, tone = 'neutral', style }: PillProps) {
  const t = TONE[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      <Text variant="caption" color={t.fg} style={styles.text}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { fontWeight: '600' },
});
