import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Pill, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import type { LessonPlan } from './types';

/** Renders the full 7-part BeyondBell lesson plan (§2.2). Presentational only. */
export function LessonPlanView({ plan }: { plan: LessonPlan }) {
  return (
    <View style={{ gap: spacing.md }}>
      <HeaderBlock plan={plan} />

      <Section icon="flag-outline" title="Learning objectives">
        <View style={{ gap: spacing.sm }}>
          {plan.objectives.map((o, i) => (
            <View key={i} style={styles.objRow}>
              <Text variant="bodyMedium" color={colors.amberDark}>
                {i + 1}.
              </Text>
              <Text variant="body" style={{ flex: 1, lineHeight: 21 }}>
                {o}
              </Text>
              {plan.bloom_levels[i] ? <Pill label={plan.bloom_levels[i] as string} tone="amber" /> : null}
            </View>
          ))}
        </View>
      </Section>

      <Section icon="cube-outline" title="Materials & resources">
        <View style={{ gap: spacing.xs }}>
          {plan.materials.map((m, i) => (
            <Bullet key={i} text={m} />
          ))}
        </View>
      </Section>

      <Section icon="bulb-outline" title="Hook / starter" time={plan.hook.duration}>
        <Text variant="label">{plan.hook.activity}</Text>
        <Text variant="body" style={{ marginTop: spacing.xs, lineHeight: 21 }}>
          {plan.hook.instructions}
        </Text>
      </Section>

      <Section icon="layers-outline" title="Concept delivery">
        <View style={{ gap: spacing.md }}>
          {plan.concept_delivery.map((step) => (
            <View key={step.step} style={styles.step}>
              <View style={styles.stepNum}>
                <Text variant="caption" color={colors.ink} style={{ fontWeight: '700' }}>
                  {step.step}
                </Text>
              </View>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <Text variant="label">{step.title}</Text>
                <Text variant="body" style={{ lineHeight: 21 }}>
                  {step.content}
                </Text>
                <ActionLine label="Teacher" text={step.teacher_action} />
                <ActionLine label="Students" text={step.student_action} />
              </View>
            </View>
          ))}
        </View>
      </Section>

      <Section icon="people-outline" title="Student activity" time={plan.student_activity.duration}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="label">{plan.student_activity.title}</Text>
          <Pill label={plan.student_activity.type} tone="neutral" />
        </View>
        <Text variant="body" style={{ marginTop: spacing.xs, lineHeight: 21 }}>
          {plan.student_activity.instructions}
        </Text>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-done-outline" size={16} color={colors.success} />
          <Text variant="caption" color={colors.muted} style={{ flex: 1 }}>
            Success criteria: {plan.student_activity.success_criteria}
          </Text>
        </View>
      </Section>

      <Section icon="help-circle-outline" title="Formative check + exit ticket" time="5 min">
        <View style={{ gap: spacing.xs }}>
          {plan.formative_check.questions.map((q, i) => (
            <View key={i} style={styles.objRow}>
              <Text variant="bodyMedium" color={colors.amberDark}>
                Q{i + 1}.
              </Text>
              <Text variant="body" style={{ flex: 1, lineHeight: 21 }}>
                {q}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.exitBox}>
          <Text variant="caption" color={colors.muted} style={{ marginBottom: 2 }}>
            EXIT TICKET
          </Text>
          <Text variant="bodyMedium">{plan.formative_check.exit_ticket}</Text>
        </View>
      </Section>

      <Section icon="git-branch-outline" title="Differentiation">
        <ActionLine label="Support" text={plan.differentiation.support} />
        <View style={{ height: spacing.xs }} />
        <ActionLine label="Extension" text={plan.differentiation.extension} />
      </Section>

      {plan.homework ? (
        <Section icon="home-outline" title="Homework">
          <Text variant="body" style={{ lineHeight: 21 }}>
            {plan.homework}
          </Text>
        </Section>
      ) : null}
    </View>
  );
}

function HeaderBlock({ plan }: { plan: LessonPlan }) {
  const h = plan.header;
  return (
    <Card highlight>
      <Text variant="caption" color={colors.ink}>
        {h.board} · {h.grade} · {h.subject}
      </Text>
      <Text variant="h2" color={colors.ink} style={{ marginTop: 2 }}>
        {h.topic}
      </Text>
      <View style={styles.metaRow}>
        <Meta icon="time-outline" text={h.duration} />
        <Meta icon="calendar-outline" text={h.date} />
        <Meta icon="person-outline" text={h.teacher} />
      </View>
    </Card>
  );
}

function Section({
  icon,
  title,
  time,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  time?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.amberDark} />
        <Text variant="label" style={{ flex: 1 }}>
          {title}
        </Text>
        {time ? <Pill label={time} tone="amber" /> : null}
      </View>
      <View style={{ marginTop: spacing.sm }}>{children}</View>
    </Card>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.objRow}>
      <Text variant="body" color={colors.amberDark}>
        •
      </Text>
      <Text variant="body" style={{ flex: 1, lineHeight: 21 }}>
        {text}
      </Text>
    </View>
  );
}

function ActionLine({ label, text }: { label: string; text: string }) {
  return (
    <Text variant="caption" color={colors.muted} style={{ lineHeight: 19 }}>
      <Text variant="caption" color={colors.ink} style={{ fontWeight: '700' }}>
        {label}:{' '}
      </Text>
      {text}
    </Text>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={13} color={colors.ink} />
      <Text variant="caption" color={colors.ink}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  objRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md },
  step: { flexDirection: 'row', gap: spacing.sm },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FCE8B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBox: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: '#D8F2E6',
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  exitBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.canvas,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
});
