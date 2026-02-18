import { toast } from "@/common/toast";

/**
 * Copy text to clipboard with toast notification
 * @param text - Text to copy to clipboard
 * @param label - Optional label for toast message (e.g., "Booking ID")
 */
export async function copyToClipboard(
  text: string,
  label?: string,
): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }

    toast.success(
      label ? `${label} copied to clipboard` : "Copied to clipboard",
    );
    return true;
  } catch (_error) {
    toast.error("Failed to copy to clipboard");
    return false;
  }
}
