import { UMAMI_TRACKED_DOMAIN, UMAMI_WEBSITE_ID } from '$lib/config.js';
import { sanitizeAnalyticsPayload } from '$lib/analytics-payload.js';
import {
  ANALYTICS_BEFORE_SEND_HANDLER,
  analyticsScriptConfiguration,
  isAnalyticsRecordingUrl
} from '$lib/analytics-script.js';

let umami = null;

// Funnel steps match these strings exactly, so call sites share one vocabulary.
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
  return host === UMAMI_TRACKED_DOMAIN || host.endsWith('.' + UMAMI_TRACKED_DOMAIN);
}

export function initAnalytics() {
  if (umami) return true;
  if (!UMAMI_WEBSITE_ID || !UMAMI_TRACKED_DOMAIN || !onTrackedHost()) return false;

  window[ANALYTICS_BEFORE_SEND_HANDLER] = (_type, payload) =>
    sanitizeAnalyticsPayload(payload, location.origin);

  const config = analyticsScriptConfiguration(location.origin, UMAMI_WEBSITE_ID);
  umami = new Promise((resolve) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = config.src;
    script.dataset.websiteId = config.websiteId;
    script.dataset.hostUrl = config.hostUrl;
    script.dataset.beforeSend = config.beforeSend;
    script.addEventListener(
      'load',
      () => {
        if (isAnalyticsRecordingUrl(location)) {
          const recorder = document.createElement('script');
          recorder.async = true;
          recorder.src = config.recorderSrc;
          recorder.dataset.websiteId = config.websiteId;
          recorder.dataset.hostUrl = config.hostUrl;
          document.head.append(recorder);
        }
        const tracker = window.umami ?? null;
        if (!tracker) umami = null; // allow a later initAnalytics() call to retry
        resolve(tracker);
      },
      { once: true }
    );
    script.addEventListener(
      'error',
      () => {
        umami = null; // allow a later initAnalytics() call to retry
        resolve(null);
      },
      { once: true }
    );
    document.head.append(script);
  });

  return true;
}

/**
 * Report a named Umami event with optional properties.
 * Resolves true once the tracker accepts the event for delivery.
 */
export async function trackEvent(name, props) {
  const tracker = await umami;
  if (!tracker) return false;
  try {
    tracker.track(name, props);
    return true;
  } catch {
    // Analytics is best-effort and must never interrupt a user flow.
    return false;
  }
}
