import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';

export interface ToolAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  active?: boolean;
}

/**
 * Shared floating action bar for AI tool result screens — a white pill anchored
 * near the bottom with a high-elevation shadow, so it stays in thumb reach as
 * the user scrolls long output. Pass any number of actions; configure via the
 * `actions` array, don't fork. (Parent scroll views must reserve ~100px bottom
 * inset so content isn't hidden behind it.)
 */
export function ToolActionBar({ actions }: { actions: ToolAction[] }) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.pill}>
        {actions.map((a) => {
          const color = a.primary || a.active ? colors.ink : colors.muted;
          return (
            <Pressable
              key={a.id}
              onPress={a.onPress}
              style={[styles.action, a.primary && styles.primary, a.active && !a.primary && styles.activeAction]}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <Ionicons name={a.icon} size={20} color={color} />
              <Text variant="caption" color={color} style={a.primary || a.active ? { fontWeight: '700' } : undefined}>
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: spacing.xl, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  action: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 22 },
  primary: { backgroundColor: '#FCE8B8' },
  activeAction: { backgroundColor: colors.canvas },
});
