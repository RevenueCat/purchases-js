import { ServerResponse } from "./types";

export interface Price {
  amount: number;
  currency: string;
}

export interface Product {
  id: string;
  displayName: string;
  identifier: string;
  currentPrice: Price | null;
  normalPeriodDuration: string | null;
}

export interface Package {
  id: string;
  identifier: string;
  rcBillingProduct: Product | null;
}

export interface Offering {
  id: string;
  identifier: string;
  displayName: string;
  packages: Package[];
}

export interface OfferingsPage {
  offerings: Offering[];
  current: Offering | null;
  priceByPackageId: { [packageId: string]: number };
}

export const toPrice = (priceData: ServerResponse) => {
  return {
    amount: priceData.amount,
    currency: priceData.currency,
  } as Price;
};

export const toProduct = (productDetailsData: ServerResponse): Product => {
  return {
    id: productDetailsData.identifier,
    identifier: productDetailsData.identifier,
    displayName: productDetailsData.title,
    currentPrice: productDetailsData.current_price
      ? toPrice(productDetailsData.current_price)
      : null,
    normalPeriodDuration: productDetailsData.normal_period_duration,
  };
};

export const toPackage = (
  packageData: ServerResponse,
  productDetailsData: ServerResponse,
): Package => {
  const rcBillingProduct =
    productDetailsData[packageData.platform_product_identifier];

  return {
    id: packageData.identifier,
    identifier: packageData.identifier,
    rcBillingProduct: rcBillingProduct ? toProduct(rcBillingProduct) : null,
  };
};

export const toOffering = (
  offeringsData: ServerResponse,
  productDetailsData: ServerResponse,
): Offering => {
  return {
    id: offeringsData.identifier,
    identifier: offeringsData.identifier,
    displayName: offeringsData.description,
    packages: offeringsData.packages.map((p: ServerResponse) =>
      toPackage(p, productDetailsData),
    ),
  };
};
