<script module>
  export type Direction = "up" | "down" | "left" | "right";
</script>

<script lang="ts">
  export let direction: Direction;
</script>

<svg
  width="16"
  height="16"
  viewBox="0 0 16 16"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
  class="arrow {direction}"
>
  <path
    d="M4.94 5.72656L8 8.7799L11.06 5.72656L12 6.66656L8 10.6666L4 6.66656L4.94 5.72656Z"
    class="arrow-fill"
    fill-opacity="0.7"
  />
</svg>

<style>
  .arrow {
    transition: transform 0.3s ease;
  }

  .arrow-fill {
    fill: var(--rc-color-grey-text-dark);
  }

  .arrow.left {
    transform: rotate(90deg);
  }

  .arrow.up {
    transform: rotate(180deg);
  }

  .arrow.right {
    transform: rotate(-90deg);
  }

  .arrow.down {
    transform: rotate(0deg);
  }
</style>
