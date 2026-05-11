import { describe, expect, it } from "vitest";
import { extractPaywallLayout } from "../../dev/extract-paywall-layout";
import {
  fixturePaywallData,
  fixtureUiConfig,
} from "../fixtures/paywall-fixtures";

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
    expect(result.metadata.viewport).toEqual({
      width: 402,
      height: 874,
      scale: 1,
    });
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

    const expectedIds = collectAllIds(data.components_config.base.stack);
    for (const id of expectedIds) {
      expect(result.components[id], `component ${id} missing`).toBeDefined();
      expect(result.components[id].componentId).toBe(id);
    }
  });

  it("uses scale=1 by default and respects an explicit scale", async () => {
    const r1 = await extractPaywallLayout({
      paywallData: fixturePaywallData(),
      uiConfig: fixtureUiConfig(),
      locale: "en_US",
      viewport: { width: 402, height: 874 },
    });
    expect(r1.metadata.viewport.scale).toBe(1);

    const r2 = await extractPaywallLayout({
      paywallData: fixturePaywallData(),
      uiConfig: fixtureUiConfig(),
      locale: "en_US",
      viewport: { width: 402, height: 874, scale: 2 },
    });
    expect(r2.metadata.viewport.scale).toBe(2);
  });
});

function collectAllIds(node: {
  id: string;
  components?: { id: string }[];
}): string[] {
  const out = [node.id];
  for (const c of (node as { components?: { id: string }[] }).components ??
    []) {
    out.push(
      ...collectAllIds(c as { id: string; components?: { id: string }[] }),
    );
  }
  return out;
}
