import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet, Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

/** Report reasons (§2.114). Reporting is anonymous to the poster. */
export const REPORT_REASONS = ['Off-topic', 'Misinformation', 'Spam', 'Harassment', 'Student privacy violation', 'Other'];

export function ReportSheet({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (reason: string) => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Report post">
      <Text variant="caption" color={colors.muted} style={{ marginBottom: spacing.sm }}>
        Your report is anonymous. Our team reviews every report.
      </Text>
      <View>
        {REPORT_REASONS.map((r) => (
          <Pressable key={r} style={styles.row} onPress={() => onSelect(r)}>
            <Text variant="body" style={{ flex: 1 }}>
              {r}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
