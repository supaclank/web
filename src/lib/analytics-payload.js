const ATTRIBUTION_PARAMETER_PREFIX = 'utm_';
const ATTRIBUTION_PARAMETERS = new Set(['ref', 'source']);

function sanitizedUrl(raw, siteOrigin, includeOrigin) {
  try {
    const url = new URL(raw, siteOrigin);
    const kept = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      if (key.startsWith(ATTRIBUTION_PARAMETER_PREFIX) || ATTRIBUTION_PARAMETERS.has(key)) {
        kept.append(key, value);
      }
    }

    const query = kept.toString();
    const path = url.pathname + (query ? `?${query}` : '');
    return includeOrigin ? url.origin + path : path;
  } catch {
    return raw.split(/[?#]/)[0];
  }
}

export function sanitizeAnalyticsPayload(payload, siteOrigin) {
  const sanitized = { ...payload };
  if (payload.url) sanitized.url = sanitizedUrl(payload.url, siteOrigin, false);
  if (payload.referrer) sanitized.referrer = sanitizedUrl(payload.referrer, siteOrigin, true);
  return sanitized;
}
