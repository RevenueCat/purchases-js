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

  get textStyleVars() {
    return toTextStyleVar("text", DEFAULT_TEXT_STYLES);
  }

  get spacingStyleVars() {
    return toSpacingVars("spacing", DEFAULT_SPACING);
  }
}
