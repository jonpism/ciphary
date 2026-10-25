//  encryption entirely in the browser via the Web Crypto API:
//   • the file is encrypted with a random AES-256-GCM key
//   • the AES key is wrapped (encrypted) with the recipient's RSA-OAEP public key
//   • only the holder of the matching RSA private key can unwrap the AES key,
//     and therefore only they can decrypt the file.
//
// note: keys and plaintext stay on this machine

const RSA_PARAMS = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]), // 65537
  hash: "SHA-256",
};

const AES_PARAMS = { name: "AES-GCM", length: 256 };

// bumped if the on-disk bundle/key format ever changes
export const FORMAT_VERSION = 1;
export const ALGORITHM_LABEL = "RSA-OAEP-4096 + AES-256-GCM";

// ---------------------------------------------------------------------------
// Base64 and armor helpers
// ---------------------------------------------------------------------------

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000; // avoid "too many arguments" on String.fromCharCode
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// wrap raw base64 in PEM-like, easy to copy,paste and label
function armor(label, base64) {
  const lines = base64.match(/.{1,64}/g) || [""];
  return `-----BEGIN CIPHARY ${label}-----\n${lines.join("\n")}\n-----END CIPHARY ${label}-----`;
}

function dearmor(text) {
  return text
    .replace(/-----(BEGIN|END) CIPHARY [^-]+-----/g, "")
    .replace(/\s+/g, "");
}

// ---------------------------------------------------------------------------
// key generation, export, import
// ---------------------------------------------------------------------------

export async function generateKeyPair() {
  return crypto.subtle.generateKey(RSA_PARAMS, true, ["encrypt", "decrypt"]);
}

export async function exportPublicKey(publicKey) {
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  return armor("PUBLIC KEY", bufferToBase64(spki));
}

export async function exportPrivateKey(privateKey) {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  return armor("PRIVATE KEY", bufferToBase64(pkcs8));
}

export async function importPublicKey(armoredText) {
  const spki = base64ToBuffer(dearmor(armoredText));
  return crypto.subtle.importKey("spki", spki, RSA_PARAMS, true, ["encrypt"]);
}

export async function importPrivateKey(armoredText) {
  const pkcs8 = base64ToBuffer(dearmor(armoredText));
  return crypto.subtle.importKey("pkcs8", pkcs8, RSA_PARAMS, true, ["decrypt"]);
}

// ---------------------------------------------------------------------------
// fingerprint
//
// SHA-256 over the public key's DER bytes ( grouped hex)
// two people comparing fingerprints can detect a swapped key.
// ---------------------------------------------------------------------------

export async function fingerprintPublicKey(publicKey) {
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  const digest = await crypto.subtle.digest("SHA-256", spki);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // group into blocks of 4 for readability
  return (hex.match(/.{1,4}/g) || []).join(" ").toUpperCase();
}

// ---------------------------------------------------------------------------
// encrypt / decrypt
// ---------------------------------------------------------------------------

// encrypt a file for a recipient
// eeturns a JSON string ".ciphary"
export async function encryptFile(file, recipientPublicKey) {
  const fileBuffer = await file.arrayBuffer();

  // 1: Fresh symmetric key + IV for the file
  const aesKey = await crypto.subtle.generateKey(AES_PARAMS, true, [
    "encrypt",
    "decrypt",
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2: encrypt the file body with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    fileBuffer,
  );

  // 3: wrap the AES key with the recipient's public key
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
  const wrappedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAesKey,
  );

  const bundle = {
    ciphary: FORMAT_VERSION,
    alg: ALGORITHM_LABEL,
    filename: file.name,
    iv: bufferToBase64(iv),
    encryptedKey: bufferToBase64(wrappedKey),
    ciphertext: bufferToBase64(ciphertext),
  };
  return JSON.stringify(bundle, null, 2);
}

// decrypt a ".ciphary" bundle with the recipient's private key
// returns { filename, blob } ready to download
export async function decryptBundle(bundleText, recipientPrivateKey) {
  let bundle;
  try {
    bundle = JSON.parse(bundleText);
  } catch {
    throw new Error("This does not look like a Ciphary file (invalid JSON).");
  }
  if (!bundle.ciphary || !bundle.encryptedKey || !bundle.ciphertext) {
    throw new Error("This does not look like a Ciphary file (missing fields).");
  }
  if (bundle.ciphary !== FORMAT_VERSION) {
    throw new Error(`Unsupported Ciphary format version: ${bundle.ciphary}.`);
  }

  // 1: unwrap the AES key with the private key
  let rawAesKey;
  try {
    rawAesKey = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      recipientPrivateKey,
      base64ToBuffer(bundle.encryptedKey),
    );
  } catch {
    throw new Error(
      "Could not unwrap the key. This file was likely encrypted for a different key.",
    );
  }

  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAesKey,
    AES_PARAMS,
    false,
    ["decrypt"],
  );

  // 2: decrypt the file body. AES-GCM verifies integrity
  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(base64ToBuffer(bundle.iv)) },
      aesKey,
      base64ToBuffer(bundle.ciphertext),
    );
  } catch {
    throw new Error("Decryption failed. The file may be corrupt or tampered with.");
  }

  return {
    filename: bundle.filename || "decrypted.bin",
    blob: new Blob([plaintext]),
  };
}

// compute a fingerprint
export async function fingerprintFromArmored(armoredText) {
  const publicKey = await importPublicKey(armoredText);
  return fingerprintPublicKey(publicKey);
}
