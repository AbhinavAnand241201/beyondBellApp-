import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

type Tone = 'info' | 'warning' | 'danger';

const TONE: Record<Tone, { bg: string; border: string; fg: string }> = {
  info: { bg: '#EEF4FF', border: '#C9DBFF', fg: '#1D3C8B' },
  warning: { bg: '#FFF6E5', border: '#FFE0A3', fg: '#7A5A00' },
  danger: { bg: '#FBE3E1', border: '#F3B6B0', fg: '#8B231B' },
};

export interface BannerProps {
  title: string;
  message?: string;
  tone?: Tone;
}

/** Inline notice — used e.g. for the "connect a backend" placeholder state. */
export function Banner({ title, message, tone = 'info' }: BannerProps) {
  const t = TONE[tone];
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg, borderColor: t.border }]}>
      <Text variant="label" color={t.fg}>
        {title}
      </Text>
      {message ? (
        <Text variant="caption" color={t.fg} style={styles.msg}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  msg: { lineHeight: 18 },
});
