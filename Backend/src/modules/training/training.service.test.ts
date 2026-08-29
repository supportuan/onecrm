import { describe, expect, it } from '@jest/globals';
import { parseCategory, TrainingError } from './training.service.js';
import { parseDeliveryMode, parseProgramType, resolveMaxSeats } from './training-classes.js';

describe('training.service helpers', () => {
  it('accepts known course categories', () => {
    expect(parseCategory('onboarding')).toBe('ONBOARDING');
    expect(parseCategory('SOFT_SKILLS')).toBe('SOFT_SKILLS');
    expect(parseCategory('ielts_prep')).toBe('IELTS_PREP');
    expect(parseCategory('VISA_TRAINING')).toBe('VISA_TRAINING');
  });

  it('rejects unknown categories', () => {
    expect(() => parseCategory('yoga')).toThrow(TrainingError);
  });
});

describe('training classes', () => {
  it('accepts IELTS and visa programs', () => {
    expect(parseProgramType('ielts_prep')).toBe('IELTS_PREP');
    expect(parseProgramType('VISA_TRAINING')).toBe('VISA_TRAINING');
  });

  it('rejects unknown programs', () => {
    expect(() => parseProgramType('yoga')).toThrow(TrainingError);
  });

  it('parses 1-on-1 and group delivery', () => {
    expect(parseDeliveryMode('one_on_one')).toBe('ONE_ON_ONE');
    expect(parseDeliveryMode('1-on-1')).toBe('ONE_ON_ONE');
    expect(parseDeliveryMode('group')).toBe('GROUP');
  });

  it('locks 1-on-1 to a single seat and requires 2+ for groups', () => {
    expect(resolveMaxSeats('ONE_ON_ONE', 12)).toBe(1);
    expect(resolveMaxSeats('GROUP', undefined)).toBe(8);
    expect(resolveMaxSeats('GROUP', 6)).toBe(6);
    expect(() => resolveMaxSeats('GROUP', 1)).toThrow(TrainingError);
  });
});
