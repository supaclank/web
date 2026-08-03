export const SUPACLANK_PREVIEW_HOST = 'supaclank.dev';

export function isSupaclankPreviewHostname(hostname) {
  return hostname === SUPACLANK_PREVIEW_HOST || hostname.endsWith('.' + SUPACLANK_PREVIEW_HOST);
}
