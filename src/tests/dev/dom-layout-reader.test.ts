import { describe, expect, it, beforeEach } from "vitest";
import {
  readComponentLayout,
  mapNativeType,
} from "../../dev/dom-layout-reader";

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

    el.getBoundingClientRect = () =>
      ({
        x: 26,
        y: 232,
        width: 340,
        height: 30,
        top: 232,
        left: 26,
        right: 366,
        bottom: 262,
        toJSON: () => ({}),
      }) as DOMRect;
    container.getBoundingClientRect = () =>
      ({
        x: 10,
        y: 20,
        width: 0,
        height: 0,
        top: 20,
        left: 10,
        right: 10,
        bottom: 20,
        toJSON: () => ({}),
      }) as DOMRect;

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
      ({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        top: 0,
        left: 0,
        right: 1,
        bottom: 1,
        toJSON: () => ({}),
      }) as DOMRect;
    container.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        top: 0,
        left: 0,
        right: 1,
        bottom: 1,
        toJSON: () => ({}),
      }) as DOMRect;

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
      ({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        top: 0,
        left: 0,
        right: 1,
        bottom: 1,
        toJSON: () => ({}),
      }) as DOMRect;
    container.getBoundingClientRect = () =>
      ({
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        top: 0,
        left: 0,
        right: 1,
        bottom: 1,
        toJSON: () => ({}),
      }) as DOMRect;

    const layout = readComponentLayout({
      entry: { id: "b", type: "purchase_button", name: undefined },
      container,
    });
    expect(layout.state.enabled).toBe(false);
  });
});
