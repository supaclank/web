<script>
  import { getContext } from 'svelte';
  import { WORKSPACE_CONTEXT } from './model.js';
  const workspace = getContext(WORKSPACE_CONTEXT);
  let mode = $state('signup');
  let email = $state('');
  let password = $state('');
  let isBusy = $state(false);
  let error = $state('');
  let sent = $state(false);
  function callbackURL() {
    const url = new URL('/auth/callback', location.origin);
    url.searchParams.set('return_to', '/?build=1');
    return url.toString();
  }
  async function submit(event) {
    event.preventDefault(); isBusy = true; error = '';
    try {
      if (!workspace.supabase) throw new Error('Sign-in is unavailable. Reload and try again.');
      const result = mode === 'signup'
        ? await workspace.supabase.auth.signUp({ email, password, options: { emailRedirectTo: callbackURL() } })
        : await workspace.supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      sent = !result.data.session;
    } catch (cause) { error = cause.message; }
    finally { isBusy = false; }
  }
  async function github() {
    isBusy = true; error = '';
    try {
      const { error: cause } = await workspace.supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: callbackURL() } });
      if (cause) throw cause;
    } catch (cause) { error = cause.message; isBusy = false; }
  }
</script>
<div class="auth-panel nodrag nopan nowheel" data-umami-mask>
  <h2>{sent ? 'Check your inbox' : 'Make room for your idea.'}</h2>
  <p>{sent ? 'Confirm your email, then come back to your board. Your prompt is saved in this browser.' : 'Create an account to start your seven-day cloud trial. Your idea is right here waiting.'}</p>
  {#if !sent}<form onsubmit={submit}><label>Email<input type="email" bind:value={email} autocomplete="email" required /></label><label>Password<input type="password" bind:value={password} autocomplete={mode === 'signup' ? 'new-password' : 'current-password'} minlength="8" required /></label><button class="primary-button" disabled={isBusy}>{isBusy ? 'Connecting…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button></form><button class="quiet-button oauth-button" onclick={github} disabled={isBusy || !workspace.supabase}>Continue with GitHub</button><button class="text-button" onclick={() => { mode = mode === 'signup' ? 'signin' : 'signup'; error = ''; }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}</button><p class="auth-terms">By creating an account, you agree to the <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>{/if}
  {#if error}<p class="builder-error" role="alert">{error}</p>{/if}
</div>
