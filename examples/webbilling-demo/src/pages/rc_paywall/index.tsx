import type { PurchaseResult } from "@revenuecat/purchases-js";
import { Purchases } from "@revenuecat/purchases-js";
import React, { useEffect } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import { useNavigate, useSearchParams } from "react-router-dom";

const RCPaywallPage: React.FC = () => {
  const { offering } = usePurchasesLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang");

  useEffect(() => {
    const target = document.getElementById("paywall");
    if (!offering || target?.innerHTML !== "") {
      return;
    }

    const purchases = Purchases.getSharedInstance();

    purchases
      .presentPaywall({
        offering: offering,
        htmlTarget: document.getElementById("paywall") || undefined,
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
          queryParamRedemptionInfoUrl = `?redeem_url=${redemptionInfo.redeemUrl}&offering`;
        }

        navigate(
          `/success/${purchases.getAppUserId()}${queryParamRedemptionInfoUrl}`,
        );
      })
      .catch((err: Error) => console.log(`Error: ${err}`));
  }, [offering, navigate, lang]);

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }

  return (
    <>
      <div style={{ height: "100vh" }} id="paywall"></div>
    </>
  );
};

export default RCPaywallPage;
