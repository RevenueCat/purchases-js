import { PurchasesError } from "@revenuecat/purchases-js";
import React, { useState } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";

type ProductChangeResult = {
  operationSessionId: string;
  changeType: "immediate" | "deferred";
  newProductId: string;
};

/**
 * Demo page for upgrade-mode checkout through the web SDK.
 *
 * Fetches a short-lived subscriber access token from the demo token server,
 * then opens Purchases.presentProductChange which mounts the upgrade checkout UI
 * (start → confirm).
 */
const UpgradePage: React.FC = () => {
  const { purchases, customerInfo } = usePurchasesLoaderData();
  const [newProductId, setNewProductId] = useState("");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState<ProductChangeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProductIds = Array.from(customerInfo.activeSubscriptions);

  const canConfirm = Boolean(newProductId) && Boolean(subscriptionId);

  const openUpgradeCheckout = async () => {
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

      const changeResult: ProductChangeResult =
        // @ts-expect-error presentProductChange is marked as internal for now
        await purchases.presentProductChange({
          newProductId,
          subscriberToken,
          subscriptionId,
        });
      setResult(changeResult);
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
            Change to product:{" "}
            <input
              type="text"
              value={newProductId}
              placeholder="target product identifier"
              onChange={(event) => setNewProductId(event.target.value)}
              style={{ width: "300px" }}
            />
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
              {result.changeType === "immediate"
                ? "Upgrade applied immediately"
                : "Downgrade scheduled for next renewal"}
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
          configured product change path, and the RevenueCat subscription public
          id (<code>sub…</code>) for the subscription to change.
        </div>
      </div>
    </>
  );
};

export default UpgradePage;
