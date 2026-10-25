<script>
  import Keys from "./components/Keys.svelte";
  import Encrypt from "./components/Encrypt.svelte";
  import Decrypt from "./components/Decrypt.svelte";

  const tabs = [
    { id: "keys", label: "1 · Keys" },
    { id: "encrypt", label: "2 · Encrypt" },
    { id: "decrypt", label: "3 · Decrypt" },
  ];

  let active = $state("keys");
</script>

<header class="site-header">
  <h1>Ciphary</h1>
  <p class="subtitle">
    Encrypt a file in your browser so that only the intended recipient can open
    it. Nothing you load here leaves this device.
  </p>
</header>

<div class="tabs" role="tablist">
  {#each tabs as tab}
    <button
      class="tab"
      class:is-active={active === tab.id}
      role="tab"
      aria-selected={active === tab.id}
      onclick={() => (active = tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>

<main>
  {#if active === "keys"}
    <Keys />
  {:else if active === "encrypt"}
    <Encrypt />
  {:else}
    <Decrypt />
  {/if}
</main>

<footer class="site-footer">
  <p>
    Ciphary runs entirely in your browser and it is Open source. 
    Nothing leaves your machine and there are no servers.
  </p>
  <p class="trust-note">
    <strong>Note on trust:</strong> Ciphary guarantees strong encryption, but it
    cannot verify a key's owner for you. Always confirm a public key's fingerprint
    with the other person through a channel you already trust.
  </p>
</footer>
