import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet, Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { BADGE_CATALOG } from './badges';

/** All 28 badges — earned in colour, unearned greyed with criteria (§2.88). */
export function BadgeGridModal({ visible, onClose, earned }: { visible: boolean; onClose: () => void; earned: Set<string> }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={`Badges (${earned.size}/${BADGE_CATALOG.length})`}>
      <ScrollView style={{ maxHeight: 460 }}>
        <View style={styles.grid}>
          {BADGE_CATALOG.map((b) => {
            const has = earned.has(b.slug);
            return (
              <View key={b.slug} style={styles.cell}>
                <View style={[styles.disc, { backgroundColor: has ? '#FCE8B8' : colors.canvas }]}>
                  <Ionicons name={b.icon as keyof typeof Ionicons.glyphMap} size={22} color={has ? colors.amberDark : colors.mutedLight} />
                </View>
                <Text variant="caption" color={has ? colors.ink : colors.mutedLight} style={{ textAlign: 'center' }} numberOfLines={2}>
                  {b.label}
                </Text>
                {!has ? (
                  <Text variant="caption" color={colors.mutedLight} style={{ textAlign: 'center', fontSize: 10 }} numberOfLines={2}>
                    {b.criteria}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.lg },
  cell: { width: '30%', alignItems: 'center', gap: 4 },
  disc: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
