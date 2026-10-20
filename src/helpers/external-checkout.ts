import { ErrorCode, PurchasesError } from "../entities/errors";
import { generateUUID } from "./uuid-helper";

export function externalCheckoutUrl(
  checkoutUrl: string | undefined,
  appUserId: string,
  productId: string,
  returnUrl?: string,
  checkoutToken = generateUUID(),
): string {
  let url: URL;
  try {
    url = new URL(checkoutUrl ?? "");
  } catch {
    throw new PurchasesError(
      ErrorCode.ConfigurationError,
      "Provide an absolute HTTP or HTTPS externalCheckoutUrl for external purchases.",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new PurchasesError(
      ErrorCode.ConfigurationError,
      "externalCheckoutUrl must use HTTP or HTTPS without embedded credentials.",
    );
  }
  url.searchParams.set("app_user_id", appUserId);
  url.searchParams.set("product_id", productId);
  url.searchParams.set("checkout_token", checkoutToken);
  url.searchParams.delete("return_url");
  if (returnUrl !== undefined) {
    let destination: URL;
    try {
      destination = new URL(returnUrl);
    } catch {
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "externalCheckoutReturnUrl must be an absolute HTTP or HTTPS URL.",
      );
    }
    if (
      !["http:", "https:"].includes(destination.protocol) ||
      destination.username ||
      destination.password
    ) {
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "externalCheckoutReturnUrl must use HTTP or HTTPS without embedded credentials.",
      );
    }
    destination.searchParams.set("checkout_token", checkoutToken);
    url.searchParams.set("return_url", destination.toString());
  }
  return url.toString();
}
