<script lang="ts">
  let terms: Record<string, string> = {};
  export { terms };
</script>

<dl>
  {#each Object.keys(terms) as termKey}
    <dt>{termKey}</dt>
    <dd>{terms[termKey]}</dd>
  {/each}
</dl>

<style>
  dl {
    width: 100%;
    overflow: hidden;
    padding: 0;
    margin: 0;
  }

  dt {
    float: left;
    width: 25%;
    padding: 0;
    margin: 0;
    text-transform: uppercase;
    font-size: 0.75rem;
    margin-top: 0.2rem;
  }

  dd {
    float: left;
    width: 75%;
    padding: 0;
    margin: 0;
  }
</style>
