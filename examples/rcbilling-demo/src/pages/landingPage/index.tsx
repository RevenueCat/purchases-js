import React from "react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";
import AppLogo from "../../components/AppLogo";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="landing">
      <div className="landingMain">
        <div className="appLogo">
          <AppLogo />
        </div>
        <h1>Get Smarter with Health Check</h1>
        <h2>Try our RevenueCat Billing Demo Subscription Flow Today.</h2>
        <Button caption="Subscribe now" onClick={() => navigate("/login")} />
      </div>
      <div className="screenshot">
        <img src="/screenshot.png" alt="Screenshot of the app" />
      </div>
    </div>
  );
};

export default LandingPage;
