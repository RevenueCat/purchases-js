<script>
  import Icon from "../../assets/success.svg?raw"; // Load SVG as a raw string
  import {
    getStyleVariable,
    getReplacedFillSvgAsImgUrl,
  } from "../../helpers/process-style-overrides";
  import { appearanceConfigStore } from "../../store/store";

  const accentColor = $appearanceConfigStore["color_accent"];
  const svgUrl = getReplacedFillSvgAsImgUrl(accentColor, Icon);
</script>

<img src={svgUrl} alt="icon" class="rcb-ui-asset-icon" />

<style>
  img {
    width: 124px;
    height: 124px;
    margin: 0 auto;
  }
</style>
