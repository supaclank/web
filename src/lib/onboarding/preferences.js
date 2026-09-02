import { repositoryPath } from '../navigation.js';

export const BUILD_TARGET = Object.freeze({ web: 'web', mobile: 'mobile' });
export const DEVICE = Object.freeze({ laptop: 'laptop', mobile: 'mobile' });
export const USAGE = Object.freeze({ local: 'local', cloud: 'cloud' });
export const ONBOARDING_VERSION = 1;
export const ONBOARDING_METADATA_KEY = 'onboarding';
export const ONBOARDING_STORAGE_KEY = 'supaclank:onboarding';
export const GET_STARTED_PATH = '/get-started';
export const WELCOME_PATH = '/welcome';
export const PREFERENCE_QUERY_KEYS = Object.freeze(['build', 'devices', 'usage']);
export const INSTALL_COMMAND = 'brew install supaclank/tap/clank';
export const PREVIEW_COMMAND = 'clank preview';
export const PAIR_COMMAND = 'clank pair';

function isSelection(value, options) {
  return Array.isArray(value) && value.length > 0 &&
    new Set(value).size === value.length && value.every((item) => options.includes(item));
}

export function validatePreferences(value) {
  if (!value || value.version !== ONBOARDING_VERSION ||
      !isSelection(value.buildTargets, Object.values(BUILD_TARGET)) ||
      !isSelection(value.devices, Object.values(DEVICE)) ||
      !Object.values(USAGE).includes(value.usage)) {
    throw new Error('Choose what to build, your devices, and where to run Clank.');
  }
  return {
    version: ONBOARDING_VERSION,
    buildTargets: [...value.buildTargets],
    devices: [...value.devices],
    usage: value.usage
  };
}

export function preferencesFromSearch(params) {
  if (!PREFERENCE_QUERY_KEYS.every((key) => params.getAll(key).length === 1)) return null;
  try {
    return validatePreferences({
      version: ONBOARDING_VERSION,
      buildTargets: params.get('build').split(','),
      devices: params.get('devices').split(','),
      usage: params.get('usage')
    });
  } catch {
    return null;
  }
}

export function preferencesFromUser(user) {
  try {
    return validatePreferences(user.user_metadata[ONBOARDING_METADATA_KEY]);
  } catch {
    return null;
  }
}

export function preferencesFromStorage(storage) {
  try {
    return validatePreferences(JSON.parse(storage.getItem(ONBOARDING_STORAGE_KEY)));
  } catch {
    return null;
  }
}

export function storePreferences(storage, value) {
  const preferences = validatePreferences(value);
  try {
    storage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // The setup still works when private browsing or browser settings disable storage.
  }
  return preferences;
}

export function preferencesPath(pathname, value) {
  if (![GET_STARTED_PATH, WELCOME_PATH].includes(pathname)) {
    throw new Error('Onboarding requires a setup or welcome destination.');
  }
  const preferences = validatePreferences(value);
  const params = new URLSearchParams({
    build: preferences.buildTargets.join(','),
    devices: preferences.devices.join(','),
    usage: preferences.usage
  });
  return `${pathname}?${params}`;
}

export function signupPath(value) {
  const preferences = validatePreferences(value);
  if (preferences.usage !== USAGE.cloud) throw new Error('Local setup does not require an account.');
  return `/signup?${new URLSearchParams({ return_to: preferencesPath(WELCOME_PATH, preferences) })}`;
}

export function setupContinuation(value, isSignedIn) {
  const preferences = validatePreferences(value);
  if (isSignedIn) return { href: preferencesPath(WELCOME_PATH, preferences), label: 'Save my setup' };
  if (preferences.usage === USAGE.cloud) return { href: signupPath(preferences), label: 'Start my free trial' };
  return null;
}

export function setupNeeds(value) {
  const { buildTargets, devices, usage } = validatePreferences(value);
  const isLocal = usage === USAGE.local;
  const downloadApp = devices.includes(DEVICE.mobile) ||
    (isLocal && buildTargets.includes(BUILD_TARGET.mobile));
  return {
    installCLI: isLocal,
    downloadApp,
    pairPhone: isLocal && downloadApp,
    openComputerWorkspace: !isLocal && devices.includes(DEVICE.laptop),
    needsLaptopReminder: isLocal && devices.includes(DEVICE.mobile)
  };
}

export function repositoryInputPath(input) {
  let slug = input.trim();
  if (slug.startsWith('https://')) {
    const url = new URL(slug);
    if (url.hostname !== 'github.com' || url.username || url.password || url.port || url.search || url.hash) {
      throw new Error('Enter a GitHub repository URL or owner/repository.');
    }
    slug = url.pathname.slice(1).replace(/\/$/, '');
  }
  const match = /^([a-z\d](?:[a-z\d-]*[a-z\d])?)\/([a-z\d_.-]+)$/i.exec(slug);
  if (!match) throw new Error('Enter a GitHub repository URL or owner/repository.');
  const [, owner, name] = match;
  const repo = name.replace(/\.git$/, '');
  if (!repo || /^\.+$/.test(repo)) throw new Error('Enter a repository name.');
  return repositoryPath(owner, repo);
}
