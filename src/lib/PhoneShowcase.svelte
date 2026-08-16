<script>
  import { onMount } from 'svelte';
  import QrPlay from '$lib/QrPlay.svelte';
  import PlayBadge from '$lib/PlayBadge.svelte';

  // Each loop starts from a blank slate and builds ONE app live: summon the
  // floating box → speak a prompt (the waveform) → the agent works → the app
  // hot-refreshes in place → a done banner. Then we spin to the next blank
  // slate. The only spin is that transition. Every prompt is spoken.
  const demos = [
    { app: 'recipes', prompt: 'a recipe app with photos and weekly meal planning', reply: 'Done, your recipe app is live.', edit: 'make the cover photo blue', editReply: 'Cover photo is blue now, live.' },
    { app: 'fitness', prompt: 'a workout tracker with charts and streaks', reply: 'Built your workout tracker.', edit: 'make the progress ring orange', editReply: 'Progress ring is orange now, live.' },
    { app: 'habits', prompt: 'a habit tracker with reminders and a calendar view', reply: 'Added your habit tracker.', edit: 'make the habit dots blue', editReply: 'Habit dots are blue now, live.' }
  ];

  const BARS = 32; // exactly fills the visible window, so new bars spawn at the right edge
  const PITCH = 5; // px width of each bar slot
  const BAR_MS = 85; // ms to scroll the strip left by one slot
  const QUIET = 0.05; // resting bar height (renders as a dot)

  // Animation state.
  let motion = $state('hold'); // 'hold' | 'flick' | 'spin' | 'static'
  let boxVisible = $state(false);
  let typed = $state('');
  let recording = $state(false);
  let working = $state(false);
  let doneReply = $state('');
  let sending = $state(false);
  let appBuilt = $state(false);
  let edited = $state(false);
  let reloading = $state(false);
  let demoIndex = $state(0);
  // Each bar carries a stable id, so a bar keeps its own height for its whole
  // life (true scroll, no in-place morphing) and new bars can animate in.
  let nextBarId = 0;
  const makeBar = (level) => ({ id: nextBarId++, level });
  let bars = $state(Array.from({ length: BARS }, () => makeBar(QUIET)));
  let waveOffset = $state(0); // px the strip has scrolled within the current slot
  let reduceMotion = $state(false);
  let hovering = $state(false); // hover the phone → show the install QR + badge

  let alive = true;
  let timer;
  let rafId;

  // Visibility gate: skip the waveform's costly bar-recycle re-render and hold
  // the demo loop at its next blank-slate boundary while scrolled off-screen
  // (mid-demo work still finishes — this isn't a hard pause). requestAnimationFrame
  // only throttles when the *tab* is hidden, not when an element leaves the
  // viewport — so without this the waveform rAF keeps churning and re-rendering
  // the heavy 3D phone for nothing, which shows up as a jank burst when you
  // scroll it back into view.
  let stageEl;
  let active = true; // is the phone in the viewport?
  let resumeGate = null; // resolves the run-loop's await once we re-enter view
  const gate = () => (active ? Promise.resolve() : new Promise((r) => (resumeGate = r)));
  function setActive(v) {
    if (v === active) return;
    active = v;
    if (v && resumeGate) {
      resumeGate();
      resumeGate = null;
    }
  }

  let resolveSleep = null; // lets unmount resume a pending sleep() so run() can exit
  const sleep = (ms) =>
    new Promise((resolve) => {
      // Unmount can resume a pending sleep() mid-loop, which resumes run()/voicePrompt()
      // straight into their next sleep() call — refuse to schedule once dead, else that
      // new timer is never cleared.
      if (!alive) return resolve();
      resolveSleep = resolve;
      timer = setTimeout(() => {
        resolveSleep = null;
        resolve();
      }, ms);
    });

  // Voice prompt: red record button, a waveform that scrolls right→left as
  // "volume" arrives, and the transcript streaming in word by word.
  async function voicePrompt(text) {
    recording = true;
    typed = '';
    bars = Array.from({ length: BARS }, () => makeBar(QUIET)); // start still (dots)
    waveOffset = 0;

    // Each new sample: loudness drifts (random walk) for loud/quiet phases, but
    // the per-bar level is an INDEPENDENT biased-low spike (product of two
    // randoms ≈ log-ish), so most bars are dots and the occasional loud ones
    // spike tall — noisy, not smooth clusters.
    let w1 = 0, w2 = 0, w3 = 0;
    const nextSample = () => {
      // Three random walks at different rates, summed. abs() folds it positive;
      // a modulus keeps it on-screen while preserving variation (no flat caps).
      // → dense, tall-leaning bars with dots where the sum crosses zero.
      w1 += (Math.random() - 0.5) * 0.9; w1 -= w1 * 0.08;
      w2 += (Math.random() - 0.5) * 0.6; w2 -= w2 * 0.04;
      w3 += (Math.random() - 0.5) * 0.35; w3 -= w3 * 0.02;
      const v = (Math.abs(w1 + w2 + w3) * 0.7) % 1;
      return 0.05 + v * 0.9;
    };

    // Continuously translate the strip LEFT; once a whole slot has scrolled by,
    // recycle (drop the leftmost bar, push a fresh sample on the right). Each
    // bar keeps its height and physically moves — a real right→left scroll.
    cancelAnimationFrame(rafId);
    let last = 0;
    const frame = (t) => {
      if (!alive || !recording) return;
      // Off-screen: keep the rAF ticking (it's bound to the recording window)
      // but skip the costly bar-recycle + re-render. last=0 avoids a jump on
      // resume.
      // Cap the elapsed delta: a backgrounded tab pauses rAF, so the first frame
      // back can be minutes stale, which would otherwise spin the recycle loop
      // thousands of times and freeze the tab.
      if (active && last && t - last < 500) {
        waveOffset += (PITCH / BAR_MS) * (t - last);
        while (waveOffset >= PITCH) {
          waveOffset -= PITCH;
          bars = [...bars.slice(1), makeBar(nextSample())];
        }
      }
      last = active ? t : 0;
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    // Listen for a beat (just a caret), then stream the transcript word by word.
    await sleep(800);
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (!alive) break;
      typed = words.slice(0, i + 1).join(' ');
      await sleep(200 + Math.random() * 180);
    }
    await sleep(900);
    recording = false;
    cancelAnimationFrame(rafId);
  }

  async function run() {
    await sleep(1300);
    while (alive) {
      await gate(); // hold here (at a clean blank slate) while scrolled out of view
      if (!alive) break;
      const demo = demos[demoIndex];

      // Shake to summon the floating box over the blank slate.
      motion = 'flick';
      await sleep(330);
      boxVisible = true;
      await sleep(380);
      motion = 'hold';
      await sleep(900);

      // Speak the prompt.
      await voicePrompt(demo.prompt);
      await sleep(750);

      // Send → the agent works (rotating glow), input clears.
      sending = true;
      await sleep(260);
      sending = false;
      typed = '';
      working = true;
      await sleep(1500);

      // Refresh bar flashes a beat BEFORE the new bundle lands.
      reloading = true;
      await sleep(220);
      appBuilt = true; // bundle lands — the app builds in place
      await sleep(80);
      reloading = false;
      working = false;
      doneReply = demo.reply; // done banner
      await sleep(2400);

      // Ask for a change — spoken too → watch it hot-reload live, in place.
      doneReply = '';
      await sleep(400);
      await voicePrompt(demo.edit);
      await sleep(650);
      sending = true;
      await sleep(260);
      sending = false;
      typed = '';
      working = true;
      await sleep(1400);
      reloading = true; // refresh bar precedes the update
      await sleep(220);
      edited = true; // bundle lands — the app updates live
      await sleep(80);
      reloading = false;
      working = false;
      doneReply = demo.editReply;
      await sleep(2600);

      // Spin to the next blank slate (no slide-down exit).
      motion = 'spin';
      await sleep(300);
      appBuilt = false;
      edited = false;
      reloading = false;
      boxVisible = false;
      doneReply = '';
      typed = '';
      recording = false;
      working = false;
      demoIndex = (demoIndex + 1) % demos.length;
      await sleep(700);
      motion = 'hold';
      await sleep(800);
    }
  }

  onMount(() => {
    reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduceMotion) {
      // Static punchline: a freshly built app + the done banner.
      motion = 'static';
      appBuilt = true;
      boxVisible = true;
      doneReply = demos[0].reply;
      return;
    }
    run();
    // Pause/resume the showcase as it enters/leaves the viewport.
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0 }
    );
    if (stageEl) io.observe(stageEl);
    return () => {
      alive = false;
      io.disconnect();
      clearTimeout(timer);
      if (resolveSleep) resolveSleep(); // unblock a pending sleep() so run() can exit
      cancelAnimationFrame(rafId);
      if (resumeGate) resumeGate(); // unblock a parked run-loop so it can exit
    };
  });

  let phoneClass = $derived(
    hovering || motion === 'static'
      ? 'phone-static'
      : motion === 'spin'
        ? 'phone-spin'
        : motion === 'flick'
          ? 'phone-flick'
          : 'phone-hold'
  );
  let shadowClass = $derived(
    motion === 'spin' ? 'shadow-spin' : motion === 'flick' ? 'shadow-flick' : ''
  );
  let activeApp = $derived(demos[demoIndex].app);
  // Send only when there's text to send, and not mid-record / mid-work.
  let showSubmit = $derived(typed.length > 0 && !recording && !working);
</script>

<!-- Decorative: the hero copy carries the message for screen readers. The whole
     stage is the hover target — a generous margin around the phone. -->
<div
  bind:this={stageEl}
  class="phone-stage"
  aria-hidden="true"
  role="presentation"
  onmouseenter={() => (hovering = true)}
  onmouseleave={() => (hovering = false)}
>
  <!-- Brand glow behind the phone -->
  <div class="absolute top-1/2 left-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-dim blur-3xl"></div>

  <div class="perspective">
    <!-- Contact shadow -->
    <div class="phone-shadow {shadowClass}"></div>

    <!-- Phone body -->
    <div class="phone {phoneClass}">
      <!-- 3D edge depth -->
      {#each Array.from({ length: 20 }) as _, i}
        <div class="absolute inset-0 rounded-[2.4rem] bg-zinc-950" style="transform: translateZ(-{i + 1}px)"></div>
      {/each}

      <!-- Side buttons -->
      <div class="absolute top-24 -right-[2px] h-14 w-[3px] rounded-r bg-zinc-700" style="transform: translateZ(-9px)"></div>
      <div class="absolute top-20 -left-[2px] h-10 w-[3px] rounded-l bg-zinc-700"></div>
      <div class="absolute top-32 -left-[2px] h-10 w-[3px] rounded-l bg-zinc-700"></div>

      <!-- Bezel + screen -->
      <div class="relative overflow-hidden rounded-[2.4rem] border-[9px] border-zinc-900 bg-zinc-900 shadow-2xl">
        <div class="relative overflow-hidden rounded-[1.7rem] bg-black">
          <!-- Camera pinhole -->
          <div class="absolute top-2 left-1/2 z-30 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-zinc-800 ring-1 ring-zinc-700">
            <div class="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-950"></div>
          </div>
          <!-- Home indicator -->
          <div class="absolute bottom-2 left-1/2 z-30 h-1 w-14 -translate-x-1/2 rounded-full bg-white/30"></div>

          <!-- Screen -->
          <div class="relative h-[500px] w-[236px] overflow-hidden">
            {#if !appBuilt}
              {@render blankApp()}
            {:else}
              {#key activeApp + '-' + edited}
                <div class="app-screen h-full w-full">
                  {#if activeApp === 'recipes'}
                    {@render recipesApp()}
                  {:else if activeApp === 'fitness'}
                    {@render fitnessApp()}
                  {:else}
                    {@render habitsApp()}
                  {/if}
                </div>
              {/key}
            {/if}

            <!-- Expo-style refresh bar — full-width blue banner that blinks on
                 at the top of the app a beat before each update lands. -->
            {#if reloading}
              <div class="reload-banner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" />
                </svg>
                Refreshing…
              </div>
            {/if}

            <!-- Hover-to-install: a branded "Get supaclank" panel with the QR
                 (clank mascot center) + Play badge, shown over the app on hover. -->
            <div
              class="install-overlay"
              style="opacity: {hovering ? 1 : 0}; pointer-events: {hovering ? 'auto' : 'none'}"
            >
              <div class="flex h-full w-full flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
                <img src="/mascot.png" alt="" class="h-14 w-14 rounded-2xl shadow-sm" />
                <div>
                  <p class="text-[13px] font-semibold tracking-tight text-ink">Get Clank</p>
                  <p class="mt-0.5 text-[10px] leading-snug text-muted">Build anything from your phone</p>
                </div>
                <div class="rounded-xl bg-white p-1.5 shadow-md ring-1 ring-black/5">
                  <div class="h-[108px] w-[108px]"><QrPlay /></div>
                </div>
                <PlayBadge size="sm" tabindex={-1} />
                <p class="text-[10px] text-dim">Scan the code, or tap the badge</p>
              </div>
            </div>

            <!-- Floating prompt box (the dev overlay), summoned by the flick. -->
            <div class="prompt-wrap" class:show={boxVisible}>
              <div class="prompt-box" class:working>
                <div class="glow"></div>
                <div class="box-inner">
                  <!-- Done banner (agent reply) — grid-rows reveal so the
                       full-width divider never clips and nothing jumps. -->
                  <div class="done-section" class:open={!!doneReply}>
                    <div class="done-clip">
                      <div class="done-row">
                        <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
                        <span class="done-text">{doneReply}</span>
                      </div>
                      <div class="divider"></div>
                    </div>
                  </div>

                  <div class="prompt-body">
                    <!-- Top row: input + drag handle -->
                    <div class="prompt-top">
                      <div class="prompt-text">
                        {#if working}
                          <span class="muted">Working…</span>
                        {:else if recording || typed}
                          <span class="ink">{typed}</span>{#if recording}<span class="caret">|</span>{/if}
                        {:else}
                          <span class="ph">Ask anything…</span>
                        {/if}
                      </div>
                      <svg class="handle" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
                        <circle cx="37.5" cy="30" r="8" /><circle cx="62.5" cy="30" r="8" />
                        <circle cx="37.5" cy="50" r="8" /><circle cx="62.5" cy="50" r="8" />
                        <circle cx="37.5" cy="70" r="8" /><circle cx="62.5" cy="70" r="8" />
                      </svg>
                    </div>

                    <!-- Voice waveform — its own row, height-animated (grid-rows)
                         so the box grows/shrinks smoothly instead of popping. -->
                    <div class="wave-section" class:open={recording}>
                      <div class="wave-clip">
                        <div class="wave">
                          <div class="wave-strip" style="transform: translateX(-{waveOffset}px)">
                            {#each bars as bar (bar.id)}
                              <div class="bar-slot">
                                <div class="bar" style="height: {Math.max(3, bar.level * 32)}px"></div>
                              </div>
                            {/each}
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Toolbar: capture + attach · mic (send) -->
                    <div class="prompt-bar">
                      <svg class="tool" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M18 38 L18 18 L38 18" /><path d="M62 18 L82 18 L82 38" />
                        <path d="M18 62 L18 82 L38 82" /><path d="M62 82 L82 82 L82 62" />
                      </svg>
                      <svg class="tool" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M65 25 L65 65 C65 85 50 90 35 75 L35 35 C35 20 50 15 55 30 L55 60" />
                      </svg>
                      <div class="spacer"></div>

                      <!-- Right cluster: the mic rests flush-right; when there's
                           text it slides left to reveal the submit that sits
                           behind it. Submit only fades — it never moves. -->
                      <div class="actions">
                        <div class="circle send" class:pressed={sending} style="opacity: {showSubmit ? 1 : 0}">
                          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M50 75 L50 25" /><path d="M30 45 L50 25 L70 45" />
                          </svg>
                        </div>
                        <div class="circle mic" style="transform: translateX({showSubmit ? '-30px' : '0px'}); background: {recording ? '#d9534f' : working ? '#424242' : 'rgba(117, 117, 117, 0.4)'}">
                          {#if recording || working}
                            <div class="stop"></div>
                          {:else}
                            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                              <rect x="35" y="15" width="30" height="40" rx="15" />
                              <path d="M25 55 C25 78 75 78 75 55" />
                              <path d="M50 78 L50 90" /><path d="M32 90 L68 90" />
                            </svg>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ───────────────────────── App previews ───────────────────────── -->

{#snippet statusbar(dark = false)}
  <div class="flex items-center justify-between px-5 pt-2 text-[9px] font-semibold {dark ? 'text-white/80' : 'text-zinc-900/80'}">
    <span>9:41</span>
    <div class="flex items-center gap-1">
      <svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M2 22h3v-8H2v8zm6 0h3V10H8v12zm6 0h3V6h-3v16zm6 0h3V2h-3v20z" /></svg>
      <svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4C7 4 2.7 6 0 9l12 15L24 9c-2.7-3-7-5-12-5z" /></svg>
      <div class="h-2 w-3.5 rounded-[2px] border {dark ? 'border-white/70' : 'border-zinc-900/70'} px-[1px] py-[1px]"><div class="h-full w-2/3 rounded-[1px] {dark ? 'bg-white/80' : 'bg-zinc-900/80'}"></div></div>
    </div>
  </div>
{/snippet}

{#snippet blankApp()}
  <div class="flex h-full w-full flex-col bg-white">
    {@render statusbar(false)}
    <div class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div class="h-12 w-12 rounded-2xl border-2 border-dashed border-zinc-200"></div>
      <p class="text-[10px] font-medium text-zinc-300">Blank canvas</p>
    </div>
  </div>
{/snippet}

{#snippet tabbar(accent, dark = false)}
  <div class="flex items-center justify-around border-t px-2 py-3 {dark ? 'border-white/10 bg-black/40' : 'border-zinc-100 bg-white'}">
    {#each [0, 1, 2, 3] as t}
      <div class="h-4 w-4 rounded-[5px] {t === 0 ? '' : dark ? 'bg-white/15' : 'bg-zinc-200'}" style={t === 0 ? `background:${accent}` : ''}></div>
    {/each}
  </div>
{/snippet}

{#snippet recipesApp()}
  <div class="flex h-full w-full flex-col bg-white">
    {@render statusbar(false)}
    <div class="flex items-center justify-between px-4 pt-3">
      <h3 class="text-[16px] font-bold tracking-tight text-zinc-900">Recipes</h3>
      <div class="h-7 w-7 rounded-full bg-gradient-to-br from-orange-300 to-rose-300"></div>
    </div>
    <div class="mx-4 mt-3 flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-[9px] text-zinc-400">
      <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      Search recipes
    </div>
    <div class="mx-4 mt-3 overflow-hidden rounded-2xl">
      <div class="relative h-28 bg-gradient-to-br {edited ? 'from-sky-400 via-blue-400 to-indigo-500' : 'from-orange-400 via-amber-400 to-rose-400'}">
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-2.5">
          <p class="text-[11px] font-semibold text-white">Creamy Tomato Pasta</p>
          <p class="text-[8px] text-white/80">25 min · Easy</p>
        </div>
      </div>
    </div>
    <div class="mt-3 flex-1 space-y-2.5 px-4">
      {#each [{ n: 'Avocado Toast', m: '10 min', g: 'from-lime-300 to-emerald-300' }, { n: 'Berry Smoothie', m: '5 min', g: 'from-fuchsia-300 to-rose-300' }] as r}
        <div class="flex items-center gap-2.5">
          <div class="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br {r.g}"></div>
          <div class="min-w-0">
            <p class="truncate text-[11px] font-medium text-zinc-800">{r.n}</p>
            <p class="text-[8px] text-zinc-400">{r.m} · ★ 4.8</p>
          </div>
        </div>
      {/each}
    </div>
    {@render tabbar('#f97316', false)}
  </div>
{/snippet}

{#snippet fitnessApp()}
  <div class="flex h-full w-full flex-col bg-zinc-950">
    {@render statusbar(true)}
    <div class="px-4 pt-3">
      <p class="text-[9px] font-medium text-emerald-400">TODAY</p>
      <h3 class="text-[16px] font-bold tracking-tight text-white">Good evening 💪</h3>
    </div>
    <div class="mt-3 flex justify-center">
      <div class="relative h-32 w-32">
        <svg class="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" stroke-width="9" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={edited ? '#fb923c' : '#34d399'} stroke-width="9" stroke-linecap="round" stroke-dasharray="264" stroke-dashoffset="74" />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-[20px] font-bold text-white">1,248</span>
          <span class="text-[8px] text-zinc-400">kcal burned</span>
        </div>
      </div>
    </div>
    <div class="mx-4 mt-4 grid grid-cols-3 gap-2">
      {#each [{ l: 'Steps', v: '8.4k' }, { l: 'Move', v: '52m' }, { l: 'Zone', v: '24m' }] as s}
        <div class="rounded-xl bg-zinc-900 px-2 py-2 text-center">
          <p class="text-[12px] font-bold text-white">{s.v}</p>
          <p class="text-[7px] text-zinc-500">{s.l}</p>
        </div>
      {/each}
    </div>
    <div class="mt-3 flex-1 space-y-2 px-4">
      {#each [{ n: 'Morning Run', m: '5.2 km', done: true }, { n: 'Upper Body', m: '8 sets', done: false }] as w}
        <div class="flex items-center gap-2.5 rounded-xl bg-zinc-900 px-3 py-2.5">
          <div class="flex h-5 w-5 items-center justify-center rounded-full {w.done ? 'bg-emerald-400' : 'border border-zinc-600'}">
            {#if w.done}<svg class="h-3 w-3 text-zinc-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>{/if}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-medium text-white">{w.n}</p>
            <p class="text-[8px] text-zinc-500">{w.m}</p>
          </div>
        </div>
      {/each}
    </div>
    {@render tabbar('#34d399', true)}
  </div>
{/snippet}

{#snippet habitsApp()}
  <div class="flex h-full w-full flex-col bg-[#f7f5ff]">
    {@render statusbar(false)}
    <div class="flex items-center justify-between px-4 pt-3">
      <div>
        <h3 class="text-[16px] font-bold tracking-tight text-zinc-900">Habits</h3>
        <p class="text-[8px] text-zinc-400">This week · 86%</p>
      </div>
      <div class="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-[11px] font-bold text-white">+</div>
    </div>
    <div class="mt-3 flex-1 space-y-2.5 px-4">
      {#each [{ n: 'Read 20 pages', e: '📚', days: [1, 1, 1, 1, 0, 1, 1], s: 12 }, { n: 'Meditate', e: '🧘', days: [1, 1, 0, 1, 1, 1, 1], s: 8 }, { n: 'No sugar', e: '🍎', days: [1, 1, 1, 1, 1, 0, 1], s: 21 }] as h}
        <div class="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-[13px]">{h.e}</span>
              <span class="text-[11px] font-medium text-zinc-800">{h.n}</span>
            </div>
            <span class="text-[9px] font-semibold text-orange-500">🔥 {h.s}</span>
          </div>
          <div class="mt-2 flex items-center justify-between">
            {#each h.days as d}
              <div class="h-3.5 w-3.5 rounded-full {d ? (edited ? 'bg-blue-500' : 'bg-violet-500') : 'bg-zinc-200'}"></div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
    {@render tabbar('#8b5cf6', false)}
  </div>
{/snippet}

<style>
  .phone-stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .perspective {
    perspective: 1100px;
  }

  .phone {
    position: relative;
    transform-style: preserve-3d;
    transform-origin: center calc(100% + 120px);
  }

  .phone-shadow {
    position: absolute;
    bottom: -60px;
    left: 50%;
    height: 1.75rem;
    width: 14rem;
    transform: translateX(-50%) translateX(-10%);
    border-radius: 100%;
    background: rgba(0, 0, 0, 0.35);
    filter: blur(22px);
  }

  /* Hot refresh: the freshly built app flashes/fades into place. */
  /* Both the initial build and an edit re-key the app screen, so this quick
     hot-reload banner replays at the top — reading as the new bundle landing. */
  .app-screen {
    position: relative;
  }
  .reload-banner {
    position: absolute;
    top: 20px; /* below the OS status bar — anchored at the top of the app */
    left: 0;
    right: 0;
    z-index: 6;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 17px;
    background: #fa5573; /* brand coral */
    color: #ffffff;
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.02em;
    pointer-events: none;
    /* Shown/hidden via the `reloading` flag — instant on, instant off. */
  }
  .reload-banner svg {
    width: 9px;
    height: 9px;
  }

  /* ── Floating prompt box — scaled from clank-mobile dp values (≈0.6×,
     since the 236px screen represents a ~393dp-wide phone). ── */
  /* Hover-to-install overlay — sits above the app/prompt box (z 20) but below
     the phone's pinhole + home indicator (z 30). */
  .install-overlay {
    position: absolute;
    inset: 0;
    z-index: 25;
    transition: opacity 0.25s ease; /* opacity + pointer-events driven inline */
  }

  .prompt-wrap {
    position: absolute;
    left: 50%;
    bottom: 13%;
    z-index: 20;
    width: 180px; /* 300dp */
    /* Rises up into place — the payoff of the flick gesture. (The exit
       happens during the spin, so this slide is only ever seen on entry.) */
    transform: translateX(-50%) translateY(42px) scale(0.92);
    opacity: 0;
    transition:
      opacity 0.35s ease,
      transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .prompt-wrap.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }

  .prompt-box {
    position: relative;
    width: 100%;
  }
  /* Rotating "comet" glow while the agent works. A cornerless circle so
     rotation never exposes an edge; soft gradient stops so the comet has
     no hard leading edge. (WorkingBaseColor #FF6E20.) */
  .glow {
    position: absolute;
    inset: -2px;
    border-radius: 16px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  .prompt-box.working .glow {
    opacity: 1;
  }
  .glow::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 240%;
    aspect-ratio: 1;
    border-radius: 50%;
    transform: translate(-50%, -50%) rotate(0deg);
    background: conic-gradient(
      rgba(255, 110, 32, 0) 0deg,
      rgba(255, 110, 32, 0) 205deg,
      rgba(255, 150, 90, 0.45) 290deg,
      #ff6e20 338deg,
      rgba(255, 110, 32, 0) 360deg
    );
    filter: blur(1px);
    animation: glow-rot 2s linear infinite;
  }
  @keyframes glow-rot {
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  .box-inner {
    position: relative;
    z-index: 1;
    overflow: hidden;
    border-radius: 14px; /* 24dp */
    background: #ffffff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    transition: box-shadow 0.3s ease;
  }
  .prompt-box.working .box-inner {
    box-shadow:
      0 2px 12px rgba(0, 0, 0, 0.12),
      0 0 14px rgba(255, 110, 32, 0.22);
  }

  /* Done banner: grid-rows reveal (no overflow-clip on the negative-margin
     divider, no layout jump). The divider is genuinely full-width. */
  .done-section {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.24s ease;
  }
  .done-section.open {
    grid-template-rows: 1fr;
  }
  .done-clip {
    overflow: hidden;
    min-height: 0;
    opacity: 0;
    transition: opacity 0.2s ease 0.04s;
  }
  .done-section.open .done-clip {
    opacity: 1;
  }
  .done-row {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    padding: 10px 10px 8px;
  }
  .check {
    width: 9px;
    height: 9px;
    flex-shrink: 0;
    margin-top: 1px;
    color: #22c55e;
  }
  .done-text {
    font-size: 9px;
    line-height: 1.35;
    color: #1f1f23;
  }
  .divider {
    width: 100%;
    height: 1px;
    background: #eee;
  }

  .prompt-body {
    padding: 10px; /* 16dp */
  }

  .prompt-top {
    display: flex;
    align-items: flex-start;
    gap: 5px;
  }
  .prompt-text {
    flex: 1;
    min-width: 0;
    min-height: 1.3em;
    font-size: 10px; /* 16sp */
    line-height: 1.45; /* wraps to multiple lines for longer prompts */
  }
  .prompt-text .ph {
    color: #bdbdbd;
  }
  .prompt-text .muted {
    color: #9e9e9e;
  }
  .prompt-text .ink {
    color: #0f0f0f;
  }
  .caret {
    color: #9e9e9e;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
  .handle {
    width: 12px; /* 20dp */
    height: 12px;
    flex-shrink: 0;
    margin-top: 1px;
    color: #bdbdbd;
  }

  /* Voice waveform — its own row. The grid-rows 0fr↔1fr trick animates the
     row's height (and thus the whole box) so it grows/shrinks smoothly.
     Bars scroll right→left; rounded caps; dots at rest. */
  .wave-section {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease;
  }
  .wave-section.open {
    grid-template-rows: 1fr;
  }
  .wave-clip {
    overflow: hidden;
    min-height: 0;
  }
  .wave {
    overflow: hidden; /* clips the wider strip → only the visible window shows */
    height: 36px;
    margin-top: 8px;
  }
  .wave-strip {
    display: flex;
    align-items: center;
    height: 100%;
    will-change: transform;
  }
  .bar-slot {
    width: 5px; /* fixed slot = scroll pitch; the bar sits centered inside */
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .bar {
    width: 3px; /* all bars equal width; min height == width → a round dot */
    border-radius: 9999px;
    background: #424242;
    transform-origin: center;
  }

  .prompt-bar {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px; /* 16dp */
  }
  .tool {
    width: 12px; /* 20dp */
    height: 12px;
    color: #9e9e9e;
  }
  .spacer {
    flex: 1;
  }
  /* Fixed-width cluster (mic + gap + submit). Both buttons are pinned
     flush-right and stacked; the mic (on top) slides left to reveal the
     submit behind it. The submit only fades — it never translates. */
  .actions {
    position: relative;
    z-index: 1; /* keep the stop button above the waveform behind it */
    height: 22px; /* 36dp */
    width: 52px; /* mic 22 + gap 8 + submit 22 (overridden to 22 while recording) */
    flex-shrink: 0;
  }
  .circle {
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    height: 22px;
    width: 22px;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
  }
  .circle svg {
    width: 11px; /* 18dp */
    height: 11px;
  }
  .mic {
    /* background is set inline (recording → red, working → dark stop,
       else idle gray) so it survives HMR's stale-CSS reload race. */
    color: #ffffff;
    transition:
      transform 0.18s ease,
      background 0.2s ease;
  }
  .stop {
    height: 8px;
    width: 8px;
    border-radius: 2px;
    background: #ffffff;
  }
  .send {
    background: #424242; /* SendButtonActiveBackground */
    color: #ffffff;
    transition:
      opacity 0.18s ease,
      transform 0.12s ease;
  }
  .send.pressed {
    transform: scale(0.86);
  }

  @media (max-width: 640px) {
    .phone {
      scale: 0.82;
    }
    .phone-stage {
      margin-block: -1.5rem;
    }
  }
</style>
