import { describe, expect, it, beforeEach } from "vitest";
import {
  readComponentLayout,
  mapComponentType,
  mapNativeType,
} from "../../dev/dom-layout-reader";

describe("mapNativeType", () => {
  it("maps known types to the closed vocabulary (SCHEMA.md §6)", () => {
    expect(mapNativeType("text")).toBe("StaticText");
    expect(mapNativeType("image")).toBe("Image");
    expect(mapNativeType("icon")).toBe("Icon");
    expect(mapNativeType("purchase_button")).toBe("Button");
    expect(mapNativeType("button")).toBe("Button");
    expect(mapNativeType("wallet_button")).toBe("Button");
    expect(mapNativeType("redemption_button")).toBe("Button");
    expect(mapNativeType("express_purchase_button")).toBe("Button");
    expect(mapNativeType("stack")).toBe("Container");
    expect(mapNativeType("package")).toBe("Container");
    expect(mapNativeType("footer")).toBe("Container");
    expect(mapNativeType("input_text")).toBe("Input");
    expect(mapNativeType("anything-else")).toBe("Other");
  });
});

describe("mapComponentType", () => {
  it("collapses dashboard types into the schema's `type` enum", () => {
    expect(mapComponentType("text")).toBe("text");
    expect(mapComponentType("image")).toBe("image");
    expect(mapComponentType("icon")).toBe("icon");
    expect(mapComponentType("purchase_button")).toBe("button");
    expect(mapComponentType("wallet_button")).toBe("button");
    expect(mapComponentType("input_single_choice")).toBe("input");
    expect(mapComponentType("stack")).toBe("container");
    expect(mapComponentType("package")).toBe("container");
    // Unknown types fall through to the safest default.
    expect(mapComponentType("anything-else")).toBe("container");
  });
});

describe("readComponentLayout", () => {
  let container: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  function stubRect(el: Element, x: number, y: number, w: number, h: number) {
    (el as { getBoundingClientRect: () => DOMRect }).getBoundingClientRect =
      () =>
        ({
          x,
          y,
          width: w,
          height: h,
          top: y,
          left: x,
          right: x + w,
          bottom: y + h,
          toJSON: () => ({}),
        }) as DOMRect;
  }

  const zeroFrame = { x: 0, y: 0, width: 0, height: 0 };

  it("emits rendered: false when no DOM node matches the id", () => {
    expect(
      readComponentLayout({
        entry: { id: "missing", type: "text", name: "n" },
        container,
      }),
    ).toEqual({
      componentId: "missing",
      type: "text",
      rendered: false,
      frame: zeroFrame,
      state: { enabled: true, selected: false },
    });
  });

  it("emits rendered: false when the element has display:none", () => {
    const el = document.createElement("span");
    el.setAttribute("data-rc-component-id", "hidden");
    el.style.display = "none";
    container.appendChild(el);
    stubRect(el, 0, 0, 0, 0);
    stubRect(container, 0, 0, 0, 0);

    const layout = readComponentLayout({
      entry: { id: "hidden", type: "text", name: undefined },
      container,
    });
    expect(layout.rendered).toBe(false);
    expect(layout.frame).toEqual(zeroFrame);
    expect(layout.nativeType).toBeUndefined();
  });

  it("emits rendered: false when the frame has zero width or height", () => {
    const el = document.createElement("span");
    el.setAttribute("data-rc-component-id", "empty");
    container.appendChild(el);
    stubRect(el, 0, 0, 100, 0);
    stubRect(container, 0, 0, 100, 100);

    const layout = readComponentLayout({
      entry: { id: "empty", type: "text", name: undefined },
      container,
    });
    expect(layout.rendered).toBe(false);
    expect(layout.frame).toEqual(zeroFrame);
  });

  it("emits the spec-shaped component for a matching node", () => {
    const el = document.createElement("span");
    el.setAttribute("data-rc-component-id", "title");
    el.setAttribute("data-rc-component-type", "text");
    el.textContent = "Hello";
    container.appendChild(el);

    stubRect(el, 26, 232, 340, 30);
    stubRect(container, 10, 20, 0, 0);

    const layout = readComponentLayout({
      entry: { id: "title", type: "text", name: "title-name" },
      container,
    });
    expect(layout).toEqual({
      componentId: "title",
      type: "text",
      rendered: true,
      nativeType: "StaticText",
      label: "Hello",
      frame: { x: 16, y: 212, width: 340, height: 30 },
      state: { enabled: true, selected: false },
    });
  });

  it("respects data-rc-selected when present", () => {
    const el = document.createElement("div");
    el.setAttribute("data-rc-component-id", "pkg");
    el.setAttribute("data-rc-component-type", "package");
    el.setAttribute("data-rc-selected", "true");
    container.appendChild(el);
    stubRect(el, 0, 0, 1, 1);
    stubRect(container, 0, 0, 1, 1);

    const layout = readComponentLayout({
      entry: { id: "pkg", type: "package", name: undefined },
      container,
    });
    expect(layout.rendered).toBe(true);
    expect(layout.state.selected).toBe(true);
    expect(layout.type).toBe("container");
    expect(layout.nativeType).toBe("Container");
  });

  it("marks aria-disabled elements as enabled=false", () => {
    const el = document.createElement("button");
    el.setAttribute("data-rc-component-id", "b");
    el.setAttribute("data-rc-component-type", "purchase_button");
    el.setAttribute("aria-disabled", "true");
    container.appendChild(el);
    stubRect(el, 0, 0, 1, 1);
    stubRect(container, 0, 0, 1, 1);

    const layout = readComponentLayout({
      entry: { id: "b", type: "purchase_button", name: undefined },
      container,
    });
    expect(layout.rendered).toBe(true);
    expect(layout.state.enabled).toBe(false);
    expect(layout.type).toBe("button");
    expect(layout.nativeType).toBe("Button");
  });
});
