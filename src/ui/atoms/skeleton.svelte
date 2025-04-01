<script module>
  import { type Snippet } from "svelte";
</script>

<script lang="ts">
  export let children: Snippet;
</script>

<div class="rcb-pricing-table-value-loading">{@render children?.()}</div>

<style>
  .rcb-pricing-table-value-loading {
    color: transparent;
    animation: rcb-pricing-table-value-loading 1.5s ease-in-out 0s infinite
      normal none running;
    cursor: progress;
    background-color: var(--rc-color-grey-text-dark);
    user-select: none;
    border-radius: 4px;
  }

  @keyframes rcb-pricing-table-value-loading {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 0.3;
    }
  }
</style>
