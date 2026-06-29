import React, { useState } from "react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { Purchases } from "@revenuecat/purchases-js";
import { isPaddleApiKey, isStripeApiKey } from "../../util/PurchasesLoader";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [appUserId, setAppUserId] = useState("");
  const [offeringId, setOfferingId] = useState("");
  const [useCustomLogger, setUseCustomLogger] = useState(true);
  const [enableWorkflows, setEnableWorkflows] = useState(false);

  const navigateToAppUserIDPaywall = (
    appUserId?: string,
    useRCPaywall = false,
  ) => {
    if (appUserId) {
      const params = new URLSearchParams();
      if (displayName) {
        params.append("$displayName", displayName);
      }
      if (nickname) {
        params.append("nickname", nickname);
      }
      if (offeringId.trim()) {
        params.append("offeringId", offeringId.trim());
      }
      // Add custom logger preference
      params.append("useCustomLogger", useCustomLogger.toString());
      if (enableWorkflows) {
        params.append("enableWorkflows", "true");
      }

      const queryString = params.toString();
      const base = useRCPaywall ? "rc_paywall" : "paywall";
      const url = `/${base}/${encodeURIComponent(appUserId)}${queryString ? `?${queryString}` : ""}`;
      navigate(url);
    }
  };

  return (
    <div className="login">
      <h1>Hello! What's your user ID?</h1>
      <h2>Please enter a unique user ID to continue.</h2>
      <form onSubmit={(event) => event.preventDefault()}>
        <input
          type="text"
          id="app-user-id"
          placeholder="Your app user ID"
          className="input-field"
          value={appUserId}
          onChange={(e) => setAppUserId(e.target.value)}
        />
        <div className="attributes-section" style={{ marginTop: "16px" }}>
          <h3>Optional Attributes</h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              type="text"
              placeholder="Offering identifier (leave blank for default offering)"
              value={offeringId}
              onChange={(e) => setOfferingId(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
        <div className="logger-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useCustomLogger}
              onChange={(e) => setUseCustomLogger(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">
              🏥 Use custom health logger (adds health icon to SDK logs)
            </span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={enableWorkflows}
              onChange={(e) => setEnableWorkflows(e.target.checked)}
              className="checkbox-input"
            />
            <span className="checkbox-text">
              Enable multipage paywalls (workflows)
            </span>
          </label>
        </div>
        <div className="button-group">
          <Button
            caption="Continue"
            onClick={() => {
              navigateToAppUserIDPaywall(appUserId);
            }}
          />
          <Button
            caption="Continue (RC Paywall)"
            onClick={() => {
              navigateToAppUserIDPaywall(appUserId, true);
            }}
          />
          <Button
            caption={
              isPaddleApiKey
                ? "Skip to Paddle"
                : isStripeApiKey
                  ? "Skip to Stripe Checkout"
                  : "Skip to Web Billing"
            }
            onClick={() => {
              navigateToAppUserIDPaywall(
                appUserId || Purchases.generateRevenueCatAnonymousAppUserId(),
              );
            }}
          />
        </div>
      </form>
      <p className="notice">
        In a non-demo app, you would allow customers to sign up / log in here.
      </p>
    </div>
  );
};

export default LoginPage;
