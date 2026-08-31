import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

// Dev-server defaults for the PUBLIC_* vars that src/lib/config.js imports
// from $env/static/public. That virtual module only exports vars that exist
// when the server starts, so a missing one is an ES-module link error
// (SyntaxError) that 500s every route. There is no committed env file, so a
// fresh checkout or worktree would otherwise render nothing until you hand-copy
// .env.example. Values below mirror it: the local `task local:up` stack, plus a
// publishable key that is safe in client code by Supabase design.
//
// Invariant: this only runs for `command === 'serve'`, and `vite build` is
// `command === 'build'`, so no default here can reach a built artifact. A local
// `vite build` without real env still fails loudly, exactly as it does today.
export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    // loadEnv lets process.env win over .env files, so fold the files in first.
    // Otherwise a default below would shadow the .env meant to override it.
    Object.assign(process.env, loadEnv(mode, process.cwd(), 'PUBLIC_'));

    // ??= only fills what is genuinely unset, so shell and CI values keep priority.
    process.env.PUBLIC_SUPABASE_URL ??= 'http://supaclank.test:54321';
    process.env.PUBLIC_SUPABASE_ANON_KEY ??= 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
    process.env.PUBLIC_GATEWAY_URL ??= 'http://supaclank.test:18080';
    process.env.PUBLIC_UMAMI_TRACKED_DOMAIN ??= '';
    process.env.PUBLIC_UMAMI_WEBSITE_ID ??= '';
  }

  return {
    plugins: [tailwindcss(), sveltekit()]
  };
});
