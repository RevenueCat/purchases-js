import type {
  PaywallData,
  UIConfig,
  CustomVariables,
} from "@revenuecat/purchases-ui-js";
import type { Offering } from "../entities/offerings";

/**
 * Bumped to `3.0.0` when the schema locked in the "every dashboard ID is a
 * key, on every platform" invariant (see `SCHEMA.md` §1). Under 3.x the
 * extractor emits an entry for every component in the dashboard tree —
 * `rendered: true` with the captured frame when the DOM node was found and
 * laid out, `rendered: false` with a zero-frame sentinel otherwise. The 2.x
 * shape (which dropped non-rendered components entirely) is no longer valid.
 *
 * Prior 2.0.0 changelog: aligned with the cross-platform spec — renamed
 * `dashboardType` → `type`, dropped `dashboardName` / `domTag` /  the
 * `rendered` placeholder, expanded `nativeType` to include `Container` and
 * `Icon`. Under 3.0.0 `rendered` returns as a first-class boolean.
 */
export const EXTRACTOR_VERSION = "3.0.0";

export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractInput {
  paywallData: PaywallData;
  uiConfig: UIConfig;
  /**
   * Full offering object. When provided, variables/packages render with the
   * real product data. When absent, a minimal offering is synthesized.
   */
  offering?: Offering;
  /**
   * Identifier to report in `metadata.offeringId` when no full `offering` is
   * supplied. Useful when normalizing from an RC `/offerings` API response
   * where the offering identifier is known but no package data is available.
   */
  offeringId?: string;
  locale: string;
  darkMode?: boolean;
  viewport: { width: number; height: number; scale?: number };
  customVariables?: CustomVariables;
}

/**
 * Closed enum per `SCHEMA.md` §6. `Container` covers stacks, packages, tabs,
 * carousels, timelines, badges, footers, headers, and the paywall root.
 * `Icon` is distinguished from `Image` to match the dashboard component
 * vocabulary. `Other` is reserved for unmapped cases and should be rare.
 */
export type NativeType =
  | "StaticText"
  | "Image"
  | "Icon"
  | "Button"
  | "Toggle"
  | "Input"
  | "ScrollView"
  | "Container"
  | "Other";

/**
 * Closed enum per `SCHEMA.md` §6. Mirrors the dashboard's semantic categories
 * collapsed into platform-agnostic buckets.
 */
export type ComponentType =
  | "text"
  | "image"
  | "icon"
  | "button"
  | "toggle"
  | "input"
  | "scroll"
  | "container";

/**
 * One entry per dashboard component. `rendered` distinguishes whether the
 * platform actually surfaced the component:
 *
 * - `rendered: true`  — `frame` is the captured bounding box, `nativeType`
 *   is set, `label` is present for text-bearing components.
 * - `rendered: false` — `frame` is the zero sentinel `{0,0,0,0}`,
 *   `nativeType` and `label` are omitted.
 *
 * `type` always comes from the dashboard config and is emitted in both cases.
 */
export interface ComponentLayout {
  componentId: string;
  type: ComponentType;
  rendered: boolean;
  /** Only emitted when `rendered: true`. */
  nativeType?: NativeType;
  /** Only emitted when `rendered: true` and the component is text-bearing. */
  label?: string;
  /** When `rendered: false`, exactly `{ x: 0, y: 0, width: 0, height: 0 }`. */
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
