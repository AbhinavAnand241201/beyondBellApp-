import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { colors } from '@/theme/tokens';
import type { ComplianceDocument } from './types';

/**
 * Compliance document export (§ Export Formats). Clipboard + on-device PDF run
 * client-side. Word (.docx) deferred → shares text. Includes the evidence folder
 * structure (§3.3) verbatim.
 */
export function documentToPlainText(doc: ComplianceDocument): string {
  const L: string[] = [];
  L.push(doc.title.toUpperCase());
  if (doc.rating) L.push(`Self-appraisal rating: ${doc.rating}`);
  L.push('');
  doc.sections.forEach((s) => {
    L.push(s.heading.toUpperCase());
    L.push(s.body);
    L.push('');
  });
  L.push('EVIDENCE CHECKLIST');
  doc.evidenceChecklist.forEach((e) => L.push(`[ ] ${e.item} — ${e.format} (${e.responsible})`));
  L.push('');
  L.push('EVIDENCE FOLDER STRUCTURE');
  L.push(doc.folderStructure);
  L.push('');
  L.push('IMPROVEMENT PLAN');
  doc.improvementPlan.forEach((a) => L.push(`- ${a.action} | ${a.timeline} | ${a.measure}`));
  return L.join('\n');
}

export async function copyDocument(doc: ComplianceDocument): Promise<void> {
  await Clipboard.setStringAsync(documentToPlainText(doc));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function documentToHtml(doc: ComplianceDocument): string {
  const sections = doc.sections.map((s) => `<h2>${esc(s.heading)}</h2><p>${esc(s.body)}</p>`).join('');
  const evidence = doc.evidenceChecklist
    .map((e) => `<tr><td>☐ ${esc(e.item)}</td><td>${esc(e.format)}</td><td>${esc(e.responsible)}</td></tr>`)
    .join('');
  const plan = doc.improvementPlan
    .map((a) => `<tr><td>${esc(a.action)}</td><td>${esc(a.timeline)}</td><td>${esc(a.measure)}</td></tr>`)
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    *{font-family:-apple-system,Helvetica,Arial,sans-serif;color:${colors.ink};}
    body{padding:28px;} h1{font-size:20px;} h2{font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:#7A5A00;margin:18px 0 6px;}
    p{font-size:13px;line-height:1.6;} table{border-collapse:collapse;width:100%;font-size:12px;margin-top:6px;}
    th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;} th{background:#FAFAFA;}
    pre{background:#FAFAFA;border:1px solid #eee;border-radius:6px;padding:12px;font-size:12px;white-space:pre-wrap;}
    .head{background:${colors.amber};border-radius:10px;padding:14px 16px;margin-bottom:12px;}
  </style></head><body>
    <div class="head"><h1>${esc(doc.title)}</h1>${doc.rating ? `<div>Rating: ${esc(doc.rating)}</div>` : ''}</div>
    ${sections}
    <h2>Evidence Checklist</h2><table><tr><th>Item</th><th>Format</th><th>Responsible</th></tr>${evidence}</table>
    <h2>Evidence Folder Structure</h2><pre>${esc(doc.folderStructure)}</pre>
    <h2>Improvement Plan</h2><table><tr><th>Action</th><th>Timeline</th><th>Measure</th></tr>${plan}</table>
  </body></html>`;
}

export async function exportDocumentPdf(doc: ComplianceDocument): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: documentToHtml(doc) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share compliance document' });
  }
}
