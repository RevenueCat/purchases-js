declare module "*.svelte" {
  // oxlint-disable-next-line svelte/no-svelte-internal
  export { SvelteComponentDev as default } from "svelte/internal";
}

declare global {}
