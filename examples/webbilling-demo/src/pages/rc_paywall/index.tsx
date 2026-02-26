import type { PurchaseResult } from "@revenuecat/purchases-js";
import { Purchases } from "@revenuecat/purchases-js";
import React, { useEffect } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePaywallSettings } from "../../hooks/usePaywallSettings";
import SettingsGearButton from "../../components/SettingsGearButton";

const RCPaywallPage: React.FC = () => {
  const { offering } = usePurchasesLoaderData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang");
  const hideBackButtons = searchParams.get("hideBackButtons") === "true";
  const { openSettings, settings } = usePaywallSettings();

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
        hideBackButtons: hideBackButtons,
        customVariables: settings,
      })
      .then((purchaseResult: PurchaseResult) => {
        const { customerInfo, redemptionInfo } = purchaseResult;
        console.log(`CustomerInfo after purchase: ${customerInfo}`);
        console.log(
          `RedemptionInfo after purchase: ${JSON.stringify(redemptionInfo)}`,
        );

        let queryParamRedemptionInfoUrl = "";
        if (redemptionInfo && redemptionInfo.redeemUrl) {
          queryParamRedemptionInfoUrl = `?redeem_url=${redemptionInfo.redeemUrl}&offeringId=${offering.identifier}`;
        }

        navigate(
          `/success/${purchases.getAppUserId()}${queryParamRedemptionInfoUrl}`,
        );
      })
      .catch((err: Error) => console.log(`Error: ${err}`));
  }, [offering, navigate, lang, hideBackButtons, settings]);

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }

  return (
    <>
      <div style={{ minHeight: "100vh" }} id="paywall"></div>
      <SettingsGearButton onClick={openSettings} />
    </>
  );
};

export default RCPaywallPage;
