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
  request,
}) => {
  const appUserId = params["app_user_id"];
  const searchParams = new URL(request.url).searchParams;
  const currency = searchParams.get("currency");

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
      purchases.getOfferings({ currency: currency || undefined }),
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
