import { View, StyleSheet } from 'react-native';

import { colors, radius } from '@/theme/tokens';

/** Thin step progress indicator (0..1). */
export function ProgressBar({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.amber, borderRadius: radius.pill },
});
