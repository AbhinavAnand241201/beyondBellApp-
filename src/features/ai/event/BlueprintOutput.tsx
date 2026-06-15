import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Pill, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { DOC_TABS, type DocTab, type EventBlueprint } from './types';

/** 8-document blueprint output (§1.3) with horizontally-scrollable doc tabs. */
export function BlueprintOutput({ blueprint }: { blueprint: EventBlueprint }) {
  const [tab, setTab] = useState<DocTab>('brief');
  return (
    <View style={{ gap: spacing.md }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        {DOC_TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && styles.tabActive]}>
            <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={15} color={tab === t.id ? colors.ink : colors.muted} />
            <Text variant="caption" color={tab === t.id ? colors.ink : colors.muted} style={tab === t.id ? { fontWeight: '700' } : undefined}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === 'brief' ? <BriefTab bp={blueprint} /> : null}
      {tab === 'programme' ? <ProgrammeTab bp={blueprint} /> : null}
      {tab === 'roles' ? <RolesTab bp={blueprint} /> : null}
      {tab === 'rehearsal' ? <RehearsalTab bp={blueprint} /> : null}
      {tab === 'budget' ? <BudgetTab bp={blueprint} /> : null}
      {tab === 'comms' ? <CommsTab bp={blueprint} /> : null}
      {tab === 'checklist' ? <ChecklistTab bp={blueprint} /> : null}
      {tab === 'scripts' ? <ScriptsTab bp={blueprint} /> : null}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ gap: spacing.xs }}>
      {items.map((it, i) => (
        <View key={i} style={styles.bulletRow}>
          <Ionicons name="ellipse" size={6} color={colors.amberDark} style={{ marginTop: 7 }} />
          <Text variant="body" style={{ flex: 1, lineHeight: 21 }}>
            {it}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <Text variant="label" style={{ marginBottom: spacing.sm }}>
        {title}
      </Text>
      {children}
    </Card>
  );
}

function BriefTab({ bp }: { bp: EventBlueprint }) {
  return (
    <View style={{ gap: spacing.md }}>
      <Card highlight>
        <Text variant="caption" color={colors.ink}>
          THEME
        </Text>
        <Text variant="h3" color={colors.ink}>
          {bp.brief.theme}
        </Text>
        <Text variant="body" color={colors.ink} style={{ marginTop: spacing.xs, lineHeight: 21 }}>
          {bp.brief.purpose}
        </Text>
      </Card>
      <SectionCard title="Highlights">
        <Bullets items={bp.brief.highlights} />
      </SectionCard>
      <SectionCard title="Success metrics">
        <Bullets items={bp.brief.successMetrics} />
      </SectionCard>
    </View>
  );
}

function ProgrammeTab({ bp }: { bp: EventBlueprint }) {
  return (
    <SectionCard title={`Running order · ${bp.programme.totalDuration}`}>
      <View style={{ gap: spacing.md }}>
        {bp.programme.items.map((i, idx) => (
          <View key={idx} style={styles.progRow}>
            <Text variant="label" color={colors.amberDark} style={{ width: 64 }}>
              {i.time}
            </Text>
            <View style={{ flex: 1 }}>
              <Text variant="body">{i.activity}</Text>
              <Text variant="caption" color={colors.muted}>
                {i.responsible}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

function RolesTab({ bp }: { bp: EventBlueprint }) {
  return (
    <View style={{ gap: spacing.md }}>
      <SectionCard title="Committees">
        <View style={{ gap: spacing.sm }}>
          {bp.roles.committees.map((c) => (
            <View key={c.name}>
              <Text variant="bodyMedium">
                {c.name} <Text variant="caption" color={colors.muted}>· lead: {c.lead}</Text>
              </Text>
              <Text variant="caption" color={colors.muted}>
                {c.scope}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
      <SectionCard title="Student roles">
        <View style={{ gap: spacing.md }}>
          {bp.roles.studentRoles.map((r) => (
            <View key={r.title}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Text variant="bodyMedium">{r.title}</Text>
                <Pill label={r.gradeRange} tone="amber" />
              </View>
              <Bullets items={r.responsibilities} />
              <Text variant="caption" color={colors.muted}>
                Reports to: {r.reportsTo}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
      <SectionCard title="Staff roles">
        <View style={{ gap: spacing.sm }}>
          {bp.roles.staffRoles.map((s) => (
            <View key={s.title}>
              <Text variant="bodyMedium">{s.title}</Text>
              <Text variant="caption" color={colors.muted}>
                {s.responsibilities.join(' · ')}
              </Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </View>
  );
}

function RehearsalTab({ bp }: { bp: EventBlueprint }) {
  return (
    <SectionCard title="Rehearsal schedule">
      <View style={{ gap: spacing.md }}>
        {bp.rehearsal.map((r) => (
          <View key={r.label} style={styles.progRow}>
            <Pill label={r.label} tone="neutral" />
            <Text variant="body" style={{ flex: 1 }}>
              {r.focus}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

function BudgetTab({ bp }: { bp: EventBlueprint }) {
  return (
    <View style={{ gap: spacing.md }}>
      {bp.budget.groups.map((g) => (
        <SectionCard key={g.name} title={g.name}>
          <View style={{ gap: spacing.xs }}>
            {g.items.map((it) => (
              <View key={it.item} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md }}>
                <Text variant="body" color={colors.muted} style={{ flex: 1 }}>
                  {it.item}
                </Text>
                <Text variant="bodyMedium">{it.range}</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      ))}
      <Card highlight>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="label" color={colors.ink}>
            Total (target)
          </Text>
          <Text variant="label" color={colors.ink}>
            {bp.budget.total}
          </Text>
        </View>
        <Text variant="caption" color={colors.ink} style={{ marginTop: 2 }}>
          Plus contingency: {bp.budget.contingency}
        </Text>
      </Card>
    </View>
  );
}

function CommsTab({ bp }: { bp: EventBlueprint }) {
  return (
    <View style={{ gap: spacing.md }}>
      {bp.comms.map((c, i) => (
        <Card key={i}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
            <Text variant="label" style={{ flex: 1 }}>
              {c.what}
            </Text>
            <Pill label={c.when} tone="amber" />
          </View>
          <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
            {c.channel} → {c.audience}
          </Text>
          <View style={styles.draftBox}>
            <Text variant="body" color={colors.muted} style={{ lineHeight: 20 }}>
              {c.draft}
            </Text>
          </View>
        </Card>
      ))}
    </View>
  );
}

function ChecklistTab({ bp }: { bp: EventBlueprint }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const total = bp.checklist.reduce((n, p) => n + p.items.length, 0);
  const done = checked.size;

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <Text variant="label">
          {done}/{total} done
        </Text>
        <Text variant="caption" color={colors.muted}>
          Tap items to track progress (saved on this screen).
        </Text>
      </Card>
      {bp.checklist.map((phase) => (
        <SectionCard key={phase.phase} title={phase.phase}>
          <View style={{ gap: spacing.sm }}>
            {phase.items.map((it, idx) => {
              const key = `${phase.phase}-${idx}`;
              const isDone = checked.has(key);
              return (
                <Pressable key={key} onPress={() => toggle(key)} style={styles.checkRow}>
                  <Ionicons
                    name={isDone ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={isDone ? colors.success : colors.mutedLight}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="body" color={isDone ? colors.muted : colors.ink} style={isDone ? styles.strike : undefined}>
                      {it.item}
                    </Text>
                    <Text variant="caption" color={colors.muted}>
                      {it.responsible} · {it.deadline}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>
      ))}
    </View>
  );
}

function ScriptsTab({ bp }: { bp: EventBlueprint }) {
  return (
    <View style={{ gap: spacing.md }}>
      <SectionCard title="MC script">
        <View style={{ gap: spacing.sm }}>
          {bp.scripts.mc.map((line, i) => (
            <Text key={i} variant="body" style={{ lineHeight: 21 }}>
              {line}
            </Text>
          ))}
        </View>
      </SectionCard>
      <SectionCard title="Welcome address">
        <Bullets items={bp.scripts.welcomeAddress} />
      </SectionCard>
      <SectionCard title="Vote of thanks">
        <Bullets items={bp.scripts.voteOfThanks} />
      </SectionCard>
    </View>
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
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  progRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  draftBox: { marginTop: spacing.sm, backgroundColor: colors.canvas, padding: spacing.md, borderRadius: radius.sm, borderLeftWidth: 3, borderLeftColor: colors.amber },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  strike: { textDecorationLine: 'line-through' },
});
