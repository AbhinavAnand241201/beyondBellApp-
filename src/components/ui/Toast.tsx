import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, shadow, spacing } from '@/theme/tokens';
import { Text } from './Text';

export interface ToastProps {
  visible: boolean;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onHide: () => void;
  duration?: number;
}

/** Lightweight auto-dismissing toast pinned to the bottom. State-controlled. */
export function Toast({ visible, message, icon = 'checkmark-circle', onHide, duration = 2200 }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onHide, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onHide]);

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.wrap} edges={['bottom']} pointerEvents="none">
      <View style={styles.toast}>
        <Ionicons name={icon} size={18} color={colors.success} />
        <Text variant="bodyMedium" color="#FFFFFF" style={{ flex: 1 }}>
          {message}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: spacing.lg, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    maxWidth: '90%',
    ...shadow.card,
  },
});
