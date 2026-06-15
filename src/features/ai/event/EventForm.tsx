import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, OptionChip, Select, Text, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import {
  ATTENDANCE_OPTIONS,
  AUDIENCE_OPTIONS,
  BUDGET_OPTIONS,
  EVENT_TYPES,
  GRADE_OPTIONS,
  LEAD_TIME_OPTIONS,
  VENUE_OPTIONS,
  type AttendanceRange,
  type Audience,
  type BudgetRange,
  type EventInput,
  type LeadTime,
  type Venue,
} from './types';

export interface EventFormProps {
  value: EventInput;
  onChange: (next: EventInput) => void;
  /** Opens the AI theme-suggestion sheet (§2.2). */
  onSuggestThemes: () => void;
}

/** Event Architect input form (§2.1). */
export function EventForm({ value, onChange, onSuggestThemes }: EventFormProps) {
  function toggleGrade(g: number) {
    const has = value.grades.includes(g);
    onChange({ ...value, grades: has ? value.grades.filter((x) => x !== g) : [...value.grades, g] });
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <Select
        label="Event type"
        value={value.eventTypeId || null}
        placeholder="Choose an event"
        options={EVENT_TYPES.map((e) => ({ value: e.id, label: `${e.label}  ·  ${e.category}` }))}
        onChange={(v) => onChange({ ...value, eventTypeId: v })}
      />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Select label="Audience" value={value.audience} options={AUDIENCE_OPTIONS.map((a) => ({ value: a, label: a }))} onChange={(v) => onChange({ ...value, audience: v as Audience })} />
        </View>
        <View style={{ flex: 1 }}>
          <Select label="Expected attendance" value={value.attendance} options={ATTENDANCE_OPTIONS.map((a) => ({ value: a, label: a }))} onChange={(v) => onChange({ ...value, attendance: v as AttendanceRange })} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Select label="Venue" value={value.venue} options={VENUE_OPTIONS.map((v) => ({ value: v, label: v }))} onChange={(v) => onChange({ ...value, venue: v as Venue })} />
        </View>
        <View style={{ flex: 1 }}>
          <Select label="Budget range" value={value.budgetRange} options={BUDGET_OPTIONS.map((b) => ({ value: b, label: b }))} onChange={(v) => onChange({ ...value, budgetRange: v as BudgetRange })} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <TextField label="Event date (optional)" value={value.date} onChangeText={(v) => onChange({ ...value, date: v })} placeholder="DD/MM/YYYY" />
        </View>
        <View style={{ flex: 1 }}>
          <Select label="Planning lead time" value={value.leadTime} options={LEAD_TIME_OPTIONS.map((l) => ({ value: l, label: l }))} onChange={(v) => onChange({ ...value, leadTime: v as LeadTime })} />
        </View>
      </View>

      {/* Grades */}
      <View style={{ gap: spacing.sm }}>
        <Text variant="label">Grades involved</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {GRADE_OPTIONS.map((g) => (
            <OptionChip key={g} label={`${g}`} selected={value.grades.includes(g)} onPress={() => toggleGrade(g)} />
          ))}
        </View>
      </View>

      {/* Theme + AI suggestion */}
      <View style={{ gap: spacing.sm }}>
        <TextField
          label="Theme (optional)"
          value={value.theme}
          onChangeText={(v) => onChange({ ...value, theme: v })}
          placeholder="e.g. Roots & Wings"
        />
        <Button
          title="Let AI suggest themes"
          variant="secondary"
          size="sm"
          onPress={onSuggestThemes}
          leftIcon={<Ionicons name="color-palette-outline" size={16} color={colors.ink} />}
          style={{ alignSelf: 'flex-start' }}
        />
      </View>

      <TextField
        label="Special requirements (optional)"
        value={value.specialRequirements}
        onChangeText={(v) => onChange({ ...value, specialRequirements: v })}
        placeholder="e.g. Chief guest expected · Live streaming · No PA system"
        multiline
        numberOfLines={2}
        style={{ minHeight: 60, textAlignVertical: 'top' }}
      />
    </View>
  );
}
