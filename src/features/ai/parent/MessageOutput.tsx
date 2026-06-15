import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, OptionChip, Pill, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { FORMAT_LABEL, REFINEMENT_CHIPS, type MessageFormat, type ParentMessageOutput } from './types';

export interface MessageOutputProps {
  output: ParentMessageOutput;
  /** Active format tab — controlled so the action bar copies the right one. */
  activeFormat: MessageFormat;
  onFormatChange: (f: MessageFormat) => void;
  /** One-click refinement (§3.3). */
  onRefine: (instruction: string) => void;
  refining?: boolean;
}

/** Message output with format tabs, tone badge, and refinement chips (§2.3). */
export function MessageOutput({ output, activeFormat, onFormatChange, onRefine, refining }: MessageOutputProps) {
  const available = (Object.keys(output.formats) as MessageFormat[]).filter((f) => output.formats[f]);

  // Keep the active tab valid as formats change after refinement.
  useEffect(() => {
    if (!available.includes(activeFormat) && available[0]) onFormatChange(available[0]);
  }, [available, activeFormat, onFormatChange]);

  const email = output.formats.email;

  return (
    <View style={{ gap: spacing.md }}>
      {/* Tone badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Pill label={`Tone: ${output.toneApplied}`} tone="amber" />
      </View>

      {/* Format tabs */}
      {available.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {available.map((f) => (
            <Pressable key={f} onPress={() => onFormatChange(f)} style={[styles.tab, activeFormat === f && styles.tabActive]}>
              <Text variant="caption" color={activeFormat === f ? colors.ink : colors.muted} style={activeFormat === f ? { fontWeight: '700' } : undefined}>
                {FORMAT_LABEL[f]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* Message body */}
      <Card>
        {activeFormat === 'email' && email ? (
          <>
            <Text variant="caption" color={colors.muted}>
              SUBJECT
            </Text>
            <Text variant="label" style={{ marginBottom: spacing.sm }}>
              {email.subject}
            </Text>
            <Text variant="body" style={{ lineHeight: 22 }}>
              {email.body}
            </Text>
          </>
        ) : (
          <Text variant="body" style={{ lineHeight: 22 }}>
            {activeFormat === 'email' ? '' : output.formats[activeFormat]}
          </Text>
        )}
      </Card>

      {/* Tone note */}
      <View style={styles.noteRow}>
        <Ionicons name="color-wand-outline" size={14} color={colors.muted} />
        <Text variant="caption" color={colors.muted} style={{ flex: 1 }}>
          {output.toneNote}
        </Text>
      </View>

      {/* Refinement chips */}
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text variant="label">Refine</Text>
          {refining ? <Text variant="caption" color={colors.muted}>· updating…</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {REFINEMENT_CHIPS.map((c) => (
            <OptionChip key={c.id} label={c.label} selected={false} onPress={() => onRefine(c.instruction)} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: { gap: spacing.sm, paddingVertical: 2 },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: '#FCE8B8', borderColor: colors.amber },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
});
