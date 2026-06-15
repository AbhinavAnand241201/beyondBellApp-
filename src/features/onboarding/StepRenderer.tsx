import { Switch, View } from 'react-native';

import { OptionChip, Text, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import {
  BOARD_OPTIONS,
  GRADE_OPTIONS,
  LANGUAGE_OPTIONS,
  ROLE_OPTIONS,
  STEP_TITLES,
  SUBJECT_OPTIONS,
  YEARS_EXP_OPTIONS,
  type WizardData,
} from './types';

export interface StepProps {
  data: WizardData;
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  toggleInArray: <K extends 'boards' | 'subjects' | 'grades' | 'specialist_areas'>(
    key: K,
    value: WizardData[K][number],
  ) => void;
}

/** Section label above a group of inputs. */
function FieldLabel({ children, hint }: { children: string; hint?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="label">{children}</Text>
      {hint ? (
        <Text variant="caption" color={colors.muted}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Wrapping row of selectable chips. */
function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}

export function StepRenderer({ step, data, update, toggleInArray }: StepProps & { step: number }) {
  switch (step) {
    case 1:
      return (
        <View style={{ gap: spacing.lg }}>
          <TextField
            label="Display name"
            value={data.display_name}
            onChangeText={(v) => update('display_name', v)}
            placeholder="e.g. Priya Sharma"
            autoCapitalize="words"
          />
          <View style={{ gap: spacing.sm }}>
            <FieldLabel>Your role</FieldLabel>
            <ChipWrap>
              {ROLE_OPTIONS.map((r) => (
                <OptionChip
                  key={r.value}
                  label={r.label}
                  selected={data.role === r.value}
                  onPress={() => update('role', r.value)}
                />
              ))}
            </ChipWrap>
          </View>
          <TextField
            label="Designation (optional)"
            value={data.designation}
            onChangeText={(v) => update('designation', v)}
            placeholder="e.g. Senior Science Teacher"
          />
        </View>
      );

    case 2:
      return (
        <View style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.sm }}>
            <FieldLabel hint="Pick all that apply">Boards you teach</FieldLabel>
            <ChipWrap>
              {BOARD_OPTIONS.map((b) => (
                <OptionChip key={b} label={b} selected={data.boards.includes(b)} onPress={() => toggleInArray('boards', b)} />
              ))}
            </ChipWrap>
          </View>
          <View style={{ gap: spacing.sm }}>
            <FieldLabel>Grades</FieldLabel>
            <ChipWrap>
              {GRADE_OPTIONS.map((g) => (
                <OptionChip
                  key={g}
                  label={`Grade ${g}`}
                  selected={data.grades.includes(g)}
                  onPress={() => toggleInArray('grades', g)}
                />
              ))}
            </ChipWrap>
          </View>
          <View style={{ gap: spacing.sm }}>
            <FieldLabel hint="Pick all that apply">Subjects</FieldLabel>
            <ChipWrap>
              {SUBJECT_OPTIONS.map((s) => (
                <OptionChip
                  key={s}
                  label={s}
                  selected={data.subjects.includes(s)}
                  onPress={() => toggleInArray('subjects', s)}
                />
              ))}
            </ChipWrap>
          </View>
        </View>
      );

    case 3:
      return (
        <View style={{ gap: spacing.lg }}>
          <TextField
            label="School name (optional)"
            value={data.school_name}
            onChangeText={(v) => update('school_name', v)}
            placeholder="e.g. Delhi Public School"
            autoCapitalize="words"
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <FieldLabel hint="Off keeps your school private">Show school on profile</FieldLabel>
            <Switch
              value={data.show_school_name}
              onValueChange={(v) => update('show_school_name', v)}
              trackColor={{ true: colors.amber, false: colors.border }}
            />
          </View>
          <TextField
            label="City"
            value={data.city}
            onChangeText={(v) => update('city', v)}
            placeholder="e.g. Mumbai"
            autoCapitalize="words"
          />
          <TextField
            label="State (optional)"
            value={data.state}
            onChangeText={(v) => update('state', v)}
            placeholder="e.g. Maharashtra"
            autoCapitalize="words"
          />
          <View style={{ gap: spacing.sm }}>
            <FieldLabel>Years of experience</FieldLabel>
            <ChipWrap>
              {YEARS_EXP_OPTIONS.map((y) => (
                <OptionChip
                  key={y.value}
                  label={y.label}
                  selected={data.years_exp === y.value}
                  onPress={() => update('years_exp', y.value)}
                />
              ))}
            </ChipWrap>
          </View>
        </View>
      );

    case 4:
      return (
        <View style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.sm }}>
            <FieldLabel hint="Optional — what you’re known for">Specialist areas</FieldLabel>
            <ChipWrap>
              {SUBJECT_OPTIONS.map((s) => (
                <OptionChip
                  key={s}
                  label={s}
                  selected={data.specialist_areas.includes(s)}
                  onPress={() => toggleInArray('specialist_areas', s)}
                />
              ))}
            </ChipWrap>
          </View>
          <TextField
            label="Short bio (optional)"
            value={data.bio}
            onChangeText={(v) => update('bio', v)}
            placeholder="A line or two about your teaching."
            multiline
            numberOfLines={4}
            style={{ minHeight: 96, textAlignVertical: 'top' }}
          />
          <View style={{ gap: spacing.sm }}>
            <FieldLabel>Preferred language</FieldLabel>
            <ChipWrap>
              {LANGUAGE_OPTIONS.map((l) => (
                <OptionChip
                  key={l.value}
                  label={l.label}
                  selected={data.language_preference === l.value}
                  onPress={() => update('language_preference', l.value)}
                />
              ))}
            </ChipWrap>
          </View>
          <TextField
            label="Contact phone (optional)"
            value={data.contact_phone}
            onChangeText={(v) => update('contact_phone', v)}
            keyboardType="phone-pad"
            placeholder="Shown only if you choose to share it"
            hint="This is your product contact number, separate from your login phone."
          />
        </View>
      );

    case 5:
      return <ReviewStep data={data} />;

    default:
      return null;
  }
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}>
      <Text variant="body" color={colors.muted}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ flex: 1, textAlign: 'right' }}>
        {value || '—'}
      </Text>
    </View>
  );
}

function ReviewStep({ data }: { data: WizardData }) {
  const roleLabel = ROLE_OPTIONS.find((r) => r.value === data.role)?.label ?? data.role;
  const yearsLabel = YEARS_EXP_OPTIONS.find((y) => y.value === data.years_exp)?.label ?? '—';
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="body" color={colors.muted}>
        {STEP_TITLES[5]} — confirm everything looks right.
      </Text>
      <ReviewRow label="Name" value={data.display_name} />
      <ReviewRow label="Role" value={roleLabel} />
      <ReviewRow label="Boards" value={data.boards.join(', ')} />
      <ReviewRow label="Grades" value={data.grades.map((g) => g).join(', ')} />
      <ReviewRow label="Subjects" value={data.subjects.join(', ')} />
      <ReviewRow label="School" value={data.show_school_name ? data.school_name : 'Hidden'} />
      <ReviewRow label="City" value={data.city} />
      <ReviewRow label="Experience" value={yearsLabel} />
      <ReviewRow label="Language" value={data.language_preference} />
    </View>
  );
}
