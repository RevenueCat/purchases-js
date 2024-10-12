import { BrandingAppearance } from "../../networking/responses/branding-response";
import {
  toFormColors,
  toFormStyleVar,
  toProductInfoStyleVar,
  toShape,
} from "./utils";
import { Shape } from "./shapes";
import { Colors } from "./colors";

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
}
