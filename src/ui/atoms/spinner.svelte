<script lang="ts">
  import Icon from "../../assets/spinner.svg?raw";

  export type Props = {
    color?: string;
  };

  const { color = "var(--rc-color-accent)" }: Props = $props();
</script>

<div style="color:{color};" class="rcb-ui-asset-icon">
  {@html Icon}
</div>

<style>
  @-webkit-keyframes rotating /* Safari and Chrome */ {
    from {
      -webkit-transform: rotate(0deg);
      -o-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    to {
      -webkit-transform: rotate(360deg);
      -o-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes rotating {
    from {
      -ms-transform: rotate(0deg);
      -moz-transform: rotate(0deg);
      -webkit-transform: rotate(0deg);
      -o-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    to {
      -ms-transform: rotate(360deg);
      -moz-transform: rotate(360deg);
      -webkit-transform: rotate(360deg);
      -o-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  div {
    width: 80px;
    height: 80px;
    -webkit-animation: rotating 2s ease-in-out infinite;
    -moz-animation: rotating 2s ease-in-out infinite;
    -ms-animation: rotating 2s ease-in-out infinite;
    -o-animation: rotating 2s ease-in-out infinite;
    animation: rotating 2s ease-in-out infinite;
  }
</style>
