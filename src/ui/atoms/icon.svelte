<script module lang="ts">
  import { type Component } from "svelte";
  import {
    type Direction,
    default as IconChevron,
  } from "./icons/icon-chevron.svelte";
  import { default as IconBack } from "../atoms/icons/icon-back.svelte";
  import { default as IconCart } from "../atoms/icons/icon-cart.svelte";
  import { default as IconError } from "../atoms/icons/icon-error.svelte";
  import { default as IconLock } from "../atoms/icons/icon-lock.svelte";
  import { default as IconSuccess } from "../atoms/icons/icon-success.svelte";
  import { default as IconInfo } from "../atoms/icons/icon-info.svelte";
  import { default as IconClose } from "../atoms/icons/icon-close.svelte";
  import { default as IconWarning } from "../atoms/icons/icon-warning.svelte";

  export type IconName =
    | "cart"
    | "error"
    | "lock"
    | "success"
    | "chevron-left"
    | "chevron-right"
    | "chevron-up"
    | "chevron-down"
    | "info"
    | "back"
    | "close"
    | "warning";

  const iconMap: Record<
    IconName,
    Component<{ direction?: Direction } | object>
  > = {
    cart: IconCart as Component<object>,
    error: IconError as Component<object>,
    lock: IconLock as Component<object>,
    success: IconSuccess as Component<object>,
    back: IconBack,
    info: IconInfo as Component<object>,
    close: IconClose,
    warning: IconWarning as Component<object>,
    "chevron-left": IconChevron as Component<{ direction?: Direction }>,
    "chevron-right": IconChevron as Component<{ direction?: Direction }>,
    "chevron-up": IconChevron as Component<{ direction?: Direction }>,
    "chevron-down": IconChevron as Component<{ direction?: Direction }>,
  };
</script>

<script lang="ts">
  const { name }: { name: IconName } = $props();
  const MappedIcon = iconMap[name];

  let args = $state({});

  if (name.startsWith("chevron")) {
    const direction = name.split("-")[1];
    args = { direction };
  }
</script>

<MappedIcon {...args} />
