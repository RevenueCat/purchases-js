export interface Spacing {
  [key: string]: {
    mobile: string;
    desktop: string;
  };
}

export const DEFAULT_SPACING: Spacing = {
  outerPadding: {
    mobile: "clamp(1.3125rem, 5.6vw, 1.5rem)",
    desktop: "clamp(1.5rem, 9.44vw, 5rem)",
  },
  outerPaddingSmall: {
    mobile: "clamp(0.75rem, 4.2vw, 1rem)",
    desktop: "clamp(1.5rem, 9.44vw, 5rem)",
  },
  gapSmall: {
    mobile: "0.25rem",
    desktop: "0.375rem",
  },
  gapMedium: {
    mobile: "0.5rem",
    desktop: "0.75rem",
  },
  gapLarge: {
    mobile: "0.75rem",
    desktop: "0.75rem",
  },
  gapXLarge: {
    mobile: "1rem",
    desktop: "2rem",
  },
  gapXXLarge: {
    mobile: "1.25rem",
    desktop: "2.25rem",
  },
  inputHeight: {
    mobile: "3rem",
    desktop: "3rem",
  },
};
