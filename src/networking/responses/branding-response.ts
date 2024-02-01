import { ServerResponse } from "../../entities/types";

export type BrandingInfoResponse = {
  appIcon: string | null;
  appIconWebp: string | null;
  id: string;
  sellerCompanyName: string | null;
};

export const toBrandingInfoResponse = (
  raw: ServerResponse,
): BrandingInfoResponse => {
  const assetsBaseUrl = (import.meta.env.VITE_ASSETS_ENDPOINT as string) || "";
  return {
    appIcon: `${assetsBaseUrl}/${raw.app_icon}`,
    appIconWebp: `${assetsBaseUrl}/${raw.app_icon_webp}`,
    id: raw.id,
    sellerCompanyName: raw.seller_company_name,
  } as BrandingInfoResponse;
};
