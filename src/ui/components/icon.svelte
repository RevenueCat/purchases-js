<script module>
  import { type Component } from "svelte";
  import { default as IconArrow } from "./icons/icon-arrow.svelte";
  import { default as IconCart } from "./icons/icon-cart.svelte";
  import { default as IconError } from "./icons/icon-error.svelte";
  import { default as IconLock } from "./icons/icon-lock.svelte";
  import { default as IconSuccess } from "./icons/icon-success.svelte";

  export type IconName = "arrow" | "cart" | "error" | "lock" | "success";

  const iconMap: Record<IconName, Component> = {
    arrow: IconArrow,
    cart: IconCart,
    error: IconError,
    lock: IconLock,
    success: IconSuccess,
  };
</script>

<script lang="ts">
  const { name }: { name: IconName } = $props();
  const MappedIcon = iconMap[name];
</script>

<MappedIcon />
