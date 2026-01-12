import type { PurchaseResult } from "@revenuecat/purchases-js";
import { Purchases } from "@revenuecat/purchases-js";
import React from "react";

const RCPaywallLauncherPage: React.FC = () => {
  const [purchaseResult, setPurchaseResult] =
    React.useState<PurchaseResult | null>(null);

  const onLaunchPaywallClicked = () => {
    const purchases = Purchases.getSharedInstance();
    purchases
      .presentPaywall({
        // No offering parameter - SDK uses current offering
        // No htmlTarget parameter - SDK creates overlay
      })
      .then((purchaseResult: PurchaseResult) => {
        setPurchaseResult(purchaseResult);
        const { customerInfo, redemptionInfo } = purchaseResult;
        console.log(`CustomerInfo after purchase: ${customerInfo}`);
        console.log(
          `RedemptionInfo after purchase: ${JSON.stringify(redemptionInfo)}`,
        );
      })
      .catch((err: Error) => console.log(`Error: ${err}`));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: "20px",
        padding: "20px",
      }}
    >
      <button onClick={onLaunchPaywallClicked}>Launch Paywall</button>
      {purchaseResult ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "flex-start",
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "600px",
          }}
        >
          <h2>Purchase Result</h2>
          <div>
            <strong>Redemption URL:</strong>
            <p style={{ wordBreak: "break-all" }}>
              {purchaseResult.redemptionInfo?.redeemUrl || "N/A"}
            </p>
          </div>
          <div>
            <strong>App User ID:</strong>
            <p>{purchaseResult.customerInfo.originalAppUserId}</p>
          </div>
          <div style={{ width: "100%" }}>
            <strong>Active Entitlement IDs:</strong>
            {Object.keys(purchaseResult.customerInfo.entitlements.active)
              .length > 0 ? (
              <ul>
                {Object.keys(
                  purchaseResult.customerInfo.entitlements.active,
                ).map((entitlementId) => (
                  <li key={entitlementId}>{entitlementId}</li>
                ))}
              </ul>
            ) : (
              <p>No active entitlements</p>
            )}
          </div>
          <div style={{ width: "100%" }}>
            <strong>All Expiration Dates by Product:</strong>
            {Object.keys(
              purchaseResult.customerInfo.allExpirationDatesByProduct,
            ).length > 0 ? (
              <ul>
                {Object.entries(
                  purchaseResult.customerInfo.allExpirationDatesByProduct,
                ).map(([productId, expirationDate]) => (
                  <li key={productId}>
                    <strong>{productId}:</strong>{" "}
                    {expirationDate
                      ? expirationDate.toLocaleString()
                      : "Lifetime"}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No products</p>
            )}
          </div>
        </div>
      ) : (
        <p>No purchase result yet. Click the button to launch the paywall.</p>
      )}
    </div>
  );
};

export default RCPaywallLauncherPage;
