# Supaclank Web

This repository contains the frontend that runs at [supaclank.com](https://supaclank.com), including the interactive [demo](https://supaclank.com/demo).

## Run it

```sh
npm install
npm run dev
```

The development server uses local defaults. To point it at another Supabase or Clank gateway environment, copy `.env.example` to `.env` and change the public values.

You can also open the repository in Clank:

```sh
brew install supaclank/tap/clank
clank preview
```

## Commands

```sh
npm test
npm run build
npm run preview
```

## Production

This is the real production frontend, not a separate example or mirror. Supaclank's private infrastructure repository pins a reviewed commit from this repository and supplies deployment configuration at build time.

Deployment credentials, infrastructure configuration, and backend services are intentionally maintained separately. Everything shipped to a browser—including public Supabase configuration and form endpoints—should be treated as public.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues should be reported according to [SECURITY.md](SECURITY.md).

The code is available under the [MIT License](LICENSE). Bundled fonts retain their SIL Open Font License notices in `static/fonts/`.
