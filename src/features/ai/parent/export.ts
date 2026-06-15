import { Linking, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import type { MessageFormat, ParentMessageOutput } from './types';

/**
 * Parent-message output helpers (§2.3 copy / share / open-in-email). All run
 * client-side. WhatsApp/SMS/diary are plain text; email opens the OS mail app.
 */

/** Plain text for a given format (email flattens subject + body). */
export function formatToText(output: ParentMessageOutput, format: MessageFormat): string {
  if (format === 'email') {
    const e = output.formats.email;
    return e ? `Subject: ${e.subject}\n\n${e.body}` : '';
  }
  return output.formats[format] ?? '';
}

export async function copyFormat(output: ParentMessageOutput, format: MessageFormat): Promise<void> {
  await Clipboard.setStringAsync(formatToText(output, format));
}

export async function shareFormat(output: ParentMessageOutput, format: MessageFormat): Promise<void> {
  await Share.share({ message: formatToText(output, format) });
}

/** Open the OS mail composer pre-filled (§2.3 "Open in email app"). */
export async function openEmail(output: ParentMessageOutput): Promise<boolean> {
  const e = output.formats.email;
  if (!e) return false;
  const url = `mailto:?subject=${encodeURIComponent(e.subject)}&body=${encodeURIComponent(e.body)}`;
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
  return can;
}
