import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import PaywallPage from "./pages/paywall";

import { Purchases, CustomerInfo } from "@revenuecat/purchases-js";
import AppUserIdForm from "./components/AppUserIdForm";
import WithEntitlement from "./components/WithEntitlement";
import CatServices from "./pages/catServices";
import NoDogServices from "./pages/noDogServices";
import { SuccessPage } from "./pages/success";
import DogServices from "./pages/dogServices";
import WithoutEntitlement from "./components/WithoutEntitlement";

const apiKey = import.meta.env.VITE_RC_API_KEY as string;
const initialUserId = localStorage.getItem("appUserId") || "someUserMario";
const purchases = Purchases.initializePurchases(apiKey, initialUserId);
export const catServicesEntitlementId = "catServices";
export const dogServicesEntitlementId = "dogServices";

const onNotEntitledToCatServices = () => {
  console.log("The user is not entitled to catServices");
  window.location.href = "/paywall";
};

const onNotEntitledToDogServices = () => {
  console.log("The user is not entitled to dogServices");
  window.location.href = "/noDogServicesHere";
};

const onAppUserIdChange = (newValue: string) => {
  console.log(`Changing appUserId to ${newValue}`);
  localStorage.setItem("appUserId", newValue);
  window.location.href = "/";
};

const onAlreadyEntitled = () => {
  console.log("The user is already entitled");
  window.location.href = "/";
};

function App() {
  const appUserId = localStorage.getItem("appUserId") || "someUserMario";
  purchases.getCustomerInfo().then((customerInfo: CustomerInfo) => {
    console.log(
      `CustomerInfo for user ${appUserId}: ${JSON.stringify(
        customerInfo,
        null,
        2,
      )}`,
    );
  });

  return (
    <>
      <h1>Cats Entermeow Services</h1>
      <div style={{ marginTop: "60px" }}>
        <BrowserRouter>
          <Routes>
            <Route
              path={"/paywall"}
              element={
                <WithoutEntitlement
                  purchases={purchases}
                  entitlementId={catServicesEntitlementId}
                  onEntitled={onAlreadyEntitled}
                >
                  <PaywallPage purchases={purchases} />
                </WithoutEntitlement>
              }
            />
            <Route
              path={"/success"}
              element={
                <SuccessPage
                  purchases={purchases}
                  entitlementId={catServicesEntitlementId}
                />
              }
            />
            <Route
              path="/dogServices"
              element={
                <WithEntitlement
                  purchases={purchases}
                  entitlementId={dogServicesEntitlementId}
                  onNotEntitled={onNotEntitledToDogServices}
                >
                  <DogServices />
                </WithEntitlement>
              }
            />
            <Route path="/noDogServicesHere" element={<NoDogServices />} />
            <Route
              path="/*"
              element={
                <WithEntitlement
                  purchases={purchases}
                  entitlementId={catServicesEntitlementId}
                  onNotEntitled={onNotEntitledToCatServices}
                >
                  <CatServices />
                </WithEntitlement>
              }
            />
          </Routes>
        </BrowserRouter>
      </div>
      <AppUserIdForm
        currentAppUserId={appUserId}
        onAppUserIdChange={onAppUserIdChange}
      />
    </>
  );
}

export default App;
