import { PurchasesError } from "@revenuecat/purchases-js";
import React, { useState } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";

// Local mirror of the internal ProductChangeResult type — changeProduct is
// @internal and excluded from the public .d.ts for now.
type ProductChangeResult = {
  operationSessionId: string;
  changeType: "immediate" | "deferred";
  newProductId: string;
};

/**
 * Demo page for headless subscription product changes through the web SDK.
 *
 * Fetches a short-lived subscriber access token from the demo token server
 * (which holds the secret API key, mimicking the developer's backend) and
 * then calls Purchases.changeProduct with it. No checkout UI is shown and no
 * payment details are collected: the change is applied to the customer's
 * existing subscription using the payment method on file.
 */
const UpgradePage: React.FC = () => {
  const { purchases, customerInfo } = usePurchasesLoaderData();
  const [newProductId, setNewProductId] = useState("");
  const [sourceProductId, setSourceProductId] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState<ProductChangeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProductIds = Array.from(customerInfo.activeSubscriptions);
  const hasMultipleActiveSubscriptions = activeProductIds.length > 1;

  const canConfirm =
    Boolean(newProductId) &&
    (!hasMultipleActiveSubscriptions || Boolean(sourceProductId));

  const performChange = async () => {
    setInProgress(true);
    setResult(null);
    setError(null);

    try {
      // Ask the demo token server for a short-lived subscriber token.
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

      // Perform the product change with the token.
      // @ts-expect-error changeProduct is marked as internal for now
      const changeResult: ProductChangeResult = await purchases.changeProduct({
        newProductId,
        subscriberToken,
        ...(sourceProductId ? { sourceProductId } : {}),
      });
      setResult(changeResult);
    } catch (e) {
      if (e instanceof PurchasesError) {
        const underlying = e.underlyingErrorMessage
          ? `\n${e.underlyingErrorMessage}`
          : "";
        setError(
          `${e.message}${underlying}\n\n` +
            "Common causes: missing product change path (404), " +
            "expired/invalid subscriber token (401), or multiple active " +
            "subscriptions without sourceProductId.",
        );
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
        <h1>Change subscription</h1>

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

        {hasMultipleActiveSubscriptions && (
          <>
            <p>
              <label>
                Source product (required — multiple active subscriptions):{" "}
                <input
                  type="text"
                  value={sourceProductId}
                  placeholder="product identifier to change from"
                  onChange={(event) => setSourceProductId(event.target.value)}
                  style={{ width: "300px" }}
                />
              </label>
            </p>
            <p>
              {activeProductIds.map((identifier) => (
                <button
                  key={identifier}
                  style={{ marginRight: "8px" }}
                  onClick={() => setSourceProductId(identifier)}
                >
                  Use source: {identifier}
                </button>
              ))}
            </p>
          </>
        )}

        <button
          className="button"
          disabled={inProgress || !canConfirm}
          onClick={performChange}
          style={{ marginTop: "8px" }}
        >
          {inProgress ? "Changing..." : "Confirm change"}
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
          Requires the token server (<code>npm run token-server</code>) and a
          configured product change path between the source and target products.
        </div>
      </div>
    </>
  );
};

export default UpgradePage;
