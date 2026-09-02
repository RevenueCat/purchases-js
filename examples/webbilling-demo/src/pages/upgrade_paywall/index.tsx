import type { PurchaseResult } from "@revenuecat/purchases-js";
import { PurchasesError } from "@revenuecat/purchases-js";
import React, { useState } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";

/**
 * Demo page for upgrade/downgrade checkout started from an RC Paywall.
 *
 * Fetches a short-lived subscriber access token from the demo token server,
 * then calls Purchases.presentPaywall with productChangeInfo. The user picks
 * the target package on the paywall; checkout starts in product-change mode
 * when a change path exists, otherwise as a normal purchase.
 */
const UpgradePaywallPage: React.FC = () => {
  const { purchases, customerInfo, offering } = usePurchasesLoaderData();
  const activeWebBillingProductIds = Object.values(
    customerInfo.subscriptionsByProductIdentifier,
  )
    .filter(
      (subscription) =>
        subscription.store === "rc_billing" &&
        customerInfo.activeSubscriptions.has(subscription.productIdentifier),
    )
    .map((subscription) => subscription.productIdentifier);
  const [productIdentifier, setProductIdentifier] = useState(
    () => activeWebBillingProductIds[0] ?? "",
  );
  const [subscriptionId, setSubscriptionId] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canOpen = Boolean(offering);

  const openUpgradePaywall = async () => {
    if (!offering) {
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

      const paywallTarget = document.getElementById("upgrade-paywall");
      if (!paywallTarget) {
        throw new Error("Missing #upgrade-paywall mount point");
      }
      paywallTarget.innerHTML = "";
      setPaywallOpen(true);

      const purchaseResult = await purchases.presentPaywall({
        offering,
        htmlTarget: paywallTarget,
        // @ts-expect-error productChangeInfo is marked as internal for now
        productChangeInfo: {
          ...(subscriptionId ? { subscriptionId } : {}),
          ...(productIdentifier ? { productIdentifier } : {}),
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
      setPaywallOpen(false);
      setInProgress(false);
    }
  };

  const changeType =
    // @ts-expect-error productChange is marked as internal for now
    result?.productChange?.changeType as "immediate" | "deferred" | undefined;

  return (
    <>
      <div
        className="rc-paywall"
        style={{ display: paywallOpen ? "none" : undefined }}
      >
        <h1>Upgrade paywall</h1>

        <p>
          Current user: <code>{purchases.getAppUserId()}</code>
        </p>
        <p>
          Offering: <code>{offering?.identifier ?? "none"}</code>
        </p>

        <p>
          <label>
            Change from product:{" "}
            <select
              value={productIdentifier}
              onChange={(event) => setProductIdentifier(event.target.value)}
              style={{ width: "320px" }}
            >
              <option value="">Infer / omit</option>
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
            Subscription id (<code>sub…</code>, optional):{" "}
            <input
              type="text"
              value={subscriptionId}
              placeholder="sub… (optional)"
              onChange={(event) => setSubscriptionId(event.target.value)}
              style={{ width: "300px" }}
            />
          </label>
        </p>

        <button
          className="button"
          disabled={inProgress || !canOpen}
          onClick={openUpgradePaywall}
          style={{ marginTop: "8px" }}
        >
          {inProgress ? "Opening…" : "Open upgrade paywall"}
        </button>

        {result && (
          <div>
            <h2>
              {changeType === "deferred"
                ? "Downgrade scheduled for next renewal"
                : changeType === "immediate"
                  ? "Upgrade applied immediately"
                  : "Purchase / product change completed"}
            </h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}

        {error && (
          <div>
            <h2>Paywall closed or change failed</h2>
            <pre>{error}</pre>
          </div>
        )}

        <div className="notice">
          Requires the token server (<code>npm run token-server</code>), an
          offering with an RC Paywall, and a configured product change path to
          the package the user picks on the paywall. Source product and/or
          subscription id are optional; if both are omitted the backend infers a
          single active Web Billing subscription.
        </div>
      </div>
      <div
        id="upgrade-paywall"
        style={{
          minHeight: paywallOpen ? "100vh" : undefined,
          display: paywallOpen ? "block" : "none",
        }}
      />
    </>
  );
};

export default UpgradePaywallPage;
