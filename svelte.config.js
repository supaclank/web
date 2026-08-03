import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Produce prerendered pages and a shared application shell. The 200.html
// fallback lets client-routed deep links boot through the static host.
/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '200.html',
      precompress: false,
      strict: true
    }),
    csp: {
      // Hash mode adds SvelteKit's inline hydration hashes to the policy,
      // keeping script-src first-party without allowing unsafe-inline.
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'],
        'font-src': ['self'],
        'img-src': ['self', 'data:'],
        // Apps Script /exec redirects from script.google.com to
        // script.googleusercontent.com, so feedback requires both origins.
        'connect-src': [
          'self',
          'https://*.supabase.co',
          process.env.PUBLIC_GATEWAY_URL,
          'http://supaclank.test:*',
          'https://script.google.com',
          'https://script.googleusercontent.com'
        ].filter(Boolean),
        'base-uri': ['self'],
        'form-action': ['self']
      }
    }
  }
};

export default config;
