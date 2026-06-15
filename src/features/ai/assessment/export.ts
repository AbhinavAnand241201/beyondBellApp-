import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { colors } from '@/theme/tokens';
import { allQuestions, computeBlueprint } from './engine';
import type { AssessmentPaper } from './types';

/**
 * Assessment export (design doc §6). Clipboard (plain text) and PDF (on-device
 * via expo-print) run fully client-side — no backend. Word (.docx) is deferred
 * and shares the text form for now.
 */

export function paperToPlainText(paper: AssessmentPaper, includeAnswers: boolean): string {
  const h = paper.header;
  const out: string[] = [];
  out.push(`${String(h.subject).toUpperCase()} — ${h.grade} (${h.board})`);
  out.push(`Max Marks: ${h.totalMarks}    Time: ${h.duration}`);
  out.push('');
  out.push('GENERAL INSTRUCTIONS');
  h.generalInstructions.forEach((g, i) => out.push(`${i + 1}. ${g}`));
  out.push('');

  for (const s of paper.sections) {
    out.push(`${s.name.toUpperCase()} — ${s.title} (${s.marksEach} marks each)`);
    s.questions.forEach((q, i) => {
      out.push(`${i + 1}. ${q.question}  [${q.marks}]`);
      if (q.options) q.options.forEach((o) => out.push(`   ${o}`));
      if (includeAnswers) out.push(`   Ans: ${q.answer}`);
    });
    out.push('');
  }
  return out.join('\n');
}

export async function copyPaper(paper: AssessmentPaper, includeAnswers: boolean): Promise<void> {
  await Clipboard.setStringAsync(paperToPlainText(paper, includeAnswers));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function paperToHtml(paper: AssessmentPaper, opts: { answerKey: boolean; markingScheme: boolean }): string {
  const h = paper.header;
  const questions = allQuestions(paper.sections);
  const bp = computeBlueprint(questions);

  const sectionsHtml = paper.sections
    .map((s) => {
      const qs = s.questions
        .map((q, i) => {
          const opts = q.options ? `<div class="opts">${q.options.map((o) => `<span>${esc(o)}</span>`).join('')}</div>` : '';
          return `<div class="q"><b>${i + 1}.</b> ${esc(q.question)} <span class="m">[${q.marks}]</span>${opts}</div>`;
        })
        .join('');
      return `<h2>${esc(s.name)} — ${esc(s.title)} <span class="me">(${s.marksEach} each)</span></h2>${qs}`;
    })
    .join('');

  const answerKeyHtml = opts.answerKey
    ? `<div class="page"></div><h1>Answer Key</h1>${questions
        .map((q) => `<div class="q"><b>${q.id}.</b> ${esc(q.answer)} <span class="m">[${q.marks}]</span></div>`)
        .join('')}`
    : '';

  const schemeHtml = opts.markingScheme
    ? `<div class="page"></div><h1>Marking Scheme</h1><table><tr><th>Q</th><th>Value points</th><th>Marks</th></tr>${questions
        .map((q) => `<tr><td>${q.id}</td><td>${q.valuePoints.map(esc).join('; ')}</td><td>${q.marks}</td></tr>`)
        .join('')}</table>`
    : '';

  const blueprintHtml = `<div class="page"></div><h1>Blueprint</h1><table><tr><th>Topic</th>${bp.blooms
    .map((b) => `<th>${b}</th>`)
    .join('')}<th>Total</th></tr>${bp.rows
    .map(
      (r) => `<tr><td>${esc(r.topic)}</td>${bp.blooms.map((b) => `<td>${r.byBloom[b] || ''}</td>`).join('')}<td>${r.total}</td></tr>`,
    )
    .join('')}<tr class="tot"><td>Total</td>${bp.blooms
    .map((b) => `<td>${bp.columnTotals[b] || ''}</td>`)
    .join('')}<td>${bp.grandTotal}</td></tr></table>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    * { font-family: -apple-system, Helvetica, Arial, sans-serif; color:${colors.ink}; }
    body { padding: 28px; } .page { page-break-before: always; }
    .head { background:${colors.amber}; border-radius:10px; padding:14px 16px; margin-bottom:14px; }
    .head h1 { margin:0 0 4px; font-size:20px; } .head .meta { font-size:12px; }
    h1 { font-size:18px; margin:18px 0 10px; }
    h2 { font-size:14px; background:#FCE8B8; padding:6px 10px; border-radius:6px; margin:16px 0 8px; }
    .me, .m { color:#7A5A00; font-size:12px; } .q { font-size:13px; line-height:1.5; margin:6px 0; }
    .opts { display:flex; gap:14px; flex-wrap:wrap; margin:4px 0 0 16px; font-size:12px; color:#444; }
    table { border-collapse: collapse; width:100%; font-size:12px; margin-top:6px; }
    th,td { border:1px solid #ddd; padding:6px 8px; text-align:left; } th { background:#FAFAFA; }
    .tot td { font-weight:700; background:#FCE8B8; }
  </style></head><body>
    <div class="head"><h1>${esc(String(h.subject))} — ${esc(h.grade)}</h1>
      <div class="meta">${esc(String(h.board))} &nbsp;·&nbsp; Max Marks: ${h.totalMarks} &nbsp;·&nbsp; Time: ${esc(h.duration)}</div></div>
    <h2 style="background:none;padding:0">General Instructions</h2>
    <ol>${h.generalInstructions.map((g) => `<li>${esc(g)}</li>`).join('')}</ol>
    ${sectionsHtml}
    ${answerKeyHtml}
    ${schemeHtml}
    ${blueprintHtml}
  </body></html>`;
}

export async function exportPaperPdf(
  paper: AssessmentPaper,
  opts: { answerKey: boolean; markingScheme: boolean },
): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: paperToHtml(paper, opts) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share assessment' });
  }
}
