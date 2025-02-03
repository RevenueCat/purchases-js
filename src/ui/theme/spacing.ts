export interface Spacing {
  [key: string]: {
    mobile: string;
    desktop: string;
  };
}

export const DEFAULT_SPACING: Spacing = {
  outerPadding: {
    mobile: "clamp(21px, 5.6vw, 24px)",
    desktop: "clamp(24px, 9.44vw, 80px)",
  },
  outerPaddingSmall: {
    mobile: "clamp(12px, 4.2vw, 16px)",
    desktop: "clamp(24px, 9.44vw, 80px)",
  },
  gapSmall: {
    mobile: "4px",
    desktop: "6px",
  },
  gapMedium: {
    mobile: "8px",
    desktop: "12px",
  },
  gapLarge: {
    mobile: "12px",
    desktop: "12px",
  },
  gapXLarge: {
    mobile: "16px",
    desktop: "32px",
  },
  gapXXLarge: {
    mobile: "20px",
    desktop: "36px",
  },
  inputHeight: {
    mobile: "48px",
    desktop: "48px",
  },
};
