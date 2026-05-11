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
  const cssGlobal = (globalThis as { CSS?: { escape?: (v: string) => string } })
    .CSS;
  if (typeof cssGlobal?.escape === "function") {
    return cssGlobal.escape(value);
  }
  return value.replace(/["\\]/g, (m) => `\\${m}`);
}
