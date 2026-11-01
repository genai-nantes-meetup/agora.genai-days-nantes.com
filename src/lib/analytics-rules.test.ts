import { describe, expect, it } from 'vitest';
import { analyticsStatus, changedFieldNames, lengthBucket, personProperties, readAttribution } from './analytics-rules';

describe('analytics rules', () => {
  it('maps statuses with organizer first', () => {
    expect(analyticsStatus({ is_organizer: true, is_speaker: true })).toBe('organizer');
    expect(analyticsStatus({ is_speaker: true, sponsor_tier: 'gold' })).toBe('speaker');
    expect(analyticsStatus({ sponsor_tier: 'platinum' })).toBe('sponsor_platinum');
    expect(analyticsStatus(null)).toBe('participant');
  });
  it('buckets message length', () => {
    expect(lengthBucket(20)).toBe('1-20');
    expect(lengthBucket(21)).toBe('21-100');
    expect(lengthBucket(501)).toBe('500+');
  });
  it('never sends the pitch or free text in person properties', () => {
    const props = personProperties({ email: 'a@b.c', pitch: 'secret', job_title: 'CTO', company: 'X' }, 'participant');
    expect(JSON.stringify(props)).not.toContain('secret');
    expect(props).not.toHaveProperty('pitch');
    expect(props).not.toHaveProperty('company');
  });
  it('lists changed field names only', () => {
    expect(changedFieldNames({ city: 'Nantes', pitch: 'a' }, { city: 'Paris', pitch: 'a' })).toEqual(['city']);
  });
  it('reads only known attribution values', () => {
    expect(readAttribution('?utm_source=email&utm_campaign=unread-digest')).toEqual({ email: 'unread-digest' });
    expect(readAttribution('?utm_source=email&utm_campaign=evil')).toEqual({});
    expect(readAttribution('?from_push=message')).toEqual({ push: 'message' });
  });
});
