# Ciphary

Encrypt a file in your browser so that **only the intended recipient can open it**.

Ciphary is a static, open-source web app (built for GitHub Pages). All cryptography
runs client-side using the browser's **Web Crypto API** so there are no servers and no uploads.
Nothing you load ever leaves your device.

## How it works

Ciphary uses **hybrid encryption**:

1. The recipient generates an **RSA-4096 key pair** and shares their **public key**.
2. The sender encrypts the file with a fresh random **AES-256-GCM** key.
3. That AES key is wrapped with the recipient's public key (**RSA-OAEP**).
4. The recipient unwraps the AES key with their **private key**, then decrypts the file.

The result is a `.ciphary` file (a small JSON envelope) the sender transfers to the
recipient by email, Drive, USB, etc. Ciphary is the lock and key, not the
delivery van.

## Usage

1. **Keys**: the recipient generates a key pair, keeps the private key secret, and
   shares the public key.
2. **Encrypt**: the sender picks a file, pastes the recipient's public key, and
   downloads the encrypted `.ciphary` file.
3. **Decrypt**: the recipient loads the `.ciphary` file with their private key to
   recover the original.

## A note on trust

Ciphary guarantees strong encryption, but it **cannot verify who a public key belongs
to**. If an attacker swaps in their own key, your file would be encrypted to them.

To protect against this, Ciphary shows a **fingerprint** for every public key. Confirm
it with the other person through a channel you already trust (a phone call, in person)
before sending. This is the one step that turns correct encryption into actually-secure
transfer.

## Tech stack

Built with **Svelte + Vite** (same stack as the [Cryptology Playground](https://jonpism.github.io/cryptology-playground-web/)). The crypto
lives in framework-agnostic modules under `src/lib/`; the UI is Svelte components
under `src/components/`.

```
src/
├── main.js            app entry
├── App.svelte         header, tabs, footer
├── app.css            global tokens & styles
├── components/        Keys · Encrypt · Decrypt · Fingerprint
└── lib/               crypto.js · download.js
```

## Running locally

```bash
npm install
npm run dev        # dev server with hot reload
npm run build      # production build → dist/
npm run preview    # preview the production build
```

## Deploying to GitHub Pages

`npm run build` outputs a static site to `dist/`. `vite.config.js` uses
`base: "./"` (relative asset paths), so the build works under any project subpath
without hard-coding the repo name. Publish `dist/` either with a GitHub Action
or by pushing it to a `gh-pages` branch.

## Roadmap

- **v1**: client-side encrypt/decrypt, key generation, fingerprints. 
- **v2**: look up a recipient's key by GitHub username.
- **Later**: Web of Trust; peer-to-peer / serverless transfer layer.

## License

Open source. See `LICENSE`.
