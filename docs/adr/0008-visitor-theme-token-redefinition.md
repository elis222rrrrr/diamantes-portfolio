# 0008. Visitor light/dark theme via CSS variable redefinition

Status: Accepted
Date: 2026-07-21 (recorded retroactively)

## Context

The public site's entire visual design was built directly on Tailwind's `white`/`black` color
utilities (`bg-black`, `text-white`, `border-white/15`, …) across roughly 40 files and 200 class
usages, with no theme-token abstraction. A visitor-facing light/dark toggle was requested without
a full redesign — the two realistic approaches were rewriting every one of those ~200 usages to a
new token system, or finding a way to make the existing classes theme-aware without touching them.

## Decision

Confirmed (not assumed) that Tailwind v4 compiles `.text-white` to `color: var(--color-white)` — a
real CSS custom property, even for opacity-modifier variants via `color-mix()`. `app/globals.css`
redefines `--color-white`/`--color-black` (swapped) under `html[data-theme="light"]
[data-site-root]`, so every existing `bg-black`/`text-white`/etc. usage re-themes for free. The
admin panel intentionally stays dark-only — `[data-site-root]` scopes the redefinition to the
public site layout only.

## Consequences

- Zero of the ~200 existing class usages needed to change — the fix is two variable redefinitions,
  not a 40-file rewrite. This only works because it was confirmed against actual compiled CSS
  output first, not assumed from Tailwind's docs alone.
- Three genuinely custom-CSS pieces (`.card-gradient`, `.chrome-text`, `.nav-dot`) and the logo
  image needed their own explicit light-theme values, since they're not Tailwind utilities that
  ride on the two redefined variables.
- A handful of purely decorative inline `rgba(255,255,255,…)` gradients (Hero's chrome blob, grid
  overlay) don't invert — a disclosed limitation, not new light-mode art direction, since they're
  literal `style` attribute values, not classes.
- The theme itself is set via `data-theme` on `<html>` by a `next/script`
  `strategy="beforeInteractive"` inline script — confirmed against Next's own docs that this always
  injects into `<head>` and runs before hydration, avoiding a flash of the wrong theme.
- **Revisit if:** the site's visual design moves off Tailwind's raw color utilities onto a proper
  design-token system for other reasons — at that point this redefinition trick becomes unnecessary
  scaffolding rather than the load-bearing mechanism it is today.
