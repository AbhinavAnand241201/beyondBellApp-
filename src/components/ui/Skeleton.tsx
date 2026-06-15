import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';

import { Card } from './Card';
import { colors, spacing } from '@/theme/tokens';

/** A single shimmering placeholder block. */
export function SkeletonBlock({ width, height = 14, style }: { width?: number | string; height?: number; style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width: (width as ViewStyle['width']) ?? '100%', height, borderRadius: 6, backgroundColor: colors.border, opacity }, style]} />;
}

/** A list of skeleton cards — drop into any list screen while data loads (§2.142). */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={{ padding: spacing.lg, gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <SkeletonBlock width={40} height={40} style={{ borderRadius: 20 }} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBlock width="50%" />
              <SkeletonBlock width="30%" height={10} />
            </View>
          </View>
          <SkeletonBlock height={12} style={{ marginTop: spacing.md }} />
          <SkeletonBlock width="80%" height={12} style={{ marginTop: 6 }} />
        </Card>
      ))}
    </View>
  );
}
