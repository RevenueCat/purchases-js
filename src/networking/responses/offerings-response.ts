export interface PackageResponse {
  identifier: string;
  platform_product_identifier: string;
}

export interface OfferingResponse {
  identifier: string;
  description: string;
  packages: PackageResponse[];
  metadata: { [key: string]: unknown } | null;
  paywall_components: { [key: string]: unknown } | null;
}

export interface TargetingResponse {
  readonly rule_id: string;
  readonly revision: number;
}

export interface PlacementsResponse {
  readonly fallback_offering_id: string;
  readonly offering_ids_by_placement?: { [key: string]: string | null };
}

export interface OfferingsResponse {
  current_offering_id: string | null;
  offerings: OfferingResponse[];
  targeting?: TargetingResponse;
  placements?: PlacementsResponse;
}
