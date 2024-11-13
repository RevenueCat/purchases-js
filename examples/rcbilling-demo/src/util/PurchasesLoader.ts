import {
  CustomerInfo,
  AppUserIDProvider,
  LogLevel,
  Offering,
  Purchases,
} from "@revenuecat/purchases-js";
import { LoaderFunction, redirect, useLoaderData } from "react-router-dom";

const apiKey = import.meta.env.VITE_RC_API_KEY as string;

type IPurchasesLoaderData = {
  purchases: Purchases;
  customerInfo: CustomerInfo;
  offering: Offering;
};

const loadPurchases: LoaderFunction<IPurchasesLoaderData> = async ({
  params,
  request,
}) => {
  const appUserId = params["app_user_id"];
  const searchParams = new URL(request.url).searchParams;
  const currency = searchParams.get("currency");
  const offeringId = searchParams.get("offeringId");

  Purchases.setLogLevel(LogLevel.Verbose);
  try {
    if (!Purchases.isConfigured()) {
      if (!appUserId) {
        Purchases.configure(apiKey, AppUserIDProvider.RevenueCat);
      } else {
        Purchases.configure(apiKey, appUserId);
      }
    } else {
      if (!appUserId) {
        throw redirect("/");
      } else {
        await Purchases.getSharedInstance().changeUser(appUserId);
      }
    }

    const purchases = Purchases.getSharedInstance();
    const [customerInfo, offerings] = await Promise.all([
      purchases.getCustomerInfo(),
      purchases.getOfferings({
        currency: currency || undefined,
        offeringIdentifier: offeringId || undefined,
      }),
    ]);

    const offering = offeringId
      ? offerings.all[offeringId] || null // Return the specified offering
      : offerings.current || null; // Default to the current offering

    return {
      purchases,
      customerInfo,
      offering,
    };
  } catch {
    throw redirect("/");
  }
};

const usePurchasesLoaderData: () => IPurchasesLoaderData = () =>
  useLoaderData() as IPurchasesLoaderData;

export { loadPurchases, usePurchasesLoaderData };
