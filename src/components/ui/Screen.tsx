import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

export interface ScreenProps extends ViewProps {
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
}

/** Safe-area-aware screen wrapper on the grey canvas. */
export function Screen({
  scroll = false,
  padded = true,
  edges = ['top', 'left', 'right'],
  style,
  children,
  ...rest
}: ScreenProps) {
  const inner = (
    <View style={[padded && styles.padded, !scroll && styles.flex, style]} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padded && styles.padded, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  padded: { padding: spacing.lg },
});
