import { describe, expect, it } from "vitest";
import "../../main"; // forces the installer to attach via the gated dynamic import

describe("installExtractor (via main.ts gated import)", () => {
  it("attaches __rcExtractPaywallLayout__ to window in dev/test builds", async () => {
    // Allow the dynamic import to resolve.
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    expect(
      typeof (window as unknown as { __rcExtractPaywallLayout__?: unknown })
        .__rcExtractPaywallLayout__,
    ).toBe("function");
  });
});
