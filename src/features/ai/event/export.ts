import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { colors } from '@/theme/tokens';
import type { EventBlueprint } from './types';

/**
 * Event blueprint export (§ Export Formats). Clipboard (plain text) and PDF
 * (on-device via expo-print) run client-side. Word (.docx) deferred → shares text.
 */

export function blueprintToPlainText(bp: EventBlueprint, eventName: string): string {
  const L: string[] = [];
  L.push(`EVENT BLUEPRINT — ${eventName.toUpperCase()}`);
  L.push('');
  L.push('1. EVENT BRIEF');
  L.push(`Purpose: ${bp.brief.purpose}`);
  L.push(`Theme: ${bp.brief.theme}   Audience: ${bp.brief.audience}`);
  L.push(`Highlights: ${bp.brief.highlights.join(', ')}`);
  L.push('');
  L.push(`2. PROGRAMME FLOW (${bp.programme.totalDuration})`);
  bp.programme.items.forEach((i) => L.push(`${i.time} — ${i.activity} [${i.responsible}]`));
  L.push('');
  L.push('3. ROLE ASSIGNMENTS');
  bp.roles.committees.forEach((c) => L.push(`• ${c.name} (lead: ${c.lead}) — ${c.scope}`));
  bp.roles.studentRoles.forEach((r) => L.push(`• ${r.title} (${r.gradeRange}) → ${r.reportsTo}`));
  L.push('');
  L.push('4. REHEARSAL SCHEDULE');
  bp.rehearsal.forEach((r) => L.push(`${r.label}: ${r.focus}`));
  L.push('');
  L.push(`5. BUDGET (total: ${bp.budget.total}, contingency: ${bp.budget.contingency})`);
  bp.budget.groups.forEach((g) => {
    L.push(g.name);
    g.items.forEach((it) => L.push(`  - ${it.item}: ${it.range}`));
  });
  L.push('');
  L.push('6. COMMUNICATION PLAN');
  bp.comms.forEach((c) => L.push(`${c.when} · ${c.channel} → ${c.audience}: ${c.what}`));
  L.push('');
  L.push('7. MASTER CHECKLIST');
  bp.checklist.forEach((p) => {
    L.push(p.phase);
    p.items.forEach((it) => L.push(`  [ ] ${it.item} (${it.responsible}, ${it.deadline})`));
  });
  L.push('');
  L.push('8. SCRIPT OUTLINES');
  L.push('MC:');
  bp.scripts.mc.forEach((s) => L.push(`  ${s}`));
  L.push('Welcome address:');
  bp.scripts.welcomeAddress.forEach((s) => L.push(`  - ${s}`));
  L.push('Vote of thanks:');
  bp.scripts.voteOfThanks.forEach((s) => L.push(`  - ${s}`));
  return L.join('\n');
}

export async function copyBlueprint(bp: EventBlueprint, eventName: string): Promise<void> {
  await Clipboard.setStringAsync(blueprintToPlainText(bp, eventName));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function blueprintToHtml(bp: EventBlueprint, eventName: string): string {
  const li = (arr: string[]) => arr.map((x) => `<li>${esc(x)}</li>`).join('');
  const programme = bp.programme.items
    .map((i) => `<tr><td>${esc(i.time)}</td><td>${esc(i.activity)}</td><td>${esc(i.responsible)}</td></tr>`)
    .join('');
  const committees = bp.roles.committees.map((c) => `<li><b>${esc(c.name)}</b> (lead: ${esc(c.lead)}) — ${esc(c.scope)}</li>`).join('');
  const budget = bp.budget.groups
    .map((g) => `<tr><td><b>${esc(g.name)}</b></td><td>${g.items.map((it) => `${esc(it.item)}: ${esc(it.range)}`).join('<br/>')}</td></tr>`)
    .join('');
  const comms = bp.comms.map((c) => `<tr><td>${esc(c.when)}</td><td>${esc(c.channel)}</td><td>${esc(c.audience)}</td><td>${esc(c.what)}</td></tr>`).join('');
  const checklist = bp.checklist
    .map((p) => `<h3>${esc(p.phase)}</h3><ul>${p.items.map((it) => `<li>☐ ${esc(it.item)} <i>(${esc(it.responsible)}, ${esc(it.deadline)})</i></li>`).join('')}</ul>`)
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    *{font-family:-apple-system,Helvetica,Arial,sans-serif;color:${colors.ink};}
    body{padding:28px;} h1{font-size:20px;} h2{font-size:15px;background:#FCE8B8;padding:6px 10px;border-radius:6px;margin:18px 0 8px;}
    h3{font-size:13px;margin:10px 0 4px;} li,td{font-size:12px;line-height:1.5;} .page{page-break-before:always;}
    table{border-collapse:collapse;width:100%;} td{border:1px solid #ddd;padding:6px 8px;vertical-align:top;}
    .head{background:${colors.amber};border-radius:10px;padding:14px 16px;margin-bottom:12px;}
  </style></head><body>
    <div class="head"><h1>Event Blueprint — ${esc(eventName)}</h1></div>
    <h2>1. Event Brief</h2>
    <p><b>Purpose:</b> ${esc(bp.brief.purpose)}</p>
    <p><b>Theme:</b> ${esc(bp.brief.theme)} &nbsp; <b>Audience:</b> ${esc(bp.brief.audience)}</p>
    <p><b>Highlights:</b></p><ul>${li(bp.brief.highlights)}</ul>
    <h2>2. Programme Flow (${esc(bp.programme.totalDuration)})</h2>
    <table><tr><td><b>Time</b></td><td><b>Activity</b></td><td><b>Responsible</b></td></tr>${programme}</table>
    <h2>3. Role Assignments</h2><ul>${committees}</ul>
    <h2>4. Rehearsal Schedule</h2><ul>${li(bp.rehearsal.map((r) => `${r.label}: ${r.focus}`))}</ul>
    <h2>5. Budget (total ${esc(bp.budget.total)}, +${esc(bp.budget.contingency)})</h2>
    <table>${budget}</table>
    <h2>6. Communication Plan</h2>
    <table><tr><td><b>When</b></td><td><b>Channel</b></td><td><b>Audience</b></td><td><b>What</b></td></tr>${comms}</table>
    <div class="page"></div><h2>7. Master Checklist</h2>${checklist}
    <h2>8. Script Outlines</h2>
    <h3>MC script</h3><ul>${li(bp.scripts.mc)}</ul>
    <h3>Welcome address</h3><ul>${li(bp.scripts.welcomeAddress)}</ul>
    <h3>Vote of thanks</h3><ul>${li(bp.scripts.voteOfThanks)}</ul>
  </body></html>`;
}

export async function exportBlueprintPdf(bp: EventBlueprint, eventName: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html: blueprintToHtml(bp, eventName) });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share event blueprint' });
  }
}
