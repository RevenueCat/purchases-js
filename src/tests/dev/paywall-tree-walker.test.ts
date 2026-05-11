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
});
