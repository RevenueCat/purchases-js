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
  toOffering,
} from "../entities/offerings";
import { Logger } from "./logger";

const addPlacementContextToPackage = (
  rcPackage: Package,
  placementId: string,
): Package => {
  return {
    ...rcPackage,
    rcBillingProduct: {
      ...rcPackage.rcBillingProduct,
      presentedOfferingContext: {
        ...rcPackage.rcBillingProduct.presentedOfferingContext,
        placementIdentifier: placementId,
      },
    },
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

const findOfferingByPlacementId = (
  placementsData: PlacementsResponse,
  allOfferings: { [offeringId: string]: Offering },
  placementId: string,
): Offering | null => {
  const offeringIdsByPlacement =
    placementsData.offering_ids_by_placement ?? null;
  if (offeringIdsByPlacement == null) {
    return null;
  }
  const fallbackOfferingId = placementsData.fallback_offering_id ?? null;
  let offering: Offering | undefined;
  if (placementId in offeringIdsByPlacement) {
    const offeringId = offeringIdsByPlacement[placementId] ?? null;
    if (offeringId == null) {
      return null;
    }
    offering = allOfferings[offeringId];
    if (offering == undefined) {
      offering = allOfferings[fallbackOfferingId];
    }
  } else {
    offering = allOfferings[fallbackOfferingId];
  }

  if (offering == undefined) {
    return null;
  }

  return {
    ...offering,
    packagesById: Object.fromEntries(
      Object.entries(offering.packagesById).map(([packageId, rcPackage]) => [
        packageId,
        addPlacementContextToPackage(rcPackage, placementId),
      ]),
    ),
    availablePackages: offering.availablePackages.map((rcPackage) =>
      addPlacementContextToPackage(rcPackage, placementId),
    ),
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

export function toOfferings(
  offeringsData: OfferingsResponse,
  productsData: ProductsResponse,
): Offerings {
  const productsMap: { [productId: string]: ProductResponse } = {};
  productsData.product_details.forEach((p: ProductResponse) => {
    productsMap[p.identifier] = p;
  });

  const allOfferings: { [offeringId: string]: Offering } = {};
  offeringsData.offerings.forEach((o: OfferingResponse) => {
    const isCurrent = o.identifier === offeringsData.current_offering_id;
    const offering = toOffering(
      isCurrent,
      o,
      productsMap,
      offeringsData.targeting,
    );
    if (offering != null) {
      allOfferings[o.identifier] = offering;
    }
  });

  const currentOffering: Offering | null = offeringsData.current_offering_id
    ? allOfferings[offeringsData.current_offering_id] ?? null
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
    getCurrentOfferingForPlacement(placementId: string): Offering | null {
      const placementData = offeringsData.placements ?? null;
      if (placementData == null) {
        return null;
      }
      return findOfferingByPlacementId(
        placementData,
        allOfferings,
        placementId,
      );
    },
  };
}
