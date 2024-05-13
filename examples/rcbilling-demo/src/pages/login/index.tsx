import React from "react";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="login">
      <h1>Hello! What’s your user ID?</h1>
      <h2>Please enter your user ID to continue.</h2>
      <form onSubmit={(event) => event.preventDefault()}>
        <input type="text" id="app-user-id" placeholder="Your app user ID" />
        <Button
          caption="Continue"
          onClick={() => {
            const appUserId = (
              document.getElementById("app-user-id") as HTMLInputElement | null
            )?.value;
            if (appUserId) {
              navigate(`/paywall/${encodeURIComponent(appUserId)}`);
            }
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
