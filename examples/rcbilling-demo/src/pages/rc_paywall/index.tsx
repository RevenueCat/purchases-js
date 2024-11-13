import { Purchases } from "@revenuecat/purchases-js";
import React, { useEffect } from "react";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import LogoutButton from "../../components/LogoutButton";

const RCPaywallPage: React.FC = () => {
  const { offering } = usePurchasesLoaderData();

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
      .then((x) => console.log(x))
      .catch((err) => console.log(`Error: ${err}`));
  }, [offering]);

  if (!offering) {
    console.error("No offering found");
    return <>No offering found!</>;
  }

  return (
    <>
      <LogoutButton />
      <div id="paywall"></div>
    </>
  );
};

export default RCPaywallPage;
