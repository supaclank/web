import { describe, expect, test } from 'bun:test';
import {
  ONBOARDING_ACTION, ONBOARDING_PLACEMENT,
  onboardingProperties, onboardingStepProperties, onboardingActionProperties
} from './analytics-properties.js';
import { BUILD_TARGET, DEVICE, USAGE, ONBOARDING_VERSION } from './preferences.js';

const answers = {
  version: ONBOARDING_VERSION,
  buildTargets: [BUILD_TARGET.web, BUILD_TARGET.mobile],
  devices: [DEVICE.laptop, DEVICE.mobile],
  usage: USAGE.local
};

describe('onboarding analytics properties', () => {
  test('groups both selections consistently regardless of click order', () => {
    const expected = {
      onboarding_version: ONBOARDING_VERSION,
      placement: ONBOARDING_PLACEMENT.getStarted,
      build_targets: 'web+mobile',
      devices: 'laptop+mobile',
      usage: USAGE.local
    };
    expect(onboardingProperties(ONBOARDING_PLACEMENT.getStarted, answers)).toEqual(expected);
    expect(onboardingProperties(ONBOARDING_PLACEMENT.getStarted, {
      ...answers,
      buildTargets: [...answers.buildTargets].reverse(),
      devices: [...answers.devices].reverse()
    })).toEqual(expected);
    expect(answers.buildTargets).toEqual([BUILD_TARGET.web, BUILD_TARGET.mobile]);
    expect(answers.devices).toEqual([DEVICE.laptop, DEVICE.mobile]);
  });

  test('reports unanswered questions without inventing selections', () => {
    expect(onboardingStepProperties(ONBOARDING_PLACEMENT.getStarted, {
      buildTargets: [], devices: [], usage: ''
    }, 0, false)).toEqual({
      onboarding_version: ONBOARDING_VERSION,
      placement: ONBOARDING_PLACEMENT.getStarted,
      step: 'build',
      is_edit: false
    });
    expect(onboardingStepProperties(ONBOARDING_PLACEMENT.welcome, {
      buildTargets: [BUILD_TARGET.web], devices: [], usage: USAGE.cloud
    }, 1, true)).toEqual({
      onboarding_version: ONBOARDING_VERSION,
      placement: ONBOARDING_PLACEMENT.welcome,
      build_targets: 'web', usage: USAGE.cloud, step: 'devices', is_edit: true
    });
    expect(onboardingStepProperties(ONBOARDING_PLACEMENT.welcome, answers, 2, false).step).toBe('usage');
  });

  test('keeps all 18 setup combinations distinct', () => {
    const combinations = new Set();
    for (const buildTargets of [[BUILD_TARGET.web], [BUILD_TARGET.mobile], Object.values(BUILD_TARGET)]) {
      for (const devices of [[DEVICE.laptop], [DEVICE.mobile], Object.values(DEVICE)]) {
        for (const usage of Object.values(USAGE)) {
          const properties = onboardingProperties(ONBOARDING_PLACEMENT.getStarted, { buildTargets, devices, usage });
          combinations.add(JSON.stringify(properties));
          expect(properties.usage).toBe(usage);
        }
      }
    }
    expect(combinations.size).toBe(18);
  });

  test('never forwards arbitrary account data or free text', () => {
    const properties = onboardingActionProperties(ONBOARDING_PLACEMENT.welcome, {
      ...answers,
      email: 'private@example.com',
      user_id: 'private-account',
      repository: 'private-org/secret-repo',
      error: 'Token secret-token failed',
      access_token: 'secret-token'
    }, ONBOARDING_ACTION.openRepository);
    expect(properties).toEqual({
      onboarding_version: ONBOARDING_VERSION,
      placement: ONBOARDING_PLACEMENT.welcome,
      build_targets: 'web+mobile', devices: 'laptop+mobile', usage: USAGE.local,
      action: ONBOARDING_ACTION.openRepository
    });
  });

  test('rejects unsupported values instead of sending free text or hiding mistakes', () => {
    for (const invalid of [
      { ...answers, buildTargets: ['private-repo'] },
      { ...answers, devices: ['email@example.com'] },
      { ...answers, devices: [DEVICE.mobile, DEVICE.mobile] },
      { ...answers, buildTargets: undefined },
      { ...answers, usage: 'hybrid' },
      { ...answers, usage: undefined }
    ]) expect(() => onboardingProperties(ONBOARDING_PLACEMENT.getStarted, invalid)).toThrow();
    expect(() => onboardingProperties('/private-org/repo', answers)).toThrow();
    expect(() => onboardingStepProperties(ONBOARDING_PLACEMENT.getStarted, answers, 3, false)).toThrow();
    expect(() => onboardingStepProperties(ONBOARDING_PLACEMENT.getStarted, answers, 0, undefined)).toThrow();
    expect(() => onboardingActionProperties(ONBOARDING_PLACEMENT.welcome, answers, 'secret-url')).toThrow();
  });

  test('requires complete choices for setup actions', () => {
    expect(() => onboardingActionProperties(ONBOARDING_PLACEMENT.getStarted, {
      ...answers, devices: []
    }, ONBOARDING_ACTION.copyInstall)).toThrow();
    for (const action of Object.values(ONBOARDING_ACTION)) {
      expect(onboardingActionProperties(ONBOARDING_PLACEMENT.welcome, answers, action).action).toBe(action);
    }
  });
});
