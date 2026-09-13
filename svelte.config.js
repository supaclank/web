import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { loadEnv } from 'vite';
import { previewFrameSource } from './src/lib/preview-origin.js';

const publicEnv = { ...loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'PUBLIC_'), ...process.env };

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
        'frame-src': publicEnv.PUBLIC_PREVIEW_ROOT_DOMAIN
          ? [previewFrameSource(publicEnv.PUBLIC_GATEWAY_URL, publicEnv.PUBLIC_PREVIEW_ROOT_DOMAIN)]
          : ['none'],
        'img-src': ['self', 'data:'],
        // Apps Script /exec redirects from script.google.com to
        // script.googleusercontent.com, so feedback requires both origins.
        'connect-src': [
          'self',
          'https://*.supabase.co',
          publicEnv.PUBLIC_GATEWAY_URL,
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
