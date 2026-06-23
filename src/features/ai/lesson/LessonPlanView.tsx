import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { LessonPlan } from './types';

/** Renders the full 7-part BeyondBell lesson plan (§2.2). Presentational only. */
export function LessonPlanView({ plan }: { plan: LessonPlan }) {
  const h = plan.header;
  const tags = [h.subject, h.grade, h.board, h.duration].filter(Boolean);

  return (
    <View style={{ gap: spacing.md }}>
      {/* Meta chips + title */}
      <View style={{ gap: spacing.sm }}>
        <View style={styles.tagRow}>
          {tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
        <Text variant="display" style={styles.title}>
          {h.topic}
        </Text>
        <Text variant="body" color={colors.muted}>
          Lesson Architect · {h.board} {h.grade} · {h.duration}
        </Text>
      </View>

      <Section number={1} title="Learning objectives">
        <View style={{ gap: spacing.sm }}>
          {plan.bloom_levels.length > 0 ? (
            <View style={styles.bloomRow}>
              {plan.bloom_levels.map((b, i) => (
                <View key={`${b}-${i}`} style={styles.bloomChip}>
                  <Text style={styles.bloomText}>#{b}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {plan.objectives.map((o, i) => (
            <View key={i} style={styles.objRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} style={{ marginTop: 1 }} />
              <Text variant="body" style={{ flex: 1, lineHeight: 22 }}>
                {o}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section number={2} title="Materials & resources">
        <View style={{ gap: spacing.xs }}>
          {plan.materials.map((m, i) => (
            <Bullet key={i} text={m} />
          ))}
        </View>
      </Section>

      <Section number={3} title="Hook / starter" time={plan.hook.duration}>
        <Text variant="label">{plan.hook.activity}</Text>
        <Text variant="body" style={{ marginTop: spacing.xs, lineHeight: 22 }}>
          {plan.hook.instructions}
        </Text>
      </Section>

      <Section number={4} title="Main teaching content">
        <View style={{ gap: spacing.md }}>
          {plan.concept_delivery.map((step) => (
            <View key={step.step} style={{ gap: spacing.xs }}>
              <Text style={styles.stepKicker}>STEP {step.step}</Text>
              <Text variant="label">{step.title}</Text>
              <Text variant="body" style={{ lineHeight: 22 }}>
                {step.content}
              </Text>
              <TeacherTip label="Teacher" text={step.teacher_action} />
              <TeacherTip label="Students" text={step.student_action} muted />
            </View>
          ))}
        </View>
      </Section>

      <Section number={5} title="Student activity" time={plan.student_activity.duration}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="label">{plan.student_activity.title}</Text>
          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{plan.student_activity.type}</Text>
          </View>
        </View>
        <Text variant="body" style={{ marginTop: spacing.xs, lineHeight: 22 }}>
          {plan.student_activity.instructions}
        </Text>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-done-outline" size={16} color={colors.success} />
          <Text variant="caption" color={colors.muted} style={{ flex: 1 }}>
            Success criteria: {plan.student_activity.success_criteria}
          </Text>
        </View>
      </Section>

      <Section number={6} title="Formative check + exit ticket" time="5 MIN">
        <View style={{ gap: spacing.xs }}>
          {plan.formative_check.questions.map((q, i) => (
            <View key={i} style={styles.objRow}>
              <Text variant="bodyMedium" color={colors.amberDark}>
                Q{i + 1}.
              </Text>
              <Text variant="body" style={{ flex: 1, lineHeight: 22 }}>
                {q}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.exitBox}>
          <Text style={styles.exitLabel}>EXIT TICKET</Text>
          <Text variant="bodyMedium">{plan.formative_check.exit_ticket}</Text>
        </View>
      </Section>

      <Section number={7} title="Differentiation">
        <TeacherTip label="Support" text={plan.differentiation.support} />
        <View style={{ height: spacing.sm }} />
        <TeacherTip label="Extension" text={plan.differentiation.extension} />
      </Section>

      {plan.homework ? (
        <Section number={8} title="Closure & homework">
          <Text variant="body" style={{ lineHeight: 22 }}>
            {plan.homework}
          </Text>
        </Section>
      ) : null}
    </View>
  );
}

/** Collapsible card; open by default. Step number lives in the header (no timeline). */
function Section({
  number,
  title,
  time,
  children,
}: {
  number: number;
  title: string;
  time?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.card}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.cardHeader}>
        <View style={styles.numCircle}>
          <Text style={styles.numText}>{number}</Text>
        </View>
        <Text variant="h3" style={{ flex: 1 }}>
          {title}
        </Text>
        {time ? (
          <View style={styles.timeTag}>
            <Text style={styles.timeText}>{time}</Text>
          </View>
        ) : null}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedLight} />
      </Pressable>
      {open ? <View style={styles.cardBody}>{children}</View> : null}
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.objRow}>
      <Text variant="body" color={colors.amberDark}>
        •
      </Text>
      <Text variant="body" style={{ flex: 1, lineHeight: 22 }}>
        {text}
      </Text>
    </View>
  );
}

/** Inset box with a left amber border for teacher/student guidance. */
function TeacherTip({ label, text, muted }: { label: string; text: string; muted?: boolean }) {
  return (
    <View style={styles.tipBox}>
      <Text variant="caption" color={muted ? colors.muted : colors.amberDark} style={{ fontFamily: fonts.bodySemibold }}>
        {label}
      </Text>
      <Text variant="body" color={colors.muted} style={{ lineHeight: 21, fontStyle: 'italic' }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { height: 28, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: '#FFFBEB' },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#D97706' },
  title: { fontSize: 28, lineHeight: 34 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  numCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.ink },
  cardBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  timeTag: { height: 24, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.pill, backgroundColor: '#FFFBEB' },
  timeText: { fontFamily: fonts.bodySemibold, fontSize: 11, color: '#D97706', letterSpacing: 0.3 },

  bloomRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.xs },
  bloomChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: '#EDE9FE' },
  bloomText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: '#6D28D9' },

  objRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepKicker: { fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.mutedLight, letterSpacing: 0.5 },
  typePill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.canvas },
  typePillText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted },

  tipBox: { borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#FAFAFA', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, gap: 2 },
  successBox: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', marginTop: spacing.sm, backgroundColor: '#D8F2E6', padding: spacing.sm, borderRadius: radius.sm },
  exitBox: { marginTop: spacing.sm, backgroundColor: colors.canvas, padding: spacing.md, borderRadius: radius.sm, borderLeftWidth: 3, borderLeftColor: colors.amber },
  exitLabel: { fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.muted, letterSpacing: 0.5, marginBottom: 2 },
});
