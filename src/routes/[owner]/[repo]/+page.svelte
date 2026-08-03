<script>
  import { onDestroy, onMount } from 'svelte';
  import WorktreePreview from '$lib/github/WorktreePreview.svelte';
  import GitHubConnect from '$lib/pull-request/GitHubConnect.svelte';
  import StatusCard from '$lib/pull-request/StatusCard.svelte';
  import { ClankGateway } from '$lib/clank-gateway.js';
  import { repositoryPath } from '$lib/navigation.js';
  import { GITHUB_CONNECTION_REQUIRED, GITHUB_TOKEN_INVALID } from '$lib/pull-request-preview.js';

  let { data } = $props();
  let locator = $derived({ owner: data.owner, repo: data.repo });

  let phase = $state('loading');
  let gateway = $state(null);
  let supabase = $state(null);
  let inspection = $state(null);
  let launch = $state(null);
  let isTrusted = $state(false);
  let error = $state('');
  let controller = new AbortController();

  onDestroy(() => controller.abort());

  onMount(async () => {
    try {
      repositoryPath(data.owner, data.repo);
    } catch (cause) {
      fail(cause);
      return;
    }

    const [{ createSupabase }, { GATEWAY_URL }] = await Promise.all([
      import('$lib/supabase'),
      import('$lib/config')
    ]);
    supabase = createSupabase();
    const { data: authData } = await supabase.auth.getSession();
    if (!authData.session) {
      phase = 'signedout';
      return;
    }
    gateway = new ClankGateway(GATEWAY_URL, authData.session.access_token);
    await inspect();
  });

  async function signInWithGitHub() {
    error = '';
    const callback = new URL('/auth/callback', location.origin);
    callback.searchParams.set('return_to', repositoryPath(data.owner, data.repo));
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: callback.toString() }
    });
    if (authError) fail(authError);
  }

  async function inspect() {
    phase = 'inspecting';
    error = '';
    try {
      inspection = await gateway.inspectRepository(locator, controller.signal);
      isTrusted = false;
      phase = 'review';
    } catch (cause) {
      if ([GITHUB_CONNECTION_REQUIRED, GITHUB_TOKEN_INVALID].includes(cause.code)) {
        phase = 'github-connect';
        return;
      }
      if (cause.status === 402) {
        error = cause.message;
        phase = 'billing';
        return;
      }
      fail(cause);
    }
  }

  async function createWorkspace() {
    if (!isTrusted) return;
    phase = 'launching';
    error = '';
    try {
      launch = await gateway.launchRepository(locator, controller.signal);
      phase = 'preview';
    } catch (cause) {
      if ([GITHUB_CONNECTION_REQUIRED, GITHUB_TOKEN_INVALID].includes(cause.code)) {
        phase = 'github-connect';
        return;
      }
      fail(cause);
    }
  }

  function fail(cause) {
    error = cause?.message || String(cause);
    phase = 'error';
  }

  function retry() {
    if (!inspection) return inspect();
    isTrusted = false;
    phase = 'review';
  }

  let githubURL = $derived(`https://github.com/${encodeURIComponent(data.owner)}/${encodeURIComponent(data.repo)}`);
</script>

<svelte:head>
  <title>{data.owner}/{data.repo} · Supaclank workspace</title>
  <meta name="description" content={`Clone ${data.owner}/${data.repo} into a private editing workspace on your own Clank machine.`} />
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8 sm:justify-center sm:py-12">
  <header class="mb-7 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2.5"><img src="/mascot.png" alt="" width="38" height="38" class="rounded-xl" /><span class="font-semibold tracking-tight">supaclank</span></a>
    <a href={githubURL} target="_blank" rel="noreferrer" class="font-mono text-xs text-muted hover:text-ink">View on GitHub ↗</a>
  </header>

  {#if phase === 'loading'}
    <StatusCard title="Opening repository…" detail="Loading your Supaclank session." />
  {:else if phase === 'signedout'}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm sm:p-8">
      <p class="font-mono text-xs text-brand">PRIVATE CLOUD WORKSPACE</p>
      <h1 class="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Start working on {data.owner}/{data.repo}</h1>
      <p class="mt-3 text-muted">Sign in and Supaclank will clone the repository onto your own Clank host, create a fresh branch, and start a private web preview you can edit with an agent.</p>
      <button onclick={signInWithGitHub} class="mt-6 w-full rounded-lg bg-ink px-5 py-3 font-medium text-paper">Continue with GitHub</button>
      <a href={`/signup?return_to=${encodeURIComponent(repositoryPath(data.owner, data.repo))}`} class="mt-3 block text-center text-sm text-muted hover:text-ink">Use email instead</a>
      {#if error}<p class="mt-3 text-sm text-danger">{error}</p>{/if}
    </div>
  {:else if phase === 'inspecting'}
    <StatusCard title="Preparing your private machine…" detail="Waking your Clank host and checking the repository without downloading or running its code." />
  {:else if phase === 'github-connect'}
    <GitHubConnect {gateway} onconnected={inspect} />
  {:else if phase === 'review' && inspection}
    <div class="overflow-hidden rounded-2xl border border-line bg-elevated shadow-sm">
      <div class="border-b border-line-subtle p-6 sm:p-8">
        <p class="font-mono text-xs text-brand">{inspection.is_private ? 'PRIVATE REPOSITORY' : 'PUBLIC REPOSITORY'}</p>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight">{inspection.owner}/{inspection.repo}</h1>
        {#if inspection.description}<p class="mt-3 text-sm text-muted">{inspection.description}</p>{/if}
        <p class="mt-4 text-sm text-muted">Fresh branch from <span class="font-mono text-ink">{inspection.default_branch}</span></p>
      </div>
      <div class="p-6 sm:p-8">
        <div class="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p class="text-sm font-medium text-warning">This runs repository code on your cloud machine</p>
          <p class="mt-1 text-sm text-muted">The preview setup and dev server can access files and credentials available on your host. Continue only if you trust this repository.</p>
        </div>
        <label class="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4"><input type="checkbox" bind:checked={isTrusted} class="mt-0.5 h-4 w-4 accent-brand" /><span class="text-sm"><strong class="block">I trust {inspection.owner}/{inspection.repo}</strong><span class="text-muted">Supaclank keeps its default branch untouched and creates a separate editing worktree.</span></span></label>
        <button onclick={createWorkspace} disabled={!isTrusted} class="mt-4 w-full rounded-lg bg-brand px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">Create workspace &amp; preview</button>
      </div>
    </div>
  {:else if phase === 'launching'}
    <StatusCard title="Creating your workspace…" detail={`Cloning ${data.owner}/${data.repo}, refreshing its default branch, and forking a clean editing worktree.`} />
  {:else if phase === 'preview' && launch}
    <WorktreePreview
      {gateway}
      {launch}
      title={`${inspection.owner}/${inspection.repo}`}
      detail={`${launch.branch} · forked from ${launch.default_branch}`}
      displayName={`${inspection.repo} · ${launch.branch}`}
    />
  {:else if phase === 'billing'}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm"><h1 class="text-xl font-semibold">Cloud access needs attention</h1><p class="mt-2 text-sm text-muted">{error}</p><a href={`/welcome?return_to=${encodeURIComponent(repositoryPath(data.owner, data.repo))}`} class="mt-5 block rounded-lg bg-brand px-5 py-2.5 text-center font-medium text-white">Open billing</a></div>
  {:else if phase === 'error'}
    <div class="rounded-2xl border border-danger/30 bg-elevated p-6 shadow-sm"><p class="font-mono text-xs text-danger">WORKSPACE STOPPED</p><h1 class="mt-2 text-xl font-semibold">Couldn’t open this repository</h1><p class="mt-2 break-words text-sm text-muted">{error}</p><button class="mt-5 rounded-lg border border-line px-4 py-2 text-sm font-medium" onclick={retry}>Try again</button></div>
  {/if}
</div>
