import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';

export interface GeneratingOverlayProps {
  visible: boolean;
  /** Headline, e.g. "Lesson Architect is thinking…". */
  title: string;
  /** Sub-line, e.g. "Usually under 60 seconds". */
  subtitle?: string;
  /** Cosmetic micro-steps that advance on a timer while generation runs. */
  steps: string[];
  /** Icon in the pulsing mark. Defaults to "sparkles". */
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Shared full-screen "AI is thinking…" overlay used by every AI tool. The
 * micro-steps advance on a timer (purely cosmetic — the real call runs in
 * parallel). Configure per-tool via props; do NOT fork this component.
 *
 * Reused by: Tool 01 Lesson Architect, Tool 02 Assessment Builder, …
 */
export function GeneratingOverlay({ visible, title, subtitle, steps, icon = 'sparkles' }: GeneratingOverlayProps) {
  const [active, setActive] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setActive(0);
      return;
    }
    setActive(0);
    const interval = setInterval(() => {
      setActive((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 1300);
    return () => clearInterval(interval);
  }, [visible, steps.length]);

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Animated.View style={[styles.mark, { transform: [{ scale }] }]}>
            <Ionicons name={icon} size={26} color={colors.ink} />
          </Animated.View>
          <Text variant="h3" style={{ textAlign: 'center' }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
              {subtitle}
            </Text>
          ) : null}

          <View style={styles.steps}>
            {steps.map((label, i) => {
              const done = i < active;
              const current = i === active;
              return (
                <View key={label} style={styles.step}>
                  {done ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  ) : current ? (
                    <ActivityIndicator size="small" color={colors.amberDark} />
                  ) : (
                    <Ionicons name="ellipse-outline" size={20} color={colors.border} />
                  )}
                  <Text variant="body" color={done || current ? colors.ink : colors.mutedLight}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  steps: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
