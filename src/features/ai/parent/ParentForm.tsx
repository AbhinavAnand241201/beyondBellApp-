import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Banner, Card, OptionChip, Select, Text, TextField } from '@/components/ui';
import { gradesForBoard } from '@/features/ai/shared/curriculum';
import { colors, spacing } from '@/theme/tokens';
import {
  CONTEXT_MAX,
  FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TONE_OPTIONS,
  getSituation,
  type Language,
  type MessageFormat,
  type ParentInput,
  type Tone,
} from './types';

export interface ParentFormProps {
  value: ParentInput;
  onChange: (next: ParentInput) => void;
}

// Parent messages aren't board-specific; use a generic Class 1–12 grade list.
const GRADE_OPTIONS = gradesForBoard('CBSE');

/**
 * Parent Communicator form (§2.1). Shows dynamic tone guidance for the selected
 * situation, and a safety advisory for Very-High-sensitivity situations (§2.3).
 */
export function ParentForm({ value, onChange }: ParentFormProps) {
  const situation = getSituation(value.situationId);

  function toggleFormat(f: MessageFormat) {
    const has = value.formats.includes(f);
    const formats = has ? value.formats.filter((x) => x !== f) : [...value.formats, f];
    onChange({ ...value, formats: formats.length ? formats : value.formats }); // keep ≥1
  }

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Situation summary + dynamic tone guidance */}
      {situation ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="information-circle-outline" size={18} color={colors.amberDark} />
            <Text variant="label" style={{ flex: 1 }}>
              {situation.label}
            </Text>
          </View>
          <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.xs }}>
            {situation.toneGuidance}
          </Text>
        </Card>
      ) : null}

      {situation?.sensitivity === 'Very High' ? (
        <Banner
          tone="danger"
          title="Sensitive matter"
          message="Consider involving the counsellor or coordinator. Keep the written message brief and request an in-person meeting."
        />
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Student name" value={value.studentName} onChangeText={(v) => onChange({ ...value, studentName: v })} placeholder="e.g. Aarav" autoCapitalize="words" />
        </View>
        <View style={{ flex: 1 }}>
          <Select label="Grade" value={value.grade} options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} onChange={(v) => onChange({ ...value, grade: v })} />
        </View>
      </View>

      <TextField label="Parent name (optional)" value={value.parentName} onChangeText={(v) => onChange({ ...value, parentName: v })} placeholder="e.g. Mr. Sharma" autoCapitalize="words" />

      <View style={{ gap: spacing.xs }}>
        <TextField
          label="Key facts / context"
          value={value.context}
          onChangeText={(v) => onChange({ ...value, context: v.slice(0, CONTEXT_MAX) })}
          placeholder="1–3 sentences, e.g. Scored 8/50 in the unit test and seems disengaged in class."
          multiline
          numberOfLines={3}
          style={{ minHeight: 88, textAlignVertical: 'top' }}
        />
        <Text variant="caption" color={colors.muted} style={{ textAlign: 'right' }}>
          {value.context.length}/{CONTEXT_MAX}
        </Text>
      </View>

      {/* Output formats */}
      <Field label="Output format" hint="Pick one or more.">
        <ChipWrap>
          {FORMAT_OPTIONS.map((f) => (
            <OptionChip key={f.value} label={f.label} selected={value.formats.includes(f.value)} onPress={() => toggleFormat(f.value)} />
          ))}
        </ChipWrap>
      </Field>

      {/* Tone */}
      <Field label="Tone" hint={value.tone === 'Auto' ? 'Auto picks the right tone for this situation.' : undefined}>
        <ChipWrap>
          {TONE_OPTIONS.map((t) => (
            <OptionChip key={t.value} label={t.label} selected={value.tone === t.value} onPress={() => onChange({ ...value, tone: t.value as Tone | 'Auto' })} />
          ))}
        </ChipWrap>
      </Field>

      {/* Language */}
      <Field label="Language">
        <ChipWrap>
          {LANGUAGE_OPTIONS.map((l) => (
            <OptionChip key={l.value} label={l.label} selected={value.language === l.value} onPress={() => onChange({ ...value, language: l.value as Language })} />
          ))}
        </ChipWrap>
      </Field>

      <TextField
        label="Additional instruction (optional)"
        value={value.additionalInstruction}
        onChangeText={(v) => onChange({ ...value, additionalInstruction: v })}
        placeholder="e.g. Do not mention the specific test score · Keep it brief"
        multiline
        numberOfLines={2}
        style={{ minHeight: 60, textAlignVertical: 'top' }}
      />

      {situation ? (
        <Text variant="caption" color={situation.sensitivity === 'Very High' ? colors.danger : colors.mutedLight}>
          Sensitivity: {situation.sensitivity}
        </Text>
      ) : null}
    </View>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ gap: 2 }}>
        <Text variant="label">{label}</Text>
        {hint ? (
          <Text variant="caption" color={colors.muted}>
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}
