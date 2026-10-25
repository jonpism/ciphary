<script>
  import {
    generateKeyPair,
    exportPublicKey,
    exportPrivateKey,
    fingerprintPublicKey,
  } from "../lib/crypto.js";
  import { downloadText, copyToClipboard } from "../lib/download.js";
  import Fingerprint from "./Fingerprint.svelte";

  let generating = $state(false);
  let publicKey = $state("");
  let privateKey = $state("");
  let fingerprint = $state("");
  let copied = $state("");

  async function generate() {
    generating = true;
    try {
      const keyPair = await generateKeyPair();
      [publicKey, privateKey, fingerprint] = await Promise.all([
        exportPublicKey(keyPair.publicKey),
        exportPrivateKey(keyPair.privateKey),
        fingerprintPublicKey(keyPair.publicKey),
      ]);
    } catch (err) {
      alert("Key generation failed: " + err.message);
    } finally {
      generating = false;
    }
  }

  async function copy(which, text) {
    try {
      await copyToClipboard(text);
      copied = which;
      setTimeout(() => (copied = ""), 1200);
    } catch {
      alert("Copy failed. Select the text and copy manually.");
    }
  }
</script>

<section class="panel" role="tabpanel">
  <h2>Generate a key pair</h2>
  <p class="lede">
    If you are the <strong>recipient</strong>, generate a key pair. Share your
    <strong>public key</strong> with the sender so they can encrypt to you. Keep your
    <strong>private key</strong> secret. It is the only thing that can decrypt files
    sent to you.
  </p>

  <button class="btn btn-primary" onclick={generate} disabled={generating}>
    {generating ? "Generating (a few seconds)…" : "Generate key pair"}
  </button>

  {#if publicKey}
    <div class="field">
      <label for="pub-key">Your public key <span class="hint">(safe to share)</span></label>
      <textarea id="pub-key" rows="6" readonly value={publicKey}></textarea>
      <div class="row">
        <button class="btn" onclick={() => copy("pub", publicKey)}>
          {copied === "pub" ? "Copied!" : "Copy"}
        </button>
        <button
          class="btn"
          onclick={() => downloadText("ciphary-public-key.txt", publicKey)}
        >
          Download
        </button>
      </div>
    </div>

    <Fingerprint value={fingerprint}>
      <p class="note">
        Read this aloud to the recipient over a channel you trust (a phone call or in
        person). If their copy matches, the key is genuine.
      </p>
    </Fingerprint>

    <div class="field danger">
      <label for="priv-key">
        Your private key <span class="hint">(keep secret and never share)</span>
      </label>
      <textarea id="priv-key" rows="8" readonly value={privateKey}></textarea>
      <div class="row">
        <button class="btn" onclick={() => copy("priv", privateKey)}>
          {copied === "priv" ? "Copied!" : "Copy"}
        </button>
        <button
          class="btn"
          onclick={() => downloadText("ciphary-private-key.txt", privateKey)}
        >
          Download
        </button>
      </div>
    </div>
  {/if}
</section>
