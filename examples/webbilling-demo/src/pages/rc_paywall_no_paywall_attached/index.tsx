import { Purchases } from "@revenuecat/purchases-js";
import React, { useState } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";

const RCPaywallNoPaywallAttachedPage: React.FC = () => {
  const { offering } = usePurchasesLoaderData();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }

  const onShowPaywallClicked = async () => {
    setErrorMessage(null);

    try {
      await Purchases.getSharedInstance().presentPaywall({
        offering,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown presentPaywall error";
      console.log(`Error: ${message}`);
      setErrorMessage(message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <h1>No paywall attached repro</h1>
      <button onClick={onShowPaywallClicked}>Show paywall</button>
      <button onClick={() => setClickCount((count) => count + 1)}>
        Background action {clickCount}
      </button>
      {errorMessage ? <div role="alert">{errorMessage}</div> : null}
    </div>
  );
};

export default RCPaywallNoPaywallAttachedPage;
