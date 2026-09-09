---
name: Clank landing and builder board
description: A dark, minimal canvas for turning an idea into an app.
colors:
  builder-bg: "#141416"
  builder-panel: "#1e1e21"
  builder-raised: "#262629"
  builder-line: "#38383d"
  builder-text: "#f3f0ed"
  builder-muted: "#b2adb4"
  builder-accent: "#fa8198"
typography:
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
  label:
    fontFamily: "Inter, Inter Fallback, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SF Mono, Menlo, monospace"
rounded:
  compact: "6px"
  control: "8px"
  message: "10px"
  choice: "12px"
  panel: "14px"
spacing:
  compact: "8px"
  control: "12px"
  inset: "16px"
  form: "28px"
components:
  button-primary:
    backgroundColor: "{colors.builder-accent}"
    textColor: "#221417"
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
    textColor: "#23161a"
    rounded: "9px"
    size: "36px"
  input:
    backgroundColor: "#19171c"
    textColor: "{colors.builder-text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  target-choice:
    rounded: "{rounded.control}"
    padding: "10px 13px"
  project-card:
    backgroundColor: "{colors.builder-panel}"
    rounded: "{rounded.panel}"
  chat-composer:
    backgroundColor: "#29232c"
    rounded: "{rounded.message}"
    padding: "12px"
---

# Design System: Clank landing and builder board

## Overview

**Creative North Star: "Dark connected canvas"**

Clank uses a clean graphite field, warm white text, coral selection paths, and the existing mascot. Controls stay compact while the canvas gives ideas room to grow. Surface borders and restrained tonal shifts organize the interface.

This document covers only the landing page and builder board rendered inside `.clank-builder`, including the board's embedded sign-in and project forms. Pricing, account, onboarding, and other existing pages retain their incumbent system. Implementation evidence lives in `src/lib/builder/`, with shared font definitions in `src/app.css`; surface composition belongs in `.impeccable/landing.brief.md`.

**Key Characteristics:**

- Graphite surfaces with warm white text and coral interaction accents.
- Compact controls, softly rounded containers, and thin structural borders.
- A fading dot field on entry and a pannable project board.

## Colors

The palette combines near-neutral graphite with muted plum details and a clear coral accent.

- **Primary — Coral:** `builder-accent` marks primary actions, active connections, caret color, and focus.
- **Neutral — Graphite:** `builder-bg` is the canvas; `builder-panel` contains project content; `builder-raised` supplies raised or hovered control surfaces.
- **Neutral — Warm white and muted gray:** `builder-text` carries primary content; `builder-muted` supports secondary copy and navigation.
- **Neutral — Structural gray:** `builder-line` separates controls and panels. Individual composers, messages, selected choices, and error panels use local plum tints from the component stylesheet.

## Typography

Self-hosted Inter supplies both headings and interface text; JetBrains Mono supplies code. The shared font assets are retained without importing the incumbent pages' warm-paper palette.

The hierarchy is compact: medium-weight headings, regular body copy, and medium-weight selection labels. Form titles use the recorded title role. Conversation text is 13px with a 1.65 line height; the mobile chat composer uses 16px. The landing heading scales from 36px to 52px and resolves to 37px at the narrow breakpoint. Smaller status and helper labels are component-specific, not a general body-text scale.

## Layout

The landing uses centered bounded regions: a header up to 1320px wide, a connected prompt up to 1100px, and supporting content up to 1120px. Cloud/local choices sit left of the prompt; web/mobile choices sit right. Connections disappear at 1000px and below. At 699px and below, choices become horizontal rows above and below the prompt, supporting content becomes one column, and examples wrap.

The board fills the viewport beneath its header. Desktop project widgets are 1080px wide, with a 350px conversation column beside the preview; draft widgets are 430px wide. At 699px and below, both become 350px wide and project widgets switch between Chat and Preview tabs. Headers remain drag handles while forms, transcripts, and previews preserve normal interaction. Board zoom runs from 0.25 to 1.5.

## Elevation & Depth

Custom builder surfaces use tonal layering and thin borders rather than a shadow scale. The landing dot field uses a 24px grid with a radial fade and a slow 9-second opacity cycle. The board reuses the grid spacing without the landing fade. Control color changes take 160ms; selected connector strokes take 300ms. Reduced-motion preferences disable builder animation and transitions.

## Shapes

Controls use the control radius; conversation bubbles and composers use the message radius; execution choices use the choice radius; project widgets and the main prompt use the panel radius. Borders are generally one pixel. Icons are shared, unfilled SVG paths with rounded line caps and joins, keeping their geometry consistent across labels and actions.

## Components

- **Buttons:** Coral primary actions, outlined quiet actions, coral text actions, and compact icon actions share restrained color transitions. The send action is square with rounded corners. Disabled buttons visibly dim; disabled send buttons use their own muted plum treatment.
- **Inputs and composers:** Dark inset fields use a thin border. Composers strengthen their border on focus; other focusable controls use a coral outline with an offset. The main prompt and the chat composer keep their action in a trailing footer.
- **Choices:** Radio-backed execution/output cards and project target tabs show selection through border, background, and text color. Desktop execution/output cards also use a small status dot. Focus remains visible around the choice label.
- **Navigation:** The mascot wordmark anchors the header. Secondary links remain muted until hover. The board header groups project switching and creation; compact layouts hide secondary account and source links.
- **Project widgets:** A tinted drag header caps the conversation and preview. Human messages use an inset bubble; agent text remains on the panel surface; tool activity expands through disclosure controls. The preview has its own toolbar and explicit loading, setup, error, browser, and native-phone states.

## Do's and Don'ts

### Do:

- Do preserve the recognizable Clank mascot and shared SVG icon geometry.
- Do use coral to make actions, selection, and keyboard focus visible.
- Do retain the board's readable widget widths and narrow-screen Chat/Preview tabs.
- Do honor reduced-motion preferences for the dot field and control transitions.

### Don't:

- Don't apply this scoped palette to existing pricing, account, or onboarding pages.
- Don't use tiny status-label sizes as the default for operational text.
- Don't let canvas dragging consume normal interaction inside forms, transcripts, or previews.
