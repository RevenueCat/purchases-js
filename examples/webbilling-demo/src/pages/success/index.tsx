import React from "react";
import AppStoreButton from "../../components/AppStoreButton";
import PlayStoreButton from "../../components/PlayStoreButton";
import AppLogo from "../../components/AppLogo";
import LogoutButton from "../../components/LogoutButton";

const SuccessPage: React.FC = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const redeemUrlParam = urlParams.get("redeem_url");

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
        {redeemUrlParam && (
          <>
            <h5 className="description">
              You are currently using an anonymous user. To save your
              subscription across devices, please download the app and tap on
              this link from your device.
            </h5>
            <a href={redeemUrlParam}>
              <button className="button">Redeem</button>
            </a>
          </>
        )}
      </div>
    </>
  );
};

export default SuccessPage;
