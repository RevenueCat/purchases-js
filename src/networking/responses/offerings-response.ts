export interface PackageResponse {
  identifier: string;
  platform_product_identifier: string;
}

export interface OfferingResponse {
  identifier: string;
  description: string;
  packages: PackageResponse[];
}
export interface OfferingsResponse {
  current_offering_id: string | null;
  offerings: OfferingResponse[];
}
