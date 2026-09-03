import { BUILD_TARGET, DEVICE, USAGE, ONBOARDING_VERSION, validatePreferences } from './preferences.js';

export const ONBOARDING_PLACEMENT = Object.freeze({ getStarted: 'get-started', welcome: 'welcome' });
export const ONBOARDING_SAVE_SOURCE = Object.freeze({ modal: 'modal', inline: 'inline', handoff: 'handoff' });
export const ONBOARDING_ACTION = Object.freeze({
  cloudSignup: 'cloud_signup',
  saveAccount: 'save_account',
  appDownload: 'app_download',
  appQrShown: 'app_qr_shown',
  copyInstall: 'copy_install',
  copyPair: 'copy_pair',
  copyPreview: 'copy_preview',
  openRepository: 'open_repository'
});
const STEPS = Object.freeze(['build', 'devices', 'usage']);

function selectionProperty(values, options) {
  if (!Array.isArray(values) || new Set(values).size !== values.length ||
      values.some((value) => !options.includes(value))) {
    throw new Error('Analytics requires recognized onboarding selections.');
  }
  return options.filter((option) => values.includes(option)).join('+');
}

export function onboardingProperties(placement, { buildTargets, devices, usage }) {
  if (!Object.values(ONBOARDING_PLACEMENT).includes(placement)) {
    throw new Error('Analytics requires an onboarding placement.');
  }
  if (usage !== '' && !Object.values(USAGE).includes(usage)) {
    throw new Error('Analytics requires a recognized workspace choice.');
  }
  const buildSelection = selectionProperty(buildTargets, Object.values(BUILD_TARGET));
  const deviceSelection = selectionProperty(devices, Object.values(DEVICE));
  return {
    onboarding_version: ONBOARDING_VERSION,
    placement,
    ...(buildSelection && { build_targets: buildSelection }),
    ...(deviceSelection && { devices: deviceSelection }),
    ...(usage && { usage })
  };
}

export function onboardingStepProperties(placement, answers, step, isEdit) {
  if (!Number.isInteger(step) || step < 0 || step >= STEPS.length || typeof isEdit !== 'boolean') {
    throw new Error('Analytics requires an onboarding step and edit state.');
  }
  return { ...onboardingProperties(placement, answers), step: STEPS[step], is_edit: isEdit };
}

export function onboardingActionProperties(placement, answers, action) {
  if (!Object.values(ONBOARDING_ACTION).includes(action)) {
    throw new Error('Analytics requires a recognized setup action.');
  }
  return { ...onboardingProperties(placement, validatePreferences(answers)), action };
}
