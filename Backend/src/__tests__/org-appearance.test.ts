import { describe, expect, it } from '@jest/globals';
import {
  DEFAULT_ALLIED_SERVICES,
  normalizeAlliedServices,
  publicAlliedServices,
  sanitizeAlliedServiceItem,
} from '../modules/org/allied-services.js';

describe('allied services appearance', () => {
  it('returns built-in cards when nothing is stored', () => {
    const config = normalizeAlliedServices(null);
    expect(config.heading).toBe('One Platform, Multiple Services');
    expect(config.items).toHaveLength(DEFAULT_ALLIED_SERVICES.length);
    expect(config.items.some((item) => item.placeholder)).toBe(true);
  });

  it('keeps placeholder cards without a live URL', () => {
    const used = new Set<string>();
    const item = sanitizeAlliedServiceItem(
      {
        id: 'custom-1',
        title: 'Future product',
        description: 'Coming later',
        url: '',
        icon: 'Sparkles',
        placeholder: true,
        enabled: true,
      },
      0,
      used,
    );
    expect(item?.placeholder).toBe(true);
    expect(item?.url).toBe('');
  });

  it('rejects javascript URLs and unknown icons', () => {
    const used = new Set<string>();
    const item = sanitizeAlliedServiceItem(
      {
        id: 'bad',
        title: 'Unsafe',
        url: 'javascript:alert(1)',
        icon: 'NotAnIcon',
        enabled: true,
      },
      0,
      used,
    );
    expect(item?.url).toBe('');
    expect(item?.icon).toBe('GraduationCap');
    expect(item?.placeholder).toBe(true);
  });

  it('hides disabled cards from the public page payload', () => {
    const publicConfig = publicAlliedServices({
      heading: 'Our services',
      items: [
        { id: 'live', title: 'Live', url: 'https://example.com', enabled: true, placeholder: false },
        { id: 'hidden', title: 'Hidden', url: 'https://hidden.example', enabled: false },
      ],
    });
    expect(publicConfig.heading).toBe('Our services');
    expect(publicConfig.items.map((item) => item.id)).toEqual(['live']);
  });
});
