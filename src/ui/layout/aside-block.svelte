<script>
  export let style = "";
</script>

<div class="rcb-ui-aside" style={style}>
  <slot />
</div>

<style>
    .rcb-ui-aside {
        margin-right: 16px;
        flex: 320px 1 0;
        max-width: 480px;
    }

    @media screen and (max-width: 960px) {
        .rcb-ui-aside {
            margin-right: 0;
            margin-bottom: 16px;
            min-width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: none;
            max-width: none;
        }
    }
</style>