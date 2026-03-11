import type { PurchaseResult } from "@revenuecat/purchases-js";
import { Purchases } from "@revenuecat/purchases-js";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";

const RCPaywallInElementPage: React.FC = () => {
  const { offering } = usePurchasesLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang");
  const hideBackButtons = searchParams.get("hideBackButtons") === "true";

  useEffect(() => {
    const target = document.getElementById("rc-paywall-in-element-target");
    if (!offering || !target || target.innerHTML !== "") {
      return;
    }

    const purchases = Purchases.getSharedInstance();

    purchases
      .presentPaywall({
        offering,
        htmlTarget: target,
        selectedLocale: lang || undefined,
        hideBackButtons,
      })
      .then((purchaseResult: PurchaseResult) => {
        const { customerInfo, redemptionInfo } = purchaseResult;
        console.log(`CustomerInfo after purchase: ${customerInfo}`);
        console.log(
          `RedemptionInfo after purchase: ${JSON.stringify(redemptionInfo)}`,
        );

        navigate(`/success/${purchases.getAppUserId()}`);
      })
      .catch((err: Error) => console.log(`Error: ${err}`));
  }, [offering, navigate, lang, hideBackButtons]);

  if (!offering) {
    return <>No offering found!</>;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "24px",
        background: "#f4f6fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        data-testid="embedded-paywall-shell"
        style={{
          width: "80vw",
          maxWidth: "1000px",
          minWidth: "320px",
          height: "80vh",
          minHeight: "640px",
          borderRadius: "20px",
          overflow: "hidden",
          border: "1px solid #cfd8ea",
          background: "#ffffff",
          boxShadow: "0 18px 40px rgba(17, 24, 39, 0.12)",
        }}
      >
        <div
          id="rc-paywall-in-element-target"
          data-testid="embedded-paywall-target"
          style={{ width: "100%", height: "100%" }}
        ></div>
      </div>
    </div>
  );
};

export default RCPaywallInElementPage;
