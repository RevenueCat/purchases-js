import { buildAssetURL } from "../networking/assets";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";

export const valueOrNull = (value: string | null | undefined): string | null =>
  !value || value.trim() === "" ? null : value;

const fallbackBrandingSources = {
  icon: null,
  iconWebp: null,
  wordmark: null,
  wordmarkWebp: null,
  src: null,
  srcWebp: null,
  wordmarkSrc: null,
  wordmarkSrcWebp: null,
};

export const buildBrandingSources = (info: BrandingInfoResponse | null) => {
  if (!info) {
    return fallbackBrandingSources;
  }

  const icon = valueOrNull(info.app_icon);
  const iconWebp = valueOrNull(info.app_icon_webp);
  const wordmark = valueOrNull(info.app_wordmark);
  const wordmarkWebp = valueOrNull(info.app_wordmark_webp);

  return {
    src: icon ? buildAssetURL(icon) : null,
    srcWebp: iconWebp ? buildAssetURL(iconWebp) : null,
    wordmarkSrc: wordmark ? buildAssetURL(wordmark) : null,
    wordmarkSrcWebp: wordmarkWebp ? buildAssetURL(wordmarkWebp) : null,
  };
};
