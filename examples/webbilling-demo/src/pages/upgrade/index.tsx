import type { Package, PurchaseResult } from "@revenuecat/purchases-js";
import { PurchasesError } from "@revenuecat/purchases-js";
import React, { useState } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";

/**
 * Demo page for upgrade-mode checkout through the web SDK.
 *
 * Fetches a short-lived subscriber access token from the demo token server,
 * then calls Purchases.purchase with productChangeInfo to mount the upgrade
 * checkout UI (start → confirm). Source product comes from CustomerInfo;
 * target product is taken from the selected package.
 */
const UpgradePage: React.FC = () => {
  const { purchases, customerInfo, offering } = usePurchasesLoaderData();
  // Product changes only apply to Web Billing; activeSubscriptions mixes stores.
  const activeWebBillingProductIds = Object.values(
    customerInfo.subscriptionsByProductIdentifier,
  )
    .filter(
      (subscription) =>
        subscription.store === "rc_billing" &&
        customerInfo.activeSubscriptions.has(subscription.productIdentifier),
    )
    .map((subscription) => subscription.productIdentifier);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [fromProductIdentifier, setFromProductIdentifier] = useState(
    () => activeWebBillingProductIds[0] ?? "",
  );
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const packages: Package[] = offering?.availablePackages ?? [];
  const selectedPackage =
    packages.find((pkg) => pkg.identifier === selectedPackageId) ?? null;

  const canConfirm = Boolean(selectedPackage);

  const openUpgradeCheckout = async () => {
    if (!selectedPackage) {
      return;
    }

    setInProgress(true);
    setResult(null);
    setError(null);

    try {
      const tokenResponse = await fetch("/api/upgrade-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appUserId: purchases.getAppUserId() }),
      });
      if (!tokenResponse.ok) {
        const body = await tokenResponse.text();
        throw new Error(
          `Failed to mint subscriber token (${tokenResponse.status}). ` +
            `Check the token server env and secret API key. ${body}`,
        );
      }
      const { access_token: subscriberToken } = await tokenResponse.json();

      const purchaseResult: PurchaseResult = await purchases.purchase({
        rcPackage: selectedPackage,
        // @ts-expect-error productChangeInfo is marked as internal for now
        productChangeInfo: {
          ...(fromProductIdentifier ? { fromProductIdentifier } : {}),
          subscriberToken,
        },
      });
      setResult(purchaseResult);
    } catch (e) {
      if (e instanceof PurchasesError) {
        const underlying = e.underlyingErrorMessage
          ? `\n${e.underlyingErrorMessage}`
          : "";
        setError(`${e.message}${underlying}`);
      } else {
        setError(String(e));
      }
    } finally {
      setInProgress(false);
    }
  };

  const changeType =
    // @ts-expect-error productChange is marked as internal for now
    result?.productChange?.changeType as "immediate" | "deferred" | undefined;

  return (
    <>
      <div className="rc-paywall">
        <h1>Upgrade checkout</h1>

        <p>
          Current user: <code>{purchases.getAppUserId()}</code>
        </p>
        <p>
          <label>
            Change from product:{" "}
            <select
              value={fromProductIdentifier}
              onChange={(event) => setFromProductIdentifier(event.target.value)}
              style={{ width: "320px" }}
            >
              <option value="">Infer</option>
              {activeWebBillingProductIds.map((productId) => (
                <option key={productId} value={productId}>
                  {productId}
                </option>
              ))}
            </select>
          </label>
        </p>

        <p>
          <label>
            Change to package:{" "}
            <select
              value={selectedPackageId}
              onChange={(event) => setSelectedPackageId(event.target.value)}
              style={{ width: "320px" }}
            >
              <option value="">Select a package</option>
              {packages.map((pkg) => (
                <option key={pkg.identifier} value={pkg.identifier}>
                  {pkg.identifier} → {pkg.webBillingProduct.identifier}
                </option>
              ))}
            </select>
          </label>
        </p>

        <button
          className="button"
          disabled={inProgress || !canConfirm}
          onClick={openUpgradeCheckout}
          style={{ marginTop: "8px" }}
        >
          {inProgress ? "Opening…" : "Open upgrade checkout"}
        </button>

        {result && (
          <div>
            <h2>
              {changeType === "deferred"
                ? "Downgrade scheduled for next renewal"
                : changeType === "immediate"
                  ? "Upgrade applied immediately"
                  : "Product change completed"}
            </h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {error && (
          <div>
            <h2>Change failed</h2>
            <pre>{error}</pre>
          </div>
        )}

        <div className="notice">
          Requires the token server (<code>npm run token-server</code>) and a
          configured product change path to the selected package's product.
        </div>
      </div>
    </>
  );
};

export default UpgradePage;
