import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, OptionChip, Pill, Segmented, Select, Text, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { BOARD_OPTIONS, gradesForBoard, subjectsFor } from '@/features/ai/shared/curriculum';
import { bloomDistributionFor, buildSectionPlan, defaultQuestionTypes } from './engine';
import {
  BLOOM_LEVELS,
  DIFFICULTY_PRESETS,
  DURATION_OPTIONS,
  HOTS_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  SET_OPTIONS,
  TOTAL_MARKS_OPTIONS,
  type AssessmentInput,
  type Board,
  type BloomLevel,
  type HotsMode,
  type QuestionType,
  type SetCount,
} from './types';

export interface AssessmentFormProps {
  value: AssessmentInput;
  onChange: (next: AssessmentInput) => void;
}

/**
 * Reactive Assessment Builder form (§2.1, §2.4). Board selection auto-fills the
 * section format + default question types; changing total marks live-updates the
 * section plan preview. Cascading clears invalid downstream values.
 */
export function AssessmentForm({ value, onChange }: AssessmentFormProps) {
  const grades = gradesForBoard(value.board);
  const subjects = subjectsFor(value.board, value.grade);
  const plan = buildSectionPlan(value.board, value.totalMarks);
  const bloom = bloomDistributionFor(value.totalMarks);

  function setBoard(board: Board) {
    const nextGrades = gradesForBoard(board);
    const grade = nextGrades.includes(value.grade) ? value.grade : (nextGrades[0] ?? '');
    const subs = subjectsFor(board, grade);
    const subject = subs.includes(value.subject) ? value.subject : '';
    onChange({ ...value, board, grade, subject, questionTypes: defaultQuestionTypes(board) });
  }
  function setGrade(grade: string) {
    const subs = subjectsFor(value.board, grade);
    const subject = subs.includes(value.subject) ? value.subject : '';
    onChange({ ...value, grade, subject });
  }
  function toggle<T>(arr: T[], item: T): T[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Select label="Board" value={value.board} options={BOARD_OPTIONS.map((b) => ({ value: b, label: b }))} onChange={(v) => setBoard(v as Board)} />
        </View>
        <View style={{ flex: 1 }}>
          <Select label="Grade" value={value.grade} options={grades.map((g) => ({ value: g, label: g }))} onChange={setGrade} />
        </View>
      </View>

      <Select
        label="Subject"
        value={value.subject || null}
        placeholder={subjects.length ? 'Choose a subject' : 'No subjects for this grade'}
        options={subjects.map((s) => ({ value: s, label: s }))}
        onChange={(v) => onChange({ ...value, subject: v })}
        disabled={subjects.length === 0}
      />

      <TopicInput topics={value.topics} onChange={(topics) => onChange({ ...value, topics })} />

      {/* Total marks + duration */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Select
            label="Total marks"
            value={String(value.totalMarks)}
            options={TOTAL_MARKS_OPTIONS.map((m) => ({ value: String(m), label: `${m} marks` }))}
            onChange={(v) => onChange({ ...value, totalMarks: Number(v) })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Select
            label="Duration"
            value={String(value.durationMins)}
            options={DURATION_OPTIONS.map((d) => ({ value: String(d), label: `${d} min` }))}
            onChange={(v) => onChange({ ...value, durationMins: Number(v) })}
          />
        </View>
      </View>

      {/* Live section plan preview (reactive marks→counts) */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <Ionicons name="albums-outline" size={18} color={colors.amberDark} />
          <Text variant="label" style={{ flex: 1 }}>
            {value.board} paper structure
          </Text>
          <Pill label={`${plan.computedTotal} marks`} tone={plan.matchesRequested ? 'success' : 'amber'} />
        </View>
        <View style={{ gap: 4 }}>
          {plan.sections.map((s) => (
            <View key={s.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption" color={colors.muted} style={{ flex: 1 }}>
                {s.name} · {s.title}
              </Text>
              <Text variant="caption" color={colors.ink}>
                {s.marksEach} × {s.count} = {s.marks}
              </Text>
            </View>
          ))}
        </View>
        {!plan.matchesRequested ? (
          <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.xs }}>
            Auto-balanced to {plan.computedTotal} marks — the AI will fine-tune to {value.totalMarks}.
          </Text>
        ) : null}
      </Card>

      {/* Question types */}
      <Field label="Question types" hint="Auto-selected from the board pattern — adjust freely.">
        <ChipWrap>
          {QUESTION_TYPE_OPTIONS.map((t) => (
            <OptionChip
              key={t.value}
              label={t.label}
              selected={value.questionTypes.includes(t.value)}
              onPress={() => onChange({ ...value, questionTypes: toggle<QuestionType>(value.questionTypes, t.value) })}
            />
          ))}
        </ChipWrap>
      </Field>

      {/* Difficulty mix presets */}
      <Field label="Difficulty mix" hint={`Easy ${value.difficultyMix.easy} · Medium ${value.difficultyMix.medium} · Hard ${value.difficultyMix.hard}`}>
        <ChipWrap>
          {DIFFICULTY_PRESETS.map((p) => {
            const active =
              p.mix.easy === value.difficultyMix.easy &&
              p.mix.medium === value.difficultyMix.medium &&
              p.mix.hard === value.difficultyMix.hard;
            return <OptionChip key={p.label} label={p.label} selected={active} onPress={() => onChange({ ...value, difficultyMix: p.mix })} />;
          })}
        </ChipWrap>
      </Field>

      {/* Bloom's focus */}
      <Field
        label="Bloom’s focus (optional)"
        hint={
          value.bloomFocus.length === 0
            ? `Balanced for this size: ${bloom.rememberUnderstand}% recall · ${bloom.applyAnalyse}% apply/analyse · ${bloom.evaluateCreate}% evaluate/create`
            : 'Custom focus selected'
        }
      >
        <ChipWrap>
          {BLOOM_LEVELS.map((b) => (
            <OptionChip
              key={b}
              label={b}
              selected={value.bloomFocus.includes(b)}
              onPress={() => onChange({ ...value, bloomFocus: toggle<BloomLevel>(value.bloomFocus, b) })}
            />
          ))}
        </ChipWrap>
      </Field>

      {/* HOTS + sets */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="label">HOTS</Text>
          <Segmented options={HOTS_OPTIONS} value={value.hots} onChange={(v: HotsMode) => onChange({ ...value, hots: v })} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="label">Sets</Text>
          <Segmented
            options={SET_OPTIONS.map((s) => ({ value: String(s.value), label: s.label }))}
            value={String(value.numSets)}
            onChange={(v) => onChange({ ...value, numSets: Number(v) as SetCount })}
          />
        </View>
      </View>

      {/* Toggles */}
      <ToggleRow label="Include answer key" value={value.includeAnswerKey} onValueChange={(v) => onChange({ ...value, includeAnswerKey: v })} />
      <ToggleRow
        label="Include marking scheme"
        value={value.includeMarkingScheme}
        onValueChange={(v) => onChange({ ...value, includeMarkingScheme: v })}
      />

      <TextField
        label="Special instructions (optional)"
        value={value.specialInstructions}
        onChangeText={(v) => onChange({ ...value, specialInstructions: v })}
        placeholder="e.g. No MCQ section · Include a map question"
        multiline
        numberOfLines={2}
        style={{ minHeight: 64, textAlignVertical: 'top' }}
      />
    </View>
  );
}

function TopicInput({ topics, onChange }: { topics: string[]; onChange: (t: string[]) => void }) {
  const [draft, setDraft] = useState('');
  function add() {
    const t = draft.trim();
    if (t && !topics.includes(t)) onChange([...topics, t]);
    setDraft('');
  }
  return (
    <Field label="Topic(s) / chapter(s)" hint="Add one or more — press return to add.">
      <TextField value={draft} onChangeText={setDraft} placeholder="e.g. Light — Reflection & Refraction" onSubmitEditing={add} returnKeyType="done" />
      {topics.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }}>
          {topics.map((t) => (
            <Pressable key={t} onPress={() => onChange(topics.filter((x) => x !== t))}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FCE8B8', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999 }}>
                <Text variant="caption" color={colors.ink}>
                  {t}
                </Text>
                <Ionicons name="close" size={12} color={colors.ink} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Field>
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

function ToggleRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text variant="label">{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.amber, false: colors.border }} />
    </View>
  );
}
