import type { PaywallPurchaseResult } from "@revenuecat/purchases-js";
import { Purchases, PurchasesError } from "@revenuecat/purchases-js";
import React from "react";

const RCPaywallLauncherPage: React.FC = () => {
  const [purchaseResult, setPurchaseResult] =
    React.useState<PaywallPurchaseResult | null>(null);
  const [error, setError] = React.useState<PurchasesError | null>(null);

  const onLaunchPaywallClicked = () => {
    const purchases = Purchases.getSharedInstance();
    purchases
      .presentPaywall({
        onPurchaseError: (error) => {
          console.error(
            `There was a purchase error inside the paywall: ${error}`,
          );
        },
      })
      .then((purchaseResult: PaywallPurchaseResult) => {
        setPurchaseResult(purchaseResult);
        setError(null);
        const { customerInfo, redemptionInfo } = purchaseResult;
        console.log(`CustomerInfo after purchase: ${customerInfo}`);
        console.log(
          `RedemptionInfo after purchase: ${JSON.stringify(redemptionInfo)}`,
        );
      })
      .catch((err: Error) => {
        console.log(`Error: ${err}`);
        if (err instanceof PurchasesError) {
          setError(err);
          setPurchaseResult(null);
        } else {
          // Handle non-PurchasesError cases by wrapping in a generic error display
          console.error("Unexpected error type:", err);
        }
      });
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
      {error && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "flex-start",
            border: "2px solid #dc3545",
            backgroundColor: "#f8d7da",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          <h2 style={{ color: "#721c24", margin: 0 }}>Error</h2>
          <div style={{ width: "100%" }}>
            <strong>Error Code:</strong>
            <p>{error.errorCode}</p>
          </div>
          <div style={{ width: "100%" }}>
            <strong>Message:</strong>
            <p>{error.message}</p>
          </div>
          {error.underlyingErrorMessage && (
            <div style={{ width: "100%" }}>
              <strong>Underlying Error:</strong>
              <p>{error.underlyingErrorMessage}</p>
            </div>
          )}
          {error.extra?.statusCode && (
            <div style={{ width: "100%" }}>
              <strong>HTTP Status Code:</strong>
              <p>{error.extra.statusCode}</p>
            </div>
          )}
          {error.extra?.backendErrorCode && (
            <div style={{ width: "100%" }}>
              <strong>Backend Error Code:</strong>
              <p>{error.extra.backendErrorCode}</p>
            </div>
          )}
        </div>
      )}
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
      ) : !error ? (
        <p>No purchase result yet. Click the button to launch the paywall.</p>
      ) : null}
    </div>
  );
};

export default RCPaywallLauncherPage;
