import { extractPaywallLayout } from "./extract-paywall-layout";
import type { ExtractInput, ExtractedLayout } from "./extract-types";
import { getNullableWindow } from "../helpers/browser-globals";

declare global {
  interface Window {
    __rcExtractPaywallLayout__?: (
      input: ExtractInput,
    ) => Promise<ExtractedLayout>;
  }
}

export function installExtractor(): void {
  const win = getNullableWindow();
  if (!win) return;
  win.__rcExtractPaywallLayout__ = extractPaywallLayout;
}
