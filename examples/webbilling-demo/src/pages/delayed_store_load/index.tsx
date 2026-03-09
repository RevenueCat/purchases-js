import type { PaywallPurchaseResult } from "@revenuecat/purchases-js";
import { Purchases, PurchasesError } from "@revenuecat/purchases-js";
import React from "react";

const DelayedStoreLoadPage: React.FC = () => {
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
        console.log(
          `CustomerInfo after purchase: ${purchaseResult.customerInfo}`,
        );
      })
      .catch((err: Error) => {
        console.log(`Error: ${err}`);
        if (err instanceof PurchasesError) {
          setError(err);
          setPurchaseResult(null);
        } else {
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
      <h2>Delayed Store Load Test</h2>
      <p style={{ maxWidth: "500px", textAlign: "center", color: "#666" }}>
        This page was configured with{" "}
        <code>storeLoadTime: "purchase_start"</code>. The store module (Stripe)
        will only be loaded when you click the button below.
      </p>
      <button onClick={onLaunchPaywallClicked}>Launch Paywall</button>
      {error && (
        <div
          style={{
            border: "2px solid #dc3545",
            backgroundColor: "#f8d7da",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          <h2 style={{ color: "#721c24", margin: 0 }}>Error</h2>
          <p>
            <strong>Error Code:</strong> {error.errorCode}
          </p>
          <p>
            <strong>Message:</strong> {error.message}
          </p>
        </div>
      )}
      {purchaseResult ? (
        <div
          style={{
            border: "1px solid #ccc",
            padding: "20px",
            borderRadius: "8px",
            maxWidth: "600px",
          }}
        >
          <h2>Purchase Result</h2>
          <p>
            <strong>App User ID:</strong>{" "}
            {purchaseResult.customerInfo.originalAppUserId}
          </p>
        </div>
      ) : !error ? (
        <p>No purchase result yet. Click the button to launch the paywall.</p>
      ) : null}
    </div>
  );
};

export default DelayedStoreLoadPage;
