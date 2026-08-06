<script>
  // Keep this live policy aligned with retention, subprocessors, analytics,
  // sandbox access, and account-deletion behavior as the product changes.
  const EFFECTIVE_DATE = '2 August 2026';
  const LAST_UPDATED = '2 August 2026';
</script>

<svelte:head>
  <title>Privacy Policy: Supaclank</title>
  <meta name="description" content="What data supaclank collects, why, who can access your sandbox, and your rights." />
</svelte:head>

<div class="mx-auto w-full max-w-3xl px-5 pt-14 pb-24">
  <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Privacy Policy</h1>
  <p class="mt-2 text-sm text-dim">Effective {EFFECTIVE_DATE} · Last updated {LAST_UPDATED}</p>

  <div class="legal">
    <!-- Plain-language summary up top; the numbered sections below are the policy. -->
    <div class="mt-8 rounded-2xl border border-line bg-elevated p-5">
      <p class="!mt-0 font-medium !text-ink">The short version</p>
      <ul class="!mb-0">
        <li>We collect what's needed to run the service, nothing more. We don't want your data: it's a liability to us, not an asset.</li>
        <li>Nothing tracks you inside the app or on your sandbox. Our website uses cookieless, EU-hosted analytics that stores nothing on your device. No selling data, ever.</li>
        <li>Your prompts go from your sandbox to the AI provider <em>you</em> connect, not through us to providers of our choosing.</li>
        <li>We administer the machines your sandbox runs on, so we technically can access it. Humans do so only to help you, investigate abuse, or when legally compelled.</li>
        <li>We never train AI models on your code or transcripts.</li>
        <li>Delete your account and your sandbox is destroyed immediately; residual records go within 30 days (bookkeeping excepted: Swedish law makes us keep those 7 years).</li>
      </ul>
    </div>

    <h2>1. Who is responsible</h2>
    <p>
      The data controller is <strong>Absolutely Right AB</strong>, org. no.
      559577-8233, Ofg 773b Billo, 106 46 Stockholm,
      Sweden, the company behind supaclank. Privacy questions:
      <a href="mailto:privacy@supaclank.com">privacy@supaclank.com</a>.
    </p>

    <h2>2. What this policy covers</h2>
    <p>
      It covers the supaclank cloud service, the clank mobile app, and our websites. It does
      <strong>not</strong> cover self-hosted clank: if you run clank on your own infrastructure,
      your projects and prompts stay between your devices, your machines, and the AI provider you
      use; none of it reaches us.
    </p>

    <h2>3. How your data flows</h2>
    <p>
      Your work lives on your sandbox: your code, project files, and the agent's session
      transcripts sit on a machine dedicated to you, not in a shared database. Credentials you
      connect (your AI provider sign-in, git hosting tokens) are stored there too, so the agent
      can act on your behalf. Our gateway authenticates you, enforces billing, and routes your
      traffic to your sandbox; our central systems hold only account, billing, and operational
      records (your sandbox registration, push token, and active preview links). The main
      exception: images you attach to prompts are stored in our object storage.
    </p>
    <p>
      The AI exchange starts and ends at your sandbox. clank runs a coding agent there (by
      default, Anthropic's Claude Code CLI), connected to <strong>your own provider
      account</strong>: we start the provider's device-authorization flow, and the credential
      lands on your sandbox. When you prompt the agent, your prompt and relevant project context
      go from your sandbox directly to that provider, under <em>that provider's</em> terms and
      privacy policy. We do not send your content to AI providers ourselves.
    </p>
    <p>
      Treat prompts accordingly: don't paste secrets or personal data you don't want transmitted
      to your provider.
    </p>

    <h2>4. What we collect</h2>
    <ul>
      <li>
        <strong>Account data.</strong> Your email address and, if you sign in with GitHub, the
        basic profile information GitHub shares (username, avatar). Passwords are handled by our
        auth provider, Supabase; we never see them.
      </li>
      <li>
        <strong>Billing data.</strong> Payments are processed by Stripe. Stripe holds your card
        details; we never receive them. We store your subscription status and billing history.
      </li>
      <li>
        <strong>Sandbox contents.</strong> Your code, project files, the working history of your
        agent sessions (transcripts), and the credentials you connect, all stored on your sandbox
        (see §3).
      </li>
      <li>
        <strong>Images and uploads.</strong> Images you attach to prompts are stored in our object
        storage (Tigris).
      </li>
      <li>
        <strong>Push tokens.</strong> If you enable notifications, a device push token, so we can
        deliver them.
      </li>
      <li>
        <strong>Technical data.</strong> Standard server logs (IP address, request metadata,
        timestamps), used for security, debugging, and abuse prevention.
      </li>
      <li>
        <strong>Website analytics.</strong> How our websites are used in aggregate: pages visited,
        referrer, country, browser and device type, plus anonymous conversion events such as a
        checkout being started. No cookies, no identifier that lasts beyond the day or follows you
        to other sites, and your browser never contacts the analytics provider directly (events are
        relayed through our own server). Websites only: there is none of this in the mobile app or
        on your sandbox.
      </li>
      <li>
        <strong>Communications.</strong> Emails you send us, and messages submitted through forms
        on our sites (stored in Google Sheets via Google Apps Script).
      </li>
    </ul>
    <p>
      We use <strong>no advertising SDKs anywhere</strong>, and no analytics of any kind in the
      mobile app.
    </p>

    <h2>5. Why we process it (legal bases)</h2>
    <ul>
      <li>
        <strong>To provide the service</strong> (contract, GDPR art. 6.1 b): running your sandbox,
        storing your projects, delivering notifications, billing.
      </li>
      <li>
        <strong>To keep the service safe and working</strong> (legitimate interest, art. 6.1 f):
        security monitoring, abuse prevention, debugging from server logs, and measuring how our
        websites perform through cookieless analytics.
      </li>
      <li>
        <strong>To meet legal obligations</strong> (art. 6.1 c): bookkeeping, tax, responding to
        lawful requests.
      </li>
    </ul>
    <p>
      We do not sell personal data. We do not use your code, files, or transcripts to train AI
      models. And we do not track how you use clank: what you build, prompt, or run on your sandbox
      is never measured or reported back to us. The product metrics we watch are operational
      (uptime, machine health, latency, error rates), and the website analytics above covers our
      website, including its sign-up and checkout pages, but never reaches the mobile app or your
      sandbox.
    </p>

    <h2>6. Who can access your sandbox</h2>
    <p>
      Your sandbox runs on cloud infrastructure we administer, and we hold administrative
      credentials to it. Concretely:
    </p>
    <ul>
      <li>
        <strong>Automated processes</strong> access sandboxes to run the service: provisioning,
        updating the agent CLI, health checks, sleep and wake.
      </li>
      <li>
        <strong>People at supaclank</strong> access the contents of a sandbox (your files, your
        transcripts) only (a) to debug a problem you asked us to look at, (b) to investigate
        abuse, fraud, or a security incident, or (c) when we are legally compelled to.
      </li>
    </ul>
    <p>
      We do not volunteer your data to anyone, authorities included. We disclose it only in
      response to a valid legal order, no more than the order compels, and we will tell you before
      complying unless we are legally prohibited from doing so.
    </p>

    <h2>7. Who we share data with</h2>
    <p>Only processors that run the service for us:</p>
    <ul>
      <li><strong>Supabase:</strong> authentication and database.</li>
      <li><strong>Stripe:</strong> payments and subscription billing.</li>
      <li><strong>Fly.io:</strong> the cloud infrastructure your sandbox runs on.</li>
      <li><strong>Tigris:</strong> object storage for images you upload.</li>
      <li><strong>Plausible:</strong> cookieless website analytics, processed and stored in the EU.</li>
      <li><strong>Expo:</strong> push-notification delivery, relayed onward through Google's Firebase Cloud Messaging.</li>
      <li><strong>Google:</strong> Firebase Cloud Messaging (the push relay above); Google Sheets for contact-form submissions.</li>
      <li><strong>Proton:</strong> our email.</li>
    </ul>
    <p>
      Some of these are outside the EU/EEA (mainly in the United States). Where they are, transfers
      rely on adequacy decisions such as the EU-US Data Privacy Framework, or on Standard
      Contractual Clauses. Beyond processors, we disclose data only if the law requires it (see
      §6), or as part of a merger or acquisition, in which case this policy continues to apply to
      your data and we will notify you.
    </p>

    <h2>8. How long we keep it</h2>
    <ul>
      <li>
        <strong>Account and sandbox data.</strong> For as long as you have an account. When your
        subscription ends, your sandbox is suspended, not deleted; we may remove sandboxes that
        stay inactive, but never sooner than 30 days after the subscription ends.
      </li>
      <li>
        <strong>Account deletion.</strong> Deleting your account destroys your sandbox and its
        contents immediately, and any remaining account records within 30 days.
      </li>
      <li>
        <strong>Bookkeeping records.</strong> Kept for 7 years, as the Swedish Bookkeeping Act
        requires.
      </li>
      <li>
        <strong>Uploaded images.</strong> Deleted from our object storage automatically within 48
        hours of upload. Your sandbox fetches them within minutes of you sending the message, so
        there is no reason to keep them longer.
      </li>
      <li><strong>Server logs.</strong> Up to 90 days.</li>
      <li>
        <strong>Backups.</strong> Deleted data can persist in backups for up to 30 days before
        being purged.
      </li>
    </ul>

    <h2>9. Your rights</h2>
    <p>Under the GDPR you can ask us to:</p>
    <ul>
      <li>show you the personal data we hold about you (access), and give you a copy (portability);</li>
      <li>correct it (rectification) or delete it (erasure);</li>
      <li>restrict or object to processing based on legitimate interest.</li>
    </ul>
    <p>
      Delete your account directly in the app, on the web at
      <a href="/delete-account">supaclank.com/delete-account</a>, or email
      <a href="mailto:privacy@supaclank.com">privacy@supaclank.com</a> for this or any other
      request; we respond within 30 days. If you are unhappy with how we handle your data, you can
      complain to the Swedish Authority for Privacy Protection (IMY, imy.se) or your local
      supervisory authority.
    </p>

    <h2>10. Security</h2>
    <p>
      Traffic is encrypted in transit, each user's sandbox is an isolated environment, and access
      to production systems is restricted (see §6). On your side: keep your account credentials
      safe, and keep real secrets out of prompts. If a security incident affecting your data comes
      to our attention, we will tell you promptly.
    </p>

    <h2>11. Children</h2>
    <p>
      The service is not directed at children under 13, and we do not knowingly collect their
      data. If you believe a child has an account, contact us and we will delete it.
    </p>

    <h2>12. Cookies</h2>
    <p>
      Our sites store only what's needed to keep you signed in (an authentication session, in your
      browser's local storage). We use no advertising cookies and no cross-site trackers, and our
      analytics is cookieless and stores nothing on your device. That is why you don't see a cookie
      banner here.
    </p>

    <h2>13. Changes</h2>
    <p>
      When this policy changes materially, we will notify you by email at least 30 days before the
      change takes effect. The current version always lives at this page; its history is public in
      our repository.
    </p>

    <h2>14. Contact</h2>
    <p>
      <a href="mailto:privacy@supaclank.com">privacy@supaclank.com</a> for privacy matters,
      <a href="mailto:support@supaclank.com">support@supaclank.com</a> for everything else.
    </p>
  </div>
</div>

<style>
  /* Long-form legal prose shares the site's theme tokens without repeating
     utility classes on every paragraph, list, and heading. */
  .legal h2 {
    margin: 2.5rem 0 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--color-ink);
  }
  .legal p,
  .legal ul {
    margin: 0.75rem 0;
    line-height: 1.65;
    color: var(--color-muted);
  }
  .legal ul {
    padding-left: 1.25rem;
    list-style: disc;
  }
  .legal li {
    margin: 0.4rem 0;
  }
  .legal li::marker {
    color: var(--color-dim);
  }
  .legal strong {
    font-weight: 600;
    color: var(--color-ink);
  }
  .legal em {
    font-style: italic;
  }
  .legal a {
    color: var(--color-ink);
    text-decoration: underline;
    text-decoration-color: var(--color-line);
    text-underline-offset: 3px;
    transition: text-decoration-color 120ms;
  }
  .legal a:hover {
    text-decoration-color: var(--color-brand);
  }
</style>
