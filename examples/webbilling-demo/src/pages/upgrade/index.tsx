import type { Package, PurchaseResult } from "@revenuecat/purchases-js";
import { PurchasesError } from "@revenuecat/purchases-js";
import React, { useState } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";

/**
 * Demo page for upgrade-mode checkout through the web SDK.
 *
 * Fetches a short-lived subscriber access token from the demo token server,
 * then calls Purchases.purchase with productChangeInfo to mount the upgrade
 * checkout UI (start → confirm). Target product is taken from the selected
 * package (same shape a paywall would use).
 */
const UpgradePage: React.FC = () => {
  const { purchases, customerInfo, offering } = usePurchasesLoaderData();
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProductIds = Array.from(customerInfo.activeSubscriptions);
  const packages: Package[] = offering?.availablePackages ?? [];
  const selectedPackage =
    packages.find((pkg) => pkg.identifier === selectedPackageId) ?? null;

  const canConfirm = Boolean(selectedPackage) && Boolean(subscriptionId);

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
          subscriptionId,
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
          Active subscription product(s):{" "}
          <code>
            {activeProductIds.length > 0 ? activeProductIds.join(", ") : "none"}
          </code>
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

        <p>
          <label>
            Subscription id (<code>sub…</code>):{" "}
            <input
              type="text"
              value={subscriptionId}
              placeholder="sub…"
              onChange={(event) => setSubscriptionId(event.target.value)}
              style={{ width: "300px" }}
            />
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
          Requires the token server (<code>npm run token-server</code>), a
          configured product change path to the selected package's product, and
          the RevenueCat subscription public id (<code>sub…</code>). Uses{" "}
          <code>purchases.purchase</code> with <code>rcPackage</code> +{" "}
          <code>productChangeInfo</code> (target product defaults from the
          package).
        </div>
      </div>
    </>
  );
};

export default UpgradePage;
