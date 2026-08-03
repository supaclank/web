const LOCAL_ORIGIN = 'https://supaclank.invalid';

// Validate return paths against a fixed local origin to prevent OAuth and
// checkout flows from becoming open redirects.
export function safeReturnTo(value, fallback = '/welcome') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  try {
    const parsed = new URL(value, LOCAL_ORIGIN);
    if (parsed.origin !== LOCAL_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function pullRequestPath(owner, repo, number) {
  const normalizedNumber = Number(number);
  if (!owner || !repo || !Number.isSafeInteger(normalizedNumber) || normalizedNumber <= 0) {
    throw new Error('A GitHub owner, repository, and positive pull request number are required.');
  }
  return `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pull/${normalizedNumber}`;
}

export function repositoryPath(owner, repo) {
  if (!owner || !repo) {
    throw new Error('A GitHub owner and repository are required.');
  }
  return `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
