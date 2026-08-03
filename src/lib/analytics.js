import { PLAUSIBLE_DOMAIN } from '$lib/config.js';

// The tracker reads browser globals during module evaluation. Keep it dynamic so
// prerendering and off-domain visits never evaluate or download the tracker.
let plausible = null;

// Keep names in one place: Plausible goals and funnels match these
// strings exactly, so a typo at a call site would silently split data.
export const analyticsEvents = Object.freeze({
  trialStarted: 'Trial Started',
  signupFailed: 'Signup Failed',
  checkoutStarted: 'Checkout Started',
  checkoutFailed: 'Checkout Failed',
  subscriptionActivated: 'Subscription Activated',
  oauthAuthorized: 'OAuth Authorized',
  oauthAuthorizationFailed: 'OAuth Authorization Failed',
  installCommandsCopied: 'Install Commands Copied',
  installQrShown: 'Install QR Shown',
  fleetWaitlistSubmitted: 'Fleet Waitlist Submitted',
  feedbackSubmitted: 'Feedback Submitted'
});

function onTrackedHost() {
  const host = location.hostname;
  return host === PLAUSIBLE_DOMAIN || host.endsWith('.' + PLAUSIBLE_DOMAIN);
}

// Auth tokens can arrive in URL fragments. Analytics keeps only the path and
// explicit marketing attribution, so credentials never transit to Plausible.
function sanitizeUrl(raw) {
  try {
    const { origin, pathname, searchParams } = new URL(raw, location.origin);
    const kept = new URLSearchParams();
    for (const [key, value] of searchParams) {
      if (key.startsWith('utm_') || key === 'ref' || key === 'source') kept.append(key, value);
    }
    const query = kept.toString();
    return origin + pathname + (query ? `?${query}` : '');
  } catch {
    // Malformed input still loses its query string and fragment.
    return raw.split(/[?#]/)[0];
  }
}


export function initAnalytics() {
  if (plausible || !PLAUSIBLE_DOMAIN || !onTrackedHost()) return;
  plausible = import('@plausible-analytics/tracker')
    .then((mod) => {
      mod.init({
        domain: PLAUSIBLE_DOMAIN,
        // Production supplies a same-origin relay, keeping the browser CSP first-party.
        endpoint: location.origin + '/-/pv',
        // SvelteKit navigations use history.pushState, so automatic pageviews
        // cover both client-side navigation and full document loads.
        autoCapturePageviews: true,
        // Play Store and other external links become outbound-click events.
        outboundLinks: true,
        transformRequest: (payload) => {
          payload.u = sanitizeUrl(payload.u);
          // Same-origin referrers may contain OAuth or marketing parameters;
          // the sanitized origin and path are sufficient for attribution.
          if (payload.r) payload.r = sanitizeUrl(payload.r);
          return payload;
        }
      });
      return mod;
    })
    .catch(() => null);
}


/**
 * Report a named Plausible goal with optional string properties.
 * Resolves true once the tracker accepts the event for delivery.
 */
export async function trackEvent(name, props) {
  const mod = await plausible;
  if (!mod) return false;
  try {
    mod.track(name, { props });
    return true;
  } catch {
    // Analytics is best-effort and must never interrupt a user flow.
    return false;
  }
}
