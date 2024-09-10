<script>
  import { getStyleVariable } from "../../helpers/process-style-overrides";
  import { appearanceConfigStore } from "../../store/store";
  import Icon from "../../assets/lock.svg?raw"; // Load SVG as a raw string

  let svgUrl;
  const accentColor = $appearanceConfigStore["color_accent"];
  let svgContent = Icon;

  if (accentColor) {
    svgContent = Icon.replace(
      /fill="#[0-9A-Fa-f]{6}"/,
      `fill="${accentColor}"`,
    );
    svgUrl = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  } else {
    svgUrl = `data:image/svg+xml,${encodeURIComponent(Icon)}`;
  }
</script>

<img src={svgUrl} alt="icon" class="rcb-ui-asset-icon" />
