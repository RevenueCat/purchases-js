import type { CustomerInfo, Offering } from "@revenuecat/purchases-js";
import {
  type FlagsConfig,
  LogLevel,
  Purchases,
} from "@revenuecat/purchases-js";
import type { LoaderFunction } from "react-router-dom";
import { redirect, useLoaderData } from "react-router-dom";

declare global {
  interface Window {
    __RC_API_KEY__?: string;
  }
}

const apiKey = window.__RC_API_KEY__ || import.meta.env.VITE_RC_API_KEY;
const canary = import.meta.env.VITE_RC_CANARY;

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
  const rcSource = searchParams.get("rcSource") || undefined;
  const optOutOfAutoUTM =
    searchParams.get("optOutOfAutoUTM") === "true" || false;

  if (!appUserId) {
    throw redirect("/");
  }
  const additionalHeaders: Record<string, string> = {};
  if (canary) {
    additionalHeaders["X-RC-Canary"] = canary;
  }

  const flagsConfig: FlagsConfig = {
    autoCollectUTMAsMetadata: !optOutOfAutoUTM,
  };
  if (rcSource) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    flagsConfig.rcSource = rcSource;
  }

  Purchases.setLogLevel(LogLevel.Verbose);
  try {
    if (!Purchases.isConfigured()) {
      Purchases.configure({
        apiKey,
        appUserId,
        httpConfig: additionalHeaders,
        flags: flagsConfig,
      });
    } else {
      await Purchases.getSharedInstance().changeUser(appUserId);
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
  } catch (error) {
    console.error(error);
    throw redirect("/");
  }
};

const usePurchasesLoaderData: () => IPurchasesLoaderData = () =>
  useLoaderData() as IPurchasesLoaderData;

export { loadPurchases, usePurchasesLoaderData };
