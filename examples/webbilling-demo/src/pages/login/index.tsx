import React, { useState } from "react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import { Purchases } from "@revenuecat/purchases-js";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [useCustomLogger, setUseCustomLogger] = useState(true);

  const navigateToAppUserIDPaywall = (appUserId?: string) => {
    if (appUserId) {
      const params = new URLSearchParams();
      if (displayName) {
        params.append("$displayName", displayName);
      }
      if (nickname) {
        params.append("nickname", nickname);
      }
      // Add custom logger preference
      params.append("useCustomLogger", useCustomLogger.toString());

      const queryString = params.toString();
      const url = `/paywall/${encodeURIComponent(appUserId)}${queryString ? `?${queryString}` : ""}`;
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
        />
        <div className="attributes-section">
          <h3>Optional Attributes</h3>
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
        </div>
        <div className="button-group">
          <Button
            caption="Continue"
            onClick={() => {
              const appUserId = (
                document.getElementById(
                  "app-user-id",
                ) as HTMLInputElement | null
              )?.value;
              navigateToAppUserIDPaywall(appUserId);
            }}
          />
          <Button
            caption="Skip"
            onClick={() => {
              navigateToAppUserIDPaywall(
                Purchases.generateRevenueCatAnonymousAppUserId(),
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
