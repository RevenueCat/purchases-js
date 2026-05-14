import { describe, expect, it } from "vitest";
import { walkPaywallTree } from "../../dev/paywall-tree-walker";
import type { PaywallData } from "@revenuecat/purchases-ui-js";

const minimalPaywall = (): PaywallData =>
  ({
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
                dimension: {
                  type: "vertical",
                  alignment: "center",
                  distribution: "start",
                },
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
          dimension: {
            type: "vertical",
            alignment: "center",
            distribution: "start",
          },
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
    } as PaywallData["components_config"],
  }) as unknown as PaywallData;

describe("walkPaywallTree", () => {
  it("yields every component including nested ones", () => {
    const entries = [...walkPaywallTree(minimalPaywall())];
    const ids = entries.map((e) => e.id).sort();
    expect(ids).toEqual([
      "buy",
      "buy-label",
      "buy-stack",
      "root-stack",
      "title",
    ]);
  });

  it("yields each entry with its dashboard-side type and name", () => {
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
        dimension: {
          type: "vertical",
          alignment: "center",
          distribution: "start",
        },
        spacing: 0,
        margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
        padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
        background_color: null,
        background: null,
        border: null,
        shape: null,
        shadow: null,
      },
    } as never;
    const ids = [...walkPaywallTree(pw)].map((e) => e.id);
    expect(ids).toContain("footer");
    expect(ids).toContain("footer-stack");
  });

  it("descends into tabs.tabs and tabs.control.stack", () => {
    const pw = minimalPaywall();
    const stackTemplate = () => ({
      type: "stack" as const,
      id: "ctrl-stack",
      name: "ctrl-stack",
      components: [],
      size: { width: { type: "fit" }, height: { type: "fit" } },
      dimension: {
        type: "vertical",
        alignment: "center",
        distribution: "start",
      },
      spacing: 0,
      margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
      padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
      background_color: null,
      background: null,
      border: null,
      shape: null,
      shadow: null,
    });
    const tabsNode = {
      type: "tabs",
      id: "tabs-root",
      name: "tabs-root",
      control: {
        type: "buttons",
        stack: { ...stackTemplate(), id: "ctrl-stack" },
      },
      tabs: [
        {
          type: "tab",
          id: "tab-1",
          name: "tab-1",
          stack: { ...stackTemplate(), id: "tab-1-stack" },
        },
        {
          type: "tab",
          id: "tab-2",
          name: "tab-2",
          stack: { ...stackTemplate(), id: "tab-2-stack" },
        },
      ],
    };
    (
      pw.components_config.base.stack as unknown as { components: unknown[] }
    ).components.push(tabsNode);

    const ids = [...walkPaywallTree(pw)].map((e) => e.id);
    expect(ids).toContain("tabs-root");
    expect(ids).toContain("ctrl-stack");
    expect(ids).toContain("tab-1");
    expect(ids).toContain("tab-1-stack");
    expect(ids).toContain("tab-2");
    expect(ids).toContain("tab-2-stack");
  });

  it("descends into carousel.pages", () => {
    const pw = minimalPaywall();
    const pageStack = (id: string) => ({
      type: "stack" as const,
      id,
      name: id,
      components: [],
      size: { width: { type: "fit" }, height: { type: "fit" } },
      dimension: {
        type: "vertical",
        alignment: "center",
        distribution: "start",
      },
      spacing: 0,
      margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
      padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
      background_color: null,
      background: null,
      border: null,
      shape: null,
      shadow: null,
    });
    const carouselNode = {
      type: "carousel",
      id: "carousel-root",
      name: "carousel",
      pages: [pageStack("page-1"), pageStack("page-2")],
    };
    (
      pw.components_config.base.stack as unknown as { components: unknown[] }
    ).components.push(carouselNode);

    const ids = [...walkPaywallTree(pw)].map((e) => e.id);
    expect(ids).toContain("carousel-root");
    expect(ids).toContain("page-1");
    expect(ids).toContain("page-2");
  });

  it("descends into timeline.items icon/title/description", () => {
    const pw = minimalPaywall();
    const textNode = (id: string) => ({
      type: "text",
      id,
      name: id,
      text_lid: id,
      font_size: "body_m",
      font_weight: "regular",
      horizontal_alignment: "leading",
      color: { light: { type: "hex", value: "#000" } },
      padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
      margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
      size: { width: { type: "fit" }, height: { type: "fit" } },
    });
    const iconNode = (id: string) => ({
      type: "icon",
      id,
      name: id,
    });
    const timelineNode = {
      type: "timeline",
      id: "timeline-root",
      name: "timeline",
      items: [
        {
          type: "timeline_item",
          id: "item-1",
          name: "item-1",
          title: textNode("item-1-title"),
          description: textNode("item-1-desc"),
          icon: iconNode("item-1-icon"),
        },
      ],
    };
    (
      pw.components_config.base.stack as unknown as { components: unknown[] }
    ).components.push(timelineNode);

    const ids = [...walkPaywallTree(pw)].map((e) => e.id);
    expect(ids).toContain("timeline-root");
    expect(ids).toContain("item-1-title");
    expect(ids).toContain("item-1-desc");
    expect(ids).toContain("item-1-icon");
  });

  it("descends into stack.badge.stack", () => {
    const pw = minimalPaywall();
    const badgeStack = {
      type: "stack",
      id: "badge-stack",
      name: "badge-stack",
      components: [
        {
          type: "text",
          id: "badge-label",
          name: "badge-label",
          text_lid: "badge-lid",
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
      dimension: {
        type: "vertical",
        alignment: "center",
        distribution: "start",
      },
      spacing: 0,
      margin: { top: 0, bottom: 0, leading: 0, trailing: 0 },
      padding: { top: 0, bottom: 0, leading: 0, trailing: 0 },
      background_color: null,
      background: null,
      border: null,
      shape: null,
      shadow: null,
    };
    (
      pw.components_config.base.stack as unknown as {
        badge?: { style: string; alignment: string; stack: unknown };
      }
    ).badge = {
      style: "overlay",
      alignment: "top",
      stack: badgeStack,
    };

    const ids = [...walkPaywallTree(pw)].map((e) => e.id);
    expect(ids).toContain("badge-stack");
    expect(ids).toContain("badge-label");
  });
});
