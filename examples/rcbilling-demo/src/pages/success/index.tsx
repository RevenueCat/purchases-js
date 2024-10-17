import React from "react";
import AppStoreButton from "../../components/AppStoreButton";
import PlayStoreButton from "../../components/PlayStoreButton";
import AppLogo from "../../components/AppLogo";
import LogoutButton from "../../components/LogoutButton";
import { Purchases } from "@revenuecat/purchases-js";

const isAnonymousUser = () => {
  const anonymousIDRegex = /^\$RCAnonymousID:([a-f0-9]{32})$/;
  return anonymousIDRegex.test(Purchases.getSharedInstance().getAppUserId());
};

const generateDeepLink = () => {
  const appUserId = Purchases.getSharedInstance().getAppUserId();
  return `revenuecatbilling://redeem_rcb_purchase?redemption_token=${encodeURIComponent(appUserId)}`;
};

const SuccessPage: React.FC = () => {
  return (
    <>
      <LogoutButton />
      <div className="success">
        <AppLogo />
        <h1>Enjoy your premium experience.</h1>
        <h2>
          Now log in to the app to start using your new premium subscription.
        </h2>
        <div className="storeButtons">
          <AppStoreButton />
          <PlayStoreButton />
        </div>
        {isAnonymousUser() && (
          <>
            <h5 className="description">
              You are currently using an anonymous user. To save your
              subscription across devices, please download the app and tap on
              this link from your device.
            </h5>
            <a href={generateDeepLink()}>
              <button className="button">Redeem</button>
            </a>
          </>
        )}
      </div>
    </>
  );
};

export default SuccessPage;
