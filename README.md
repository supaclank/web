# Supaclank Web

This repository contains the frontend that runs at [supaclank.com](https://supaclank.com), including the prompt-first landing page and a pannable workspace with agent chat and live web/Expo previews.

## Run it

Requires Bun 1.3.11.

```sh
bun install
bun run dev
```

Copy `.env.example` to `.env` before starting. Set the public Supabase values, gateway URL, and preview root domain for your environment. The preview root must match your gateway configuration.

You can also open the repository in Clank:

```sh
brew install supaclank/tap/clank
clank preview
```

## Commands

```sh
bun test
bun run build
bun run preview
```

## Production

This is the real production frontend, not a separate example or mirror. Supaclank's private infrastructure repository pins a reviewed commit from this repository and supplies deployment configuration at build time.

Deployment credentials, infrastructure configuration, and backend services are intentionally maintained separately. Everything shipped to a browser—including public Supabase configuration and form endpoints—should be treated as public.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues should be reported according to [SECURITY.md](SECURITY.md).

The code is available under the [MIT License](LICENSE). Bundled fonts retain their SIL Open Font License notices in `static/fonts/`.

## Builder integration check

The regular tests cover draft validation, session streaming reconciliation, board restoration, and preview origin restrictions. An opt-in test also calls a real gateway and host, sends a harmless message, starts the preview, and verifies the signed embedded response:

```sh
CLANK_BUILDER_TEST_URL=http://your-local-gateway:18191 \
CLANK_BUILDER_TEST_TOKEN=... \
CLANK_BUILDER_TEST_SESSION_ID=... \
bun test src/lib/builder/gateway.integration.test.js
```

Use a disposable Svelte starter session. The test requires an idle connected agent and adds a message to that session. Keep test credentials out of committed files. Other tests run without gateway credentials.
