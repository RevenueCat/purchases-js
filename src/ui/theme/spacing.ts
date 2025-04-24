export interface Spacing {
  [key: string]: {
    mobile: string;
    desktop: string;
  };
}

export const DEFAULT_SPACING: Spacing = {
  outerPaddingTop: {
    mobile: "0.25rem", // 4px
    desktop: "clamp(1rem, 8.44vw, 7.5rem)", // 16px to 128px
  },
  outerPadding: {
    mobile: "clamp(1.3125rem, 5.6vw, 1.5rem)", // 21px to 24px
    desktop: "clamp(3rem, 6.44vw, 4.5rem)", // 48px to 72px
  },
  gapSmall: {
    mobile: "0.25rem", // 4px
    desktop: "0.5rem", // 8px
  },
  gapMedium: {
    mobile: "0.5rem", // 8px
    desktop: "0.75rem", // 12px
  },
  gapLarge: {
    mobile: "0.75rem", // 12px
    desktop: "1rem", // 16px
  },
  gapXLarge: {
    mobile: "1rem", // 16px
    desktop: "2rem", // 32px
  },
  gapXXLarge: {
    mobile: "1.25rem", // 20px
    desktop: "2.25rem", // 36px
  },
  gapXXXLarge: {
    mobile: "2.25rem", // 36px
    desktop: "5rem", // 80px
  },
  inputHeight: {
    // Only used with button
    // Inconsistent with design system
    // Should rely on padding spacings
    mobile: "3rem", // 48px
    desktop: "3rem", // 48px
  },
  gapStripeElement: {
    mobile: "0.70rem", // 11.2px
    desktop: "1rem", // 16px
  },
};
