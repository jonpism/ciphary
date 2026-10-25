// trigger a browser download for a Blob or text string

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadText(filename, text) {
  downloadBlob(filename, new Blob([text], { type: "text/plain" }));
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text);
}
