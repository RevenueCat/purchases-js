<script lang="ts">
  export let size: "small" | "medium" | "large" = "medium";

  const sizeMap = {
    small: { width: "8px", offset: "10px" },
    medium: { width: "12px", offset: "20px" },
    large: { width: "16px", offset: "30px" },
  };
</script>

<div
  class="processing"
  style="--shadow-offset: {sizeMap[size].offset}; --width: {sizeMap[size]
    .width};"
></div>

<style>
  .processing {
    width: var(--width, 12px);
    aspect-ratio: 1;
    border-radius: 50%;
    animation: l5 1.5s infinite linear;
  }

  @keyframes l5 {
    0% {
      box-shadow:
        var(--shadow-offset) 0 #fff2,
        calc(-1 * var(--shadow-offset)) 0 #fff2;
      background: #fff2;
    }
    25% {
      box-shadow:
        var(--shadow-offset) 0 #fff2,
        calc(-1 * var(--shadow-offset)) 0 #ffff;
      background: #fff2;
    }
    50% {
      box-shadow:
        var(--shadow-offset) 0 #fff2,
        calc(-1 * var(--shadow-offset)) 0 #fff2;
      background: #ffff;
    }
    75% {
      box-shadow:
        var(--shadow-offset) 0 #ffff,
        calc(-1 * var(--shadow-offset)) 0 #fff2;
      background: #fff2;
    }
    100% {
      box-shadow:
        var(--shadow-offset) 0 #fff2,
        calc(-1 * var(--shadow-offset)) 0 #fff2;
      background: #fff2;
    }
  }
</style>
