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
  displayName: string;
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
  priceByPackageId: { [packageId: string]: number };
}

export const toPrice = (data: ServerResponse) => {
  return {
    amount: data.amount,
    currency: data.currency,
  } as Price;
};

export const toProduct = (data: ServerResponse): Product => {
  return {
    id: data.id,
    identifier: data.identifier,
    displayName: data.display_name,
    currentPrice: data.current_price ? toPrice(data.current_price) : null,
    normalPeriodDuration: data.normal_period_duration,
  };
};

export const toPackage = (data: ServerResponse): Package => {
  return {
    id: data.id,
    identifier: data.identifier,
    displayName: data.display_name,
    rcBillingProduct: data.rc_billing_product
      ? toProduct(data.rc_billing_product)
      : null,
  };
};

export const toOffering = (data: ServerResponse): Offering => {
  return {
    id: data.id,
    identifier: data.identifier,
    displayName: data.display_name,
    packages: data.packages.map(toPackage),
  };
};
