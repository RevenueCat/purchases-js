import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import PaywallPage from "./pages/paywall";

import { CustomerInfo, LogLevel, Purchases } from "@revenuecat/purchases-js";
import AppUserIdForm from "./components/AppUserIdForm";
import WithEntitlement from "./components/WithEntitlement";
import CatServices from "./pages/catServices";
import NoDogServices from "./pages/noDogServices";
import { SuccessPage } from "./pages/success";
import DogServices from "./pages/dogServices";
import WithoutEntitlement from "./components/WithoutEntitlement";

const apiKey = import.meta.env.VITE_RC_API_KEY as string;
const initialUserId = localStorage.getItem("appUserId") || "someUserMario";
Purchases.setLogLevel(LogLevel.Verbose);
const purchases = Purchases.configure(apiKey, initialUserId);
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
  const appUserId = purchases.getAppUserId();
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
      <div className="main">
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
                  {/* <div style={{width:"600px"}}>I am 600px wide</div> */}
                  {/* <div style={{position: "absolute", top:"500px", left: "10px", width: "100px", backgroundColor: "red", zIndex: 9999}}>I am on top!</div> */}
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
      <div>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </div>
      <div>
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
      </div>
      <div>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </div>
      <div>
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?
      </div>
    </>
  );
}

export default App;
