<script>
  import { onDestroy, onMount } from 'svelte';
  import WorktreePreview from '$lib/github/WorktreePreview.svelte';
  import GitHubConnect from '$lib/pull-request/GitHubConnect.svelte';
  import StatusCard from '$lib/pull-request/StatusCard.svelte';
  import { ClankGateway } from '$lib/clank-gateway.js';
  import { pullRequestPath } from '$lib/navigation.js';
  import {
    GITHUB_CONNECTION_REQUIRED,
    GITHUB_TOKEN_INVALID,
    launchRequestForApprovedRevision
  } from '$lib/pull-request-preview.js';

  let { data } = $props();
  let pullNumber = $derived(Number(data.number));
  let locator = $derived({ owner: data.owner, repo: data.repo, number: pullNumber });

  let phase = $state('loading');
  let gateway = $state(null);
  let supabase = $state(null);
  let inspection = $state(null);
  let launch = $state(null);
  let isTrusted = $state(false);
  let error = $state('');
  let notice = $state('');
  let controller = new AbortController();

  onDestroy(() => controller.abort());

  onMount(async () => {
    try {
      pullRequestPath(data.owner, data.repo, data.number);
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
    callback.searchParams.set('return_to', pullRequestPath(data.owner, data.repo, data.number));
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
      inspection = await gateway.inspectPullRequest(locator, controller.signal);
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

  async function launchApprovedRevision() {
    phase = 'launching';
    error = '';
    notice = '';
    try {
      const request = launchRequestForApprovedRevision(inspection, isTrusted);
      launch = await gateway.launchPullRequest(request, controller.signal);
      phase = 'preview';
    } catch (cause) {
      if (cause.code === 'pull_request_changed') {
        await inspect();
        if (phase === 'review') notice = 'The pull request changed after you approved it. Review the new revision before running it.';
        return;
      }
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
    error = '';
    if (!inspection) return inspect();
    isTrusted = false;
    phase = 'review';
  }

  let githubURL = $derived(`https://github.com/${encodeURIComponent(data.owner)}/${encodeURIComponent(data.repo)}/pull/${pullNumber}`);
</script>

<svelte:head>
  <title>{inspection?.title || `${data.owner}/${data.repo}#${data.number}`} · Supaclank preview</title>
  <meta name="description" content={`Run ${data.owner}/${data.repo}#${data.number} privately on your own Clank machine.`} />
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8 sm:justify-center sm:py-12">
  <header class="mb-7 flex items-center justify-between">
    <a href="/" class="flex items-center gap-2.5"><img src="/mascot.png" alt="" width="38" height="38" class="rounded-xl" /><span class="font-semibold tracking-tight">supaclank</span></a>
    <a href={githubURL} target="_blank" rel="noreferrer" class="font-mono text-xs text-muted hover:text-ink">View on GitHub ↗</a>
  </header>

  {#if phase === 'loading'}
    <StatusCard title="Opening pull request…" detail="Loading your Supaclank session." />
  {:else if phase === 'signedout'}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm sm:p-8">
      <p class="font-mono text-xs text-brand">PRIVATE CLOUD PREVIEW</p>
      <h1 class="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Run {data.owner}/{data.repo}#{data.number} on your machine</h1>
      <p class="mt-3 text-muted">Sign in, review the exact author and commit, then Supaclank checks it out and starts the app on your own isolated Clank host. The preview stays private to you.</p>
      <button onclick={signInWithGitHub} class="mt-6 w-full rounded-lg bg-ink px-5 py-3 font-medium text-paper">Continue with GitHub</button>
      <a href={`/signup?return_to=${encodeURIComponent(pullRequestPath(data.owner, data.repo, data.number))}`} class="mt-3 block text-center text-sm text-muted hover:text-ink">Use email instead</a>
      {#if error}<p class="mt-3 text-sm text-danger">{error}</p>{/if}
    </div>
  {:else if phase === 'inspecting'}
    <StatusCard title="Preparing your private machine…" detail="Waking your Clank host and inspecting the pull request without running its code." />
  {:else if phase === 'github-connect'}
    <GitHubConnect {gateway} onconnected={inspect} />
  {:else if phase === 'review' && inspection}
    <div class="overflow-hidden rounded-2xl border border-line bg-elevated shadow-sm">
      <div class="border-b border-line-subtle p-6 sm:p-8">
        <p class="font-mono text-xs text-brand">{inspection.owner}/{inspection.repo} · PR #{inspection.number}</p>
        <h1 class="mt-3 text-2xl font-semibold tracking-tight">{inspection.title}</h1>
        <div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted"><span>by <strong class="text-ink">@{inspection.author}</strong></span><span><span class="font-mono">{inspection.head_branch}</span> → <span class="font-mono">{inspection.base_branch}</span></span><span class="font-mono">{inspection.head_sha.slice(0, 12)}</span></div>
      </div>
      <div class="p-6 sm:p-8">
        {#if notice}<p class="mb-4 rounded-xl border border-info/30 bg-info/10 p-4 text-sm text-info">{notice}</p>{/if}
        <div class="rounded-xl border border-warning/30 bg-warning/10 p-4">
          <p class="text-sm font-medium text-warning">This runs untrusted code on your cloud machine</p>
          <p class="mt-1 text-sm text-muted">The exact commit above can access files and credentials available on your host. Continue only if you trust @{inspection.author} and this revision.</p>
        </div>
        <label class="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4"><input type="checkbox" bind:checked={isTrusted} class="mt-0.5 h-4 w-4 accent-brand" /><span class="text-sm"><strong class="block">I trust this author and exact commit</strong><span class="text-muted">If the PR changes, Supaclank will stop and ask again.</span></span></label>
        <button onclick={launchApprovedRevision} disabled={!isTrusted} class="mt-4 w-full rounded-lg bg-brand px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">Run private preview</button>
      </div>
    </div>
  {:else if phase === 'launching'}
    <StatusCard title="Checking out the approved revision…" detail="Reusing its branch worktree when possible, otherwise creating one on your Clank host." />
  {:else if phase === 'preview' && launch}
    <WorktreePreview
      {gateway}
      {launch}
      title={inspection.title}
      detail={`${inspection.owner}/${inspection.repo}#${inspection.number} · ${inspection.head_sha.slice(0, 12)}`}
      displayName={launch.display_name || `${inspection.owner}/${inspection.repo}#${inspection.number}`}
    />
  {:else if phase === 'billing'}
    <div class="rounded-2xl border border-line bg-elevated p-6 shadow-sm"><h1 class="text-xl font-semibold">Cloud access needs attention</h1><p class="mt-2 text-sm text-muted">{error}</p><a href={`/welcome?return_to=${encodeURIComponent(pullRequestPath(data.owner, data.repo, data.number))}`} class="mt-5 block rounded-lg bg-brand px-5 py-2.5 text-center font-medium text-white">Open billing</a></div>
  {:else if phase === 'error'}
    <div class="rounded-2xl border border-danger/30 bg-elevated p-6 shadow-sm"><p class="font-mono text-xs text-danger">PREVIEW STOPPED</p><h1 class="mt-2 text-xl font-semibold">Couldn’t open this preview</h1><p class="mt-2 break-words text-sm text-muted">{error}</p><button class="mt-5 rounded-lg border border-line px-4 py-2 text-sm font-medium" onclick={retry}>Try again</button></div>
  {/if}
</div>
