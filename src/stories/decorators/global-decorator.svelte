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
    globals: {
      locale: string;
      viewport: string;
    };
  }

  let { children, globals }: Props = $props();

  const isEmbeddedViewport = globals.viewport === "embedded";
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

{#if isEmbeddedViewport}
  {@render embedded(children)}
{:else}
  {@render children?.()}
{/if}

{#snippet embedded(children?: Snippet)}
  <div style="width: 100vw; height:100vh; background-color: red;">
    <div style="display: flex">
      <div
        id="embedding-container"
        style="width: 500px; height: 600px; position: relative; overflow: hidden; background-color: lightgray;"
      >
        {@render children?.()}
      </div>
      <div style="padding: 20px;">
        <h1>Homer's Web page</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
          quos.
        </p>
      </div>
    </div>
  </div>
{/snippet}
