<script module>
  import { type Component } from "svelte";
  import {
    type Direction,
    default as IconChevron,
  } from "./icons/icon-chevron.svelte";
  import { default as IconCart } from "../atoms/icons/icon-cart.svelte";
  import { default as IconError } from "../atoms/icons/icon-error.svelte";
  import { default as IconLock } from "../atoms/icons/icon-lock.svelte";
  import { default as IconSuccess } from "../atoms/icons/icon-success.svelte";
  import { default as IconInfo } from "../atoms/icons/icon-info.svelte";

  export type IconName =
    | "cart"
    | "error"
    | "lock"
    | "success"
    | "chevron-left"
    | "chevron-right"
    | "chevron-up"
    | "chevron-down"
    | "info";

  const iconMap: Record<IconName, Component<{ direction?: Direction }>> = {
    cart: IconCart,
    error: IconError,
    lock: IconLock,
    success: IconSuccess,
    "chevron-left": IconChevron as Component<{ direction?: Direction }>,
    "chevron-right": IconChevron as Component<{ direction?: Direction }>,
    "chevron-up": IconChevron as Component<{ direction?: Direction }>,
    "chevron-down": IconChevron as Component<{ direction?: Direction }>,
    info: IconInfo,
  };
</script>

<script lang="ts">
  const { name }: { name: IconName } = $props();
  const MappedIcon = iconMap[name];

  let args = $state({});

  if (name.startsWith("chevron")) {
    const direction = name.split("-")[1];
    args = { direction: direction };
  }
</script>

<MappedIcon {...args} />
