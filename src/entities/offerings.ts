export interface Price {
  price: number;
  currency: string;
}

export interface Product {
  id: string;
  displayName: string;
  currentPrice: Price | null;
  duration: string;
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
  createdAt: Date;
  isCurrent: boolean;
  metadata: never;
  packages: Package[];
}

export interface OfferingsPage {
  offerings: Offering[];
  priceByPackageId: { [packageId: string]: number };
}

export type ServerResponse = any; // eslint-disable-line

export const toPrice = (data: ServerResponse) => {
  return {
    price: data.price,
    currency: data.currency,
  } as Price;
};

export const toProduct = (data: ServerResponse) => {
  return {
    id: data.id,
    displayName: data.display_name,
    currentPrice: data.current_price ? toPrice(data.current_price) : null,
  } as Product;
};

export const toPackage = (data: ServerResponse) => {
  return {
    id: data.id,
    identifier: data.identifier,
    displayName: data.display_name,
    rcBillingProduct: data.rc_billing_product
      ? toProduct(data.rc_billing_product)
      : null,
  } as Package;
};

export const toOffering = (data: ServerResponse) => {
  return {
    id: data.id,
    identifier: data.identifier,
    displayName: data.display_name,
    packages: data.packages.map(toPackage),
  } as Offering;
};
