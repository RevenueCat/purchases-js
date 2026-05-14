import type {
  ComponentLayout,
  ComponentType,
  NativeType,
} from "./extract-types";
import type { WalkEntry } from "./paywall-tree-walker";

const TEXT_LIKE = new Set(["text"]);
const IMAGE_LIKE = new Set(["image"]);
const ICON_LIKE = new Set(["icon"]);
const BUTTON_LIKE = new Set([
  "button",
  "purchase_button",
  "wallet_button",
  "redemption_button",
  "express_purchase_button",
]);
const INPUT_LIKE = new Set([
  "input_text",
  "input_single_choice",
  "input_multiple_choice",
]);
const CONTAINER_LIKE = new Set([
  "stack",
  "package",
  "tabs",
  "tab",
  "carousel",
  "timeline",
  "timeline_item",
  "badge",
  "footer",
  "header",
  "paywall",
]);

/**
 * Maps a dashboard component type to the schema's closed `nativeType` enum
 * (see `SCHEMA.md` §6). Returns `"Other"` for unmapped types — that should be
 * rare and any occurrence is a signal to extend the maps above.
 */
export function mapNativeType(dashboardType: string): NativeType {
  if (TEXT_LIKE.has(dashboardType)) return "StaticText";
  if (IMAGE_LIKE.has(dashboardType)) return "Image";
  if (ICON_LIKE.has(dashboardType)) return "Icon";
  if (BUTTON_LIKE.has(dashboardType)) return "Button";
  if (INPUT_LIKE.has(dashboardType)) return "Input";
  if (CONTAINER_LIKE.has(dashboardType)) return "Container";
  return "Other";
}

/**
 * Maps a dashboard component type to the schema's closed `type` enum.
 * Buttons of every flavor collapse to `"button"`; container-ish wrappers
 * collapse to `"container"`. Unmapped types fall through to `"container"`
 * (the safest default for unknown wrappers).
 */
export function mapComponentType(dashboardType: string): ComponentType {
  if (TEXT_LIKE.has(dashboardType)) return "text";
  if (IMAGE_LIKE.has(dashboardType)) return "image";
  if (ICON_LIKE.has(dashboardType)) return "icon";
  if (BUTTON_LIKE.has(dashboardType)) return "button";
  if (INPUT_LIKE.has(dashboardType)) return "input";
  if (CONTAINER_LIKE.has(dashboardType)) return "container";
  return "container";
}

interface ReadInput {
  entry: WalkEntry;
  container: HTMLElement;
}

/**
 * Reads the rendered layout of a single component. Every dashboard ID gets an
 * entry per `SCHEMA.md` §1 — when the DOM node is missing, hidden via
 * `display: none`, or has a zero-area frame, the function returns a
 * `rendered: false` entry with a zero-frame sentinel instead of omitting it.
 */
export function readComponentLayout(input: ReadInput): ComponentLayout {
  const { entry, container } = input;
  const type = mapComponentType(entry.type);
  const notRendered: ComponentLayout = {
    componentId: entry.id,
    type,
    rendered: false,
    frame: { x: 0, y: 0, width: 0, height: 0 },
    state: { enabled: true, selected: false },
  };

  const el = container.querySelector<HTMLElement>(
    `[data-rc-component-id="${cssEscape(entry.id)}"]`,
  );
  if (!el) return notRendered;

  const computed = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (computed?.display === "none") return notRendered;

  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const width = Math.round(elRect.width);
  const height = Math.round(elRect.height);
  if (width === 0 || height === 0) return notRendered;

  const frame = {
    x: Math.round(elRect.x - containerRect.x),
    y: Math.round(elRect.y - containerRect.y),
    width,
    height,
  };

  const nativeType = mapNativeType(entry.type);
  const label =
    nativeType === "StaticText" ? (el.textContent ?? undefined) : undefined;

  const selectedAttr = el.getAttribute("data-rc-selected");
  const ariaDisabled = el.getAttribute("aria-disabled");
  const isDisabled =
    (el as HTMLButtonElement).disabled === true || ariaDisabled === "true";

  return {
    componentId: entry.id,
    type,
    rendered: true,
    nativeType,
    label,
    frame,
    state: {
      enabled: !isDisabled,
      selected: selectedAttr === "true",
    },
  };
}

function cssEscape(value: string): string {
  const cssGlobal = (globalThis as { CSS?: { escape?: (v: string) => string } })
    .CSS;
  if (typeof cssGlobal?.escape === "function") {
    return cssGlobal.escape(value);
  }
  return value.replace(/["\\]/g, (m) => `\\${m}`);
}
