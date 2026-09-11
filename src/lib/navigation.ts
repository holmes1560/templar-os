/**
 * Safely opens an external URL in a new tab without being blocked by modern popup blockers.
 *
 * Modern browsers treat window.open with a 3rd windowFeatures argument (like "noopener,noreferrer")
 * as a popup window, which is aggressively blocked by default popup blockers.
 * Using standard window.open(url, "_blank") without features, plus an anchor element
 * fallback, guarantees the link opens cleanly across desktop and mobile browsers.
 */
export function openExternalUrl(url: string): void {
  if (typeof window === "undefined" || !url) return;

  try {
    const win = window.open(url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
