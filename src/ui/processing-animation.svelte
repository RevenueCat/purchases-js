<script>
  import { Theme } from "./theme/theme";
  import { getForegroundColor } from "./theme/utils";

  let backgroundColor = new Theme().formColors["background"];
  let foregroundColor = getForegroundColor(backgroundColor);
  let lightMode = foregroundColor === "white";
</script>

<div class="processing" class:light={lightMode}></div>

<style>
  .processing {
    width: 12px;
    aspect-ratio: 1;
    border-radius: 50%;
    animation: l5 1.5s infinite linear;
  }

  @keyframes l5 {
    0% {
      box-shadow:
        20px 0 #fff2,
        -20px 0 #fff2;
      background: #fff2;
    }
    25% {
      box-shadow:
        20px 0 #fff2,
        -20px 0 #ffff;
      background: #fff2;
    }
    50% {
      box-shadow:
        20px 0 #fff2,
        -20px 0 #fff2;
      background: #ffff;
    }
    75% {
      box-shadow:
        20px 0 #ffff,
        -20px 0 #fff2;
      background: #fff2;
    }
    100% {
      box-shadow:
        20px 0 #fff2,
        -20px 0 #fff2;
      background: #fff2;
    }
  }

  .light {
    animation: l5-light 1.5s infinite linear;
  }

  @keyframes l5-light {
    0% {
      box-shadow:
        20px 0 #0002,
        -20px 0 #0002;
      background: #0002;
    }
    25% {
      box-shadow:
        20px 0 #0002,
        -20px 0 #000f;
      background: #0002;
    }
    50% {
      box-shadow:
        20px 0 #0002,
        -20px 0 #0002;
      background: #000f;
    }
    75% {
      box-shadow:
        20px 0 #000f,
        -20px 0 #0002;
      background: #0002;
    }
    100% {
      box-shadow:
        20px 0 #0002,
        -20px 0 #0002;
      background: #0002;
    }
  }
</style>
