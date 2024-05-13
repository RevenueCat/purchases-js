import "./App.css";

import {
  BrowserRouter,
  LoaderFunction,
  Route,
  RouterProvider,
  Routes,
  createBrowserRouter,
  redirect,
  useNavigate,
} from "react-router-dom";
import PaywallPage from "./pages/paywall";

import { CustomerInfo, LogLevel, Purchases } from "@revenuecat/purchases-js";
import AppUserIdForm from "./components/AppUserIdForm";
import WithEntitlement from "./components/WithEntitlement";
import CatServices from "./pages/catServices";
import NoDogServices from "./pages/noDogServices";
import { SuccessPage } from "./pages/success";
import DogServices from "./pages/dogServices";
import WithoutEntitlement from "./components/WithoutEntitlement";
import { useState } from "react";
import LandingPage from "./pages/landingPage";
import LoginPage from "./login";
import { loadPurchases } from "./util/RouterLoader";

// const initialUserId =
//   localStorage.getItem("appUserId") || `demo_initial_user_id_${Date.now()}`;
// Purchases.setLogLevel(LogLevel.Verbose);
// const purchases = Purchases.configure(apiKey, initialUserId);
export const catServicesEntitlementId = "catServices";
export const dogServicesEntitlementId = "dogServices";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/login/:app_user_id",
    loader: ({ params }) => {
      console.log(params);
      if (params["app_user_id"]) {
        console.log(`Setting app user ID to ${params["app_user_id"]}`);
        throw redirect(`/paywall/${params["app_user_id"]}`);
      } else {
        throw redirect("/login");
      }
      return {};
    },
  },
  {
    path: "/logout",
    loader: () => {
      throw redirect("/");
    },
  },
  {
    path: "/paywall/:app_user_id",
    loader: loadPurchases,
    element: <PaywallPage />,
  },
  {
    path: "/success/:app_user_id",
    loader: loadPurchases,
    element: (
      <WithEntitlement entitlementId={catServicesEntitlementId}>
        <SuccessPage />
      </WithEntitlement>
    ),
  },
]);

// const onNotEntitledToCatServices = () => {
//   console.log("The user is not entitled to catServices");
//   window.location.href = "/paywall";
// };

// const onNotEntitledToDogServices = () => {
//   console.log("The user is not entitled to dogServices");
//   window.location.href = "/noDogServicesHere";
// };

// const onAppUserIdChange = (newValue: string) => {
//   console.log(`Changing appUserId to ${newValue}`);
//   localStorage.setItem("appUserId", newValue);
//   window.location.href = "/";
// };

function App() {
  // const [appUserId, setAppUserId] = useState<string | null>(null);
  // const purchases: Purchases | null =
  //   appUserId !== null ? Purchases.configure(apiKey, appUserId) : null;

  // const navigate = useNavigate();

  // const onAppUserIdChange = (newValue: string | null) => {
  //   console.log(`Changing appUserId to ${newValue}`);
  //   // localStorage.setItem("appUserId", newValue);
  //   setAppUserId(newValue);
  //   if (newValue) {
  //     // navigate("/paywall");
  //   } else {
  //     // navigate("/");
  //   }
  //   // window.location.href = "/";
  // };

  // const appUserId = purchases.getAppUserId();
  // purchases.getCustomerInfo().then((customerInfo: CustomerInfo) => {
  //   console.log(
  //     `CustomerInfo for user ${appUserId}: ${JSON.stringify(
  //       customerInfo,
  //       null,
  //       2,
  //     )}`,
  //   );
  // });

  return <RouterProvider router={router} />;

  // return (
  //   <>
  //     <BrowserRouter>
  //       <Routes>
  //         <Route path="/" element={<LandingPage />} />
  //         <Route path="/login" element={<LoginPage />} />
  //         <Route
  //           path="/login/:app_user_id"
  //           loader={({ params }) => {
  //             console.log(params);
  //             if (params["app_user_id"]) {
  //               setAppUserId(params["app_user_id"]);
  //               throw redirect("/paywall");
  //             } else {
  //               throw redirect("/login");
  //             }
  //           }}
  //         />
  //         <Route
  //           path="/logout"
  //           loader={() => {
  //             setAppUserId(null);
  //             throw redirect("/");
  //           }}
  //         />
  //         {/* <Route
  //           path="/paywall"
  //           element={
  //             <>
  //               {appUserId && purchases ? (
  //                 // <WithoutEntitlement
  //                 //   purchases={purchases}
  //                 //   entitlementId={catServicesEntitlementId}
  //                 //   onEntitled={onAlreadyEntitled}
  //                 // >
  //                   <PaywallPage purchases={purchases} />
  //                 // </WithoutEntitlement>
  //               ) : (

  //               )}
  //             </>
  //           }
  //         /> */}
  //         {purchases && (
  //           <>
  //             <Route
  //               path={"/paywall"}
  //               loader={async () => {
  //                 const [customerInfo, offerings] = await Promise.all([
  //                   purchases.getCustomerInfo(),
  //                   purchases.getOfferings(),
  //                 ]);
  //                 if (customerInfo.entitlements.active["catServices"]) {
  //                   throw redirect("/success");
  //                 }
  //                 return { offerings };
  //               }}
  //               element={
  //                 // <WithoutEntitlement
  //                 //   purchases={purchases}
  //                 //   entitlementId={catServicesEntitlementId}
  //                 //   onEntitled={onAlreadyEntitled}
  //                 // >
  //                 <PaywallPage purchases={purchases} />
  //                 // </WithoutEntitlement>
  //               }
  //             />
  //             <Route
  //               path={"/success"}
  //               element={
  //                 <SuccessPage
  //                   purchases={purchases}
  //                   entitlementId={catServicesEntitlementId}
  //                 />
  //               }
  //             />
  //             {/* <Route
  //               path="/dogServices"
  //               element={
  //                 <WithEntitlement
  //                   purchases={purchases}
  //                   entitlementId={dogServicesEntitlementId}
  //                   onNotEntitled={onNotEntitledToDogServices}
  //                 >
  //                   <DogServices />
  //                 </WithEntitlement>
  //               }
  //             />
  //             <Route path="/noDogServicesHere" element={<NoDogServices />} />
  //             <Route
  //               path="/*"
  //               element={
  //                 <WithEntitlement
  //                   purchases={purchases}
  //                   entitlementId={catServicesEntitlementId}
  //                   onNotEntitled={onNotEntitledToCatServices}
  //                 >
  //                   <CatServices />
  //                 </WithEntitlement>
  //               }
  //             /> */}
  //           </>
  //         )}
  //       </Routes>
  //     </BrowserRouter>
  //     {/* <AppUserIdForm
  //       currentAppUserId={appUserId}
  //       onAppUserIdChange={onAppUserIdChange}
  //     /> */}
  //   </>
  // );
}

export default App;
