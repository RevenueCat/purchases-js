import React from "react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { Purchases } from "@revenuecat/purchases-js";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const navigateToAppUserIDPaywall = (appUserId?: string) => {
    if (appUserId) {
      navigate(`/paywall/${encodeURIComponent(appUserId)}`);
    }
  };
  return (
    <div className="login">
      <h1>Hello! What’s your user ID?</h1>
      <h2>Please enter a unique user ID to continue.</h2>
      <form onSubmit={(event) => event.preventDefault()}>
        <input type="text" id="app-user-id" placeholder="Your app user ID" />
        <Button
          caption="Continue"
          onClick={() => {
            const appUserId = (
              document.getElementById("app-user-id") as HTMLInputElement | null
            )?.value;
            navigateToAppUserIDPaywall(appUserId);
          }}
        />
        <Button
          caption="Skip"
          onClick={() => {
            navigateToAppUserIDPaywall(
              Purchases.generateRevenueCatAnonymousId(),
            );
          }}
        />
      </form>
      <p className="notice">
        In a non-demo app, you would allow customers to sign up / log in here.
      </p>
    </div>
  );
};

export default LoginPage;
