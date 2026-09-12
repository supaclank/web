---
name: Clank landing and builder board
description: A monochrome canvas for turning a prompt and its inputs into an app.
colors:
  builder-bg: "#101010"
  builder-panel: "#181818"
  builder-raised: "#262626"
  builder-line: "#383838"
  builder-text: "#f0f0f0"
  builder-muted: "#afafaf"
  builder-accent: "#ededed"
  source-border: "#444"
  input-border: "#474747"
  connector: "#929292"
  demo-canvas: "#141414"
  demo-chrome: "#1b1b1b"
  demo-connector: "#737373"
  demo-selection: "#d99a62"
  demo-added: "#7fcf9b"
  demo-removed: "#f08b8b"
  demo-preview-bg: "#f5f5f5"
  demo-preview-ink: "#242424"
  demo-preview-muted: "#656565"
typography:
  display:
    fontFamily: "Inter, Inter Fallback, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(36px, 4vw, 52px)"
    fontWeight: 500
    lineHeight: 1.14
    letterSpacing: "-0.04em"
  demo-title:
    fontFamily: "Inter, Inter Fallback, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, Inter Fallback, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Inter, Inter Fallback, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  prompt:
    fontFamily: "Inter, Inter Fallback, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontFamily: "Inter, Inter Fallback, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace"
rounded:
  demo-control: "4px"
  attachment: "5px"
  compact: "6px"
  composer: "7px"
  control: "8px"
  send: "9px"
  message: "10px"
  switcher: "12px"
  panel: "14px"
spacing:
  compact: "8px"
  control: "12px"
  inset: "16px"
  form: "28px"
components:
  button-primary:
    backgroundColor: "{colors.builder-accent}"
    textColor: "#171717"
    rounded: "{rounded.control}"
    padding: "10px 17px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.builder-text}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.builder-accent}"
    rounded: "{rounded.control}"
    padding: "5px 0"
  button-icon:
    textColor: "{colors.builder-muted}"
    rounded: "{rounded.control}"
    width: "32px"
  button-send:
    backgroundColor: "{colors.builder-accent}"
    textColor: "#191919"
    rounded: "{rounded.send}"
    size: "36px"
  button-prompt-send:
    backgroundColor: "#eee"
    textColor: "#151515"
    rounded: "{rounded.attachment}"
    size: "30px"
  input:
    backgroundColor: "{colors.builder-panel}"
    textColor: "{colors.builder-text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  repository-input:
    backgroundColor: "{colors.builder-panel}"
    rounded: "{rounded.compact}"
    padding: "8px 10px"
  target-node:
    backgroundColor: "{colors.builder-panel}"
    rounded: "{rounded.compact}"
    padding: "8px 10px"
  project-tab:
    backgroundColor: "{colors.builder-panel}"
    rounded: "6px 6px 0 0"
    padding: "0 20px 0 10px"
    height: "30px"
  prompt-composer:
    backgroundColor: "{colors.builder-panel}"
    rounded: "0 7px 7px 7px"
    padding: "12px"
  example-chip:
    backgroundColor: "#171717"
    textColor: "#b8b8b8"
    rounded: "{rounded.composer}"
    padding: "8px 11px"
  project-card:
    backgroundColor: "{colors.builder-panel}"
    rounded: "{rounded.panel}"
  demo-browser:
    backgroundColor: "{colors.demo-canvas}"
    rounded: "{rounded.message}"
  demo-node:
    backgroundColor: "{colors.demo-chrome}"
    rounded: "{rounded.composer}"
  demo-control:
    backgroundColor: "transparent"
    textColor: "#c4c4c4"
    rounded: "{rounded.demo-control}"
    padding: "3px 7px"
  demo-preview:
    backgroundColor: "{colors.demo-preview-bg}"
    textColor: "{colors.demo-preview-ink}"
    rounded: "0 0 6px 6px"
    padding: "14px 18px"
  canvas-menu:
    backgroundColor: "{colors.builder-panel}"
    textColor: "{colors.builder-text}"
    rounded: "{rounded.control}"
    padding: "4px"
    width: "184px"
  canvas-menu-item:
    backgroundColor: "transparent"
    textColor: "{colors.builder-text}"
    rounded: "{rounded.demo-control}"
    padding: "6px 9px"
    height: "36px"
  canvas-menu-item-hover:
    backgroundColor: "{colors.builder-raised}"
  chat-composer:
    backgroundColor: "#252525"
    rounded: "{rounded.message}"
    padding: "12px"
---

# Design System: Clank landing and builder board

## Overview

**Creative North Star: "Dark connected canvas"**

Clank uses a graphite field, white and gray controls, and the existing mascot rendered in grayscale. Compact setup controls keep the prompt central. Thin borders, restrained tonal shifts, and dotted connections organize source material without adding decorative panels.

This document covers only the landing page and builder board rendered inside `.clank-builder`, including the board's embedded sign-in and project forms. Pricing, account, onboarding, and other existing pages retain their incumbent system. Implementation evidence lives in `src/lib/builder/`, with shared font definitions in `src/app.css`; surface composition belongs in `.impeccable/landing.brief.md`.

**Key Characteristics:**

- Graphite surfaces with white actions and neutral gray structure.
- A small project tab, bare prompt field, and compact footer controls.
- Directional dotted input connections on desktop and a scrolling input strip on mobile.
- A static, radially faded dot field on entry and a pannable project board.
- A labelled browser-frame demo with draggable nodes and a working sample preview.

## Colors

The builder chrome uses an achromatic palette; brightness, borders, and text convey emphasis. The Clank cursor and companion presence share the locally approved blue treatment: pointer, Clank tag, click pulse, avatar background, @Clank header button, and chat caret. Green and red are reserved for demo diff and current-work roles; muted orange marks selected node borders.

### Primary

- **Action white:** `builder-accent` marks primary actions, keyboard focus, and the caret. The prompt's smaller send action uses its recorded component variant.

### Secondary

- **Demo additions and activity:** `demo-added` colors added-line counts and current-work labels and dots in sessions and the sidebar.
- **Demo removals:** `demo-removed` colors removed-line counts. Visible plus and minus signs preserve the distinction independently of color; Idle remains muted gray.

- **Demo selection:** `demo-selection` colors the node’s own tab and body borders on selection or keyboard focus, without a detached outline or glow.

### Neutral

- **Graphite:** `builder-bg` is the landing canvas; `builder-panel` contains prompts, inputs, and project content; `builder-raised` supplies hovered controls and secondary surfaces.
- **White and muted gray:** `builder-text` carries primary content; `builder-muted` supports secondary copy and navigation.
- **Structural gray:** `builder-line` separates controls and panels; `source-border` frames the prompt and its inputs; `input-border` outlines form fields; `connector` draws dotted connections and their circular ports.
- **Demo surfaces:** `demo-canvas` backs the framed board; `demo-chrome` unifies its browser bar and node surfaces. `demo-connector` marks inactive demo edges; active edges brighten to action white.
- **Sample-app content:** `demo-preview-bg`, `demo-preview-ink`, and `demo-preview-muted` belong to the light habit tracker inside the demo preview. They do not change the surrounding builder palette.

**The Monochrome Builder Rule.** Use white, gray, and graphite for builder chrome, actions, and errors. Keep the Clank mascot in CSS grayscale; user images, app previews, and existing routes retain their own content colors. The demo’s Clank cursor and companion presence are the approved local blue exception, including the avatar background, @Clank header button, and chat caret. The demo also uses green for diff additions and current work labels/dots, red for diff removals, and muted orange on selected node borders. These semantic exceptions do not extend to other controls; Idle stays gray.

## Typography

Self-hosted Inter supplies headings and interface text; JetBrains Mono supplies code. The shared font assets are retained without importing the incumbent pages' warm-paper palette.

The hierarchy is compact: medium-weight headings and regular operational text. The display role belongs to the compact “Build apps. Keep your code.” heading and resolves to 36px at the narrow breakpoint. The demo heading uses the demo-title role and resolves to 20px on mobile. Form titles use the recorded title role. The real prompt uses its 16px role; the editable demo prompt uses the 14px body role. Conversation text is 13px with a 1.65 line height, with the mobile chat composer raised to 16px. Source menus use 12px text, the output menu uses 13px, and the repository field becomes 16px on mobile. The demo companion uses 13px conversation text and desktop input with a 20px line height, plus 12px follow-up actions; its mobile input is 16px with a 22px line height. Presence and status labels remain 10–11px. Smaller status, legal, and filename labels are local treatments, not a general body-text scale.

## Layout

The landing uses centered bounded regions: a header up to 1320px wide, an input graph up to 1100px, a framed demo region up to 1180px, and supporting content up to 1120px. The compact hero introduces app building and code ownership above the real composer; the demo follows before the supporting product content. The composer is up to 640px wide. Its attached project tab holds New project/Import repository; the footer holds the image plus, Cloud/Local menu, and send action. Cloud is the initial execution mode. Local replaces the prompt body with copyable commands.

On desktop, repository and image inputs occupy a 220px column to the left, separated from the composer by 48px. New projects show a 110px Web/Mobile selector to the right across another 48px gap. Import shows one repository field and omits the app-type selector. Between 700px and 1050px, input columns narrow to 180px and gaps to 36px. At 699px and below, inputs form a horizontally scrollable strip above the prompt; image cards are 180px wide and repository inputs 230px. The output selector sits below the prompt on the right, and connection lines disappear. Supporting content becomes one column and examples wrap.

The browser-framed demo has a 414px-high canvas, reduced to 370px at the narrow breakpoint. Its repository, agent, working-copy, and preview nodes retain widths of 180px, 320px, 230px, and 280px; session and code heights adapt to the current content. Initial and explicit agent framing uses the overview at canvas widths of 1110px and above, and 0.92 zoom below that threshold. Creation and session-chat opening leave the camera unchanged. Visitors pan the viewport, drag individual node headers, or focus the preview at 1:1 scale. The mobile footer stacks the status above the controls. Scroll gestures continue the page; dragging pans the demo. Open Clank chat occupies a 312px right sidebar beside the 414px-high canvas. At 699px and below, the 340px-high chat sits below the 370px-high canvas. Chat never overlaps the canvas, and its transcript scrolls independently. When closed, a 36px circular avatar launcher sits 12px from the upper-right corner.

The board fills the viewport below its header. A draft workspace is 1100px wide, with a transparent drag header and authentication/provider area bounded to 640px. On mobile it is 350px wide; its prompt and authentication area scroll together inside a region capped at `calc(100dvh - 175px)`, independently of canvas panning. The input strip retains its own horizontal scroll.

Existing project widgets remain 1080px wide, with a 350px conversation column beside the preview. Preserved repository and image inputs sit to their left, making that desktop group 1348px wide. At 699px and below, the project widget is 350px wide and switches between Chat and Preview tabs. Headers remain drag handles; forms, input satellites, transcripts, and previews preserve normal interaction. Satellites are part of the containing widget, not independently draggable board nodes. Board zoom runs from 0.25 to 1.5.

## Elevation & Depth

Custom builder surfaces use tonal layering and thin borders rather than a shadow scale. The demo cursor alone carries a small drop shadow to remain legible over the canvas and preview. The landing dot field stays static at 0.25 opacity on a 24px grid with a radial fade. The signed-in board reuses that grid spacing without the fade; the demo uses a 20px dot grid. Button color changes take 160ms.

Dotted edges use rounded caps and a 1/8 dash pattern. Their negative dash offset travels from source to destination over 1.2 seconds; working input-graph paths brighten and accelerate to 0.5 seconds. Active output packets follow the same direction over 1.4 seconds in the real input graph and 1.6 seconds in the demo. Demo activity progresses through reading the project, editing three files, running checks, starting the preview, and completion. Files appear incrementally; their signed diff counts tween as work advances.

Connection and demo motion pauses when its region is offscreen or the document is hidden. The automatic initial demo and Replay use a labelled cursor to type the prompt, click submit, and check one preview habit. Pause, offscreen visibility, and a hidden document freeze this scripted playback clock. Reduced motion hides travelling packets and disables animation and transitions, while retaining a static clickable cursor and manual Next step controls without automatically checking a habit. User-created sessions progress after submission without scripted cursor actions. The cursor persists after the scripted sequence finishes and during manual interaction; its tag opens chat with follow enabled and indicates Idle or Working, including scripted playback activity. Session height changes take 200ms, code height changes 240ms, sidebar expansion 220ms, and diff-count updates 320ms. Brief content transitions use 160–200ms fades and movement; reduced motion disables these transitions and count tweens. The demo board loads when its section becomes visible and uses the existing Svelte and Svelte Flow dependencies.

**The Directed Flow Rule.** Connect sources to their actual controls and move dots and active packets from source to destination. Keep the landing background still so motion explains work.

## Shapes

Input satellites use the compact radius; the project tab has rounded top corners and joins the composer at its square top-left corner. The attachment and prompt send buttons share the attachment radius. General controls use the control radius; conversation bubbles and composers use the message radius; project widgets use the panel radius. Borders are generally one pixel. Dotted paths use rounded stroke caps. Icons are shared, unfilled SVG paths with rounded line caps and joins. The demo browser frame uses the message radius, its node shells use the composer radius, and its compact controls use the demo-control radius. Small outlined circles in the browser bar establish the frame without extra decoration. The editable demo textarea has a local 2px radius and a one-pixel connector-gray focus outline offset by 5px. The demo cursor uses a 25px triangular pointer without a conventional pointer tail. Its clickable Clank tag uses 11px text at weight 600, a 16px line height, 3px by 7px padding, a 24px minimum height, and the 4px demo-control radius, with a 5px outlined or filled status dot. These local treatments do not extend the general type or radius scales.

## Components

- **Buttons:** White primary actions, outlined quiet actions, white text actions, and compact icon actions share restrained color transitions. The prompt's send and attachment controls are 30px squares; the conversation send action remains 36px. Disabled buttons dim, with explicit gray treatments for disabled send actions.
- **Prompt and source controls:** A border encloses the bare textarea and footer. New/Import lives in the attached project-tab menu, Cloud/Local in the footer, and Web/Mobile in the new-project output menu. Closed menus show only their current choice. The board's draft shows a fixed Cloud label. Focus strengthens the composer border; keyboard-focusable controls keep visible outlines. Dropping image files outlines the composer.
- **Repository and image inputs:** Import displays one editable GitHub repository input on the left; created projects retain it as read-only context. Images added by picker, paste, or drop appear as connected thumbnails with filenames and removal controls before submission. Image content is contained within a 116px-high preview. Attachments are supported for the initial session only; the active conversation composer sends text. Image persistence is browser-local IndexedDB storage, not shared asset storage. Import does not infer an app type. There is no generic artifact or multiple-repository input model.
- **Connection ports:** Repository inputs meet the prompt’s left boundary at the top project-tab control; images meet it at the lower-left plus. Output edges begin on the right boundary beside submit. Ports are measured from the rendered control positions, including in draft and project widgets. The demo uses real Svelte Flow handles for repository → session → worktree → preview. The repository has a right output, sessions have an output beside submit, and Code nodes expose a left worktree input and a labelled bottom Fork port. Editable ports brighten on hover and keyboard focus; their connection paths remain dotted.
- **Forms:** Sign-in uses inset fields with thin neutral borders. The draft's authentication and provider details sit below the same prompt, preserving the idea and its inputs through sign-in. Busy and reading states disable relevant controls; errors and notices remain explicit text.
- **Navigation and examples:** The grayscale mascot wordmark anchors the header. Secondary links remain muted until hover. Idea chips insert a prompt and focus the textarea. The board header groups project switching and creation; compact layouts hide secondary account and source links.
- **Project widgets:** A tinted drag header caps the existing conversation and preview. Human messages use an inset bubble; agent text remains on the panel surface; tool activity expands through disclosure controls. The preview retains its toolbar and explicit loading, setup, error, browser, and native-phone states. The landing demo illustrates a working-copy node and separate outgoing preview, but this signed-in widget still combines chat and preview. The demo does not add multiple-repository support, generic artifacts, backend services, or separate preview infrastructure.
- **Scripted workspace demo:** A plain browser frame contains real Svelte Flow repository → session → worktree → preview nodes; the Code node represents the worktree. Its visible note explains that every prompt runs the same habit tracker; no authentication or backend work occurs. The initial sequence and Replay alone animate the labelled cursor through typing, submit, and a checkbox click, ending at three of four habits complete. The cursor uses blue (#8aa4ff), dark tag text (#111b3c), a pale pointer edge (#dce4ff), and a matching blue click pulse; this approved accent is shared with the Clank companion presence. Editable prompts preserve visitor text. New/fork worktrees appear after submission; their previews appear only when preview startup begins. Reuse and follow-ups update the same worktree and retain an already-visible preview, without duplicates. Manual submission adds no scripted cursor actions or automatic checkbox click. These previews begin at two of four complete and retain normal checkbox interaction inside the pannable canvas. Replay resets the original session and hides its worktree and preview until their stages recur, preserving other sessions. Reset view focuses the active agent, and View preview becomes available at the ready phase. Reduced motion offers Next step with a static cursor and no automatic checkbox click. Loading and retry states are explicit.
- **Demo worktree gestures:** Drag the repository’s right port to blank canvas to create a draft from main, or the Code node’s bottom Fork port to create a draft for a child worktree. Drag a draft session’s output to an existing worktree’s left input to reuse it; dragging that input to blank canvas creates a reuse draft directly. Enter on the repository, Fork, or worktree-input port provides the same draft-creation alternatives. Only draft connections can change. Creating a node from a port or blank canvas keeps the camera still; measured drafts receive textarea focus without scrolling. Session context identifies the base branch or reused worktree; worktree nodes retain parent lineage and show their source branch. A worktree accepts one active demo writer. Busy fork or reuse attempts show an error and retain the draft; Replay waits if another session is editing the original worktree.
- **Demo node actions:** Selection and keyboard focus change the actual node borders to muted orange, including both the session tab and body. There is no detached outline or glow. Clicking a node selects it without camera movement and exits follow while playback continues; a submitted session also opens its own sidebar conversation. The header and context label remain drag handles, and editable controls keep normal interaction. Deletion controls are paused: Backspace/Delete do not remove nodes or open a confirmation dialog.
- **Session progress and chat:** The current public default keeps the prompt above the latest activity. A derived session title, staged action, and changing file counts make progress visible as the session and code surfaces change height. Clicking a submitted session or Open chat opens its corresponding sidebar without moving the camera. Each session keeps its own history; once work completes, a follow-up continues that session on the same worktree. The session composer is disabled while work is active, and Back to Clank returns to the companion. Development-only presentation variants remain exploratory rather than a selected design-system rule.
- **Clank companion:** The circle-only blue mascot launcher or persistent Clank cursor tag opens a nonmodal sidebar. Its header shows a compact @Clank button in the approved presence blue, alongside a gray outlined Idle dot or green filled Working dot and label for scripted playback and user requests. The button retains pale blue text over a translucent blue background, 1px by 5px padding, and a 4px radius, with hover and keyboard-focus states. Its accessible name is “Follow Clank on canvas”; activation centers the cursor at the current zoom and enables follow while preserving the open sidebar and playback. User messages are right-aligned graphite bubbles, capped at 88% width with 7px corners and 7px by 10px padding; they have no visible “you” label. Assistant messages retain the “clank” label. Headers and messages have no avatars. The sidebar uses the builder panel surface and neutral dividers; an inset composer uses a 7px radius and strengthens its border on focus. Opening through the avatar or cursor tag focuses the input and enables follow while scripted playback continues. Follow centers the cursor in the actual canvas, excluding the sidebar, at the current zoom; it tracks movement, completion, and resize. Replay preserves enabled following. The upper-left Following Clank button, user panning, node dragging, explicit focus actions, or new user work exit follow. Send is disabled for empty or pending requests; Enter sends and Shift+Enter adds a line. Close and Escape restore focus to the launcher. Each request starts a separate agent, working-copy, and preview row below existing nodes without moving the camera. Closing and reopening retains the conversation and request status, and Replay preserves these sessions. Show session and the ready-state View preview action focus the corresponding canvas view while keeping the sidebar open. Errors remain visible beside the composer. Every request runs the same local habit-tracker example without scripted cursor actions, real AI, authentication, voice, or backend work. The chat states this demo limitation.
- **Canvas session menu:** The board and scripted demo share one compact New session action with the recorded menu shell and item dimensions, a 16px SVG plus, and 13px text on a 20px line height. A thin structural border defines the shell; hover and keyboard focus raise the item tone, with an inset one-pixel action-white focus outline. The menu opens on blank canvas, stays at least 8px inside the viewport, and preserves native context menus in node content. Shift+F10 on the focused canvas opens it at canvas center and focuses the item; Escape returns focus to the canvas. Tab, outside click, canvas movement, wheel, scroll, resize, and window blur dismiss it. Creating from the board places a fresh draft at the original flow coordinate, preserves existing drafts, and keeps the viewport still. In the demo, New session creates an independent editable composer at the clicked flow coordinate without moving the camera. Once the new node is measured, its textarea receives focus with scrolling prevented. Existing demo sessions remain intact. Submitting that composer runs the local example; only the real board’s normal submission path creates a host session.
- **Imagery:** The existing mascot is the only branded raster treatment in this change and is rendered with `grayscale(1)`; the companion launcher additionally uses `brightness(.2)`. No new shipping raster assets were created. Files under `.impeccable/mocks/` are development references, not shipped UI assets.

## Do's and Don'ts

### Do:

- Do preserve the recognizable Clank mascot in grayscale and the shared SVG icon geometry.
- Do use brightness, neutral borders, and visible keyboard focus to distinguish controls and state.
- Do keep project source in the tab and execution inside the prompt footer.
- Do retain independent mobile scrolling for input material and the draft/authentication region.
- Do retain the board's readable widget widths and narrow-screen Chat/Preview tabs.
- Do anchor repository, image, and output connections to their corresponding controls and keep motion directional.
- Do pause connection and demo motion offscreen or when hidden, and preserve manual progression under reduced motion.
- Do keep the demo labelled as scripted and its node contents readable through panning and preview focus.

### Don't:

- Don't add pink or extend color beyond Clank presence blue, green additions/current work, red removals, and muted orange node selection in the demo.
- Don't apply this scoped palette to existing pricing, account, or onboarding pages.
- Don't use tiny status-label sizes as the default for operational text.
- Don't let canvas dragging consume normal interaction inside forms, input material, transcripts, or previews.
- Don't imply real input satellites are independent draggable nodes or that image attachments sync across browsers.
- Don't present the demo’s separate working-copy and preview nodes as a change to the signed-in project widget.
