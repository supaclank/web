const GITHUB_HOSTS = new Set(['github.com', 'www.github.com']);

export function githubRepositoryFrom(value) {
  const input = value.trim();
  if (!input) throw new Error('Enter a GitHub repository.');

  let path = input;
  if (/^https?:\/\//i.test(input)) {
    const url = new URL(input);
    if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) {
      throw new Error('Use a github.com repository URL.');
    }
    path = url.pathname;
  } else {
    path = path.replace(/^(www\.)?github\.com\//i, '');
  }

  const parts = path.replace(/^\/+|\/+$/g, '').split('/');
  if (parts.length !== 2 || parts.some((part) => !part)) {
    throw new Error('Use the format owner/repository.');
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, '');
  if (!repo) throw new Error('Use the format owner/repository.');
  return { owner, repo };
}

export function previewTitle(preview) {
  const service = preview.service_name?.trim();
  if (service && service !== 'default') return service;
  return 'Web preview';
}

export function relativePreviewAge(value, now = new Date()) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return 'Recently created';

  const minutes = Math.max(0, Math.floor((now.getTime() - timestamp.getTime()) / 60_000));
  if (minutes < 1) return 'Created just now';
  if (minutes < 60) return `Created ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Created ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Created ${days}d ago`;
}
