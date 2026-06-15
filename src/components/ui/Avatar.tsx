import { Image, StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme/tokens';
import { Text } from './Text';

export interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
}

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/** Circular avatar; falls back to initials on a tinted disc when no image. */
export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const dim = { width: size, height: size, borderRadius: size / 2 };
  if (uri) {
    return <Image source={{ uri }} style={[styles.img, dim]} />;
  }
  return (
    <View style={[styles.fallback, dim]}>
      <Text style={{ fontFamily: fonts.bodySemibold, fontSize: size * 0.4, color: colors.ink }}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: colors.border },
  fallback: {
    backgroundColor: '#FCE8B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
