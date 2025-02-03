<script lang="ts">
  export let onClose: () => void;

  const handleClick = () => {
    onClose();
  };
</script>

<button on:click={handleClick}>Text</button>
