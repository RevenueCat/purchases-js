<script>
  import {
    getStyleVariable,
    getReplacedFillSvgAsImgUrl,
  } from "../../helpers/process-style-overrides";
  import { appearanceConfigStore } from "../../store/store";
  import Icon from "../../assets/lock.svg?raw"; // Load SVG as a raw string

  const accentColor = $appearanceConfigStore["color_accent"];
  const svgUrl = getReplacedFillSvgAsImgUrl(accentColor, Icon);
</script>

<img src={svgUrl} alt="icon" class="rcb-ui-asset-icon" />
