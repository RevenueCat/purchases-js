export interface PackageResponse {
  identifier: string;
  platform_product_identifier: string;
}

export interface OfferingResponse {
  identifier: string;
  description: string;
  packages: PackageResponse[];
  metadata: { [key: string]: unknown } | null;
}
export interface OfferingsResponse {
  current_offering_id: string | null;
  offerings: OfferingResponse[];
}
