import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
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
  /** Icon in the pulsing mark. Defaults to "flash". */
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Shared full-screen "AI is thinking…" generation state used by every AI tool.
 * The micro-steps advance on a timer (purely cosmetic — the real call runs in
 * parallel). Configure per-tool via props; do NOT fork this component.
 *
 * Reused by: Tool 01 Lesson Architect, Tool 02 Assessment Builder, …
 */
export function GeneratingOverlay({ visible, title, subtitle, steps, icon = 'flash' }: GeneratingOverlayProps) {
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
        Animated.timing(pulse, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const dim = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });
  // Progress reflects how far through the cosmetic steps we are.
  const progress = steps.length > 1 ? (active + 0.5) / steps.length : 0.5;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.screen}>
        <View style={styles.center}>
          <Animated.View style={[styles.mark, { transform: [{ scale }] }]}>
            <Ionicons name={icon} size={28} color={colors.ink} />
          </Animated.View>

          <Text variant="h2" style={{ textAlign: 'center', marginTop: spacing.xl }}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" color={colors.muted} style={{ textAlign: 'center', marginTop: spacing.xs }}>
              {subtitle}
            </Text>
          ) : null}

          {/* Progress bar with rounded caps */}
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.min(100, Math.max(8, progress * 100))}%` }]} />
          </View>

          {/* Step checklist */}
          <View style={styles.steps}>
            {steps.map((label, i) => {
              const done = i < active;
              const current = i === active;
              if (current) {
                return (
                  <View key={label} style={styles.activeStep}>
                    <View style={styles.activeDot} />
                    <Animated.Text style={[styles.activeText, { opacity: dim }]} numberOfLines={2}>
                      {label}
                    </Animated.Text>
                    <Text style={styles.generating}>GENERATING…</Text>
                  </View>
                );
              }
              return (
                <View key={label} style={styles.step}>
                  <Ionicons
                    name={done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={done ? colors.success : colors.border}
                  />
                  <Text variant="body" color={done ? colors.ink : colors.mutedLight} style={{ flex: 1 }} numberOfLines={2}>
                    {label}
                  </Text>
                  {done ? <Text style={styles.done}>DONE</Text> : null}
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
  screen: { flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  center: { width: '100%', maxWidth: 420, alignItems: 'center' },
  mark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.amber,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginTop: spacing.xl,
  },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.amber },
  steps: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.xl + spacing.sm },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  done: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.success, letterSpacing: 0.5 },
  activeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.amber,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  activeDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: colors.amber },
  activeText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.amberDark },
  generating: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: colors.amberDark, letterSpacing: 0.5 },
});
