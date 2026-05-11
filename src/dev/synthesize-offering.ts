import type { PaywallData, UIConfig } from "@revenuecat/purchases-ui-js";
import {
  type Offering,
  type Package,
  type Product,
  PackageType,
  ProductType,
} from "../entities/offerings";
import { PeriodUnit } from "../helpers/duration-helper";
import { walkPaywallTree } from "./paywall-tree-walker";

function collectPackageIds(paywallData: PaywallData): string[] {
  const seen = new Set<string>();
  for (const entry of walkPaywallTree(paywallData)) {
    if (entry.type !== "package") continue;
    const pid = (entry.node as { package_id?: unknown }).package_id;
    if (typeof pid === "string") seen.add(pid);
  }
  return [...seen];
}

function blankProduct(identifier: string): Product {
  const subscriptionOption = {
    id: "base_option",
    priceId: "synth_price_id",
    base: {
      cycleCount: 1,
      periodDuration: "P1M",
      period: { number: 1, unit: PeriodUnit.Month },
      price: {
        amount: 0,
        amountMicros: 0,
        currency: "USD",
        formattedPrice: "$0",
      },
      pricePerWeek: {
        amount: 0,
        amountMicros: 0,
        currency: "USD",
        formattedPrice: "$0",
      },
      pricePerMonth: {
        amount: 0,
        amountMicros: 0,
        currency: "USD",
        formattedPrice: "$0",
      },
      pricePerYear: {
        amount: 0,
        amountMicros: 0,
        currency: "USD",
        formattedPrice: "$0",
      },
    },
    trial: null,
    introPrice: null,
    discount: null,
  };

  return {
    identifier,
    displayName: identifier,
    title: identifier,
    description: null,
    productType: ProductType.Subscription,
    normalPeriodDuration: "P1M",
    presentedOfferingIdentifier: "__synth__",
    presentedOfferingContext: {
      offeringIdentifier: "__synth__",
      placementIdentifier: null,
      targetingContext: null,
    },
    currentPrice: {
      amount: 0,
      amountMicros: 0,
      currency: "USD",
      formattedPrice: "$0",
    },
    price: {
      amount: 0,
      amountMicros: 0,
      currency: "USD",
      formattedPrice: "$0",
    },
    period: { number: 1, unit: PeriodUnit.Month },
    defaultPurchaseOption: subscriptionOption,
    defaultSubscriptionOption: subscriptionOption,
    defaultNonSubscriptionOption: null,
    subscriptionOptions: { base_option: subscriptionOption },
    freeTrialPhase: null,
    introPricePhase: null,
    discountPhase: null,
  } as unknown as Product;
}

function blankPackage(identifier: string): Package {
  const product = blankProduct(identifier);
  return {
    identifier,
    packageType: PackageType.Custom,
    rcBillingProduct: product,
    webBillingProduct: product,
  };
}

export function synthesizeOffering(
  paywallData: PaywallData,
  uiConfig: UIConfig,
): Offering {
  const ids = collectPackageIds(paywallData);
  const pkgs = ids.map((id) => blankPackage(id));
  return {
    identifier: "__synth__",
    serverDescription: "Synthesized for extractor",
    metadata: null,
    packagesById: Object.fromEntries(pkgs.map((p) => [p.identifier, p])),
    availablePackages: pkgs,
    lifetime: null,
    annual: null,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly: null,
    weekly: null,
    hasPaywall: true,
    paywallComponents: paywallData,
    uiConfig,
  } as unknown as Offering;
}
