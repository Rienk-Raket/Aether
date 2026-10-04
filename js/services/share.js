// Sharing and downloading from the browser: the device's share sheet, copying, and saving a file.

// Opens the device's share sheet when there is one; otherwise copies the text.
// Returns 'shared', 'copied' or 'failed'. Closing the share sheet is not a failure.
export async function shareText(title, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'shared';
    }
  }
  return copyText(text);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

// Saves text as a file ("Downloads" folder, or the calendar app on phones).
export function downloadTextFile(filename, content, mimeType) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
