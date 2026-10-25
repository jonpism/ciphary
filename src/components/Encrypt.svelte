<script>
  import {
    importPublicKey,
    encryptFile,
    fingerprintFromArmored,
  } from "../lib/crypto.js";
  import { downloadText } from "../lib/download.js";
  import Fingerprint from "./Fingerprint.svelte";

  let files = $state(null);
  let recipientKey = $state("");
  let fingerprint = $state("");
  let status = $state({ message: "", kind: "" });

  const file = $derived(files && files[0]);

  async function showFingerprint() {
    const armored = recipientKey.trim();
    if (!armored) return alert("Paste the recipient's public key first.");
    try {
      fingerprint = await fingerprintFromArmored(armored);
    } catch {
      alert("That does not look like a valid Ciphary public key.");
    }
  }

  async function encrypt() {
    const armored = recipientKey.trim();
    if (!file) return (status = { message: "Choose a file to encrypt.", kind: "error" });
    if (!armored)
      return (status = { message: "Paste the recipient's public key.", kind: "error" });

    status = { message: "Encrypting…", kind: "" };
    try {
      const publicKey = await importPublicKey(armored);
      const bundle = await encryptFile(file, publicKey);
      downloadText(`${file.name}.ciphary`, bundle);
      status = {
        message: `Encrypted. Downloaded "${file.name}.ciphary". Send it to the recipient.`,
        kind: "success",
      };
    } catch (err) {
      status = { message: "Encryption failed: " + err.message, kind: "error" };
    }
  }
</script>

<section class="panel" role="tabpanel">
  <h2>Encrypt a file for someone</h2>

  <div class="field">
    <label for="encrypt-file">1 · Choose the file to encrypt</label>
    <input id="encrypt-file" type="file" bind:files />
  </div>

  <div class="field">
    <label for="recipient-key">2 · Recipient's public key</label>
    <textarea
      id="recipient-key"
      rows="6"
      bind:value={recipientKey}
      placeholder={"-----BEGIN CIPHARY PUBLIC KEY-----\n...paste the recipient's public key here...\n-----END CIPHARY PUBLIC KEY-----"}
    ></textarea>
    <button class="btn" onclick={showFingerprint}>Show fingerprint</button>

    {#if fingerprint}
      <Fingerprint value={fingerprint} label="This key's fingerprint" warn>
        <p class="note warn">
          Before sending, confirm this fingerprint with the recipient through a
          channel you trust. Ciphary encrypts correctly, but it cannot confirm who a
          key really belongs to.
        </p>
      </Fingerprint>
    {/if}
  </div>

  <button class="btn btn-primary" onclick={encrypt}>3 · Encrypt file</button>
  {#if status.message}
    <p class="status {status.kind}">{status.message}</p>
  {/if}
</section>
