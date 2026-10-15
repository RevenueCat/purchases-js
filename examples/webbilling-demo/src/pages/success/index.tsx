import React from "react";
import AppStoreButton from "../../components/AppStoreButton";
import PlayStoreButton from "../../components/PlayStoreButton";
import AppLogo from "../../components/AppLogo";
import LogoutButton from "../../components/LogoutButton";
import { usePurchasesLoaderData } from "../../util/PurchasesLoader";
import { checkoutReturnContext } from "../../util/external-checkout-return";

const SuccessPage: React.FC = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const redeemUrlParam = urlParams.get("redeem_url");
  const { purchases, customerInfo } = usePurchasesLoaderData();
  if (window.location.pathname.startsWith("/checkout-return/")) {
    const { continueTo } = checkoutReturnContext(window.location.href);
    const entitlements = Object.keys(customerInfo.entitlements.active);
    const subscriptions = Array.from(customerInfo.activeSubscriptions);
    return (
      <>
        <LogoutButton />
        <div className="success">
          <AppLogo />
          <h1>Returned from checkout</h1>
          <p>Current RevenueCat access for {purchases.getAppUserId()}</p>
          <h2>Active entitlements</h2>
          {entitlements.length ? (
            <ul>
              {entitlements.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p>No active entitlements yet.</p>
          )}
          <h2>Active subscriptions</h2>
          {subscriptions.length ? (
            <ul>
              {subscriptions.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p>No active subscriptions yet.</p>
          )}
          <a className="button" href={continueTo}>
            Continue
          </a>
        </div>
      </>
    );
  }

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
