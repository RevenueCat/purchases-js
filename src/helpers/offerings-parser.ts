import {
  type OfferingResponse,
  type OfferingsResponse,
  type PlacementsResponse,
} from "../networking/responses/offerings-response";
import {
  type ProductResponse,
  type ProductsResponse,
} from "../networking/responses/products-response";
import {
  type Offering,
  type Offerings,
  type Package,
  toOffering as entitiesToOffering,
  toProduct,
} from "../entities/offerings";
import { Logger } from "./logger";

const addPlacementContextToPackage = (
  rcPackage: Package,
  placementId: string,
): Package => {
  const webBillingProduct = {
    ...rcPackage.webBillingProduct,
    presentedOfferingContext: {
      ...rcPackage.webBillingProduct.presentedOfferingContext,
      placementIdentifier: placementId,
    },
  };

  return {
    ...rcPackage,
    webBillingProduct: webBillingProduct,
    rcBillingProduct: webBillingProduct,
  };
};

// Keeps the majority of the offering data, only replacing
// the product data which is changed by the discount.
export const replaceOfferingProducts = (
  offering: Offering,
  productsData: ProductsResponse,
): Offering => {
  const productsByIdentifier = toProductsByIdentifier(productsData);

  return mapOfferingPackages(offering, (rcPackage) => {
    const productDetailsData =
      productsByIdentifier[rcPackage.webBillingProduct.identifier];
    if (productDetailsData === undefined) {
      return rcPackage;
    }

    const product = toProduct(
      productDetailsData,
      rcPackage.webBillingProduct.presentedOfferingContext,
    );
    if (product === null) {
      return rcPackage;
    }

    return {
      ...rcPackage,
      rcBillingProduct: product,
      webBillingProduct: product,
    };
  });
};

export const getOfferingIdForPlacement = (
  placementsData: PlacementsResponse,
  placementId: string,
): {
  offeringIdForPlacement: string | null;
  fallbackOfferingId: string | null;
} => {
  const offeringIdsByPlacement = placementsData.offering_ids_by_placement ?? {};

  if (placementId in offeringIdsByPlacement) {
    const placementOfferingId = offeringIdsByPlacement[placementId] ?? null;
    return {
      offeringIdForPlacement: placementOfferingId,
      // An explicit null means "No Offering" was selected in the dashboard,
      // so the fallback must not apply. The fallback only exists for
      // placements that are missing from the map entirely.
      fallbackOfferingId:
        placementOfferingId === null
          ? null
          : placementsData.fallback_offering_id,
    };
  }

  return {
    offeringIdForPlacement: null,
    fallbackOfferingId: placementsData.fallback_offering_id,
  };
};

export const enrichPackagesWithPlacementContext = (
  placementId: string,
  offering: Offering,
): Offering => {
  return mapOfferingPackages(offering, (rcPackage) =>
    addPlacementContextToPackage(rcPackage, placementId),
  );
};

// Keep every package view in sync when package data is replaced.
const mapOfferingPackages = (
  offering: Offering,
  transform: (rcPackage: Package) => Package,
): Offering => {
  const availablePackages = offering.availablePackages.map(transform);
  const packagesById = Object.fromEntries(
    availablePackages.map((rcPackage) => [rcPackage.identifier, rcPackage]),
  );
  const resolvePackage = (rcPackage: Package | null): Package | null =>
    rcPackage === null ? null : (packagesById[rcPackage.identifier] ?? null);

  return {
    ...offering,
    packagesById,
    availablePackages,
    weekly: resolvePackage(offering.weekly),
    monthly: resolvePackage(offering.monthly),
    twoMonth: resolvePackage(offering.twoMonth),
    threeMonth: resolvePackage(offering.threeMonth),
    sixMonth: resolvePackage(offering.sixMonth),
    annual: resolvePackage(offering.annual),
    lifetime: resolvePackage(offering.lifetime),
  };
};

function toProductsByIdentifier(productsData: ProductsResponse): {
  [productId: string]: ProductResponse;
} {
  const productsMap: { [productId: string]: ProductResponse } = {};
  productsData.product_details.forEach((p: ProductResponse) => {
    productsMap[p.identifier] = p;
  });
  return productsMap;
}

export function toOffering(
  offeringIdentifier: string,
  offeringsData: OfferingsResponse,
  productsData: ProductsResponse,
): Offering | null {
  const offeringData = offeringsData.offerings.find(
    (offering) => offering.identifier === offeringIdentifier,
  );

  if (!offeringData) {
    return null;
  }

  const productsMap: { [productId: string]: ProductResponse } =
    toProductsByIdentifier(productsData);

  const isCurrent =
    offeringData.identifier === offeringsData.current_offering_id;

  return entitiesToOffering(
    isCurrent,
    offeringData,
    productsMap,
    offeringsData.targeting,
    offeringsData.ui_config,
  );
}

export function toOfferings(
  offeringsData: OfferingsResponse,
  productsData: ProductsResponse,
): Offerings {
  const productsMap: { [productId: string]: ProductResponse } =
    toProductsByIdentifier(productsData);

  const allOfferings: { [offeringId: string]: Offering } = {};
  offeringsData.offerings.forEach((o: OfferingResponse) => {
    const isCurrent = o.identifier === offeringsData.current_offering_id;
    const offering = entitiesToOffering(
      isCurrent,
      o,
      productsMap,
      offeringsData.targeting,
      offeringsData.ui_config,
    );
    if (offering != null) {
      allOfferings[o.identifier] = offering;
    }
  });

  const currentOffering: Offering | null = offeringsData.current_offering_id
    ? (allOfferings[offeringsData.current_offering_id] ?? null)
    : null;

  if (Object.keys(allOfferings).length == 0) {
    Logger.debugLog(
      "Empty offerings. Please make sure you've configured offerings correctly in the " +
        "RevenueCat dashboard and that the products are properly configured.",
    );
  }

  return {
    all: allOfferings,
    current: currentOffering,
  };
}
