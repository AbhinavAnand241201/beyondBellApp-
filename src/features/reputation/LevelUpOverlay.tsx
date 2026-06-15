import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Text } from '@/components/ui';
import { levelName } from './levels';
import { colors, radius, spacing } from '@/theme/tokens';

/** Full-screen level-up celebration (§2.89). Shown in-app when level increases. */
export function LevelUpOverlay({ level, onClose }: { level: number | null; onClose: () => void }) {
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (level == null) return;
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [level, scale]);

  if (level == null) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={styles.badge}>
            <Ionicons name="trophy" size={40} color={colors.ink} />
          </View>
          <Text variant="caption" color={colors.muted}>
            LEVEL UP
          </Text>
          <Text variant="h1" style={{ textAlign: 'center' }}>
            You’ve reached Level {level}
          </Text>
          <Text variant="h3" color={colors.amberDark}>
            {levelName(level)}
          </Text>
          <Button title="Keep going" onPress={onClose} style={{ marginTop: spacing.md }} />
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.xs, width: '100%', maxWidth: 340 },
  badge: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
});
