<script>
  import { Meta, Story, Template } from "@storybook/addon-svelte-csf";
  import { Button } from "@revenuecat/purchases-ui-web";
</script>


<Meta title="PurchasesUIWeb/Button" component={Button} />


<Template>
  <div style="width: 100vw; min-height: 100vh;">

    <Button label="I am a Purchases Web UI Button" primary={true} onClick={() => {alert("You clicked me")}} />

  </div>
</Template>


<Story name='Standard' />