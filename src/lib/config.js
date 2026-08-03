// Build-time public config. Uses $env/static/public so the values are
// inlined into the static bundle (no runtime server). CI sets the prod
// PUBLIC_* vars; .env supplies them locally. See .env.example.
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_GATEWAY_URL,
  PUBLIC_PLAUSIBLE_DOMAIN
} from '$env/static/public';

export const SUPABASE_URL = PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = PUBLIC_SUPABASE_ANON_KEY;
export const GATEWAY_URL = PUBLIC_GATEWAY_URL;
// Plausible site domain (e.g. "supaclank.com"). Empty disables analytics
// entirely — no script tag, no events. Prod and dev CI both set it; local/
// ad-hoc builds leave it "".
export const PLAUSIBLE_DOMAIN = PUBLIC_PLAUSIBLE_DOMAIN;
