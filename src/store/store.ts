import { type BrandingInfoResponse } from "../networking/responses/branding-response";
import { writable } from "svelte/store";

export const appearanceConfigStore = writable<
  BrandingInfoResponse["appearance"]
>({});
