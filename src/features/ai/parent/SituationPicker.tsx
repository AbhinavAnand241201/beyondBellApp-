import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Pill, Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { CATEGORY_ICON, CATEGORY_ORDER, SENSITIVITY_TONE, SITUATIONS, type SituationCategory } from './types';

/**
 * Empty-state situation selector (§2.3 "category visual grid"). Grouped by
 * category; each situation shows its sensitivity. Selecting one advances to the
 * form. The orchestrator surfaces the Very-High advisory before generating.
 */
export function SituationPicker({ onSelect }: { onSelect: (situationId: string) => void }) {
  return (
    <View style={{ gap: spacing.lg }}>
      {CATEGORY_ORDER.map((cat) => (
        <CategoryBlock key={cat} category={cat} onSelect={onSelect} />
      ))}
    </View>
  );
}

function CategoryBlock({ category, onSelect }: { category: SituationCategory; onSelect: (id: string) => void }) {
  const items = SITUATIONS.filter((s) => s.category === category);
  if (items.length === 0) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.catHeader}>
        <Ionicons name={CATEGORY_ICON[category] as keyof typeof Ionicons.glyphMap} size={16} color={colors.amberDark} />
        <Text variant="label">{category}</Text>
      </View>
      {items.map((s) => (
        <Pressable key={s.id} onPress={() => onSelect(s.id)}>
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyMedium">{s.label}</Text>
                <Text variant="caption" color={colors.muted} numberOfLines={1}>
                  {s.toneGuidance}
                </Text>
              </View>
              <Pill label={s.sensitivity} tone={SENSITIVITY_TONE[s.sensitivity]} />
              <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
            </View>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
