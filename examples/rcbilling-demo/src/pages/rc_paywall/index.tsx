import { PurchaseResult, Purchases } from "@revenuecat/purchases-js";
import React, { useEffect } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import LogoutButton from "../../components/LogoutButton";
import { useNavigate } from "react-router-dom";

const RCPaywallPage: React.FC = () => {
  const { offering } = usePurchasesLoaderData();
  const navigate = useNavigate();

  useEffect(() => {
    const target = document.getElementById("paywall");
    if (!offering || target?.innerHTML !== "") {
      return;
    }

    const purchases = Purchases.getSharedInstance();
    purchases
      .renderPaywall({
        offering: offering,
        htmlTarget: document.getElementById("paywall") || undefined,
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
      .catch((err) => console.log(`Error: ${err}`));
  }, [offering]);

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }

  return (
    <>
      <LogoutButton />
      <div
        style={{
          position: "fixed",
          display: "flex",
          alignContent: "center",
          justifyContent: "center",
          width: "100vw",
          height: "100vh",
          background: "rgba(0, 0, 0, 0.6)",
        }}
      >
        <div>
          <div
            style={{
              borderRadius: "48px",
              border: "10px solid black",
              overflow: "hidden",
              marginTop: "20px",
              boxShadow: "0 3px 10px rgb(0 0 0 / 1)",
              height: "760px",
              width: "320px",
              background: "white",
            }}
          >
            <div id="paywall"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RCPaywallPage;
