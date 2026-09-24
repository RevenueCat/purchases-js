import type { CompleteWorkflowNavigateArgs } from "@revenuecat/purchases-ui-js";

const BLOCKED_PROTOCOLS = new Set(["javascript:", "data:", "vbscript:"]);

function blockedProtocol(protocol: string): boolean {
  return BLOCKED_PROTOCOLS.has(protocol.toLowerCase());
}

/** Open methods shared by complete-workflow and purchase-button navigation. */
type NavigateOpenMethod = CompleteWorkflowNavigateArgs["method"];

/**
 * Returns whether a URL string is safe for default paywall-driven navigation
 * using `window.open` or `location.assign`.
 */
export function isAllowedNavigateUrl(
  rawUrl: string,
  method: NavigateOpenMethod,
): boolean {
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (blockedProtocol(parsed.protocol)) {
    return false;
  }

  if (method === "deep_link") {
    return true;
  }

  return parsed.protocol === "http:" || parsed.protocol === "https:";
}
