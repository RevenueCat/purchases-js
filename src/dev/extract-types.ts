import type {
  PaywallData,
  UIConfig,
  CustomVariables,
} from "@revenuecat/purchases-ui-js";
import type { Offering } from "../entities/offerings";

export const EXTRACTOR_VERSION = "1.0.0";

export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractInput {
  paywallData: PaywallData;
  uiConfig: UIConfig;
  /**
   * Full offering object. When provided, variables/packages render with the
   * real product data. When absent, a minimal offering is synthesized.
   */
  offering?: Offering;
  /**
   * Identifier to report in `metadata.offeringId` when no full `offering` is
   * supplied. Useful when normalizing from an RC `/offerings` API response
   * where the offering identifier is known but no package data is available.
   */
  offeringId?: string;
  locale: string;
  darkMode?: boolean;
  viewport: { width: number; height: number; scale?: number };
  customVariables?: CustomVariables;
}

export type NativeType = "StaticText" | "Image" | "Button" | "Other";

export interface ComponentLayout {
  componentId: string;
  dashboardType: string;
  dashboardName?: string;
  rendered: boolean;
  nativeType?: NativeType;
  domTag?: string;
  label?: string;
  frame: Frame;
  state: { enabled: boolean; selected: boolean };
}

export interface ExtractedLayout {
  metadata: {
    platform: "web";
    platformVersion: string;
    extractorVersion: string;
    offeringId: string | null;
    locale: string;
    timestamp: string;
    viewport: { width: number; height: number; scale: number };
    rootFrame: Frame;
  };
  components: Record<string, ComponentLayout>;
}
