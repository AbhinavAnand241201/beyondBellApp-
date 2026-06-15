import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen, Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

/** Lightweight placeholder for tab screens whose feature lands in a later task. */
export function ComingSoon({ title, icon, note }: { title: string; icon: keyof typeof Ionicons.glyphMap; note: string }) {
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
        <Ionicons name={icon} size={40} color={colors.mutedLight} />
        <Text variant="h2">{title}</Text>
        <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
          {note}
        </Text>
      </View>
    </Screen>
  );
}
