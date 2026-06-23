import { ScrollView, View } from 'react-native';

import { OptionChip, Segmented, Select, Text, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import {
  BOARD_OPTIONS,
  DIFFICULTY_OPTIONS,
  DURATION_OPTIONS,
  LANGUAGE_OPTIONS,
  STUDENT_PROFILE_OPTIONS,
  gradesForBoard,
  subjectsFor,
  type Board,
  type Difficulty,
  type Language,
  type LessonInput,
  type StudentProfileTag,
} from './types';

export interface LessonFormProps {
  value: LessonInput;
  onChange: (next: LessonInput) => void;
}

/** A label + horizontally-scrollable row of selectable chips. */
function ChipRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
  renderLabel,
}: {
  label: string;
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  renderLabel?: (value: T) => string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label">{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {options.map((opt) => (
          <OptionChip
            key={opt}
            label={renderLabel ? renderLabel(opt) : opt}
            selected={opt === selected}
            onPress={() => onSelect(opt)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Progressive lesson input form (§2.1). Each selection filters the next field:
 * board → grade → subject. Changing an upstream field clears now-invalid
 * downstream selections so the teacher never lands on an impossible combo.
 */
export function LessonForm({ value, onChange }: LessonFormProps) {
  const grades = gradesForBoard(value.board);
  const subjects = subjectsFor(value.board, value.grade);

  function setBoard(board: Board) {
    const nextGrades = gradesForBoard(board);
    const grade = nextGrades.includes(value.grade) ? value.grade : (nextGrades[0] ?? '');
    const nextSubjects = subjectsFor(board, grade);
    const subject = nextSubjects.includes(value.subject) ? value.subject : '';
    onChange({ ...value, board, grade, subject });
  }

  function setGrade(grade: string) {
    const nextSubjects = subjectsFor(value.board, grade);
    const subject = nextSubjects.includes(value.subject) ? value.subject : '';
    onChange({ ...value, grade, subject });
  }

  function toggleProfile(tag: StudentProfileTag) {
    const has = value.studentProfile.includes(tag);
    onChange({
      ...value,
      studentProfile: has ? value.studentProfile.filter((t) => t !== tag) : [...value.studentProfile, tag],
    });
  }

  const difficultyHint = DIFFICULTY_OPTIONS.find((d) => d.value === value.difficulty)?.hint;

  return (
    <View style={{ gap: spacing.xl }}>
      {/* Board (horizontal chips) */}
      <ChipRow label="Board" options={BOARD_OPTIONS} selected={value.board} onSelect={setBoard} />

      {/* Grade (horizontal chips, filtered by board) */}
      <ChipRow label="Grade" options={grades} selected={value.grade} onSelect={setGrade} />

      {/* Subject (depends on board+grade) */}
      <Select
        label="Subject"
        value={value.subject || null}
        placeholder={subjects.length ? 'Choose a subject' : 'No subjects for this grade'}
        options={subjects.map((s) => ({ value: s, label: s }))}
        onChange={(v) => onChange({ ...value, subject: v })}
        disabled={subjects.length === 0}
        disabledHint={subjects.length === 0 ? 'Try a different grade or board.' : undefined}
      />

      {/* Topic */}
      <TextField
        label="Topic / Chapter"
        value={value.topic}
        onChangeText={(v) => onChange({ ...value, topic: v })}
        placeholder="e.g. Photosynthesis"
        hint="Tip: match your textbook chapter name for the closest alignment."
      />

      {/* Duration (horizontal chips) */}
      <ChipRow
        label="Lesson duration"
        options={DURATION_OPTIONS.map((d) => String(d))}
        selected={String(value.durationMinutes)}
        onSelect={(v) => onChange({ ...value, durationMinutes: Number(v) })}
        renderLabel={(v) => `${v} min`}
      />

      {/* Learning objective (optional) */}
      <TextField
        label="Learning objective (optional)"
        value={value.objective}
        onChangeText={(v) => onChange({ ...value, objective: v })}
        placeholder="Leave blank and the AI will write objectives for you."
        multiline
        numberOfLines={2}
        style={{ minHeight: 64, textAlignVertical: 'top' }}
      />

      {/* Difficulty */}
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Difficulty</Text>
        <Segmented
          options={DIFFICULTY_OPTIONS.map((d) => ({ value: d.value, label: d.label }))}
          value={value.difficulty}
          onChange={(v: Difficulty) => onChange({ ...value, difficulty: v })}
        />
        {difficultyHint ? (
          <Text variant="caption" color={colors.muted}>
            {difficultyHint}
          </Text>
        ) : null}
      </View>

      {/* Student profile (optional, multi) */}
      <View style={{ gap: spacing.sm }}>
        <Text variant="label">Student profile (optional)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {STUDENT_PROFILE_OPTIONS.map((tag) => (
            <OptionChip key={tag} label={tag} selected={value.studentProfile.includes(tag)} onPress={() => toggleProfile(tag)} />
          ))}
        </View>
      </View>

      {/* Language */}
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Language</Text>
        <Segmented
          options={LANGUAGE_OPTIONS}
          value={value.language}
          onChange={(v: Language) => onChange({ ...value, language: v })}
        />
      </View>

      {/* Special instructions (optional) */}
      <TextField
        label="Special instructions (optional)"
        value={value.specialInstructions}
        onChangeText={(v) => onChange({ ...value, specialInstructions: v })}
        placeholder="e.g. Include a group activity · No digital tools"
        multiline
        numberOfLines={2}
        style={{ minHeight: 64, textAlignVertical: 'top' }}
      />
    </View>
  );
}
