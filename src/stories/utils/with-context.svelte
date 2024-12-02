<script lang="ts">

  import { setContext, type Snippet } from "svelte";

  interface Props {
    children?: Snippet;
    context?: Record<string, any>;
  }

  let { children, context }: Props = $props();
  Object.entries(context || {}).forEach(([key, value]) => {
    setContext(key, value);
  });
</script>


{@render children?.()}