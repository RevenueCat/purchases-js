# Paywall Layout Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a testing-only `extractPaywallLayout` function (gated to be tree-shaken from the published package) that mounts a paywall via the same code path as `presentPaywall`, walks the rendered DOM, and emits per-component layout JSON matching the cross-platform extractor schema in `docs/superpowers/specs/2026-05-11-paywall-layout-extraction-design.md`.

**Architecture:** Refactor the prop-bag computation out of `presentPaywall` into a shared helper (`buildPaywallMountProps`) so both production and the extractor traverse the same mount pipeline. The extractor lives in `src/dev/`, gated by a Vite-defined boolean (`__RC_PAYWALL_EXTRACTOR__`) so Rollup tree-shakes it from production builds. A Node-side Playwright orchestrator invokes the in-page function and writes the returned JSON to disk. Upstream `purchases-ui-js` emits `data-rc-component-id`/`data-rc-component-type` on each rendered component root so the page-side walker can correlate paywall component IDs with DOM nodes.

**Tech Stack:** Svelte 5, TypeScript, Vite 6, Vitest 3 (+ jsdom), Playwright Chromium (new devDependency `@playwright/test`).

---

## File Structure

**Created in `purchases-js`:**

| Path | Responsibility |
|---|---|
| `src/helpers/paywall-mount-props.ts` | Pure helper. Resolves locale, builds `variablesPerPackage`/`infoPerPackage`, returns the prop bag shared between `presentPaywall` and the extractor. |
| `src/dev/extract-types.ts` | `ExtractInput`, `Frame`, `ComponentLayout`, `ExtractedLayout`, plus the `EXTRACTOR_VERSION` constant. |
| `src/dev/paywall-tree-walker.ts` | Pure tree walk over `PaywallData.components_config.base.stack`. Yields `{id, type, name}` per component. |
| `src/dev/dom-layout-reader.ts` | Given a container element and an `id`, looks up the rendered DOM node via `data-rc-component-id` and produces a `ComponentLayout`. |
| `src/dev/synthesize-offering.ts` | Builds a minimal `Offering` when `input.offering` is absent. |
| `src/dev/extract-paywall-layout.ts` | Exports `extractPaywallLayout(input)`. Composes the above. |
| `src/dev/extract-install.ts` | Attaches the extractor to `window.__rcExtractPaywallLayout__`. |
| `scripts/extract-paywall-layout.mjs` | Node CLI: launches Playwright, calls the page-side function, writes JSON. |
| `scripts/extractor-playground/index.html` | Minimal HTML page Playwright loads. |
| `scripts/extractor-playground/main.ts` | Imports `installExtractor` from purchases-js. |
| `scripts/check-extractor-stripped.mjs` | CI guard. Greps production `dist/` for extractor symbols, exits non-zero if found. |
| `scripts/fixtures/paywall.json` | Test fixture: small but valid `PaywallData` + `uiConfig` + `Offering`. |
| `scripts/fixtures/expected-extract.json` | Expected output for the fixture (frames rounded to ints). |
| `src/tests/helpers/paywall-mount-props.test.ts` | Snapshot test for the prop bag. |
| `src/tests/dev/paywall-tree-walker.test.ts` | Unit test for the tree walker. |
| `src/tests/dev/dom-layout-reader.test.ts` | Unit test for the DOM layout reader. |
| `src/tests/dev/synthesize-offering.test.ts` | Unit test for the offering synthesizer. |
| `src/tests/dev/extract-paywall-layout.test.ts` | jsdom-level integration test of `extractPaywallLayout`. |
| `scripts/extract-paywall-layout.e2e.test.mjs` | End-to-end test running the Node CLI against the fixture, asserting against `expected-extract.json`. |
| `global.d.ts` | (Modified) Declares `__RC_PAYWALL_EXTRACTOR__: boolean`. |

**Modified in `purchases-js`:**

| Path | Change |
|---|---|
| `src/main.ts` | `presentPaywall` calls `buildPaywallMountProps`; gated dynamic import of `installExtractor`. |
| `vite.config.js` | Add `define: { __RC_PAYWALL_EXTRACTOR__: JSON.stringify(mode !== "production") }`. |
| `vitest.config.js` | Define `__RC_PAYWALL_EXTRACTOR__: true` so tests can exercise the dev module. |
| `package.json` | Add `@playwright/test` devDependency, plus `extract`, `extract:e2e`, `check-extractor-stripped` scripts. |
| `tsconfig.test.json` | Include `scripts/` for the E2E test. |

**Modified in `../purchases-ui-js`:**

| Path | Change |
|---|---|
| `src/lib/components/**/*.svelte` (leaf templates) | Add `data-rc-component-id={id}` and `data-rc-component-type={type}` to the outermost rendered element. |
| `package.json` | Bump version. |
| `CHANGELOG.md` | Note the new data attrs. |

---

## Phase 0 — Upstream `purchases-ui-js` data attributes

> All Phase 0 work is in `../purchases-ui-js`. After editing, build with `cd ../purchases-ui-js && pnpm install && pnpm run build` so `purchases-js` consumes the change via the existing symlink.

### Task 0.1 — Add component-id data attrs to every leaf template

**Files** (`../purchases-ui-js/src/lib/components/...`):

- Modify: `button/ButtonNode.svelte`
- Modify: `carousel/Carousel.svelte`
- Modify: `countdown/Countdown.svelte`
- Modify: `express-purchase-button/ExpressPurchaseButton.svelte`
- Modify: `footer/Footer.svelte`
- Modify: `header/Header.svelte`
- Modify: `icon/Icon.svelte`
- Modify: `image/Image.svelte`
- Modify: `input-text/InputText.svelte`
- Modify: `options/InputMultipleChoice.svelte`
- Modify: `options/InputOption.svelte`
- Modify: `options/InputSingleChoice.svelte`
- Modify: `package/Package.svelte`
- Modify: `purchase-button/PurchaseButton.svelte`
- Modify: `redemption-button/RedemptionButton.svelte`
- Modify: `skeleton-loader/SkeletonLoader.svelte`
- Modify: `stack/Stack.svelte`
- Modify: `tabs/TabControl.svelte`
- Modify: `tabs/TabControlButton.svelte`
- Modify: `tabs/TabControlToggle.svelte`
- Modify: `tabs/Tabs.svelte`
- Modify: `text/TextNode.svelte`
- Modify: `timeline/Timeline.svelte`
- Modify: `video/Video.svelte`
- Modify: `wallet-button/WalletButton.svelte`

**Pattern:** Each template already accesses `props.id` (from `BaseComponent`) and `props.type` (literal string). Add `data-rc-component-id={id}` and `data-rc-component-type={type}` to the outermost element rendered when the component is visible.

#### Example — `text/TextNode.svelte`

The outermost element is the `<span>` inside `{#if isVisible}` (line ~124).

Before:
```svelte
{#if isVisible}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <span style={wrapperStyles} {onclick}>
    <Text style={textStyles} component="span">
      {@html markdownParsed}
    </Text>
  </span>
{/if}
```

After:
```svelte
{#if isVisible}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <span
    style={wrapperStyles}
    {onclick}
    data-rc-component-id={props.id}
    data-rc-component-type={props.type}
  >
    <Text style={textStyles} component="span">
      {@html markdownParsed}
    </Text>
  </span>
{/if}
```

#### Example — `stack/Stack.svelte`

The outermost element is the `<svelte:element>` inside `{#if isVisible}` (line ~143).

Before:
```svelte
<svelte:element
  this={onclick !== undefined ? "button" : "div"}
  role={onclick !== undefined ? "button" : undefined}
  {onclick}
  style={stackStyle}
  class={[...].filter(Boolean).join(" ")}
  data-testid={testId}
>
```

After:
```svelte
<svelte:element
  this={onclick !== undefined ? "button" : "div"}
  role={onclick !== undefined ? "button" : undefined}
  {onclick}
  style={stackStyle}
  class={[...].filter(Boolean).join(" ")}
  data-testid={testId}
  data-rc-component-id={props.id}
  data-rc-component-type={props.type}
>
```

For each remaining file: locate the outermost element of the rendered template (typically inside an `{#if isVisible}` or unconditional at the top level). Add the same two attribute lines.

- [ ] **Step 1: Capture the baseline test result**

Run: `cd ../purchases-ui-js && pnpm install && pnpm test`
Expected: PASS (baseline; we want to confirm the tree before changes).

- [ ] **Step 2: Edit each leaf template per the pattern above**

Apply the two-attribute addition to all 25 files listed under **Files**. Use the two worked examples (`TextNode.svelte`, `Stack.svelte`) as templates.

- [ ] **Step 3: Run the upstream test suite**

Run: `cd ../purchases-ui-js && pnpm test`
Expected: PASS. Existing tests should not care about extra data attrs.

- [ ] **Step 4: Build the upstream package**

Run: `cd ../purchases-ui-js && pnpm run build`
Expected: build succeeds, `dist/` is updated.

- [ ] **Step 5: Sanity-check via a built file**

Run: `grep -l 'data-rc-component-id' ../purchases-ui-js/dist/components/**/*.svelte 2>/dev/null | head`
Or for the compiled JS:
Run: `grep -c 'data-rc-component-id' ../purchases-ui-js/dist/components/text/TextNode.svelte`
Expected: ≥ 1 occurrence.

- [ ] **Step 6: Commit in the upstream repo**

```bash
cd ../purchases-ui-js
git add src/lib/components
git commit -m "Add data-rc-component-id / data-rc-component-type attrs to component templates"
```

### Task 0.2 — Bump and pin the upstream version

**Files:**
- Modify: `../purchases-ui-js/package.json` (version bump)
- Modify: `../purchases-ui-js/.version`
- Modify: `purchases-js/package.json` (pin)
- Modify: `purchases-js/.version` (no change needed)

- [ ] **Step 1: Bump upstream version**

Edit `../purchases-ui-js/package.json` `version` from the current value (e.g., `4.3.0`) to the next minor (e.g., `4.4.0-extractor.0`). Use a `-extractor.0` prerelease suffix so the version reflects work-in-progress until upstream merges.

```json
{
  "version": "4.4.0-extractor.0"
}
```

Update `../purchases-ui-js/.version` to match.

- [ ] **Step 2: Pin in purchases-js**

Edit `purchases-js/package.json` devDependencies entry:

```json
"@revenuecat/purchases-ui-js": "4.4.0-extractor.0"
```

(The local symlink in `node_modules/@revenuecat/purchases-ui-js -> ../../../purchases-ui-js` continues to satisfy the dependency during development; the pin documents intent and matches what CI will install once upstream publishes.)

- [ ] **Step 3: Commit in upstream**

```bash
cd ../purchases-ui-js
git add package.json .version
git commit -m "Bump version to 4.4.0-extractor.0"
```

- [ ] **Step 4: Commit in purchases-js**

```bash
cd ../purchases-js
git add package.json
git commit -m "Pin purchases-ui-js to 4.4.0-extractor.0"
```

---

## Phase 1 — Refactor `presentPaywall` to share a mount-prop helper

### Task 1.1 — Extract `buildPaywallMountProps` with snapshot test

**Files:**
- Create: `src/helpers/paywall-mount-props.ts`
- Create: `src/tests/helpers/paywall-mount-props.test.ts`
- Modify: `src/main.ts:514-1024` (the body of `presentPaywall`)

- [ ] **Step 1: Write the failing snapshot test**

Create `src/tests/helpers/paywall-mount-props.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildPaywallMountProps } from "../../helpers/paywall-mount-props";
import { fixtureOffering, fixtureUiConfig } from "../fixtures/paywall-fixtures";

describe("buildPaywallMountProps", () => {
  it("produces a stable prop bag for a fixture offering", () => {
    const result = buildPaywallMountProps({
      offering: fixtureOffering(),
      selectedLocale: "en_US",
      hideBackButtons: false,
      customVariables: undefined,
    });

    expect({
      selectedLocale: result.selectedLocale,
      defaultLocale: result.defaultLocale,
      hideBackButtons: result.hideBackButtons,
      paywallDataId: result.paywallData.id,
      uiConfigKeys: Object.keys(result.uiConfig ?? {}).sort(),
      packageIds: [...result.infoPerPackage.keys()].sort(),
    }).toMatchSnapshot();
  });

  it("falls back to the paywall's default_locale when selectedLocale is unsupported", () => {
    const result = buildPaywallMountProps({
      offering: fixtureOffering(),
      selectedLocale: "xx_YY",
      hideBackButtons: false,
      customVariables: undefined,
    });

    expect(result.selectedLocale).toBe(result.defaultLocale);
  });
});
```

The fixture helpers (`fixtureOffering`, `fixtureUiConfig`) likely already exist under `src/tests/fixtures/` — if a comparable helper isn't there, create `src/tests/fixtures/paywall-fixtures.ts` exporting a minimal `Offering` with `paywallComponents` + `uiConfig`. (Inspect existing test files under `src/tests/` to reuse a fixture if available.)

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec vitest run src/tests/helpers/paywall-mount-props.test.ts`
Expected: FAIL with `Cannot find module '../../helpers/paywall-mount-props'`.

- [ ] **Step 3: Implement `buildPaywallMountProps`**

Create `src/helpers/paywall-mount-props.ts`:

```ts
import {
  Translator,
} from "../ui/localization/translator";
import type {
  PaywallData,
  UiConfig,
  CustomVariables,
  Localizations,
} from "@revenuecat/purchases-ui-js";
import type { Offering } from "../entities/offerings";
import { buildVariablesPerPackage } from "./paywall-variables-helpers";
import { parseOfferingIntoPackageInfoPerPackage } from "./paywall-package-info-helpers";

export interface PaywallMountPropsInput {
  offering: Offering;
  selectedLocale: string;
  hideBackButtons: boolean;
  customVariables?: CustomVariables;
}

export interface PaywallMountProps {
  paywallData: PaywallData;
  uiConfig: UiConfig;
  selectedLocale: string;
  defaultLocale: string;
  variablesPerPackage: ReturnType<typeof buildVariablesPerPackage>;
  infoPerPackage: ReturnType<typeof parseOfferingIntoPackageInfoPerPackage>;
  customVariables: CustomVariables | undefined;
  hideBackButtons: boolean;
}

function calculateLocale(
  paywallData: PaywallData,
  selectedLocale: string,
): string {
  const localesSupportedByPaywall: { [key: string]: string[] } = {};
  const toLocalePrefix = (potentialLocale: string) =>
    potentialLocale.toLowerCase().split("_")[0];

  Object.keys(paywallData.components_localizations).forEach((l) => {
    if (localesSupportedByPaywall[toLocalePrefix(l)] === undefined) {
      localesSupportedByPaywall[toLocalePrefix(l)] = [];
    }
    localesSupportedByPaywall[toLocalePrefix(l)].push(l);
  });

  const localesGroup =
    localesSupportedByPaywall[toLocalePrefix(selectedLocale)];
  if (!localesGroup) {
    return paywallData.default_locale;
  }
  const bestMatch = localesGroup.find(
    (l) => l.toLowerCase() === selectedLocale,
  );
  if (bestMatch) {
    return bestMatch;
  }
  return localesGroup[0];
}

export function buildPaywallMountProps(
  input: PaywallMountPropsInput,
): PaywallMountProps {
  const { offering, selectedLocale, hideBackButtons, customVariables } = input;

  if (!offering.paywallComponents) {
    throw new Error("This offering doesn't have a paywall attached.");
  }
  if (!offering.uiConfig) {
    throw new Error(
      "No ui_config found for this offering, please contact support!",
    );
  }

  const paywallData = offering.paywallComponents;
  const finalLocale = calculateLocale(paywallData, selectedLocale);

  const translator = new Translator(
    {},
    finalLocale,
    paywallData.default_locale,
  );

  const variablesPerPackage = buildVariablesPerPackage(offering, { translator });
  const infoPerPackage = parseOfferingIntoPackageInfoPerPackage(offering);

  return {
    paywallData,
    uiConfig: offering.uiConfig,
    selectedLocale: finalLocale,
    defaultLocale: paywallData.default_locale,
    variablesPerPackage,
    infoPerPackage,
    customVariables,
    hideBackButtons,
  };
}
```

- [ ] **Step 4: Wire `presentPaywall` to use the helper**

In `src/main.ts`, replace the inline locale/variables/info computation (between the `calculateLocale` definition and the `mount(Paywall, { target, props: { ... } })` call) with a single call to `buildPaywallMountProps`. The `mount(...)` call now spreads the returned `PaywallMountProps`:

```ts
const mountProps = buildPaywallMountProps({
  offering,
  selectedLocale: paywallParams.selectedLocale ?? navigator.language,
  hideBackButtons: paywallParams.hideBackButtons ?? false,
  customVariables: paywallParams.customVariables,
});

const finalLocale = mountProps.selectedLocale;
// ...keep the paywallSessionId / paywallBaseEventData / paywallDisplayData blocks unchanged...

component = mount(Paywall, {
  target: certainHTMLTarget,
  props: {
    ...mountProps,
    appUserId: this._appUserId,
    onNavigateToUrlClicked: navigateToUrl,
    onCompleteWorkflowNavigate,
    onVisitCustomerCenterClicked,
    onBackClicked: () => { /* unchanged */ },
    onRestorePurchasesClicked,
    onPurchaseClicked: (selectedPackageId: string) => { /* unchanged */ },
    onError: (err: unknown) => { /* unchanged */ },
    walletButtonRender,
    onComponentInteraction,
  },
});
```

Delete the now-unused inline `calculateLocale` function, the explicit `Translator` construction, the `buildVariablesPerPackage` / `parseOfferingIntoPackageInfoPerPackage` calls (they now happen inside the helper), and the import for `Translator` if no longer used in `main.ts`.

- [ ] **Step 5: Run the snapshot test and verify it passes**

Run: `pnpm exec vitest run src/tests/helpers/paywall-mount-props.test.ts`
Expected: PASS. The snapshot is generated on first run; commit it.

- [ ] **Step 6: Run the full vitest suite to verify no behavior change**

Run: `pnpm exec vitest run`
Expected: PASS. All existing tests (especially `present-paywall.events.test.ts` and `purchase.events.test.ts`) must continue to pass.

- [ ] **Step 7: Run typecheck and lint**

Run: `pnpm run typecheck && pnpm run lint`
Expected: both PASS.

- [ ] **Step 8: Commit**

```bash
git add src/helpers/paywall-mount-props.ts \
        src/tests/helpers/paywall-mount-props.test.ts \
        src/tests/helpers/__snapshots__/paywall-mount-props.test.ts.snap \
        src/main.ts \
        src/tests/fixtures/paywall-fixtures.ts
git commit -m "Extract buildPaywallMountProps from presentPaywall

Pure helper that computes locale fallback, variablesPerPackage, and
infoPerPackage. presentPaywall now calls it; this is the single mount
pipeline that the upcoming extractor will share."
```

---

## Phase 2 — Build-time gating

### Task 2.1 — Add `__RC_PAYWALL_EXTRACTOR__` define and global declaration

**Files:**
- Modify: `vite.config.js`
- Modify: `vitest.config.js`
- Modify: `global.d.ts`

- [ ] **Step 1: Update `vite.config.js`**

Replace the `defineConfig({ ... })` call with one that accepts mode:

```js
export default defineConfig(({ mode }) => ({
  define: {
    __RC_PAYWALL_EXTRACTOR__: JSON.stringify(mode !== "production"),
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "Purchases",
      fileName: (format) => `Purchases.${format}.js`,
    },
  },
  plugins: [
    dts({ rollupTypes: true }),
    svelte({ compilerOptions: { css: "injected" } }),
  ],
}));
```

- [ ] **Step 2: Update `vitest.config.js`**

Add to the existing `define` block:

```js
define: {
  "process.env.VITEST": JSON.stringify(true),
  __RC_PAYWALL_EXTRACTOR__: JSON.stringify(true),
},
```

- [ ] **Step 3: Update `global.d.ts`**

Append:

```ts
declare const __RC_PAYWALL_EXTRACTOR__: boolean;
```

- [ ] **Step 4: Verify dev build still compiles**

Run: `pnpm run build:dev`
Expected: PASS.

- [ ] **Step 5: Verify prod build still compiles**

Run: `pnpm run build`
Expected: PASS.

- [ ] **Step 6: Verify tests still pass**

Run: `pnpm exec vitest run`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add vite.config.js vitest.config.js global.d.ts
git commit -m "Add __RC_PAYWALL_EXTRACTOR__ build flag

Mode-gated define for the upcoming dev-only extractor. Production builds
evaluate it to false so Rollup tree-shakes gated branches; dev builds and
tests evaluate it to true."
```

---

## Phase 3 — Output types and pure helpers

### Task 3.1 — Define types

**Files:**
- Create: `src/dev/extract-types.ts`

- [ ] **Step 1: Write the types**

```ts
import type { PaywallData, UiConfig, CustomVariables } from "@revenuecat/purchases-ui-js";
import type { Offering } from "../entities/offerings";

export const EXTRACTOR_VERSION = "1.0.0";

export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractInput {
  paywallData: PaywallData;
  uiConfig: UiConfig;
  offering?: Offering;
  locale: string;
  darkMode?: boolean;
  viewport: { width: number; height: number; scale?: number };
  customVariables?: CustomVariables;
}

export type NativeType = "StaticText" | "Image" | "Button" | "Other";

export interface ComponentLayout {
  componentId: string;
  dashboardType: string;
  dashboardName?: string;
  rendered: boolean;
  nativeType?: NativeType;
  domTag?: string;
  label?: string;
  frame: Frame;
  state: { enabled: boolean; selected: boolean };
}

export interface ExtractedLayout {
  metadata: {
    platform: "web";
    platformVersion: string;
    extractorVersion: string;
    offeringId: string | null;
    locale: string;
    timestamp: string;
    viewport: { width: number; height: number; scale: number };
    rootFrame: Frame;
  };
  components: Record<string, ComponentLayout>;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/dev/extract-types.ts
git commit -m "Add extractor type definitions"
```

### Task 3.2 — Paywall tree walker

**Files:**
- Create: `src/dev/paywall-tree-walker.ts`
- Create: `src/tests/dev/paywall-tree-walker.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { walkPaywallTree } from "../../dev/paywall-tree-walker";
import type { PaywallData } from "@revenuecat/purchases-ui-js";

const minimalPaywall = (): PaywallData => ({
  id: "pw",
  default_locale: "en_US",
  components_localizations: { en_US: {} },
  components_config: {
    base: {
      stack: {
        type: "stack",
        id: "root-stack",
        name: "root",
        components: [
          {
            type: "text",
            id: "title",
            name: "title-text",
            text_lid: "lid1",
            font_size: "body_m",
            font_weight: "regular",
            horizontal_alignment: "leading",
            color: { light: { type: "hex", value: "#000" } },
            padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
            margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
            size: { width: { type: "fit" }, height: { type: "fit" } },
          },
          {
            type: "purchase_button",
            id: "buy",
            name: "buy-btn",
            stack: {
              type: "stack",
              id: "buy-stack",
              name: "buy-stack",
              components: [
                {
                  type: "text",
                  id: "buy-label",
                  name: "buy-label",
                  text_lid: "lid2",
                  font_size: "body_m",
                  font_weight: "regular",
                  horizontal_alignment: "center",
                  color: { light: { type: "hex", value: "#fff" } },
                  padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
                  margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
                  size: { width: { type: "fit" }, height: { type: "fit" } },
                },
              ],
              size: { width: { type: "fit" }, height: { type: "fit" } },
              dimension: { type: "vertical", alignment: "center", distribution: "start" },
              spacing: 0,
              margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
              padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
              background_color: null,
              background: null,
              border: null,
              shape: null,
              shadow: null,
            },
          },
        ],
        size: { width: { type: "fit" }, height: { type: "fit" } },
        dimension: { type: "vertical", alignment: "center", distribution: "start" },
        spacing: 0,
        margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
        padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
        background_color: null,
        background: null,
        border: null,
        shape: null,
        shadow: null,
      },
    },
  },
});

describe("walkPaywallTree", () => {
  it("yields every component including nested ones", () => {
    const entries = [...walkPaywallTree(minimalPaywall())];
    const ids = entries.map((e) => e.id).sort();
    expect(ids).toEqual(["buy", "buy-label", "buy-stack", "root-stack", "title"]);
  });

  it("captures dashboardType (raw .type) and dashboardName (raw .name)", () => {
    const entries = [...walkPaywallTree(minimalPaywall())];
    const byId = Object.fromEntries(entries.map((e) => [e.id, e]));
    expect(byId["title"].type).toBe("text");
    expect(byId["title"].name).toBe("title-text");
    expect(byId["buy"].type).toBe("purchase_button");
  });

  it("descends into sticky_footer when present", () => {
    const pw = minimalPaywall();
    pw.components_config.base.sticky_footer = {
      type: "footer",
      id: "footer",
      name: "footer",
      stack: {
        type: "stack",
        id: "footer-stack",
        name: "footer-stack",
        components: [],
        size: { width: { type: "fit" }, height: { type: "fit" } },
        dimension: { type: "vertical", alignment: "center", distribution: "start" },
        spacing: 0,
        margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
        padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
        background_color: null,
        background: null,
        border: null,
        shape: null,
        shadow: null,
      },
    };
    const ids = [...walkPaywallTree(pw)].map((e) => e.id);
    expect(ids).toContain("footer");
    expect(ids).toContain("footer-stack");
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `pnpm exec vitest run src/tests/dev/paywall-tree-walker.test.ts`
Expected: FAIL with `Cannot find module '../../dev/paywall-tree-walker'`.

- [ ] **Step 3: Implement the walker**

Create `src/dev/paywall-tree-walker.ts`:

```ts
import type {
  PaywallData,
  Component,
  StackProps,
  FooterProps,
  PurchaseButtonProps,
  PackageProps,
  TabsProps,
  CarouselProps,
  TimelineProps,
} from "@revenuecat/purchases-ui-js";

export interface WalkEntry {
  id: string;
  type: string;
  name?: string;
}

export function* walkPaywallTree(
  paywallData: PaywallData,
): Generator<WalkEntry, void, void> {
  const root = paywallData.components_config.base;
  yield* walkStack(root.stack);
  if (root.sticky_footer) {
    yield* walkComponent(root.sticky_footer);
  }
}

function* walkComponent(node: Component): Generator<WalkEntry, void, void> {
  yield { id: node.id, type: node.type, name: (node as { name?: string }).name };

  switch (node.type) {
    case "stack":
      yield* walkStackChildren(node as StackProps);
      break;
    case "footer":
      yield* walkStack((node as FooterProps).stack);
      break;
    case "purchase_button":
      yield* walkStack((node as PurchaseButtonProps).stack);
      break;
    case "package":
      yield* walkStack((node as PackageProps).stack);
      break;
    case "tabs":
      yield* walkTabs(node as TabsProps);
      break;
    case "carousel":
      yield* walkCarousel(node as CarouselProps);
      break;
    case "timeline":
      yield* walkTimeline(node as TimelineProps);
      break;
    default:
      break;
  }
}

function* walkStack(stack: StackProps): Generator<WalkEntry, void, void> {
  yield* walkComponent(stack);
}

function* walkStackChildren(stack: StackProps): Generator<WalkEntry, void, void> {
  for (const child of stack.components ?? []) {
    yield* walkComponent(child);
  }
  if (stack.badge) {
    yield* walkStack(stack.badge.stack);
  }
}

function* walkTabs(node: TabsProps): Generator<WalkEntry, void, void> {
  if (node.control) {
    yield* walkComponent(node.control as Component);
  }
  for (const tab of node.tabs ?? []) {
    yield* walkComponent(tab as Component);
  }
}

function* walkCarousel(node: CarouselProps): Generator<WalkEntry, void, void> {
  for (const page of node.pages ?? []) {
    yield* walkComponent(page as Component);
  }
}

function* walkTimeline(node: TimelineProps): Generator<WalkEntry, void, void> {
  for (const item of node.items ?? []) {
    if ("title" in item && item.title) yield* walkComponent(item.title as Component);
    if ("description" in item && item.description) yield* walkComponent(item.description as Component);
    if ("icon" in item && item.icon) yield* walkComponent(item.icon as Component);
  }
}
```

> **Note:** If the upstream type definitions for `TabsProps`/`CarouselProps`/`TimelineProps` expose differently-named child arrays, adjust the field accesses to match. Run the type-check after the next step to catch mismatches.

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm exec vitest run src/tests/dev/paywall-tree-walker.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `pnpm run typecheck`
Expected: PASS. Fix any property-name mismatches against the actual `@revenuecat/purchases-ui-js` type definitions.

- [ ] **Step 6: Commit**

```bash
git add src/dev/paywall-tree-walker.ts src/tests/dev/paywall-tree-walker.test.ts
git commit -m "Add paywall tree walker

Pure generator that yields every component entry from a PaywallData.
Descends stacks, footers, purchase_button/package wrappers, tabs,
carousels, and timelines."
```

### Task 3.3 — DOM layout reader

**Files:**
- Create: `src/dev/dom-layout-reader.ts`
- Create: `src/tests/dev/dom-layout-reader.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { readComponentLayout, mapNativeType } from "../../dev/dom-layout-reader";

describe("mapNativeType", () => {
  it("maps known types to the fixed vocabulary", () => {
    expect(mapNativeType("text")).toBe("StaticText");
    expect(mapNativeType("image")).toBe("Image");
    expect(mapNativeType("icon")).toBe("Image");
    expect(mapNativeType("purchase_button")).toBe("Button");
    expect(mapNativeType("button")).toBe("Button");
    expect(mapNativeType("wallet_button")).toBe("Button");
    expect(mapNativeType("redemption_button")).toBe("Button");
    expect(mapNativeType("express_purchase_button")).toBe("Button");
    expect(mapNativeType("stack")).toBe("Other");
    expect(mapNativeType("anything-else")).toBe("Other");
  });
});

describe("readComponentLayout", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("returns rendered=false when no DOM node matches the id", () => {
    const layout = readComponentLayout({
      entry: { id: "missing", type: "text", name: "n" },
      container,
    });
    expect(layout.rendered).toBe(false);
    expect(layout.frame).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    expect(layout.nativeType).toBeUndefined();
  });

  it("returns rendered=true with the relative frame for a matching node", () => {
    container.style.position = "absolute";
    container.style.left = "10px";
    container.style.top = "20px";
    const el = document.createElement("span");
    el.setAttribute("data-rc-component-id", "title");
    el.setAttribute("data-rc-component-type", "text");
    el.textContent = "Hello";
    container.appendChild(el);

    // jsdom returns zeros — stub getBoundingClientRect for both nodes:
    el.getBoundingClientRect = () =>
      ({ x: 26, y: 232, width: 340, height: 30, top: 232, left: 26, right: 366, bottom: 262, toJSON: () => ({}) }) as DOMRect;
    container.getBoundingClientRect = () =>
      ({ x: 10, y: 20, width: 0, height: 0, top: 20, left: 10, right: 10, bottom: 20, toJSON: () => ({}) }) as DOMRect;

    const layout = readComponentLayout({
      entry: { id: "title", type: "text", name: "title-name" },
      container,
    });
    expect(layout.rendered).toBe(true);
    expect(layout.frame).toEqual({ x: 16, y: 212, width: 340, height: 30 });
    expect(layout.nativeType).toBe("StaticText");
    expect(layout.domTag).toBe("span");
    expect(layout.label).toBe("Hello");
    expect(layout.dashboardName).toBe("title-name");
    expect(layout.state).toEqual({ enabled: true, selected: false });
  });

  it("respects data-rc-selected when present", () => {
    const el = document.createElement("div");
    el.setAttribute("data-rc-component-id", "pkg");
    el.setAttribute("data-rc-component-type", "package");
    el.setAttribute("data-rc-selected", "true");
    container.appendChild(el);
    el.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 1, height: 1, top: 0, left: 0, right: 1, bottom: 1, toJSON: () => ({}) }) as DOMRect;
    container.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 1, height: 1, top: 0, left: 0, right: 1, bottom: 1, toJSON: () => ({}) }) as DOMRect;

    const layout = readComponentLayout({
      entry: { id: "pkg", type: "package", name: undefined },
      container,
    });
    expect(layout.state.selected).toBe(true);
  });

  it("marks aria-disabled elements as enabled=false", () => {
    const el = document.createElement("button");
    el.setAttribute("data-rc-component-id", "b");
    el.setAttribute("data-rc-component-type", "purchase_button");
    el.setAttribute("aria-disabled", "true");
    container.appendChild(el);
    el.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 1, height: 1, top: 0, left: 0, right: 1, bottom: 1, toJSON: () => ({}) }) as DOMRect;
    container.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: 1, height: 1, top: 0, left: 0, right: 1, bottom: 1, toJSON: () => ({}) }) as DOMRect;

    const layout = readComponentLayout({
      entry: { id: "b", type: "purchase_button", name: undefined },
      container,
    });
    expect(layout.state.enabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec vitest run src/tests/dev/dom-layout-reader.test.ts`
Expected: FAIL with `Cannot find module '../../dev/dom-layout-reader'`.

- [ ] **Step 3: Implement the reader**

Create `src/dev/dom-layout-reader.ts`:

```ts
import type { ComponentLayout, NativeType } from "./extract-types";
import type { WalkEntry } from "./paywall-tree-walker";

const TEXT_LIKE = new Set(["text"]);
const IMAGE_LIKE = new Set(["image", "icon"]);
const BUTTON_LIKE = new Set([
  "button",
  "purchase_button",
  "wallet_button",
  "redemption_button",
  "express_purchase_button",
]);

export function mapNativeType(dashboardType: string): NativeType {
  if (TEXT_LIKE.has(dashboardType)) return "StaticText";
  if (IMAGE_LIKE.has(dashboardType)) return "Image";
  if (BUTTON_LIKE.has(dashboardType)) return "Button";
  return "Other";
}

interface ReadInput {
  entry: WalkEntry;
  container: HTMLElement;
}

export function readComponentLayout(input: ReadInput): ComponentLayout {
  const { entry, container } = input;
  const el = container.querySelector<HTMLElement>(
    `[data-rc-component-id="${cssEscape(entry.id)}"]`,
  );

  const base = {
    componentId: entry.id,
    dashboardType: entry.type,
    dashboardName: entry.name,
  };

  if (!el) {
    return {
      ...base,
      rendered: false,
      frame: { x: 0, y: 0, width: 0, height: 0 },
      state: { enabled: true, selected: false },
    };
  }

  const computed = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (computed?.display === "none") {
    return {
      ...base,
      rendered: false,
      frame: { x: 0, y: 0, width: 0, height: 0 },
      state: { enabled: true, selected: false },
    };
  }

  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const frame = {
    x: Math.round(elRect.x - containerRect.x),
    y: Math.round(elRect.y - containerRect.y),
    width: Math.round(elRect.width),
    height: Math.round(elRect.height),
  };

  const nativeType = mapNativeType(entry.type);
  const label =
    nativeType === "StaticText" ? (el.textContent ?? undefined) : undefined;

  const selectedAttr = el.getAttribute("data-rc-selected");
  const ariaDisabled = el.getAttribute("aria-disabled");
  const isDisabled =
    (el as HTMLButtonElement).disabled === true || ariaDisabled === "true";

  return {
    ...base,
    rendered: true,
    nativeType,
    domTag: el.tagName.toLowerCase(),
    label,
    frame,
    state: {
      enabled: !isDisabled,
      selected: selectedAttr === "true",
    },
  };
}

function cssEscape(value: string): string {
  if (typeof (globalThis as { CSS?: { escape?: (v: string) => string } }).CSS?.escape === "function") {
    return (globalThis as { CSS: { escape: (v: string) => string } }).CSS.escape(value);
  }
  return value.replace(/["\\]/g, (m) => `\\${m}`);
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm exec vitest run src/tests/dev/dom-layout-reader.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/dev/dom-layout-reader.ts src/tests/dev/dom-layout-reader.test.ts
git commit -m "Add DOM layout reader

Looks up rendered nodes via data-rc-component-id, returns ComponentLayout
with frame/state/nativeType/domTag/label. Used by extractPaywallLayout."
```

---

## Phase 4 — Offering synthesizer

### Task 4.1 — Implement and test `synthesizeOffering`

**Files:**
- Create: `src/dev/synthesize-offering.ts`
- Create: `src/tests/dev/synthesize-offering.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { synthesizeOffering } from "../../dev/synthesize-offering";
import type { PaywallData, UiConfig } from "@revenuecat/purchases-ui-js";

const pw = (packages: string[]): PaywallData => ({
  id: "pw",
  default_locale: "en_US",
  components_localizations: { en_US: {} },
  components_config: {
    base: {
      stack: {
        type: "stack",
        id: "root",
        name: "root",
        components: packages.map((pid) => ({
          type: "package",
          id: `pkg-${pid}`,
          name: pid,
          package_id: pid,
          stack: {
            type: "stack",
            id: `pkg-${pid}-stack`,
            name: pid,
            components: [],
            size: { width: { type: "fit" }, height: { type: "fit" } },
            dimension: { type: "vertical", alignment: "center", distribution: "start" },
            spacing: 0,
            margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
            padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
            background_color: null,
            background: null,
            border: null,
            shape: null,
            shadow: null,
          },
        })) as never,
        size: { width: { type: "fit" }, height: { type: "fit" } },
        dimension: { type: "vertical", alignment: "center", distribution: "start" },
        spacing: 0,
        margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
        padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
        background_color: null,
        background: null,
        border: null,
        shape: null,
        shadow: null,
      },
    },
  },
});

const uiConfig: UiConfig = { app: { fonts: {}, colors: {} } } as UiConfig;

describe("synthesizeOffering", () => {
  it("produces an Offering with one package per package_id found in the paywall", () => {
    const result = synthesizeOffering(pw(["monthly", "annual"]), uiConfig);
    const ids = result.availablePackages.map((p) => p.identifier).sort();
    expect(ids).toEqual(["annual", "monthly"]);
  });

  it("attaches paywallComponents and uiConfig", () => {
    const data = pw(["monthly"]);
    const result = synthesizeOffering(data, uiConfig);
    expect(result.paywallComponents).toBe(data);
    expect(result.uiConfig).toBe(uiConfig);
  });

  it("returns identifier=__synth__ and an empty offering when no packages are referenced", () => {
    const data = pw([]);
    const result = synthesizeOffering(data, uiConfig);
    expect(result.identifier).toBe("__synth__");
    expect(result.availablePackages).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and verify it fails**

Run: `pnpm exec vitest run src/tests/dev/synthesize-offering.test.ts`
Expected: FAIL with `Cannot find module '../../dev/synthesize-offering'`.

- [ ] **Step 3: Implement**

Create `src/dev/synthesize-offering.ts`:

```ts
import type { PaywallData, UiConfig, Component } from "@revenuecat/purchases-ui-js";
import type { Offering, Package, Product } from "../entities/offerings";

function collectPackageIds(paywallData: PaywallData): string[] {
  const seen = new Set<string>();
  const visit = (node: Component) => {
    if ((node as { type?: string }).type === "package") {
      const pid = (node as { package_id?: string }).package_id;
      if (pid) seen.add(pid);
    }
    const children: Component[] = [];
    if ("components" in node && Array.isArray((node as { components?: Component[] }).components)) {
      children.push(...((node as { components: Component[] }).components));
    }
    if ("stack" in node && (node as { stack?: { components?: Component[] } }).stack) {
      const s = (node as { stack: { components?: Component[] } }).stack;
      if (s.components) children.push(...s.components);
    }
    children.forEach(visit);
  };
  visit(paywallData.components_config.base.stack as Component);
  return [...seen];
}

function blankProduct(identifier: string): Product {
  return {
    identifier,
    displayName: identifier,
    title: identifier,
    description: "",
    currentPrice: { amount: 0, amountMicros: 0, currency: "USD", formattedPrice: "$0" },
    normalPeriodDuration: null,
    presentedOfferingContext: { offeringIdentifier: "__synth__", placementIdentifier: null, targetingContext: null },
    subscriptionOptions: {},
    defaultSubscriptionOption: null,
    defaultNonSubscriptionOption: null,
    defaultPurchaseOption: null,
    productType: "subscription",
  } as Product;
}

function blankPackage(identifier: string): Package {
  return {
    identifier,
    packageType: "custom",
    rcBillingProduct: blankProduct(identifier),
    webBillingProduct: blankProduct(identifier),
  } as unknown as Package;
}

export function synthesizeOffering(
  paywallData: PaywallData,
  uiConfig: UiConfig,
): Offering {
  const pkgIds = collectPackageIds(paywallData);
  const pkgs = pkgIds.map((id) => blankPackage(id));
  return {
    identifier: "__synth__",
    serverDescription: "Synthesized for extractor",
    metadata: {},
    packagesById: Object.fromEntries(pkgs.map((p) => [p.identifier, p])),
    availablePackages: pkgs,
    lifetime: null,
    annual: null,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly: null,
    weekly: null,
    paywall: null,
    paywallComponents: paywallData,
    uiConfig,
  } as unknown as Offering;
}
```

> **Note:** If `Product` or `Package` shapes have changed since this plan was written, run the typecheck after Step 5 and adjust the blank values to match. The goal is "minimum that compiles and renders" — actual purchase functionality is irrelevant in the extractor.

- [ ] **Step 4: Run the test and verify it passes**

Run: `pnpm exec vitest run src/tests/dev/synthesize-offering.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `pnpm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/dev/synthesize-offering.ts src/tests/dev/synthesize-offering.test.ts
git commit -m "Add minimal Offering synthesizer for extractor"
```

---

## Phase 5 — The extractor function

### Task 5.1 — Implement `extractPaywallLayout`

**Files:**
- Create: `src/dev/extract-paywall-layout.ts`
- Create: `src/tests/dev/extract-paywall-layout.test.ts`

- [ ] **Step 1: Write the failing integration test**

```ts
import { describe, expect, it } from "vitest";
import { extractPaywallLayout } from "../../dev/extract-paywall-layout";
import { fixturePaywallData, fixtureUiConfig } from "../fixtures/paywall-fixtures";

describe("extractPaywallLayout", () => {
  it("returns metadata with platform=web, the resolved locale, and a components map", async () => {
    const result = await extractPaywallLayout({
      paywallData: fixturePaywallData(),
      uiConfig: fixtureUiConfig(),
      locale: "en_US",
      viewport: { width: 402, height: 874 },
    });

    expect(result.metadata.platform).toBe("web");
    expect(result.metadata.locale).toBe("en_US");
    expect(result.metadata.viewport).toEqual({ width: 402, height: 874, scale: 1 });
    expect(typeof result.metadata.timestamp).toBe("string");
    expect(typeof result.metadata.platformVersion).toBe("string");
    expect(Object.keys(result.components).length).toBeGreaterThan(0);
  });

  it("includes every component id from the paywall in the components map", async () => {
    const data = fixturePaywallData();
    const result = await extractPaywallLayout({
      paywallData: data,
      uiConfig: fixtureUiConfig(),
      locale: "en_US",
      viewport: { width: 402, height: 874 },
    });

    // Walk the fixture manually and assert every id is present.
    const expectedIds = collectAllIds(data.components_config.base.stack);
    for (const id of expectedIds) {
      expect(result.components[id]).toBeDefined();
      expect(result.components[id].componentId).toBe(id);
    }
  });
});

function collectAllIds(node: { id: string; components?: { id: string }[] }): string[] {
  const out = [node.id];
  for (const c of (node as { components?: { id: string }[] }).components ?? []) {
    out.push(...collectAllIds(c as { id: string; components?: { id: string }[] }));
  }
  return out;
}
```

> **Note:** jsdom returns zeros from `getBoundingClientRect`, so this test only validates structure and metadata. The Playwright E2E test in Phase 7 validates real frames.

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec vitest run src/tests/dev/extract-paywall-layout.test.ts`
Expected: FAIL with `Cannot find module '../../dev/extract-paywall-layout'`.

- [ ] **Step 3: Implement**

Create `src/dev/extract-paywall-layout.ts`:

```ts
import { mount, unmount } from "svelte";
import { Paywall } from "@revenuecat/purchases-ui-js";
import type { ExtractInput, ExtractedLayout, ComponentLayout } from "./extract-types";
import { EXTRACTOR_VERSION } from "./extract-types";
import { buildPaywallMountProps } from "../helpers/paywall-mount-props";
import { synthesizeOffering } from "./synthesize-offering";
import { walkPaywallTree } from "./paywall-tree-walker";
import { readComponentLayout } from "./dom-layout-reader";

const noop = () => {};

export async function extractPaywallLayout(
  input: ExtractInput,
): Promise<ExtractedLayout> {
  const { paywallData, uiConfig, viewport, locale, darkMode = false, customVariables, offering } = input;
  const scale = viewport.scale ?? 1;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = `${viewport.width}px`;
  container.style.height = `${viewport.height}px`;
  container.style.transformOrigin = "top left";
  container.style.transform = `scale(${scale})`;
  container.style.overflow = "hidden";
  container.style.zIndex = "2147483647";
  container.setAttribute("data-rc-extractor-root", "true");
  if (darkMode) {
    container.style.colorScheme = "dark";
    container.classList.add("rc-extractor-dark");
  }
  document.body.appendChild(container);

  const restoreMatchMedia = forceColorScheme(darkMode);

  const offeringToUse = offering ?? synthesizeOffering(paywallData, uiConfig);
  const mountProps = buildPaywallMountProps({
    offering: offeringToUse,
    selectedLocale: locale,
    hideBackButtons: false,
    customVariables,
  });

  const component = mount(Paywall, {
    target: container,
    props: {
      ...mountProps,
      appUserId: "__extract__",
      onNavigateToUrlClicked: noop,
      onCompleteWorkflowNavigate: noop,
      onVisitCustomerCenterClicked: noop,
      onBackClicked: noop,
      onRestorePurchasesClicked: noop,
      onPurchaseClicked: noop,
      onError: noop,
      walletButtonRender: undefined,
      onComponentInteraction: noop,
    },
  });

  await waitForLayout();

  const containerRect = container.getBoundingClientRect();
  const components: Record<string, ComponentLayout> = {};
  for (const entry of walkPaywallTree(paywallData)) {
    components[entry.id] = readComponentLayout({ entry, container });
  }

  const metadata: ExtractedLayout["metadata"] = {
    platform: "web",
    platformVersion: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    extractorVersion: EXTRACTOR_VERSION,
    offeringId: offering?.identifier ?? null,
    locale: mountProps.selectedLocale,
    timestamp: new Date().toISOString(),
    viewport: { width: viewport.width, height: viewport.height, scale },
    rootFrame: {
      x: 0,
      y: 0,
      width: Math.round(containerRect.width),
      height: Math.round(containerRect.height),
    },
  };

  try {
    unmount(component);
  } catch {
    // ignore
  }
  container.remove();
  restoreMatchMedia();

  return { metadata, components };
}

async function waitForLayout(): Promise<void> {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise<void>((r) => queueMicrotask(() => r()));
}

function forceColorScheme(darkMode: boolean): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const original = window.matchMedia.bind(window);
  window.matchMedia = ((query: string): MediaQueryList => {
    if (query === "(prefers-color-scheme: dark)") {
      return {
        matches: darkMode,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      } as MediaQueryList;
    }
    return original(query);
  }) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}
```

- [ ] **Step 4: Run the integration test and verify it passes**

Run: `pnpm exec vitest run src/tests/dev/extract-paywall-layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `pnpm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/dev/extract-paywall-layout.ts src/tests/dev/extract-paywall-layout.test.ts
git commit -m "Add extractPaywallLayout

Mounts <Paywall> via the shared buildPaywallMountProps pipeline into a
sized container, walks the paywall data tree, reads per-component frames
from data-rc-component-id elements, returns ExtractedLayout."
```

---

## Phase 6 — Installer and main wiring

### Task 6.1 — Add `installExtractor` and wire into `main.ts`

**Files:**
- Create: `src/dev/extract-install.ts`
- Modify: `src/main.ts` (top of file)

- [ ] **Step 1: Create the installer**

`src/dev/extract-install.ts`:

```ts
import { extractPaywallLayout } from "./extract-paywall-layout";
import type { ExtractInput, ExtractedLayout } from "./extract-types";

declare global {
  interface Window {
    __rcExtractPaywallLayout__?: (
      input: ExtractInput,
    ) => Promise<ExtractedLayout>;
  }
}

export function installExtractor(): void {
  if (typeof window === "undefined") return;
  window.__rcExtractPaywallLayout__ = extractPaywallLayout;
}
```

- [ ] **Step 2: Wire it into `main.ts`**

Add near the top of `src/main.ts`, after the existing imports but before any code:

```ts
if (__RC_PAYWALL_EXTRACTOR__) {
  void import("./dev/extract-install").then((m) => m.installExtractor());
}
```

- [ ] **Step 3: Verify dev build works**

Run: `pnpm run build:dev`
Expected: PASS.

- [ ] **Step 4: Verify the extractor is reachable in dev**

Run: `pnpm exec vitest run` to confirm the full suite still passes (since `vitest.config.js` defines `__RC_PAYWALL_EXTRACTOR__: true`, the dynamic import runs).
Expected: PASS.

- [ ] **Step 5: Verify the extractor is stripped from prod**

Run:
```bash
pnpm run build
grep -c "extractPaywallLayout" dist/Purchases.es.js
grep -c "installExtractor" dist/Purchases.es.js
grep -c "extractPaywallLayout" dist/Purchases.umd.js
grep -c "installExtractor" dist/Purchases.umd.js
```
Expected: every grep returns `0`.

If a count is non-zero, the dead-code elimination didn't work. Check that `vite.config.js` defines `__RC_PAYWALL_EXTRACTOR__` as `JSON.stringify(mode !== "production")` and that the guard in `main.ts` uses `if (__RC_PAYWALL_EXTRACTOR__)` exactly. (Rollup needs the literal `if (false)` shape to dead-eliminate the dynamic import.)

- [ ] **Step 6: Commit**

```bash
git add src/dev/extract-install.ts src/main.ts
git commit -m "Wire installExtractor behind __RC_PAYWALL_EXTRACTOR__ guard

Dev/test builds attach window.__rcExtractPaywallLayout__; production
builds strip the dev/ subtree via Rollup dead-code elimination."
```

---

## Phase 7 — Node orchestrator and playground

### Task 7.1 — Add Playwright and the playground page

**Files:**
- Create: `scripts/extractor-playground/index.html`
- Create: `scripts/extractor-playground/main.ts`
- Modify: `package.json` (add devDependency + scripts)

- [ ] **Step 1: Add Playwright as a devDependency**

Run: `pnpm add -D @playwright/test`
Expected: `@playwright/test` appears in `devDependencies`.

- [ ] **Step 2: Install Chromium for Playwright**

Run: `pnpm exec playwright install chromium`
Expected: download succeeds. (CI: a separate workflow step does this.)

- [ ] **Step 3: Create the playground HTML**

`scripts/extractor-playground/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Paywall Extractor Playground</title>
  </head>
  <body>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

- [ ] **Step 4: Create the playground main**

`scripts/extractor-playground/main.ts`:

```ts
import "../../src/main";
```

(That single side-effecting import is sufficient — the dynamic `installExtractor` runs because dev mode evaluates `__RC_PAYWALL_EXTRACTOR__` to true.)

- [ ] **Step 5: Add scripts to package.json**

Add to the `scripts` block:

```json
"extract": "node scripts/extract-paywall-layout.mjs",
"extract:e2e": "node scripts/extract-paywall-layout.e2e.test.mjs",
"check-extractor-stripped": "node scripts/check-extractor-stripped.mjs"
```

- [ ] **Step 6: Verify the playground starts under Vite**

Run: `pnpm exec vite scripts/extractor-playground --port 5176` (background)
Then in another shell: `curl -s http://localhost:5176/ | head`
Expected: HTML page including `<script type="module"`. Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/extractor-playground
git commit -m "Add Playwright dependency and extractor playground page"
```

### Task 7.2 — Write the Node CLI orchestrator

**Files:**
- Create: `scripts/extract-paywall-layout.mjs`

- [ ] **Step 1: Implement the CLI**

`scripts/extract-paywall-layout.mjs`:

```js
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { darkMode: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "--input": out.input = next(); break;
      case "--offering": out.offering = next(); break;
      case "--locale": out.locale = next(); break;
      case "--dark-mode": out.darkMode = true; break;
      case "--width": out.width = Number(next()); break;
      case "--height": out.height = Number(next()); break;
      case "--scale": out.scale = Number(next()); break;
      case "--out": out.out = next(); break;
      default:
        throw new Error(`Unknown arg: ${a}`);
    }
  }
  for (const required of ["input", "locale", "width", "height", "out"]) {
    if (out[required] == null) throw new Error(`Missing required --${required}`);
  }
  return out;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function main() {
  const args = parseArgs(process.argv);
  const inputPayload = await readJson(args.input);
  const offering = args.offering ? await readJson(args.offering) : undefined;

  const extractInput = {
    paywallData: inputPayload.paywallData,
    uiConfig: inputPayload.uiConfig,
    offering,
    locale: args.locale,
    darkMode: args.darkMode,
    viewport: { width: args.width, height: args.height, scale: args.scale ?? 1 },
    customVariables: inputPayload.customVariables,
  };

  const server = await createServer({
    root: resolve(__dirname, "extractor-playground"),
    mode: "development",
    server: { port: 0 },
    logLevel: "error",
  });
  await server.listen();
  const port = server.config.server.port;
  const url = `http://localhost:${port}/`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: args.width, height: args.height },
    deviceScaleFactor: args.scale ?? 1,
    colorScheme: args.darkMode ? "dark" : "light",
  });
  const page = await context.newPage();

  try {
    await page.goto(url);
    await page.waitForFunction(() => typeof window.__rcExtractPaywallLayout__ === "function", null, { timeout: 10_000 });
    const result = await page.evaluate(
      (input) => window.__rcExtractPaywallLayout__(input),
      extractInput,
    );

    await mkdir(dirname(resolve(args.out)), { recursive: true });
    await writeFile(resolve(args.out), JSON.stringify(result, null, 2) + "\n", "utf8");
    console.log(`Wrote ${args.out}`);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Make the script executable end-to-end** (smoke test before writing the e2e harness)

Run: `node scripts/extract-paywall-layout.mjs --help 2>&1 | head -3`
Expected: an "Unknown arg: --help" error (we haven't implemented `--help`; that's fine — it confirms the script runs). Move on.

- [ ] **Step 3: Commit**

```bash
git add scripts/extract-paywall-layout.mjs
git commit -m "Add Node orchestrator: Playwright + Vite dev server + JSON writer"
```

---

## Phase 8 — CI guard for tree-shaking

### Task 8.1 — Add `check-extractor-stripped.mjs` and wire it into CI

**Files:**
- Create: `scripts/check-extractor-stripped.mjs`

- [ ] **Step 1: Implement the guard**

```js
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const FORBIDDEN = ["extractPaywallLayout", "installExtractor", "__rcExtractPaywallLayout__"];
const FILES = ["dist/Purchases.es.js", "dist/Purchases.umd.js"];

let failed = false;
for (const file of FILES) {
  let content;
  try {
    content = await readFile(resolve(process.cwd(), file), "utf8");
  } catch (err) {
    console.error(`Could not read ${file}: ${err.message}`);
    process.exit(2);
  }
  for (const symbol of FORBIDDEN) {
    if (content.includes(symbol)) {
      console.error(`FAIL: ${file} contains "${symbol}" — the extractor was not stripped.`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log("OK: production bundle does not contain extractor symbols.");
```

- [ ] **Step 2: Run it against a fresh prod build**

Run:
```bash
pnpm run build
pnpm run check-extractor-stripped
```
Expected: `OK: production bundle does not contain extractor symbols.` Exit 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/check-extractor-stripped.mjs
git commit -m "Add CI guard that fails if extractor symbols leak into prod bundle"
```

- [ ] **Step 4: Wire into CI**

If `.circleci/config.yml` or `.github/workflows/*.yml` exists, add a step after the existing `pnpm run build` that invokes `pnpm run check-extractor-stripped`. The exact location depends on which CI provider this repo uses. Inspect `.circleci/config.yml`:

Run: `ls .circleci/ .github/workflows/ 2>/dev/null`

Then add the check step in the same job as `pnpm run build`. Commit that change separately:

```bash
git add .circleci/config.yml   # or .github/workflows/<file>.yml
git commit -m "Run check-extractor-stripped after build in CI"
```

---

## Phase 9 — End-to-end test

### Task 9.1 — Create fixtures and the E2E test

**Files:**
- Create: `scripts/fixtures/paywall.json`
- Create: `scripts/fixtures/expected-extract.json`
- Create: `scripts/extract-paywall-layout.e2e.test.mjs`

- [ ] **Step 1: Build a small fixture paywall**

`scripts/fixtures/paywall.json`:

```json
{
  "paywallData": {
    "id": "fixture-pw",
    "default_locale": "en_US",
    "components_localizations": {
      "en_US": { "title-lid": "Unlock access", "buy-lid": "Buy now" }
    },
    "components_config": {
      "base": {
        "stack": {
          "type": "stack",
          "id": "root-stack",
          "name": "root",
          "components": [
            {
              "type": "text",
              "id": "title",
              "name": "title-text",
              "text_lid": "title-lid",
              "font_size": "heading_l",
              "font_weight": "bold",
              "horizontal_alignment": "center",
              "color": { "light": { "type": "hex", "value": "#000000" } },
              "padding": { "top": 16, "bottom": 16, "leading": 16, "trailing": 16 },
              "margin": { "top": 0, "bottom": 0, "leading": 0, "trailing": 0 },
              "size": { "width": { "type": "fill" }, "height": { "type": "fit" } }
            },
            {
              "type": "purchase_button",
              "id": "buy",
              "name": "buy-btn",
              "stack": {
                "type": "stack",
                "id": "buy-stack",
                "name": "buy-stack",
                "components": [
                  {
                    "type": "text",
                    "id": "buy-label",
                    "name": "buy-label",
                    "text_lid": "buy-lid",
                    "font_size": "body_m",
                    "font_weight": "regular",
                    "horizontal_alignment": "center",
                    "color": { "light": { "type": "hex", "value": "#ffffff" } },
                    "padding": { "top": 8, "bottom": 8, "leading": 16, "trailing": 16 },
                    "margin": { "top": 0, "bottom": 0, "leading": 0, "trailing": 0 },
                    "size": { "width": { "type": "fit" }, "height": { "type": "fit" } }
                  }
                ],
                "size": { "width": { "type": "fill" }, "height": { "type": "fit" } },
                "dimension": { "type": "vertical", "alignment": "center", "distribution": "start" },
                "spacing": 0,
                "margin": { "top": 16, "bottom": 16, "leading": 16, "trailing": 16 },
                "padding": { "top": 12, "bottom": 12, "leading": 24, "trailing": 24 },
                "background_color": { "light": { "type": "hex", "value": "#000000" } },
                "background": null,
                "border": null,
                "shape": { "type": "rectangle", "corners": { "top_leading": 8, "top_trailing": 8, "bottom_leading": 8, "bottom_trailing": 8 } },
                "shadow": null
              }
            }
          ],
          "size": { "width": { "type": "fill" }, "height": { "type": "fit" } },
          "dimension": { "type": "vertical", "alignment": "center", "distribution": "start" },
          "spacing": 0,
          "margin": { "top": 0, "bottom": 0, "leading": 0, "trailing": 0 },
          "padding": { "top": 32, "bottom": 32, "leading": 16, "trailing": 16 },
          "background_color": { "light": { "type": "hex", "value": "#ffffff" } },
          "background": null,
          "border": null,
          "shape": null,
          "shadow": null
        }
      }
    }
  },
  "uiConfig": {
    "app": {
      "colors": {},
      "fonts": {}
    }
  }
}
```

> If the literal `UiConfig` shape requires more fields, copy a minimal real one from `src/tests/fixtures/` (search for any existing ui-config fixture) and adjust this file accordingly.

- [ ] **Step 2: Write the E2E test script**

`scripts/extract-paywall-layout.e2e.test.mjs`:

```js
import { execFile } from "node:child_process";
import { readFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import assert from "node:assert/strict";

const __dirname = dirname(fileURLToPath(import.meta.url));
const exec = promisify(execFile);

async function main() {
  const workDir = await mkdtemp(join(tmpdir(), "rc-extract-"));
  const outPath = join(workDir, "out.json");

  await exec(
    "node",
    [
      resolve(__dirname, "extract-paywall-layout.mjs"),
      "--input", resolve(__dirname, "fixtures/paywall.json"),
      "--locale", "en_US",
      "--width", "402",
      "--height", "874",
      "--scale", "1",
      "--out", outPath,
    ],
    { cwd: resolve(__dirname, ".."), env: process.env },
  );

  const result = JSON.parse(await readFile(outPath, "utf8"));

  assert.equal(result.metadata.platform, "web");
  assert.equal(result.metadata.locale, "en_US");
  assert.deepEqual(result.metadata.viewport, { width: 402, height: 874, scale: 1 });

  const requiredIds = ["root-stack", "title", "buy", "buy-stack", "buy-label"];
  for (const id of requiredIds) {
    assert.ok(result.components[id], `missing component ${id}`);
    assert.equal(result.components[id].componentId, id);
  }

  // The title must render and have a non-zero frame.
  const title = result.components["title"];
  assert.equal(title.rendered, true);
  assert.equal(title.nativeType, "StaticText");
  assert.equal(title.label, "Unlock access");
  assert.ok(title.frame.width > 0 && title.frame.height > 0, "title has zero frame");

  // The purchase button must render.
  const buy = result.components["buy"];
  assert.equal(buy.rendered, true);
  assert.equal(buy.nativeType, "Button");

  console.log("E2E extractor test PASSED");
  await rm(workDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Run the E2E test**

Run: `pnpm run extract:e2e`
Expected: prints `E2E extractor test PASSED` and exits 0.

If it fails because the upstream `data-rc-component-id` attrs are missing from the linked `purchases-ui-js` build, return to Phase 0 and complete the upstream rebuild step.

- [ ] **Step 4: Commit**

```bash
git add scripts/fixtures scripts/extract-paywall-layout.e2e.test.mjs
git commit -m "Add E2E fixture + Playwright-driven extractor test"
```

---

## Phase 10 — Final wiring and cleanup

### Task 10.1 — Add CI step for E2E and update `extract-api`

**Files:**
- Modify: `.circleci/config.yml` (or `.github/workflows/*.yml`) — whichever exists
- Run: `pnpm run extract-api`

- [ ] **Step 1: Add an E2E job step**

Add a step in CI that runs `pnpm exec playwright install chromium` then `pnpm run extract:e2e` after the existing test job. Use the same Node/pnpm setup as existing steps.

- [ ] **Step 2: Update API report**

Run: `pnpm run extract-api`
Expected: `api-report/` does not gain any entries for `extractPaywallLayout` (it isn't re-exported from `main.ts`). If it does, the gating is leaking — return to Phase 6 Step 5.

- [ ] **Step 3: Commit**

```bash
git add .circleci/config.yml   # or .github/workflows/<file>.yml
git add api-report/   # only if non-empty diff
git commit -m "Run E2E extractor test in CI"
```

---

## Self-review

**Spec coverage:**
- Architecture (§4 of spec) → Phase 1 + Phase 5 (`extractPaywallLayout` mounts via shared helper).
- Public API (§5) → Phase 3.1 (types) + Phase 5 (`extractPaywallLayout`).
- Output schema (§5.2, §5.3, §3) → Phase 3.3 (`dom-layout-reader`).
- `nativeType` mapping (§5.2) → covered by `mapNativeType` tests in Phase 3.3.
- Build-time gating (§6) → Phase 2 + Phase 6 + Phase 8 (CI guard).
- Node orchestrator (§7) → Phase 7.
- Upstream data attrs (§8) → Phase 0.
- Testing strategy (§9) → Phase 1.1 (snapshot), Phase 3 (tree-walk, DOM reader), Phase 4 (synthesizer), Phase 5 (integration), Phase 8 (bundle-shape), Phase 9 (E2E).
- Risks (§10) →
  - Upstream coordination → Phase 0 lockstep with Phase 6.
  - Tree-walk completeness → tested in Phase 3.2; default branch returns no children safely.
  - Float jitter → frames rounded in `dom-layout-reader.ts` (Phase 3.3).
  - Dark-mode leak → `forceColorScheme` restore in `try` finally semantics of `extractPaywallLayout` (Phase 5).
  - `selected` state limitation → `data-rc-selected` consumed where present; otherwise defaults to false. Documented in spec §10.

**Placeholder scan:** No `TBD`/`TODO`/"implement later" remain. Two "Note:" callouts point at small adjustments the implementer may need to make when type signatures in `purchases-ui-js` differ from the snapshot used to write the plan; those are concrete adjustments (run typecheck, adjust property names), not deferred work.

**Type consistency:**
- `WalkEntry` (Phase 3.2) is consumed by `readComponentLayout` (Phase 3.3) and `extractPaywallLayout` (Phase 5).
- `ExtractInput`/`ExtractedLayout`/`ComponentLayout`/`Frame`/`NativeType`/`EXTRACTOR_VERSION` (Phase 3.1) are consumed in Phases 3.3, 5, 6, 9.
- `PaywallMountProps` (Phase 1) is consumed in Phase 5 (`extractPaywallLayout`).
- `synthesizeOffering` (Phase 4) is consumed in Phase 5.
- `installExtractor` (Phase 6) is the dynamic-import target referenced from `main.ts` and is the symbol the CI guard greps for.

---

## Execution

**Plan complete and saved to `docs/superpowers/plans/2026-05-11-paywall-layout-extraction.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
