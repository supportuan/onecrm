import { describe, expect, it } from '@jest/globals';
import { parseCategory, TrainingError } from './training.service.js';

describe('training.service helpers', () => {
  it('accepts known course categories', () => {
    expect(parseCategory('onboarding')).toBe('ONBOARDING');
    expect(parseCategory('SOFT_SKILLS')).toBe('SOFT_SKILLS');
  });

  it('rejects unknown categories', () => {
    expect(() => parseCategory('yoga')).toThrow(TrainingError);
  });
});
