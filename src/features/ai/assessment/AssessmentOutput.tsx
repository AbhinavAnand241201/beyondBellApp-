import { useMemo, useState } from 'react';
// setIndex is controlled by the screen so the action bar can target the active set.
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Pill, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { allQuestions, computeBlueprint } from './engine';
import {
  OUTPUT_TABS,
  QUESTION_TYPE_LABEL,
  type AssessmentPackage,
  type AssessmentPaper,
  type OutputTab,
  type Question,
} from './types';

export interface AssessmentOutputProps {
  pkg: AssessmentPackage;
  /** Active set index — controlled by the screen so the action bar targets it. */
  setIndex: number;
  onSetChange: (index: number) => void;
  /** Tapping a question opens edit mode (§2.4). */
  onEditQuestion: (setIndex: number, sectionId: string, question: Question) => void;
}

/** Tabbed assessment output: set tabs (A/B/C) + Paper/Answers/Scheme/Blueprint. */
export function AssessmentOutput({ pkg, setIndex, onSetChange, onEditQuestion }: AssessmentOutputProps) {
  const [tab, setTab] = useState<OutputTab>('paper');
  const set = pkg.sets[setIndex] ?? pkg.sets[0];
  const paper = set?.paper;
  const questions = useMemo(() => (paper ? allQuestions(paper.sections) : []), [paper]);

  if (!paper) return null;

  const tabs = OUTPUT_TABS.filter((t) => {
    if (t.id === 'answers') return pkg.includeAnswerKey;
    if (t.id === 'scheme') return pkg.includeMarkingScheme;
    return true;
  });

  return (
    <View style={{ gap: spacing.md }}>
      {/* Set tabs (multi-set only) */}
      {pkg.sets.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {pkg.sets.map((s, i) => (
            <Pressable key={s.label} onPress={() => onSetChange(i)} style={[styles.setTab, i === setIndex && styles.setTabActive]}>
              <Text variant="label" color={i === setIndex ? colors.ink : colors.muted}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {/* Output tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {tabs.map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && styles.tabActive]}>
            <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={15} color={tab === t.id ? colors.ink : colors.muted} />
            <Text variant="caption" color={tab === t.id ? colors.ink : colors.muted} style={tab === t.id ? { fontWeight: '700' } : undefined}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === 'paper' ? <PaperTab paper={paper} onEditQuestion={(sectionId, q) => onEditQuestion(setIndex, sectionId, q)} /> : null}
      {tab === 'answers' ? <AnswerKeyTab questions={questions} /> : null}
      {tab === 'scheme' ? <MarkingTab questions={questions} /> : null}
      {tab === 'blueprint' ? <BlueprintTab questions={questions} /> : null}
    </View>
  );
}

function PaperTab({ paper, onEditQuestion }: { paper: AssessmentPaper; onEditQuestion: (sectionId: string, q: Question) => void }) {
  const h = paper.header;
  return (
    <View style={{ gap: spacing.md }}>
      <Card highlight>
        <Text variant="h3" color={colors.ink}>
          {h.subject}
        </Text>
        <Text variant="caption" color={colors.ink} style={{ marginTop: 2 }}>
          {h.board} · {h.grade}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
          <Text variant="caption" color={colors.ink}>
            Max Marks: {h.totalMarks}
          </Text>
          <Text variant="caption" color={colors.ink}>
            Time: {h.duration}
          </Text>
        </View>
      </Card>

      <Card>
        <Text variant="label" style={{ marginBottom: spacing.xs }}>
          General instructions
        </Text>
        {h.generalInstructions.map((g, i) => (
          <Text key={i} variant="caption" color={colors.muted} style={{ lineHeight: 19 }}>
            {i + 1}. {g}
          </Text>
        ))}
      </Card>

      {paper.sections.map((s) => (
        <View key={s.id} style={{ gap: spacing.sm }}>
          <View style={styles.sectionHeader}>
            <Text variant="label">{s.name}</Text>
            <Text variant="caption" color={colors.muted} style={{ flex: 1 }}>
              {s.title}
            </Text>
            <Pill label={`${s.marksEach} × ${s.questions.length}`} tone="amber" />
          </View>
          {s.questions.map((q, i) => (
            <QuestionCard key={q.id} index={i + 1} question={q} onPress={() => onEditQuestion(s.id, q)} />
          ))}
        </View>
      ))}
      <Text variant="caption" color={colors.mutedLight} style={{ textAlign: 'center', marginTop: spacing.xs }}>
        Tip: tap any question to edit or rephrase it.
      </Text>
    </View>
  );
}

function QuestionCard({ index, question, onPress }: { index: number; question: Question; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <Text variant="bodyMedium" color={colors.amberDark}>
            {index}.
          </Text>
          <View style={{ flex: 1 }}>
            <Text variant="body" style={{ lineHeight: 21 }}>
              {question.question}
            </Text>
            {question.options ? (
              <View style={{ marginTop: spacing.xs, gap: 2 }}>
                {question.options.map((o) => (
                  <Text key={o} variant="caption" color={colors.muted}>
                    {o}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={styles.metaRow}>
              <Pill label={QUESTION_TYPE_LABEL[question.type]} tone="neutral" />
              <Pill label={question.bloom} tone="amber" />
              {question.difficulty === 'HOTS' ? <Pill label="HOTS" tone="success" /> : null}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text variant="label" color={colors.amberDark}>
              {question.marks}
            </Text>
            <Ionicons name="create-outline" size={15} color={colors.mutedLight} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function AnswerKeyTab({ questions }: { questions: Question[] }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {questions.map((q) => (
        <Card key={q.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="label">{q.id}</Text>
            <Pill label={`${q.marks} marks`} tone="amber" />
          </View>
          <Text variant="body" style={{ marginTop: spacing.xs, lineHeight: 21 }}>
            {q.answer}
          </Text>
        </Card>
      ))}
    </View>
  );
}

function MarkingTab({ questions }: { questions: Question[] }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {questions.map((q) => (
        <Card key={q.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
            <Text variant="label">{q.id}</Text>
            <Text variant="caption" color={colors.muted}>
              {q.marks} marks
            </Text>
          </View>
          {q.valuePoints.map((v, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: spacing.xs }}>
              <Ionicons name="ellipse" size={6} color={colors.amberDark} style={{ marginTop: 7 }} />
              <Text variant="caption" color={colors.muted} style={{ flex: 1, lineHeight: 18 }}>
                {v}
              </Text>
            </View>
          ))}
          {q.examinerNote ? (
            <Text variant="caption" color={colors.mutedLight} style={{ marginTop: spacing.xs, fontStyle: 'italic' }}>
              Examiner: {q.examinerNote}
            </Text>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

function BlueprintTab({ questions }: { questions: Question[] }) {
  const bp = computeBlueprint(questions);
  return (
    <Card>
      <Text variant="label" style={{ marginBottom: spacing.sm }}>
        Bloom’s × Topic (marks)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.bpRow, styles.bpHeadRow]}>
            <Text variant="caption" style={[styles.bpCell, styles.bpTopicCell, { fontWeight: '700' }]}>
              Topic
            </Text>
            {bp.blooms.map((b) => (
              <Text key={b} variant="caption" style={[styles.bpCell, { fontWeight: '700' }]} numberOfLines={1}>
                {b.slice(0, 4)}
              </Text>
            ))}
            <Text variant="caption" style={[styles.bpCell, { fontWeight: '700' }]}>
              Tot
            </Text>
          </View>
          {bp.rows.map((r) => (
            <View key={r.topic} style={styles.bpRow}>
              <Text variant="caption" color={colors.muted} style={[styles.bpCell, styles.bpTopicCell]} numberOfLines={1}>
                {r.topic}
              </Text>
              {bp.blooms.map((b) => (
                <Text key={b} variant="caption" style={styles.bpCell}>
                  {r.byBloom[b] || '·'}
                </Text>
              ))}
              <Text variant="caption" style={[styles.bpCell, { fontWeight: '700' }]}>
                {r.total}
              </Text>
            </View>
          ))}
          <View style={[styles.bpRow, styles.bpTotalRow]}>
            <Text variant="caption" style={[styles.bpCell, styles.bpTopicCell, { fontWeight: '700' }]}>
              Total
            </Text>
            {bp.blooms.map((b) => (
              <Text key={b} variant="caption" style={[styles.bpCell, { fontWeight: '700' }]}>
                {bp.columnTotals[b] || '·'}
              </Text>
            ))}
            <Text variant="caption" style={[styles.bpCell, { fontWeight: '700' }]}>
              {bp.grandTotal}
            </Text>
          </View>
        </View>
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  tabRow: { gap: spacing.sm, paddingVertical: 2 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: '#FCE8B8', borderColor: colors.amber },
  setTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  setTabActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
  bpRow: { flexDirection: 'row' },
  bpHeadRow: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  bpTotalRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  bpCell: { width: 44, textAlign: 'center', paddingVertical: 6 },
  bpTopicCell: { width: 120, textAlign: 'left' },
});
