import assert from 'node:assert/strict';
import { test } from 'bun:test';

import { sanitizeAnalyticsPayload } from './analytics-payload.js';
import {
  analyticsScriptConfiguration,
  isAnalyticsRecordingUrl,
  shouldReloadForAnalyticsRecordingNavigation
} from './analytics-script.js';

const SITE_ORIGIN = 'https://supaclank.com';

test('analytics removes OAuth credentials while retaining marketing attribution', () => {
  const payload = sanitizeAnalyticsPayload(
    {
      url: '/oauth/consent?client_id=secret&utm_source=launch#access_token=secret',
      referrer: 'https://example.com/article?token=secret&ref=partner',
      name: 'OAuth Authorized',
      data: { approval: 'automatic' }
    },
    SITE_ORIGIN
  );

  assert.deepEqual(payload, {
    url: '/oauth/consent?utm_source=launch',
    referrer: 'https://example.com/article?ref=partner',
    name: 'OAuth Authorized',
    data: { approval: 'automatic' }
  });
});

test('analytics sanitization does not mutate the tracker payload', () => {
  const input = { url: '/welcome?source=qr&code=secret' };

  const payload = sanitizeAnalyticsPayload(input, SITE_ORIGIN);

  assert.notEqual(payload, input);
  assert.deepEqual(input, { url: '/welcome?source=qr&code=secret' });
  assert.deepEqual(payload, { url: '/welcome?source=qr' });
});

test('onboarding choices stay in explicit event properties, not signup return URLs', () => {
  const payload = sanitizeAnalyticsPayload({
    url: '/signup?return_to=%2Fwelcome%3Fbuild%3Dweb%26devices%3Dlaptop%26usage%3Dcloud&utm_source=launch',
    referrer: 'https://supaclank.com/get-started?build=web&devices=laptop&usage=cloud',
    data: { placement: 'get-started', build_targets: 'web', devices: 'laptop', usage: 'cloud' }
  }, SITE_ORIGIN);
  assert.equal(payload.url, '/signup?utm_source=launch');
  assert.equal(payload.referrer, 'https://supaclank.com/get-started');
  assert.deepEqual(payload.data, { placement: 'get-started', build_targets: 'web', devices: 'laptop', usage: 'cloud' });
});

test('analytics strips queries and fragments from malformed URLs', () => {
  const payload = sanitizeAnalyticsPayload(
    { url: 'https://[invalid/?secret=yes#token' },
    SITE_ORIGIN
  );

  assert.deepEqual(payload, { url: 'https://[invalid/' });
});

test('Umami loads and collects through the first-party relay', () => {
  assert.deepEqual(analyticsScriptConfiguration(SITE_ORIGIN, 'website-id'), {
    src: 'https://supaclank.com/-/stats.js',
    recorderSrc: 'https://supaclank.com/-/stats/recorder.js',
    websiteId: 'website-id',
    hostUrl: 'https://supaclank.com/-/stats',
    beforeSend: 'supaclankAnalyticsBeforeSend'
  });
});

test('recording is limited to public marketing and signup routes', () => {
  for (const pathname of ['/', '/demo', '/pricing/', '/privacy', '/signup', '/terms']) {
    assert.equal(isAnalyticsRecordingUrl(new URL(pathname, SITE_ORIGIN)), true, pathname);
  }

  for (const pathname of ['/auth/callback', '/oauth/consent', '/get-started', '/welcome', '/delete-account', '/owner/repo']) {
    assert.equal(isAnalyticsRecordingUrl(new URL(pathname, SITE_ORIGIN)), false, pathname);
  }
});

test('recording rejects URLs whose query or fragment could contain credentials', () => {
  assert.equal(isAnalyticsRecordingUrl(new URL('/signup?code=secret', SITE_ORIGIN)), false);
  assert.equal(isAnalyticsRecordingUrl(new URL('/?utm_source=launch', SITE_ORIGIN)), false);
  assert.equal(isAnalyticsRecordingUrl(new URL('/pricing#access_token=secret', SITE_ORIGIN)), false);
});

test('SPA navigation reloads when crossing the recording privacy boundary', () => {
  const publicUrl = new URL('/pricing', SITE_ORIGIN);
  const privateUrl = new URL('/oauth/consent', SITE_ORIGIN);
  const queriedUrl = new URL('/signup?code=secret', SITE_ORIGIN);

  assert.equal(shouldReloadForAnalyticsRecordingNavigation(publicUrl, privateUrl), true);
  assert.equal(shouldReloadForAnalyticsRecordingNavigation(privateUrl, publicUrl), true);
  assert.equal(shouldReloadForAnalyticsRecordingNavigation(publicUrl, queriedUrl), true);
  assert.equal(
    shouldReloadForAnalyticsRecordingNavigation(publicUrl, new URL('/signup', SITE_ORIGIN)),
    false
  );
});
