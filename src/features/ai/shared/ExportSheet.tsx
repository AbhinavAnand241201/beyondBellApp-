import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';

export type ExportFormat = 'clipboard' | 'pdf' | 'word';

export interface ExportSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (format: ExportFormat) => void;
}

const OPTIONS: { format: ExportFormat; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  { format: 'pdf', icon: 'document-outline', title: 'PDF', subtitle: 'School-ready A4, share or print' },
  { format: 'word', icon: 'document-text-outline', title: 'Word (.docx)', subtitle: 'Editable — shares as text for now' },
  { format: 'clipboard', icon: 'copy-outline', title: 'Copy to clipboard', subtitle: 'Paste into WhatsApp, email, docs' },
];

/** Shared export-format picker (design §6). Clipboard & PDF run on-device. */
export function ExportSheet({ visible, onClose, onSelect }: ExportSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Export">
      <View style={{ gap: spacing.sm }}>
        {OPTIONS.map((o) => (
          <Pressable key={o.format} style={styles.row} onPress={() => onSelect(o.format)}>
            <View style={styles.icon}>
              <Ionicons name={o.icon} size={20} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="label">{o.title}</Text>
              <Text variant="caption" color={colors.muted}>
                {o.subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  icon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FCE8B8', alignItems: 'center', justifyContent: 'center' },
});
