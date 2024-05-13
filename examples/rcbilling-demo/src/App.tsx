import {
  RouterProvider,
  createBrowserRouter,
  redirect,
} from "react-router-dom";
import "./App.css";
import WithEntitlement from "./components/WithEntitlement";
import WithoutEntitlement from "./components/WithoutEntitlement";
import LoginPage from "./pages/login";
import LandingPage from "./pages/landingPage";
import PaywallPage from "./pages/paywall";
import SuccessPage from "./pages/success";
import { loadPurchases } from "./util/RouterLoader";

export const catServicesEntitlementId = "catServices";

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
    element: (
      <WithoutEntitlement entitlementId={catServicesEntitlementId}>
        <PaywallPage />
      </WithoutEntitlement>
    ),
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

const App = () => <RouterProvider router={router} />;

export default App;
