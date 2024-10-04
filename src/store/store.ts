import { type BrandingInfoResponse } from "../networking/responses/branding-response";
import { writable } from "svelte/store";

// Store to hold appearance configuration object for custom overrides
export const appearanceConfigStore = writable<
  BrandingInfoResponse["appearance"]
>({});