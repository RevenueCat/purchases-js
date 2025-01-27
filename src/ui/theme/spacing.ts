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
  innerPadding: {
    mobile: "clamp(12px, 4.2vw, 16px)",
    desktop: "clamp(12px, 4.2vw, 16px)",
  },
  gapSmall: {
    mobile: "clamp(4px, 2.1vw, 8px)",
    desktop: "clamp(6px, 2.1vw, 12px)",
  },
  gapMedium: {
    mobile: "clamp(8px, 3.2vw, 16px)",
    desktop: "clamp(12px, 3.2vw, 24px)",
  },
  gapLarge: {
    mobile: "16px",
    desktop: "32px",
  },
  inputHeight: {
    mobile: "clamp(40px, 10.7vw, 48px)",
    desktop: "clamp(48px, 10.7vw, 48px)",
  },
};
