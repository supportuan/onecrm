import { afterEach, describe, expect, it } from '@jest/globals';
import { getEnabledModules } from '../modules/rbac/tenant-modules.service.js';
import {
  getLoginTheme,
  getOrgName,
  getProductName,
  showAlliedServices,
  showSampleModules,
} from '../utils/org-identity.js';

describe('install identity (env)', () => {
  const keys = [
    'ORG_NAME',
    'PRODUCT_NAME',
    'LOGIN_THEME',
    'SHOW_ALLIED_SERVICES',
    'SHOW_SAMPLE_MODULES',
    'ENABLED_MODULES',
  ];
  const snapshot: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of keys) {
      if (snapshot[key] === undefined) delete process.env[key];
      else process.env[key] = snapshot[key];
    }
  });

  const setEnv = (key: string, value: string | undefined) => {
    if (!(key in snapshot)) snapshot[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };

  it('defaults org name to ApplyUniNow when unset', () => {
    setEnv('ORG_NAME', undefined);
    expect(getOrgName()).toBe('ApplyUniNow');
    expect(getProductName()).toBe('OneCRM');
  });

  it('reads client org name from env', () => {
    setEnv('ORG_NAME', 'Client B');
    expect(getOrgName()).toBe('Client B');
  });

  it('accepts login theme ids and falls back to brand', () => {
    setEnv('LOGIN_THEME', 'aurora');
    expect(getLoginTheme()).toBe('aurora');
    setEnv('LOGIN_THEME', 'neon');
    expect(getLoginTheme()).toBe('brand');
  });

  it('hides allied services for non-AUN installs unless opted in', () => {
    setEnv('ORG_NAME', 'Client B');
    setEnv('SHOW_ALLIED_SERVICES', undefined);
    expect(showAlliedServices()).toBe(false);
    setEnv('SHOW_ALLIED_SERVICES', 'true');
    expect(showAlliedServices()).toBe(true);
  });

  it('hides sample modules for non-AUN installs unless opted in', () => {
    setEnv('ORG_NAME', 'Client B');
    setEnv('SHOW_SAMPLE_MODULES', undefined);
    expect(showSampleModules()).toBe(false);
    setEnv('SHOW_SAMPLE_MODULES', 'true');
    expect(showSampleModules()).toBe(true);
  });
});

describe('ENABLED_MODULES', () => {
  afterEach(() => {
    delete process.env.ENABLED_MODULES;
  });

  it('returns the full catalog when unset', async () => {
    delete process.env.ENABLED_MODULES;
    const enabled = await getEnabledModules();
    expect(enabled.has('HR')).toBe(true);
    expect(enabled.has('TRAINING')).toBe(true);
  });

  it('restricts this copy to the listed modules', async () => {
    process.env.ENABLED_MODULES = 'HR,MARKETING';
    const enabled = await getEnabledModules();
    expect(enabled).toEqual(new Set(['HR', 'MARKETING']));
  });

  it('ignores unknown keys and falls back to full catalog if none are valid', async () => {
    process.env.ENABLED_MODULES = 'NOT_A_MODULE';
    const enabled = await getEnabledModules();
    expect(enabled.has('HR')).toBe(true);
  });
});
