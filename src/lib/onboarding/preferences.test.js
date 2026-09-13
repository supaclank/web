import { describe, expect, test } from 'bun:test';
import {
  BUILD_TARGET, DEVICE, USAGE, ONBOARDING_METADATA_KEY,
  validatePreferences, preferencesFromSearch, preferencesPath, signupPath,
  setupNeeds, preferencesFromUser, preferencesFromStorage, storePreferences,
  repositoryInputPath, setupContinuation
} from './preferences.js';

const choices = {
  version: 1,
  buildTargets: [BUILD_TARGET.web, BUILD_TARGET.mobile],
  devices: [DEVICE.laptop, DEVICE.mobile],
  usage: USAGE.local
};

describe('onboarding choices', () => {
  test('supports both app types and both devices', () => {
    expect(validatePreferences(choices)).toEqual(choices);
  });

  test('requires an explicit answer to every question', () => {
    for (const invalid of [null, {}, { ...choices, buildTargets: [] },
      { ...choices, devices: [] }, { ...choices, usage: '' },
      { ...choices, buildTargets: ['desktop'] }, { ...choices, devices: ['tablet'] },
      { ...choices, usage: 'hybrid' }, { ...choices, version: 2 },
      { ...choices, devices: [DEVICE.mobile, DEVICE.mobile] }]) {
      expect(() => validatePreferences(invalid)).toThrow();
    }
  });

  test('only persists the recognized preference fields', () => {
    expect(validatePreferences({ ...choices, isAdmin: true })).toEqual(choices);
  });

  test('choices survive signup and auth callback return paths', () => {
    const cloud = { ...choices, usage: USAGE.cloud };
    const signup = new URL(signupPath(cloud), 'https://supaclank.invalid');
    const welcome = new URL(signup.searchParams.get('return_to'), signup.origin);
    expect(signup.pathname).toBe('/signup');
    expect(welcome.pathname).toBe('/welcome');
    expect(preferencesFromSearch(welcome.searchParams)).toEqual(cloud);
  });

  test('local setup never requires signup', () => {
    expect(() => signupPath(choices)).toThrow();
    expect(preferencesPath('/get-started', choices)).toStartWith('/get-started?');
  });

  test('returning users save their setup without another trial offer', () => {
    for (const usage of Object.values(USAGE)) {
      const value = { ...choices, usage };
      expect(setupContinuation(value, true)).toEqual({ href: preferencesPath('/welcome', value), label: 'Save my setup' });
    }
    expect(setupContinuation(choices, false)).toBeNull();
    const cloud = { ...choices, usage: USAGE.cloud };
    expect(setupContinuation(cloud, false)).toEqual({ href: signupPath(cloud), label: 'Start my free trial' });
  });

  test('missing, partial and invalid links reopen the questions', () => {
    for (const query of ['', 'build=web', 'build=web&devices=mobile&usage=invalid',
      'build=web&build=mobile&devices=laptop&usage=local']) {
      expect(preferencesFromSearch(new URLSearchParams(query))).toBeNull();
    }
  });

  test('completion belongs to the account, not the last browser user', () => {
    expect(preferencesFromUser({ user_metadata: { [ONBOARDING_METADATA_KEY]: choices } })).toEqual(choices);
    expect(preferencesFromUser({ user_metadata: {} })).toBeNull();
    expect(preferencesFromUser({ user_metadata: { [ONBOARDING_METADATA_KEY]: { version: 0 } } })).toBeNull();
  });

  test('stores only validated anonymous setup choices in the browser', () => {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value)
    };
    storePreferences(storage, { ...choices, email: 'not-stored@example.com' });
    expect(preferencesFromStorage(storage)).toEqual(choices);
    expect([...values.values()][0]).not.toContain('email');
  });

  test('ignores missing, corrupt, or unavailable browser storage', () => {
    expect(preferencesFromStorage({ getItem: () => null })).toBeNull();
    expect(preferencesFromStorage({ getItem: () => '{broken' })).toBeNull();
    expect(preferencesFromStorage({ getItem: () => { throw new Error('blocked'); } })).toBeNull();
    expect(() => storePreferences({ setItem: () => { throw new Error('blocked'); } }, choices)).not.toThrow();
  });

  const targetSets = [[BUILD_TARGET.web], [BUILD_TARGET.mobile], [BUILD_TARGET.web, BUILD_TARGET.mobile]];
  const deviceSets = [[DEVICE.laptop], [DEVICE.mobile], [DEVICE.laptop, DEVICE.mobile]];
  for (const buildTargets of targetSets) {
    for (const devices of deviceSets) {
      for (const usage of Object.values(USAGE)) {
        test(`${buildTargets.join('+')} on ${devices.join('+')} with ${usage} gets the required setup`, () => {
          const needs = setupNeeds({ version: 1, buildTargets, devices, usage });
          const needsPhoneApp = devices.includes(DEVICE.mobile) || buildTargets.includes(BUILD_TARGET.mobile);
          expect(needs.installCLI).toBe(usage === USAGE.local);
          expect(needs.downloadApp).toBe(needsPhoneApp);
          expect(needs.pairPhone).toBe(usage === USAGE.local && needsPhoneApp);
          expect(needs.openComputerWorkspace).toBe(usage === USAGE.cloud && devices.includes(DEVICE.laptop));
          expect(needs.needsLaptopReminder).toBe(usage === USAGE.local && devices.includes(DEVICE.mobile));
        });
      }
    }
  }

  test('mobile development requires the phone app even when building from a cloud laptop workspace', () => {
    const needs = setupNeeds({
      version: 1,
      buildTargets: [BUILD_TARGET.mobile],
      devices: [DEVICE.laptop],
      usage: USAGE.cloud
    });
    expect(needs.downloadApp).toBe(true);
    expect(needs.pairPhone).toBe(false);
  });

  test('web development from a laptop does not require a phone', () => {
    const needs = setupNeeds({ version: 1, buildTargets: [BUILD_TARGET.web], devices: [DEVICE.laptop], usage: USAGE.cloud });
    expect(needs.downloadApp).toBe(false);
    expect(needs.openComputerWorkspace).toBe(true);
  });
});

describe('cloud repository entry', () => {
  test('accepts a GitHub URL or owner/repo without creating a workspace', () => {
    expect(repositoryInputPath('supaclank/web')).toBe('/supaclank/web');
    expect(repositoryInputPath(' https://github.com/supaclank/web.git/ ')).toBe('/supaclank/web');
  });

  test('rejects foreign hosts, injected paths and incomplete repository names', () => {
    for (const value of ['', 'web', '/supaclank/web', 'https://evil.example/org/repo',
      'https://github.com@evil.example/org/repo', 'https://github.com/org/repo/pull/1',
      'org/..', 'org/repo?next=evil', 'org/repo#hash']) {
      expect(() => repositoryInputPath(value)).toThrow();
    }
  });
});
