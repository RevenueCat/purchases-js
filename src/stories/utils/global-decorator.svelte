<script module>
  import { Translator } from "../../ui/localization/translator";
  import { translatorContextKey } from "../../ui/localization/constants";
  import { eventsTrackerContextKey } from "../../ui/constants";
  import { setContext, type Snippet } from "svelte";
  import { writable, type Writable } from "svelte/store";
</script>

<script lang="ts">
  interface Props {
    children?: Snippet;
    globals?: {
      locale?: string;
      [key: string]: any;
    };
  }

  let { children, globals = {} }: Props = $props();

  const initiaLocale = globals.locale || "en";
  const translator = new Translator({}, initiaLocale, initiaLocale);
  const translatorStore: Writable<Translator> = writable(translator);

  setContext(translatorContextKey, translatorStore);
  setContext(eventsTrackerContextKey, { trackSDKEvent: () => {} });

  $effect(() => {
    const newLocale = globals.locale;
    const newTranslator = new Translator({}, newLocale, newLocale);
    translatorStore.set(newTranslator);
  });
</script>

{@render children?.()}
