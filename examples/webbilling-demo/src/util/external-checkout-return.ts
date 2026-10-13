export function checkoutReturnUrl(
  requestUrl: string,
  appUserId: string,
): string {
  const original = new URL(requestUrl);
  const url = new URL(
    `/checkout-return/${encodeURIComponent(appUserId)}`,
    original,
  );
  // Preserve settings used by the demo loader, such as offering and currency.
  url.search = original.search;
  url.searchParams.delete("checkout_token");
  url.searchParams.set(
    "continue_to",
    original.pathname.startsWith("/checkout-return/")
      ? original.searchParams.get("continue_to") || "/"
      : original.pathname + original.search + original.hash,
  );
  return url.toString();
}

export function checkoutReturnContext(requestUrl: string) {
  const url = new URL(requestUrl);
  const tokens = url.searchParams.getAll("checkout_token");
  if (tokens.length !== 1 || !tokens[0] || tokens[0].length > 1024) {
    throw new Response(
      "Provide one checkout_token to return from external checkout.",
      { status: 400 },
    );
  }
  let continuation: URL;
  try {
    continuation = new URL(
      url.searchParams.get("continue_to") || "/",
      url.origin,
    );
  } catch {
    continuation = new URL("/", url.origin);
  }
  return {
    token: tokens[0],
    continueTo:
      continuation.origin === url.origin
        ? continuation.pathname + continuation.search + continuation.hash
        : "/",
  };
}
