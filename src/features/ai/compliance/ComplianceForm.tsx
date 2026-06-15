import { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Segmented, Select, Text, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import {
  COMPLIANCE_BOARD_OPTIONS,
  PACK_CATALOG,
  SCHOOL_SIZE_OPTIONS,
  SCHOOL_STAGE_OPTIONS,
  SCHOOL_TYPE_OPTIONS,
  SQAA_DOMAINS,
  getDomain,
  type ComplianceBoard,
  type ComplianceInput,
  type Mode,
  type PackCategory,
  type SchoolSize,
  type SchoolStage,
  type SchoolType,
} from './types';

export interface ComplianceFormProps {
  value: ComplianceInput;
  onChange: (next: ComplianceInput) => void;
}

/** Compliance Generator form (§2.1 two modes, §2.2 inputs). Fields change by mode. */
export function ComplianceForm({ value, onChange }: ComplianceFormProps) {
  const packCategory = PACK_CATALOG.find((c) => c.category === value.category);
  const domainInfo = getDomain(value.domain);

  // When the category changes, reset the document type to the first valid one.
  const categoryDocs = useMemo(() => packCategory?.documents ?? [], [packCategory]);

  function setMode(mode: Mode) {
    onChange({ ...value, mode });
  }
  function setCategory(category: PackCategory) {
    const cat = PACK_CATALOG.find((c) => c.category === category);
    const documentType = cat?.documents.includes(value.documentType) ? value.documentType : (cat?.documents[0] ?? '');
    onChange({ ...value, category, documentType });
  }

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Mode toggle */}
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">Mode</Text>
        <Segmented
          options={[
            { value: 'sqaa', label: 'SQAA Domain' },
            { value: 'pack', label: 'Compliance Pack' },
          ]}
          value={value.mode}
          onChange={(v) => setMode(v as Mode)}
        />
        <Text variant="caption" color={colors.muted}>
          {value.mode === 'sqaa'
            ? 'Generate full self-appraisal documentation for one SQAA domain.'
            : 'Generate a single policy, SOP, or governance document.'}
        </Text>
      </View>

      {value.mode === 'sqaa' ? (
        <>
          <Select
            label="SQAA domain"
            value={String(value.domain)}
            options={SQAA_DOMAINS.map((d) => ({ value: String(d.number), label: `Domain ${d.number} — ${d.title}` }))}
            onChange={(v) => onChange({ ...value, domain: Number(v) })}
          />
          {domainInfo ? (
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Ionicons name="information-circle-outline" size={16} color={colors.amberDark} />
                <Text variant="caption" color={colors.muted} style={{ flex: 1 }}>
                  Documentation: {domainInfo.docTypes}
                </Text>
              </View>
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <Select
            label="Document category"
            value={value.category}
            options={PACK_CATALOG.map((c) => ({ value: c.category, label: c.category }))}
            onChange={(v) => setCategory(v as PackCategory)}
          />
          <Select
            label="Document type"
            value={value.documentType || null}
            options={categoryDocs.map((d) => ({ value: d, label: d }))}
            onChange={(v) => onChange({ ...value, documentType: v })}
          />
        </>
      )}

      {/* Shared school profile */}
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Select label="School type" value={value.schoolType} options={SCHOOL_TYPE_OPTIONS.map((s) => ({ value: s, label: s }))} onChange={(v) => onChange({ ...value, schoolType: v as SchoolType })} />
        </View>
        <View style={{ flex: 1 }}>
          <Select label="Board" value={value.board} options={COMPLIANCE_BOARD_OPTIONS.map((b) => ({ value: b, label: b }))} onChange={(v) => onChange({ ...value, board: v as ComplianceBoard })} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Select label="School size" value={value.schoolSize} options={SCHOOL_SIZE_OPTIONS.map((s) => ({ value: s, label: s }))} onChange={(v) => onChange({ ...value, schoolSize: v as SchoolSize })} />
        </View>
        <View style={{ flex: 1 }}>
          <Select label="Stage" value={value.schoolStage} options={SCHOOL_STAGE_OPTIONS.map((s) => ({ value: s, label: s }))} onChange={(v) => onChange({ ...value, schoolStage: v as SchoolStage })} />
        </View>
      </View>

      {value.mode === 'sqaa' ? (
        <>
          <TextField
            label="Existing strengths (optional)"
            value={value.strengths}
            onChangeText={(v) => onChange({ ...value, strengths: v })}
            placeholder="3–5 points the school is proud of"
            multiline
            numberOfLines={3}
            style={{ minHeight: 72, textAlignVertical: 'top' }}
          />
          <TextField
            label="Known gaps (optional)"
            value={value.gaps}
            onChangeText={(v) => onChange({ ...value, gaps: v })}
            placeholder="Areas you know need improvement"
            multiline
            numberOfLines={3}
            style={{ minHeight: 72, textAlignVertical: 'top' }}
          />
          <TextField label="SQAA review date (optional)" value={value.reviewDate} onChangeText={(v) => onChange({ ...value, reviewDate: v })} placeholder="DD/MM/YYYY" />
        </>
      ) : null}
    </View>
  );
}
