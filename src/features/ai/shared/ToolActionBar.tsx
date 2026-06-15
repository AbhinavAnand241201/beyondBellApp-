import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

export interface ToolAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  active?: boolean;
}

/**
 * Generic sticky bottom action bar for AI tool result screens. Pass any number of
 * actions; the bar lays them out evenly. Shared across all tools — configure via
 * the `actions` array, don't fork.
 */
export function ToolActionBar({ actions }: { actions: ToolAction[] }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.wrap}>
      <View style={styles.bar}>
        {actions.map((a) => {
          const color = a.primary ? colors.ink : a.active ? colors.amberDark : colors.muted;
          return (
            <Pressable
              key={a.id}
              onPress={a.onPress}
              style={[styles.action, a.primary && styles.primary]}
              accessibilityRole="button"
            >
              <Ionicons name={a.icon} size={20} color={color} />
              <Text variant="caption" color={color} style={a.primary ? { fontWeight: '700' } : undefined}>
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  bar: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  action: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: spacing.sm, borderRadius: 10 },
  primary: { backgroundColor: '#FCE8B8' },
});
