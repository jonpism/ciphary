<script>
  import { importPrivateKey, decryptBundle } from "../lib/crypto.js";
  import { downloadBlob } from "../lib/download.js";

  let files = $state(null);
  let privateKey = $state("");
  let status = $state({ message: "", kind: "" });

  const file = $derived(files && files[0]);

  async function decrypt() {
    const armored = privateKey.trim();
    if (!file)
      return (status = { message: "Choose the encrypted .ciphary file.", kind: "error" });
    if (!armored)
      return (status = { message: "Paste your private key.", kind: "error" });

    status = { message: "Decrypting…", kind: "" };
    try {
      const [bundleText, key] = await Promise.all([
        file.text(),
        importPrivateKey(armored),
      ]);
      const { filename, blob } = await decryptBundle(bundleText, key);
      downloadBlob(filename, blob);
      status = { message: `Decrypted. Downloaded "${filename}".`, kind: "success" };
    } catch (err) {
      status = { message: "Decryption failed: " + err.message, kind: "error" };
    }
  }
</script>

<section class="panel" role="tabpanel">
  <h2>Decrypt a file sent to you</h2>

  <div class="field">
    <label for="decrypt-file">
      1 · Choose the encrypted <code>.ciphary</code> file
    </label>
    <input
      id="decrypt-file"
      type="file"
      accept=".ciphary,application/json,.json,.txt"
      bind:files
    />
  </div>

  <div class="field">
    <label for="my-private-key">2 · Your private key</label>
    <textarea
      id="my-private-key"
      rows="8"
      bind:value={privateKey}
      placeholder={"-----BEGIN CIPHARY PRIVATE KEY-----\n...paste your private key here...\n-----END CIPHARY PRIVATE KEY-----"}
    ></textarea>
  </div>

  <button class="btn btn-primary" onclick={decrypt}>3 · Decrypt file</button>
  {#if status.message}
    <p class="status {status.kind}">{status.message}</p>
  {/if}
</section>
