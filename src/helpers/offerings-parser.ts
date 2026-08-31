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

const addPlacementContextToNullablePackage = (
  rcPackage: Package | null,
  placementId: string,
): Package | null => {
  if (rcPackage == null) {
    return null;
  }
  return addPlacementContextToPackage(rcPackage, placementId);
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
  const packagesById = Object.fromEntries(
    Object.entries(offering.packagesById).map(([packageId, rcPackage]) => [
      packageId,
      addPlacementContextToPackage(rcPackage, placementId),
    ]),
  );

  return {
    ...offering,
    packagesById: packagesById,
    availablePackages: Object.values(packagesById),
    weekly: addPlacementContextToNullablePackage(offering.weekly, placementId),
    monthly: addPlacementContextToNullablePackage(
      offering.monthly,
      placementId,
    ),
    twoMonth: addPlacementContextToNullablePackage(
      offering.twoMonth,
      placementId,
    ),
    threeMonth: addPlacementContextToNullablePackage(
      offering.threeMonth,
      placementId,
    ),
    sixMonth: addPlacementContextToNullablePackage(
      offering.sixMonth,
      placementId,
    ),
    annual: addPlacementContextToNullablePackage(offering.annual, placementId),
    lifetime: addPlacementContextToNullablePackage(
      offering.lifetime,
      placementId,
    ),
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
