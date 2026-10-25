<script>
  // public-key fingerprint and verification guidance
  // `warn` styling is used on the sender side, where verifying is critical
  let { value, label = "Public-key fingerprint", warn = false, children } = $props();
</script>

<div class="fingerprint-box" class:warn>
  <span class="fp-label">{label}</span>
  <code>{value}</code>
  {#if children}
    {@render children()}
  {/if}
</div>
