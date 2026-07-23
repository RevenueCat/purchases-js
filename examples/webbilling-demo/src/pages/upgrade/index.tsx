import type { ProductChangeResult } from "@revenuecat/purchases-js";
import { PurchasesError } from "@revenuecat/purchases-js";
import React, { useState } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import LogoutButton from "../../components/LogoutButton";

/**
 * PoC page for headless subscription upgrades through the web purchase flow.
 *
 * It fetches a short-lived subscriber access token from the demo token server
 * (which holds the secret API key, mimicking the developer's backend) and
 * then calls Purchases.changeProduct with it. No checkout UI is shown and no
 * payment details are collected: the change is applied to the customer's
 * existing subscription using the payment method on file.
 */
const UpgradePage: React.FC = () => {
  const { purchases, customerInfo, offering } = usePurchasesLoaderData();
  const [newProductId, setNewProductId] = useState("");
  const [inProgress, setInProgress] = useState(false);
  const [result, setResult] = useState<ProductChangeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProductIds = Array.from(customerInfo.activeSubscriptions);
  const offeredProductIds = (offering?.availablePackages ?? [])
    .map((pkg) => pkg.webBillingProduct?.identifier)
    .filter((identifier): identifier is string => Boolean(identifier));

  const performUpgrade = async () => {
    setInProgress(true);
    setResult(null);
    setError(null);

    try {
      // Step 1: ask "our backend" (the demo token server) for a short-lived
      // subscriber token. The secret API key never reaches the browser.
      const tokenResponse = await fetch("/api/upgrade-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appUserId: purchases.getAppUserId() }),
      });
      if (!tokenResponse.ok) {
        throw new Error(
          `Token server error (${tokenResponse.status}): ${await tokenResponse.text()}`,
        );
      }
      const { access_token: subscriberToken } = await tokenResponse.json();

      // Step 2: perform the headless product change with the token.
      const changeResult = await purchases.changeProduct({
        newProductId,
        subscriberToken,
      });
      setResult(changeResult);
    } catch (e) {
      if (e instanceof PurchasesError) {
        setError(`PurchasesError: ${e.message} ${e.underlyingErrorMessage}`);
      } else {
        setError(String(e));
      }
    } finally {
      setInProgress(false);
    }
  };

  return (
    <>
      <LogoutButton />
      <div className="rc-paywall">
        <h1>Upgrade PoC (headless)</h1>

        <p>
          Current user: <code>{purchases.getAppUserId()}</code>
        </p>
        <p>
          Active subscription product(s):{" "}
          <code>
            {activeProductIds.length > 0 ? activeProductIds.join(", ") : "none"}
          </code>
        </p>

        {offeredProductIds.length > 0 && (
          <p>
            Products in current offering:{" "}
            {offeredProductIds.map((identifier) => (
              <button
                key={identifier}
                style={{ marginRight: "8px" }}
                onClick={() => setNewProductId(identifier)}
              >
                {identifier}
              </button>
            ))}
          </p>
        )}

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

        <button
          className="button"
          disabled={inProgress || !newProductId}
          onClick={performUpgrade}
        >
          {inProgress ? "Changing..." : "Change subscription"}
        </button>

        {result && (
          <div>
            <h2>
              {result.changeTiming === "immediate"
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
          This is a proof of concept. The token server must be running (
          <code>npm run token-server</code>) and a product change path must be
          configured between the current and target products.
        </div>
      </div>
    </>
  );
};

export default UpgradePage;
