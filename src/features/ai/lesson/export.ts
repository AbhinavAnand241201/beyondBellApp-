import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { colors } from '@/theme/tokens';
import type { LessonPlan } from './types';

/**
 * Lesson plan export (§6). Three formats:
 *  - Clipboard: plain text with ALL-CAPS section headers for pasting anywhere (§6.3).
 *  - PDF: on-device HTML→PDF via expo-print, then the OS share sheet (§6.2).
 *  - Word (.docx): deferred — needs the docx library / server render (§6.1). For
 *    now "Word" shares the plain-text version and is labelled accordingly.
 * All three run fully client-side — no backend keys required.
 */

export function planToPlainText(plan: LessonPlan): string {
  const h = plan.header;
  const lines: string[] = [];
  lines.push(`LESSON PLAN — ${h.topic.toUpperCase()}`);
  lines.push(`${h.board} · ${h.grade} · ${h.subject} · ${h.duration}`);
  lines.push(`Date: ${h.date}    Teacher: ${h.teacher}`);
  lines.push('');

  lines.push('LEARNING OBJECTIVES');
  plan.objectives.forEach((o, i) => lines.push(`${i + 1}. ${o}${plan.bloom_levels[i] ? `  [${plan.bloom_levels[i]}]` : ''}`));
  lines.push('');

  lines.push('MATERIALS & RESOURCES');
  plan.materials.forEach((m) => lines.push(`- ${m}`));
  lines.push('');

  lines.push(`HOOK / STARTER (${plan.hook.duration})`);
  lines.push(plan.hook.activity);
  lines.push(plan.hook.instructions);
  lines.push('');

  lines.push('CONCEPT DELIVERY');
  plan.concept_delivery.forEach((s) => {
    lines.push(`${s.step}. ${s.title}`);
    lines.push(`   ${s.content}`);
    lines.push(`   Teacher: ${s.teacher_action}`);
    lines.push(`   Students: ${s.student_action}`);
  });
  lines.push('');

  lines.push(`STUDENT ACTIVITY (${plan.student_activity.duration}) — ${plan.student_activity.type}`);
  lines.push(plan.student_activity.title);
  lines.push(plan.student_activity.instructions);
  lines.push(`Success criteria: ${plan.student_activity.success_criteria}`);
  lines.push('');

  lines.push('FORMATIVE CHECK');
  plan.formative_check.questions.forEach((q, i) => lines.push(`Q${i + 1}. ${q}`));
  lines.push(`EXIT TICKET: ${plan.formative_check.exit_ticket}`);
  lines.push('');

  lines.push('DIFFERENTIATION');
  lines.push(`Support: ${plan.differentiation.support}`);
  lines.push(`Extension: ${plan.differentiation.extension}`);

  if (plan.homework) {
    lines.push('');
    lines.push('HOMEWORK');
    lines.push(plan.homework);
  }

  return lines.join('\n');
}

export async function copyPlanToClipboard(plan: LessonPlan): Promise<void> {
  await Clipboard.setStringAsync(planToPlainText(plan));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** BeyondBell-styled HTML for PDF rendering (§6.1 — yellow accent, A4) (§6.2). */
export function planToHtml(plan: LessonPlan): string {
  const h = plan.header;
  const objectives = plan.objectives
    .map((o, i) => `<li>${esc(o)} ${plan.bloom_levels[i] ? `<span class="badge">${esc(plan.bloom_levels[i] as string)}</span>` : ''}</li>`)
    .join('');
  const materials = plan.materials.map((m) => `<li>${esc(m)}</li>`).join('');
  const steps = plan.concept_delivery
    .map(
      (s) =>
        `<div class="step"><b>${s.step}. ${esc(s.title)}</b><p>${esc(s.content)}</p>
         <p class="sub"><b>Teacher:</b> ${esc(s.teacher_action)}</p>
         <p class="sub"><b>Students:</b> ${esc(s.student_action)}</p></div>`,
    )
    .join('');
  const questions = plan.formative_check.questions.map((q, i) => `<li>Q${i + 1}. ${esc(q)}</li>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
  <style>
    * { font-family: -apple-system, Helvetica, Arial, sans-serif; color: ${colors.ink}; }
    body { padding: 28px; }
    .head { background: ${colors.amber}; border-radius: 10px; padding: 16px 18px; margin-bottom: 18px; }
    .head .crumbs { font-size: 12px; }
    .head h1 { margin: 4px 0 8px; font-size: 22px; }
    .head .meta { font-size: 12px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .04em; color: #7A5A00; margin: 22px 0 8px; }
    ul { margin: 0; padding-left: 18px; } li { margin: 4px 0; font-size: 13px; line-height: 1.5; }
    p { font-size: 13px; line-height: 1.5; } .sub { color: #555; font-size: 12px; margin: 2px 0; }
    .badge { background: #FCE8B8; color: #7A5A00; font-size: 10px; padding: 2px 6px; border-radius: 8px; }
    .box { border-left: 3px solid ${colors.amber}; background: #FAFAFA; padding: 10px 12px; border-radius: 6px; }
    .step { margin-bottom: 12px; }
  </style></head><body>
    <div class="head">
      <div class="crumbs">${esc(h.board)} · ${esc(h.grade)} · ${esc(h.subject)}</div>
      <h1>${esc(h.topic)}</h1>
      <div class="meta">⏱ ${esc(h.duration)} &nbsp;&nbsp; 📅 ${esc(h.date)} &nbsp;&nbsp; 👤 ${esc(h.teacher)}</div>
    </div>
    <h2>Learning Objectives</h2><ol>${objectives}</ol>
    <h2>Materials &amp; Resources</h2><ul>${materials}</ul>
    <h2>Hook / Starter (${esc(plan.hook.duration)})</h2>
    <p><b>${esc(plan.hook.activity)}</b></p><p>${esc(plan.hook.instructions)}</p>
    <h2>Concept Delivery</h2>${steps}
    <h2>Student Activity (${esc(plan.student_activity.duration)}) — ${esc(plan.student_activity.type)}</h2>
    <p><b>${esc(plan.student_activity.title)}</b></p><p>${esc(plan.student_activity.instructions)}</p>
    <div class="box">Success criteria: ${esc(plan.student_activity.success_criteria)}</div>
    <h2>Formative Check + Exit Ticket</h2><ol>${questions}</ol>
    <div class="box">EXIT TICKET: ${esc(plan.formative_check.exit_ticket)}</div>
    <h2>Differentiation</h2>
    <p><b>Support:</b> ${esc(plan.differentiation.support)}</p>
    <p><b>Extension:</b> ${esc(plan.differentiation.extension)}</p>
    ${plan.homework ? `<h2>Homework</h2><p>${esc(plan.homework)}</p>` : ''}
  </body></html>`;
}

/** Generate a PDF on-device and open the OS share sheet. */
export async function exportPlanPdf(plan: LessonPlan): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: planToHtml(plan) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share lesson plan' });
  }
}
