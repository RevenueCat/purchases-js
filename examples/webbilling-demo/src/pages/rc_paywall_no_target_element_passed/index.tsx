import type { PurchaseResult } from "@revenuecat/purchases-js";
import { Purchases } from "@revenuecat/purchases-js";
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// This page is used to test the case where no offering is passed to the paywall.
// We expect the sdk to be smart enough to pick the .current offering autonomously.
const RCPaywallNoTargetElementPassedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang");

  const onShowPaywallClicked = () => {
    const purchases = Purchases.getSharedInstance();
    purchases
      .presentPaywall({
        selectedLocale: lang || undefined,
      })
      .then((purchaseResult: PurchaseResult) => {
        const { customerInfo, redemptionInfo } = purchaseResult;
        console.log(`CustomerInfo after purchase: ${customerInfo}`);
        console.log(
          `RedemptionInfo after purchase: ${JSON.stringify(redemptionInfo)}`,
        );

        let queryParamRedemptionInfoUrl = "";
        if (redemptionInfo && redemptionInfo.redeemUrl) {
          queryParamRedemptionInfoUrl = `?redeem_url=${redemptionInfo.redeemUrl}`;
        }

        navigate(
          `/success/${purchases.getAppUserId()}${queryParamRedemptionInfoUrl}`,
        );
      })
      .catch((err: Error) => console.log(`Error: ${err}`));
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <button onClick={onShowPaywallClicked}>Show paywall</button>
    </div>
  );
};

export default RCPaywallNoTargetElementPassedPage;
