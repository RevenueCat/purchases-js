<script>
  export let style = "";
</script>

<div class="rcb-ui-main" style={style}>
  <slot />
</div>

<style>
    .rcb-ui-main {
        flex: 480px 1 0;
        max-width: 640px;
    }

    @media screen and (max-width: 960px) {

        .rcb-ui-main {
            flex: none;
            max-width: none;
            min-width: 100%;
        }
    }
</style>