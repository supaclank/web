<script>
  // Self-service account deletion on the web. Google Play requires a web
  // resource where users can request deletion of their account and data
  // without reinstalling the app; this page is the URL we submit in the
  // Play Console Data safety form. It calls the same gateway endpoint the
  // apps use (DELETE /v1/account), which erases the sandbox and all its
  // contents, push-notification devices, preview links, and the account
  // itself — see the privacy policy §8 for retention of residual records.
  import { onMount } from 'svelte';

  let phase = $state('loading'); // loading | signedout | ready | deleted
  let email = $state('');
  let confirmText = $state('');
  let busy = $state(false);
  let error = $state('');
  let supabase;
  let gatewayURL = '';
  let token = '';

  onMount(async () => {
    const [{ createSupabase }, { GATEWAY_URL }] = await Promise.all([
      import('$lib/supabase'),
      import('$lib/config')
    ]);
    gatewayURL = GATEWAY_URL;
    supabase = createSupabase();

    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      phase = 'signedout';
      return;
    }
    token = session.access_token;
    email = session.user.email || '';
    phase = 'ready';
  });

  let confirmed = $derived(confirmText.trim().toLowerCase() === 'delete');

  async function deleteAccount() {
    busy = true;
    error = '';
    try {
      const res = await fetch(`${gatewayURL}/v1/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // The account is gone server-side; drop the now-orphaned local
        // session before showing the confirmation.
        await supabase.auth.signOut().catch(() => {});
        phase = 'deleted';
        return;
      }
      // The endpoint is idempotent, so "try again" is always safe advice.
      const data = await res.json().catch(() => null);
      error = data?.error || `Deletion failed (HTTP ${res.status}). Please try again.`;
    } catch (e) {
      error = `Could not reach the server: ${e}`;
    }
    busy = false;
  }
</script>

<svelte:head><title>Delete account · Supaclank</title></svelte:head>

<div class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
  <a href="/" class="mb-8 flex items-center justify-center gap-2.5">
    <img src="/mascot.png" alt="" width="40" height="40" class="rounded-xl" />
    <span class="text-lg font-semibold tracking-tight">supaclank</span>
  </a>

  {#if phase === 'loading'}
    <p class="text-center text-muted">Loading…</p>
  {:else if phase === 'signedout'}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
      <h1 class="text-xl font-semibold">Delete your account</h1>
      <p class="mt-2 text-sm text-muted">
        You can delete your Supaclank account and all data associated with it here. Sign in first
        so we can verify it's really you, then confirm the deletion on this page.
      </p>
      <p class="mt-2 text-sm text-muted">
        Deleting your account destroys your cloud sandbox and everything in it immediately; any
        remaining account records are removed within 30 days. See our
        <a href="/privacy" class="underline decoration-line underline-offset-2 hover:text-ink"
          >Privacy Policy</a
        > for details.
      </p>
      <a
        href="/signup?return_to=/delete-account"
        class="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-muted"
        >Sign in to continue</a
      >
      <p class="mt-4 text-xs text-dim">
        Can't sign in? Email
        <a href="mailto:privacy@supaclank.com" class="underline decoration-line underline-offset-2"
          >privacy@supaclank.com</a
        > from your account's email address and we'll delete it for you.
      </p>
    </div>
  {:else if phase === 'deleted'}
    <div class="rounded-2xl border border-line bg-elevated p-6 text-center shadow-sm">
      <h1 class="text-xl font-semibold">Account deleted</h1>
      <p class="mt-2 text-sm text-muted">
        Your account and cloud sandbox are gone. Any remaining records are removed within 30 days.
        Thanks for trying Supaclank.
      </p>
      <a href="/" class="mt-5 inline-block text-sm font-medium text-brand hover:underline"
        >Back to the homepage</a
      >
    </div>
  {:else}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
      <h1 class="text-xl font-semibold">Delete your account</h1>
      {#if email}<p class="mt-1 text-sm text-muted">Signed in as {email}</p>{/if}

      <div class="mt-5 rounded-xl border border-danger/30 bg-danger/5 p-4">
        <p class="text-sm font-medium text-danger">This cannot be undone</p>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Your cloud sandbox is destroyed immediately, including all repositories, sessions, and connected credentials in it.</li>
          <li>Push-notification registrations and preview links are removed.</li>
          <li>Your account itself is deleted; residual records go within 30 days.</li>
        </ul>
        <p class="mt-2 text-sm text-muted">
          If you have an active subscription, cancel it from
          <a href="/welcome" class="underline decoration-line underline-offset-2 hover:text-ink"
            >your account page</a
          > first.
        </p>
      </div>

      <label class="mt-5 block text-sm text-muted" for="confirm-delete">
        Type <span class="font-mono font-semibold text-ink">delete</span> to confirm:
      </label>
      <input
        id="confirm-delete"
        type="text"
        bind:value={confirmText}
        autocomplete="off"
        placeholder="delete"
        class="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-danger"
      />

      <button
        onclick={deleteAccount}
        disabled={!confirmed || busy}
        class="mt-4 w-full rounded-lg bg-danger px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? 'Deleting…' : 'Permanently delete my account'}
      </button>

      {#if error}<p class="mt-3 text-sm text-danger">{error}</p>{/if}

      <a href="/welcome" class="mt-4 block text-center text-sm text-muted hover:text-ink"
        >Never mind, take me back</a
      >
    </div>
  {/if}
</div>
