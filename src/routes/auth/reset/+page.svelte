<script>
  // Landing page for password-recovery emails. The link carries recovery
  // tokens in the URL fragment; supabase-js consumes them on construction
  // (detectSessionInUrl), which signs the user in and lets updateUser set
  // the new password.
  import { onMount } from 'svelte';

  let supabase = $state(null);
  let phase = $state('loading'); // 'loading' | 'ready' | 'invalid'
  let password = $state('');
  let error = $state('');
  let busy = $state(false);

  onMount(async () => {
    const { createSupabase } = await import('$lib/supabase');
    supabase = createSupabase();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    // Remove the credentials from browser history now that the client has them.
    if (location.hash) history.replaceState(null, '', location.pathname);
    phase = session ? 'ready' : 'invalid';
  });

  async function submit(e) {
    e.preventDefault();
    error = '';
    busy = true;
    const { error: err } = await supabase.auth.updateUser({ password });
    busy = false;
    if (err) {
      error = err.message;
      return;
    }
    location.href = '/welcome';
  }
</script>

<svelte:head><title>Reset password · Supaclank</title></svelte:head>

<div class="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
  <a href="/" class="mb-8 flex items-center justify-center gap-2.5">
    <img src="/mascot.png" alt="" width="40" height="40" class="rounded-xl" />
    <span class="text-lg font-semibold tracking-tight">supaclank</span>
  </a>

  <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm">
    {#if phase === 'loading'}
      <span class="mx-auto block h-3 w-3 animate-pulse rounded-full bg-brand"></span>
      <h1 class="mt-4 text-center text-xl font-semibold">Checking your reset link…</h1>
    {:else if phase === 'invalid'}
      <h1 class="text-xl font-semibold">Reset link didn’t work</h1>
      <p class="mt-1 text-sm text-muted">
        The link may have expired or already been used. Request a new one from the sign-in page.
      </p>
      <a
        href="/signup"
        class="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-muted"
        >Back to sign in</a
      >
    {:else}
      <h1 class="text-xl font-semibold">Choose a new password</h1>
      <p class="mt-1 text-sm text-muted">You’ll be signed in once it’s saved.</p>

      <form onsubmit={submit} class="mt-5 space-y-3">
        <input
          type="password"
          bind:value={password}
          required
          minlength="8"
          autocomplete="new-password"
          placeholder="New password"
          class="w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={busy}
          class="w-full rounded-lg bg-brand px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-muted disabled:opacity-50"
        >
          Save new password
        </button>
      </form>

      {#if error}<p class="mt-3 text-sm text-danger">{error}</p>{/if}
    {/if}
  </div>
</div>
