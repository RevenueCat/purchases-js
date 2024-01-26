export interface EntitlementResponse {
  created_at: number;
  display_name: string;
  id: string;
  lookup_key: string;
  object: string;
  project_id: string;
}

export interface EntitlementsResponse {
  entitlements: EntitlementResponse[];
}
