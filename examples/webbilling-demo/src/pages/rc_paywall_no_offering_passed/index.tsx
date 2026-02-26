import type { PurchaseResult } from "@revenuecat/purchases-js";
import { Purchases } from "@revenuecat/purchases-js";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePaywallSettings } from "../../hooks/usePaywallSettings";
import SettingsGearButton from "../../components/SettingsGearButton";

// This page is used to test the case where no offering is passed to the paywall.
// We expect the sdk to be smart enough to pick the .current offering autonomously.
const RCPaywallNoOfferingPassedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("lang");
  const { openSettings, settings } = usePaywallSettings();

  useEffect(() => {
    const target = document.getElementById("paywall");
    if (target?.innerHTML !== "") {
      return;
    }

    const purchases = Purchases.getSharedInstance();

    purchases
      .presentPaywall({
        htmlTarget: document.getElementById("paywall") || undefined,
        selectedLocale: lang || undefined,
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
          queryParamRedemptionInfoUrl = `?redeem_url=${redemptionInfo.redeemUrl}`;
        }

        navigate(
          `/success/${purchases.getAppUserId()}${queryParamRedemptionInfoUrl}`,
        );
      })
      .catch((err: Error) => console.log(`Error: ${err}`));
  }, [navigate, lang, settings]);

  return (
    <>
      <div id="paywall"></div>
      <SettingsGearButton onClick={openSettings} />
    </>
  );
};

export default RCPaywallNoOfferingPassedPage;
