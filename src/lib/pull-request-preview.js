export const GITHUB_CONNECTION_REQUIRED = 'github_connection_required';
export const GITHUB_TOKEN_INVALID = 'github_token_invalid';
export const PREVIEW_SETUP_REQUIRED = 'preview_setup_required';
export const BUILTIN_DEFAULT_PRESET_PREFIX = 'builtin-default-';

export function launchRequestForApprovedRevision(inspection, isTrusted) {
  if (!isTrusted) throw new Error('The pull request revision must be explicitly trusted before launch.');
  if (!inspection?.head_sha || !inspection?.author) {
    throw new Error('The inspected pull request revision is incomplete.');
  }
  return {
    owner: inspection.owner,
    repo: inspection.repo,
    number: inspection.number,
    // Bind launch to the revision the user reviewed, not a newer pushed commit.
    expected_head_sha: inspection.head_sha
  };
}

export function defaultPresetFor(presets, backend) {
  const id = `${BUILTIN_DEFAULT_PRESET_PREFIX}${backend}`;
  const preset = presets.find((candidate) => candidate.id === id && candidate.backend === backend);
  if (!preset) throw new Error(`Your host serves no built-in Build preset for ${backend}.`);
  return preset;
}

export function onlyConnectedProvider(providers) {
  const connected = providers.filter((provider) => provider.connected);
  const backends = new Set(connected.map((provider) => provider.backend));
  return backends.size === 1 ? connected[0] : null;
}

export async function pollUntil(load, isDone, {
  timeoutMs = 240_000,
  intervalMs = 1_500,
  signal,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  onValue = () => {}
} = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const value = await load();
    onValue(value);
    if (isDone(value)) return value;
    await sleep(intervalMs);
  }
  throw new Error('Timed out while waiting for the cloud host.');
}
