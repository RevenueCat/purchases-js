import { Purchases } from "@revenuecat/purchases-js";

import React from "react";
import success from "./success.png";

interface ISuccessPageProps {
  purchases: Purchases;
  appUserId: string;
  entitlementId: string;
}

export const SuccessPage: React.FC<ISuccessPageProps> = () => {
  const onNextClicked = () => {
    window.location.replace("/");
  };

  return (
    <section>
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
    </section>
  );
};
