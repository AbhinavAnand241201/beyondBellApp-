import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Pill, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import type { ComplianceDocument } from './types';

/** Renders a generated compliance document (§3.2 sections + §3.3 evidence folder). */
export function ComplianceOutput({ doc }: { doc: ComplianceDocument }) {
  return (
    <View style={{ gap: spacing.md }}>
      <Card highlight>
        <Text variant="h3" color={colors.ink}>
          {doc.title}
        </Text>
        {doc.rating ? (
          <View style={{ marginTop: spacing.sm }}>
            <Pill label={`Self-appraisal: ${doc.rating}`} tone="amber" />
          </View>
        ) : null}
      </Card>

      {/* Document sections */}
      {doc.sections.map((s) => (
        <Card key={s.heading}>
          <Text variant="label" color={colors.amberDark} style={{ textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: spacing.xs }}>
            {s.heading}
          </Text>
          <Text variant="body" style={{ lineHeight: 21 }}>
            {s.body}
          </Text>
        </Card>
      ))}

      {/* Evidence checklist (tickable) */}
      <EvidenceChecklist doc={doc} />

      {/* Evidence folder structure (§3.3) */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <Ionicons name="folder-outline" size={18} color={colors.amberDark} />
          <Text variant="label">Evidence folder structure</Text>
        </View>
        <View style={styles.codeBox}>
          <Text style={styles.mono}>{doc.folderStructure}</Text>
        </View>
      </Card>

      {/* Improvement plan */}
      {doc.improvementPlan.length > 0 ? (
        <Card>
          <Text variant="label" style={{ marginBottom: spacing.sm }}>
            Improvement plan
          </Text>
          <View style={{ gap: spacing.md }}>
            {doc.improvementPlan.map((a, i) => (
              <View key={i} style={{ gap: 2 }}>
                <Text variant="bodyMedium">{a.action}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                  <Pill label={a.timeline} tone="neutral" />
                  <Pill label={a.measure} tone="success" />
                </View>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

function EvidenceChecklist({ doc }: { doc: ComplianceDocument }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }
  return (
    <Card>
      <Text variant="label" style={{ marginBottom: spacing.sm }}>
        Evidence checklist ({checked.size}/{doc.evidenceChecklist.length})
      </Text>
      <View style={{ gap: spacing.sm }}>
        {doc.evidenceChecklist.map((e, i) => {
          const isDone = checked.has(i);
          return (
            <Pressable key={i} onPress={() => toggle(i)} style={styles.checkRow}>
              <Ionicons name={isDone ? 'checkbox' : 'square-outline'} size={20} color={isDone ? colors.success : colors.mutedLight} />
              <View style={{ flex: 1 }}>
                <Text variant="body" color={isDone ? colors.muted : colors.ink} style={isDone ? styles.strike : undefined}>
                  {e.item}
                </Text>
                <Text variant="caption" color={colors.muted}>
                  {e.format} · {e.responsible}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  codeBox: { backgroundColor: colors.canvas, borderRadius: radius.sm, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, color: colors.ink, lineHeight: 18 },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  strike: { textDecorationLine: 'line-through' },
});
