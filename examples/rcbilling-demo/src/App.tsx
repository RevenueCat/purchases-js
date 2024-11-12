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
import { loadPurchases } from "./util/PurchasesLoader";

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
    path: "/logout",
    loader: () => {
      throw redirect("/");
    },
  },
  {
    path: "/paywall/:app_user_id",
    loader: loadPurchases,
    element: (
      <WithoutEntitlement>
        <PaywallPage />
      </WithoutEntitlement>
    ),
  },
  {
    path: "/paywall",
    loader: loadPurchases,
    element: (
      <WithoutEntitlement>
        <PaywallPage />
      </WithoutEntitlement>
    ),
  },
  {
    path: "/success/:app_user_id",
    loader: loadPurchases,
    element: (
      <WithEntitlement>
        <SuccessPage />
      </WithEntitlement>
    ),
  },
]);

const App = () => <RouterProvider router={router} />;

export default App;
