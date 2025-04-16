export interface Spacing {
  [key: string]: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export const DEFAULT_SPACING: Spacing = {
  outerPadding: {
    mobile: "clamp(1.3125rem, 5.6vw, 1.5rem)",
    tablet: "clamp(1.40625rem, 7.52vw, 3.25rem)",
    desktop: "clamp(1.5rem, 9.44vw, 5rem)",
  },
  outerPaddingSmall: {
    mobile: "clamp(0.75rem, 4.2vw, 1rem)",
    tablet: "clamp(0.75rem, 4.2vw, 1rem)",
    desktop: "clamp(1.5rem, 9.44vw, 5rem)",
  },
  gapSmall: {
    mobile: "0.25rem",
    tablet: "0.375rem",
    desktop: "0.375rem",
  },
  gapMedium: {
    mobile: "0.5rem",
    tablet: "0.75rem",
    desktop: "0.75rem",
  },
  gapLarge: {
    mobile: "0.75rem",
    tablet: "0.75rem",
    desktop: "0.75rem",
  },
  gapXLarge: {
    mobile: "1rem",
    tablet: "1.5rem",
    desktop: "1.5rem",
  },
  gapXXLarge: {
    mobile: "1.25rem",
    tablet: "2.25rem",
    desktop: "2.25rem",
  },
  gapXXXLarge: {
    mobile: "2.25rem",
    tablet: "4.5rem",
    desktop: "4.5rem",
  },
  inputHeight: {
    mobile: "3rem",
    tablet: "3rem",
    desktop: "3rem",
  },
  gapStripeElement: {
    mobile: "0.70rem",
    tablet: "1rem",
    desktop: "1rem",
  },
};
