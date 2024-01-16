import { Purchases } from "@revenuecat/purchases-js";

import React, { useState } from "react";
import WaitForEntitlement from "../../components/WaitForEntitlement";
import { FullPageLoader } from "../../Loader";
import success from "./success.png";

interface ISuccessPageProps {
  purchases: Purchases;
  appUserId: string;
  entitlementId: string;
}

export const SuccessPage: React.FC<ISuccessPageProps> = ({
  appUserId,
  entitlementId,
  purchases,
}) => {
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onNextClicked = () => {
    window.location.replace("/");
  };

  return (
    <section>
      {loading && <FullPageLoader />}
      {error && <p>{error}</p>}
      <WaitForEntitlement
        purchases={purchases}
        appUserId={appUserId}
        entitlementId={entitlementId}
        onNotEntitled={() => {
          setIsLoading(false);
          setError("There was a problem when trying to subscribe.");
        }}
        onEntitled={() => {
          setIsLoading(false);
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2>Success!</h2>
          <div
            className={"card"}
            style={{ padding: "0px", margin: "0px", maxHeight: "370px" }}
          >
            <img src={success} style={{ width: "300px" }} alt={"Success"} />
          </div>
          <h3>Thank you for subscribing.</h3>
          <button className="button" onClick={() => onNextClicked()}>
            Start enjoying your subscription
          </button>
        </div>
      </WaitForEntitlement>
    </section>
  );
};
