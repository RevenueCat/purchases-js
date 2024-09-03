import {
  CustomerInfo,
  LogLevel,
  Offerings,
  Purchases,
} from "@revenuecat/purchases-js";
import { LoaderFunction, redirect, useLoaderData } from "react-router-dom";

const apiKey = import.meta.env.VITE_RC_API_KEY as string;

type IPurchasesLoaderData = {
  purchases: Purchases;
  customerInfo: CustomerInfo;
  offerings: Offerings;
};

const loadPurchases: LoaderFunction<IPurchasesLoaderData> = async ({
  params,
}) => {
  const appUserId = params["app_user_id"];
  if (!appUserId) {
    throw redirect("/");
  }
  Purchases.setLogLevel(LogLevel.Verbose);
  try {
    if (!Purchases.isConfigured()) {
      Purchases.configure(apiKey, appUserId);
    } else {
      Purchases.getSharedInstance().changeUser(appUserId);
    }
    const purchases = Purchases.getSharedInstance();
    const [customerInfo, offerings] = await Promise.all([
      purchases.getCustomerInfo(),
      purchases.getOfferings(),
    ]);
    return {
      purchases,
      customerInfo,
      offerings,
    };
  } catch {
    throw redirect("/");
  }
};

const usePurchasesLoaderData: () => IPurchasesLoaderData = () =>
  useLoaderData() as IPurchasesLoaderData;

export { loadPurchases, usePurchasesLoaderData };
