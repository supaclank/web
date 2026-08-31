// Build-time public config. Uses $env/static/public so the values are
// inlined into the static bundle (no runtime server). CI sets the prod
// PUBLIC_* vars; .env supplies them locally. See .env.example.
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_GATEWAY_URL,
  PUBLIC_UMAMI_TRACKED_DOMAIN,
  PUBLIC_UMAMI_WEBSITE_ID
} from '$env/static/public';

export const SUPABASE_URL = PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = PUBLIC_SUPABASE_ANON_KEY;
export const GATEWAY_URL = PUBLIC_GATEWAY_URL;
// Both values are required, so local and ad-hoc builds emit no analytics.
export const UMAMI_TRACKED_DOMAIN = PUBLIC_UMAMI_TRACKED_DOMAIN;
export const UMAMI_WEBSITE_ID = PUBLIC_UMAMI_WEBSITE_ID;
