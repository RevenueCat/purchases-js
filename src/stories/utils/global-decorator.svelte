<script module>
  import { eventsTrackerContextKey } from "../../ui/constants";
  import { setContext, type Snippet } from "svelte";
</script>

<script lang="ts">
  interface Props {
    children?: Snippet;
    globals?: {
      [key: string]: any;
    };
  }

  let { children }: Props = $props();

  setContext(eventsTrackerContextKey, { trackSDKEvent: () => {} });
</script>

{@render children?.()}
