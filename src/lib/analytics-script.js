export const ANALYTICS_BEFORE_SEND_HANDLER = 'supaclankAnalyticsBeforeSend';
export const ANALYTICS_SCRIPT_PATH = '/-/stats.js';
export const ANALYTICS_HOST_PATH = '/-/stats';
export const ANALYTICS_RECORDER_PATH = '/-/stats/recorder.js';

const ANALYTICS_RECORDING_PATHS = new Set([
  '/',
  '/demo',
  '/pricing',
  '/privacy',
  '/signup',
  '/terms'
]);

export function isAnalyticsRecordingUrl(url) {
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  return !url.search && !url.hash && ANALYTICS_RECORDING_PATHS.has(pathname);
}

export function shouldReloadForAnalyticsRecordingNavigation(from, to) {
  return isAnalyticsRecordingUrl(from) !== isAnalyticsRecordingUrl(to);
}

export function analyticsScriptConfiguration(siteOrigin, websiteId) {
  return {
    src: siteOrigin + ANALYTICS_SCRIPT_PATH,
    recorderSrc: siteOrigin + ANALYTICS_RECORDER_PATH,
    websiteId,
    hostUrl: siteOrigin + ANALYTICS_HOST_PATH,
    beforeSend: ANALYTICS_BEFORE_SEND_HANDLER
  };
}
