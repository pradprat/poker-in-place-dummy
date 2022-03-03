export const copyStringToClipboard = (text: string, mimeType = "text/plain"): void => {
  function handler(event: ClipboardEvent) {
    event.clipboardData.setData(mimeType, text);
    if (mimeType === "text/html") {
      event.clipboardData.setData(
        "text/plain",
        text.replace(/<br \/>/g, "\n").replace(/<[^>]*>/g, "")
      );
    }
    event.preventDefault();
    document.removeEventListener("copy", handler, true);
  }

  document.addEventListener("copy", handler, true);
  document.execCommand("copy");
}