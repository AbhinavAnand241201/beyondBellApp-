import { Pressable, StyleSheet, View } from 'react-native';

import { Banner, BottomSheet, Card, Text } from '@/components/ui';
import { LoadingState } from '@/components/QueryStates';
import { isApiConfigured } from '@/lib/api';
import { colors, spacing } from '@/theme/tokens';
import type { ThemeSuggestion } from './types';

export interface ThemeSheetProps {
  visible: boolean;
  loading: boolean;
  themes: ThemeSuggestion[];
  onSelect: (theme: ThemeSuggestion) => void;
  onClose: () => void;
}

/** AI theme-suggestion picker (§2.2): 3 themed options with palette + concept. */
export function ThemeSheet({ visible, loading, themes, onSelect, onClose }: ThemeSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Pick a theme">
      {!isApiConfigured ? (
        <Banner tone="info" title="Sample themes" message="Connect the AI backend for themes tailored to your event." />
      ) : null}
      {loading ? (
        <LoadingState label="Imagining themes…" />
      ) : (
        <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
          {themes.map((t) => (
            <Pressable key={t.name} onPress={() => onSelect(t)}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text variant="label" style={{ flex: 1 }}>
                    {t.name}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {t.palette.map((c) => (
                      <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                    ))}
                  </View>
                </View>
                <Text variant="caption" color={colors.amberDark} style={{ marginTop: 2 }}>
                  {t.tagline}
                </Text>
                <Text variant="body" color={colors.muted} style={{ marginTop: spacing.xs, lineHeight: 20 }}>
                  {t.concept}
                </Text>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  swatch: { width: 16, height: 16, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
