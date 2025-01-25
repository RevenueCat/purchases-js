import type { BrandingAppearance } from "../../networking/responses/branding-response";
import {
  toFormColors,
  toFormStyleVar,
  toProductInfoStyleVar,
  toShape,
  toSpacingVars,
  toTextStyleVar,
} from "./utils";
import type { Shape } from "./shapes";
import type { Colors } from "./colors";
import { DEFAULT_TEXT_STYLES } from "./text";
import { DEFAULT_SPACING } from "./spacing";

export class Theme {
  constructor(
    private readonly brandingAppearance?: BrandingAppearance | undefined,
  ) {}

  get shape(): Shape {
    return toShape(this.brandingAppearance);
  }

  get formColors(): Colors {
    return toFormColors(this.brandingAppearance);
  }

  get formStyleVars() {
    return toFormStyleVar(this.brandingAppearance);
  }

  get productInfoStyleVars() {
    return toProductInfoStyleVar(this.brandingAppearance);
  }

  get spacing() {
    return DEFAULT_SPACING;
  }

  get textStyles() {
    return DEFAULT_TEXT_STYLES;
  }

  get textStyleVars() {
    return toTextStyleVar("text", this.textStyles);
  }

  get spacingStyleVars() {
    return toSpacingVars("spacing", this.spacing);
  }
}
