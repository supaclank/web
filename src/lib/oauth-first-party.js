// Supaclank's OAuth server has exactly one first-party client — "Clank",
// the mobile app + CLI, registered statically by
// supaclank/scripts/register-oauth-client.sh (dynamic client registration
// is off). The gateway advertises that client's id pre-auth at
// GET /auth-config, so the consent page can recognize our own app and
// auto-approve it without hardcoding an environment-specific id.
//
// SECURITY: auto-approval must stay pinned to ids from this endpoint.
// If dynamic client registration is ever enabled, third-party clients
// get the full consent screen precisely because they aren't in here.

/**
 * Fetch the first-party OAuth client id from the gateway's public
 * discovery endpoint. Returns '' when the gateway URL is unset, the
 * request fails, or the payload is malformed — callers fall back to
 * showing the consent screen, never the other way around.
 */
export async function firstPartyClientId(gatewayUrl, fetcher = fetch) {
  const base = (gatewayUrl || '').trim().replace(/\/+$/, '');
  if (!base) return '';
  try {
    const response = await fetcher(`${base}/auth-config`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return '';
    const config = await response.json();
    return typeof config?.client_id === 'string' ? config.client_id : '';
  } catch {
    return '';
  }
}

/**
 * The client id of an authorization request, as returned by
 * supabase.auth.oauth.getAuthorizationDetails: `client` is
 * `{id, name, uri, logo_uri}` (supabase/auth ClientDetailsResponse,
 * passed through supabase-js untransformed). '' when absent.
 */
export function authorizationClientId(details) {
  const id = details?.client?.id;
  return typeof id === 'string' ? id : '';
}
