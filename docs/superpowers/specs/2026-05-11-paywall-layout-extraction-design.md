# Paywall Layout Extraction — Design

**Status:** Approved (brainstorm)
**Date:** 2026-05-11
**Author:** Jacob Rakidzich (with Claude)
**Branch:** `jzdesign/poc-ui-rendering-validation`

## 1. Problem

We need a way to render an RC paywall in `purchases-js`, capture the resulting
layout of every paywall component as JSON, and write that JSON to disk. The
output is for cross-platform layout comparison against the Android and iOS
extractors, so the schema must match the existing extractor format.

The capture function is for testing/analysis only. It must be optimized out of
the published `@revenuecat/purchases-js` package — no runtime cost, no public
API surface, no leaked types.

The captured layout must reflect the *production* render path. Any rendering
divergence between what `presentPaywall` displays to a real user and what the
extractor measures defeats the purpose.

## 2. Goals & non-goals

**Goals:**
- A function (`extractPaywallLayout`) that takes paywall JSON, a viewport, a
  locale, and a dark-mode flag, and returns a JSON object describing every
  component's rendered frame and state.
- Production parity: a single mount pipeline is shared between
  `presentPaywall` and the extractor.
- A Node-side script that drives the function from disk inputs to a JSON file
  on disk.
- Zero impact on the published package bundle.

**Non-goals:**
- Cross-version paywall format compatibility — we target the current
  `PaywallData` schema.
- Batch extraction (one paywall per script run; batching is a wrapper).
- Authoring/preview tooling beyond the minimal playground page that hosts the
  function for Playwright.
- Capturing fonts, CSS variables, or screenshots — frames, labels, type, and
  state only.

## 3. Decisions

| Topic | Choice | Rationale |
|---|---|---|
| Runtime environment | Real browser via Playwright/headless Chromium | jsdom returns zeros from `getBoundingClientRect`; we need real layout. |
| DOM ↔ component-id mapping | Upstream patch to `purchases-ui-js` to emit `data-rc-component-id` and `data-rc-component-type` | Cleanest, durable, and the sibling repo is already checked out. |
| Output sink | Function returns JSON; Node script writes to disk | Easy to automate; clean separation between page-side logic and FS access. |
| Approach | Refined Approach A — single shared mount pipeline | Production parity by construction. Extractor lives in `src/dev/` for clean tree-shaking, but consumes the same prop-bag helper as `presentPaywall`. |
| Input shape | `{ paywallData, uiConfig, offering?, locale, darkMode, viewport, customVariables? }` | Mirrors what `buildPaywallMountProps` consumes; optional offering for realistic variables. |
| `nativeType` field | Fixed cross-platform vocabulary AND a `domTag` field | Cross-platform comparison stays clean; raw tag aids debugging. |

## 4. Architecture

### 4.1 File layout

```
purchases-js/
  src/
    main.ts                                # presentPaywall now calls buildPaywallMountProps()
    helpers/
      paywall-mount-props.ts               # NEW. Pure helper returning the prop bag for <Paywall>.
    dev/
      extract-paywall-layout.ts            # NEW. The extractor itself; gated by __RC_PAYWALL_EXTRACTOR__.
      extract-types.ts                     # NEW. ExtractInput / ExtractedLayout types.
      extract-install.ts                   # NEW. Attaches the extractor to window.__rcExtractPaywallLayout__.
  scripts/
    extract-paywall-layout.mjs             # NEW. Node CLI: Playwright + dev server + writes JSON.
    extractor-playground/
      index.html                           # NEW. Minimal dev page.
      main.ts                              # NEW. Imports installer, exposes the global.

../purchases-ui-js/                        # Sibling repo on jzdesign/poc-ui-rendering-validation
  src/lib/components/.../*.svelte          # Upstream patch: emit data-rc-component-id / data-rc-component-type
```

### 4.2 Production-parity contract

The single source of truth for "how a paywall is mounted" is
`buildPaywallMountProps()`.

- `presentPaywall` (production): calls `buildPaywallMountProps`, layers on real
  purchase / event / navigation handlers, mounts as today.
- `extractPaywallLayout` (testing only): calls the *same* helper, layers on
  no-op handlers and a stub events tracker, mounts, measures, unmounts.

Any future change to the rendering setup (locale fallback, variables, info per
package, wallet button render, the `<Paywall>` prop list) goes through
`buildPaywallMountProps` and is therefore automatically picked up by the
extractor. This is the mechanism that guarantees parity.

`presentPaywall` keeps its existing public signature and behavior. The refactor
is internal.

## 5. Public API of the extractor

```ts
// src/dev/extract-types.ts
import type { PaywallData, UiConfig, CustomVariables } from "@revenuecat/purchases-ui-js";
import type { Offering } from "../entities/offerings";

export interface ExtractInput {
  paywallData: PaywallData;
  uiConfig: UiConfig;
  offering?: Offering;
  locale: string;                      // e.g. "en_US"
  darkMode?: boolean;                  // default false
  viewport: { width: number; height: number; scale?: number };
  customVariables?: CustomVariables;
}

export interface Frame { x: number; y: number; width: number; height: number; }

export interface ComponentLayout {
  componentId: string;
  dashboardType: string;               // raw BaseComponent.type
  dashboardName?: string;              // BaseComponent.name when present
  rendered: boolean;
  nativeType?: "StaticText" | "Image" | "Button" | "Other";
  domTag?: string;                     // rendered tag name, lowercased
  label?: string;                      // textContent for text-like components
  frame: Frame;                        // {0,0,0,0} when rendered=false
  state: { enabled: boolean; selected: boolean };
}

export interface ExtractedLayout {
  metadata: {
    platform: "web";
    platformVersion: string;           // navigator.userAgent at extract time
    extractorVersion: string;          // constant exported from extract-paywall-layout.ts
    offeringId: string | null;
    locale: string;                    // resolved locale, post-fallback
    timestamp: string;                 // ISO 8601
    viewport: { width: number; height: number; scale: number };
    rootFrame: Frame;
  };
  components: Record<string, ComponentLayout>;
}

// src/dev/extract-paywall-layout.ts
export const EXTRACTOR_VERSION = "1.0.0";
export async function extractPaywallLayout(input: ExtractInput): Promise<ExtractedLayout>;
```

### 5.1 Behavior

1. Create a sized container (`viewport.width × viewport.height`) in
   `document.body`. Apply `transform: scale(viewport.scale)` with
   `transform-origin: top left`.
2. Force dark mode: set `color-scheme` on the container and override
   `window.matchMedia("(prefers-color-scheme: dark)")` to return the requested
   mode for the duration of the call. Restore on cleanup.
3. Synthesize a minimal `Offering` if `input.offering` is absent (uses package
   IDs from `paywallData`; blank prices and product details).
4. Call `buildPaywallMountProps(offering, { locale, customVariables, … })`.
5. `mount(Paywall, { target: container, props: { ...mountProps,
   onPurchaseClicked: noop, onError: noop, … } })`.
6. Await two animation frames + a microtask flush to let Svelte 5 finish
   reactive effects.
7. Walk `paywallData.components_config.base.stack` recursively, descending into
   every wrapper type: `stack`, `footer`, `purchase_button` (its `stack`),
   `carousel`, `tabs` (tab/tab control), `package`, `timeline`, `badge`
   (when nested in a `stack`), `sticky_footer` from `RootPaywall`.
8. For each component `id`, query
   `container.querySelector('[data-rc-component-id="' + id + '"]')`.
9. `rendered = false` if no element is found OR `getComputedStyle(el).display === "none"`.
10. Frame = `el.getBoundingClientRect()` minus `container.getBoundingClientRect()`'s
    top-left, then rounded to integers.
11. Unmount, remove container, restore `matchMedia`, return the JSON object.

### 5.2 `nativeType` mapping

| `dashboardType` | `nativeType` |
|---|---|
| `text` | `StaticText` |
| `image` | `Image` |
| `icon` | `Image` |
| `button`, `purchase_button`, `wallet_button`, `redemption_button`, `express_purchase_button` | `Button` |
| anything else | `Other` |

Components with `rendered: false` omit `nativeType`, `domTag`, and `label`, and
set `frame: { x: 0, y: 0, width: 0, height: 0 }` to match the example.

### 5.3 `state` derivation

- `enabled`: `true` unless the rendered element has `disabled` or
  `aria-disabled="true"`.
- `selected`: read from a `data-rc-selected` attribute that the upstream patch
  adds where a component has internal selection state (e.g., the chosen
  package). If the upstream patch can't cheaply expose this, MVP defaults
  `selected: false` (see §10 for the deferred-followup entry).

## 6. Build-time gating

The function and the `src/dev/` subtree must not ship in the production
package.

**Mechanism:**

- `vite.config.js`:
  ```js
  define: {
    __RC_PAYWALL_EXTRACTOR__: JSON.stringify(mode !== "production"),
  }
  ```
- `src/main.ts`:
  ```ts
  declare const __RC_PAYWALL_EXTRACTOR__: boolean;
  if (__RC_PAYWALL_EXTRACTOR__) {
    void import("./dev/extract-install").then((m) => m.installExtractor());
  }
  ```
- In a production `vite build`, `__RC_PAYWALL_EXTRACTOR__` evaluates to
  `false`. Rollup eliminates the branch, the dynamic import target becomes
  unreferenced, and the entire `src/dev/` subtree is excluded from
  `Purchases.es.js` / `Purchases.umd.js`.
- The `.d.ts` rollup via `vite-plugin-dts` does not include extractor types
  because they are never re-exported from `main.ts`.

**Guard rail:** A CI step (script: `scripts/check-extractor-stripped.mjs`) does
a production `pnpm run build`, then greps the resulting `dist/Purchases.es.js`
and `dist/Purchases.umd.js` for the symbols `extractPaywallLayout` and
`installExtractor`. Either appearing fails the build. (Path fragments aren't
reliable since Rollup mangles paths; we check on exported identifiers, which
survive tree-shaking when they're actually present.)

## 7. Node orchestrator

```
scripts/extract-paywall-layout.mjs
```

**CLI shape:**

```bash
node scripts/extract-paywall-layout.mjs \
  --input fixtures/paywall.json \
  --offering fixtures/offering.json \
  --locale en_US \
  --dark-mode \
  --width 402 --height 874 --scale 1 \
  --out out/extracted.json
```

`--input` is an `ExtractInput` JSON file (minus `offering`, which is
`--offering`). `--offering` is optional. `--dark-mode` is a boolean flag.

**Flow:**

1. Read inputs from disk; validate against `ExtractInput` (light shape check).
2. Launch Playwright Chromium (`@playwright/test` added as a devDependency).
3. Start a Vite dev server pointing at `scripts/extractor-playground/`.
4. Navigate to `http://localhost:<port>/`; the page's `main.ts` imports the
   installer, which attaches `window.__rcExtractPaywallLayout__`.
5. `await page.evaluate(input => window.__rcExtractPaywallLayout__(input), input)`.
6. Write returned JSON to `--out`. Pretty-printed, 2-space indent, trailing
   newline.
7. Tear down browser + dev server.

The orchestrator exits non-zero on any error, with a clear message including
which step failed.

## 8. Upstream `purchases-ui-js` change

Sibling repo: `../purchases-ui-js` on branch
`jzdesign/poc-ui-rendering-validation` (already checked out).

Minimal PR contents:

1. Each leaf component template (`Text.svelte`, `Stack.svelte`, `Icon.svelte`,
   `Image.svelte`, `PurchaseButton.svelte`, `Footer.svelte`, `Package.svelte`,
   `Button.svelte`, `Timeline.svelte`, `Video.svelte`, `Carousel.svelte`,
   tabs/options/inputs) emits `data-rc-component-id={id}` and
   `data-rc-component-type={type}` on its outermost rendered element.
2. When a component wraps in a `<Stack>` (e.g., `PurchaseButton`, `Footer`),
   the attrs go on the outermost rendered element so the frame matches the
   component's box.
3. Optional: where a component owns internal selection state (notably
   `Package` / option pickers), emit `data-rc-selected={isSelected}`.
4. Bump `purchases-ui-js` version; pin in `purchases-js/package.json`.

Local development uses the `pnpm-workspace.yaml` override pattern already
documented in this repo's `README.md`.

## 9. Testing strategy

- **Unit (vitest, jsdom):** `paywall-mount-props.test.ts` — exercises
  `buildPaywallMountProps` against fixture offerings. Verifies it produces the
  same outputs the current `presentPaywall` body would. Snapshot-based,
  refactor-safe.
- **Unit (vitest, jsdom):** `extract-paywall-layout.tree-walk.test.ts` — drives
  the tree walk and DOM-query logic against a hand-built mount with stubbed
  `getBoundingClientRect`. Tests serialization, `rendered` detection, and
  `nativeType` mapping without depending on real layout.
- **End-to-end (Playwright, headless):**
  `scripts/extract-paywall-layout.e2e.test.ts` — runs the full Node
  orchestrator against a checked-in fixture paywall + offering. Asserts output
  matches a stored expected JSON (frames rounded to ints). This is the
  test that catches production-parity drift.
- **Bundle-shape test:** post-`pnpm run build` (production mode), grep the
  dist for `extractPaywallLayout` and `src/dev/`. Both must be absent. Wired
  into CI.

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Upstream `purchases-ui-js` patch lands late | The two repos are sibling checkouts on the same branch name; the patch + the consumer can land in lockstep with a coordinated version bump. |
| Tree-walk misses a wrapping component type that's added later | The walker iterates over every `Component` variant by `type`; new variants without explicit handling default to "leaf" (no descent), which is safe but misses children. Cover with a unit test that exhaustively lists current types and fails when a new one is added without an entry. |
| Float frame jitter between Playwright runs | Round all frame values to integers before serializing. |
| Dark-mode forcing leaks across calls | The extractor wraps `matchMedia` for the duration of one call and restores on cleanup, including in error paths. |
| `selected` state proves expensive to expose upstream | Acceptable to ship MVP with `selected: false` and a documented limitation; can be added later without changing the JSON shape. |

## 11. Open items intentionally deferred

- Whether to support multiple viewports in a single invocation. The Node
  script can be invoked multiple times by a wrapper; no need to add this to
  the in-page API yet.
- Whether to expose `extractorVersion` as something other than a hard-coded
  constant. A constant is fine for v1; can move to package.json sync later.
- Wiring `state.selected` through to upstream `data-rc-selected` if the cost
  of exposing internal selection contexts is meaningful. MVP defaults
  `selected: false` everywhere if not surfaced.
