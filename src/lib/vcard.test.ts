import {describe, expect, it} from 'vitest';
import {buildVCard} from './vcard';

const base = {first_name: 'Ada', last_name: 'Lovelace', email: 'ada@example.com', linkedin_url: 'https://linkedin.com/in/ada', job_title: 'Engineer', company: 'Analytical Engines'};

describe('buildVCard', () => {
  it('includes name, email, title, org and linkedin url', () => {
    const card = buildVCard(base);
    expect(card).toContain('BEGIN:VCARD');
    expect(card).toContain('VERSION:3.0');
    expect(card).toContain('N:Lovelace;Ada;;;');
    expect(card).toContain('FN:Ada Lovelace');
    expect(card).toContain('EMAIL;TYPE=INTERNET:ada@example.com');
    expect(card).toContain('TITLE:Engineer');
    expect(card).toContain('ORG:Analytical Engines');
    expect(card).toContain('URL:https://linkedin.com/in/ada');
    expect(card).toContain('END:VCARD');
  });

  it('omits empty optional fields', () => {
    const card = buildVCard({...base, job_title: null, company: null, linkedin_url: ''});
    expect(card).not.toContain('TITLE:');
    expect(card).not.toContain('ORG:');
    expect(card).not.toContain('URL:');
  });

  it('escapes commas, semicolons, backslashes and newlines', () => {
    const card = buildVCard({...base, company: 'ACME, Inc; Paris\\HQ\nLine2'});
    expect(card).toContain('ORG:ACME\\, Inc\\; Paris\\\\HQ\\nLine2');
  });

  it('uses CRLF line endings', () => {
    expect(buildVCard(base)).toContain('\r\n');
    expect(buildVCard(base)).not.toMatch(/[^\r]\n/);
  });
});
