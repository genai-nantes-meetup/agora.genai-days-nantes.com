import type {Member} from './networking';

function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

export type VCardInput = Pick<Member, 'first_name' | 'last_name' | 'email' | 'linkedin_url' | 'job_title' | 'company'>;

export function buildVCard(member: VCardInput): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(member.last_name)};${escapeVCard(member.first_name)};;;`,
    `FN:${escapeVCard(`${member.first_name} ${member.last_name}`.trim())}`,
    `EMAIL;TYPE=INTERNET:${escapeVCard(member.email)}`,
  ];
  if (member.job_title) lines.push(`TITLE:${escapeVCard(member.job_title)}`);
  if (member.company) lines.push(`ORG:${escapeVCard(member.company)}`);
  if (member.linkedin_url) lines.push(`URL:${escapeVCard(member.linkedin_url)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}
