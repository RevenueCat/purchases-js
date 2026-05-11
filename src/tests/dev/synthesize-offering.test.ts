import { describe, expect, it } from "vitest";
import { synthesizeOffering } from "../../dev/synthesize-offering";
import type { PaywallData, UIConfig } from "@revenuecat/purchases-ui-js";

const pw = (packageIds: string[]): PaywallData =>
  ({
    id: "pw",
    default_locale: "en_US",
    components_localizations: { en_US: {} },
    components_config: {
      base: {
        stack: {
          type: "stack",
          id: "root",
          name: "root",
          components: packageIds.map((pid) => ({
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
          })),
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
    },
  }) as unknown as PaywallData;

const uiConfig: UIConfig = {
  app: { fonts: {}, colors: {} },
} as unknown as UIConfig;

describe("synthesizeOffering", () => {
  it("produces an Offering with one package per package_id referenced in the paywall", () => {
    const result = synthesizeOffering(pw(["monthly", "annual"]), uiConfig);
    const ids = result.availablePackages.map((p) => p.identifier).sort();
    expect(ids).toEqual(["annual", "monthly"]);
  });

  it("attaches paywallComponents and uiConfig to the offering", () => {
    const data = pw(["monthly"]);
    const result = synthesizeOffering(data, uiConfig);
    expect(result.paywallComponents).toBe(data);
    expect(result.uiConfig).toBe(uiConfig);
  });

  it("returns identifier='__synth__' and empty availablePackages when no package nodes exist", () => {
    const data = pw([]);
    const result = synthesizeOffering(data, uiConfig);
    expect(result.identifier).toBe("__synth__");
    expect(result.availablePackages).toEqual([]);
  });

  it("populates packagesById so lookups by identifier work", () => {
    const result = synthesizeOffering(pw(["monthly", "annual"]), uiConfig);
    expect(result.packagesById["monthly"]).toBeDefined();
    expect(result.packagesById["annual"]).toBeDefined();
    expect(result.packagesById["monthly"].identifier).toBe("monthly");
  });
});
