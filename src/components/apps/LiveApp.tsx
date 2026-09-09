"use client";

import { useEffect, useRef, useState } from "react";
import { useOS } from "@/lib/store";
import { Icon } from "../os/Icon";

/**
 * Runs one of the real deployed projects inside an OS window.
 *
 * This only works for apps we control the headers on. A site that sends
 * `X-Frame-Options: DENY` or a restrictive `frame-ancestors` cannot be
 * embedded, and there is no way to override that from here — the decision
 * belongs to the site being embedded, which is the entire point of the
 * header. So every live window keeps a visible route out to a real tab.
 *
 * We also can't reliably *detect* a refusal: Chrome fires `load` even when
 * it has blocked the frame and painted its own error page, and the frame's
 * document is cross-origin so we can't inspect it. Rather than pretend,
 * after a few seconds we surface an unobtrusive "not loading?" escape.
 */
export function LiveApp({ url, title }: { url: string; title: string }) {
  const notify = useOS((s) => s.notify);
  const frame = useRef<HTMLIFrameElement>(null);

  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, [nonce, url]);

  // relative URLs are legitimate (a project deployed under this domain),
  // and `new URL` throws on them — resolve against the current origin.
  const host = (() => {
    try { return new URL(url, window.location.origin).host; } catch { return url; }
  })();

  const openReal = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    notify({ title: "Opened in a new tab", body: host });
  };

  return (
    <div className="flex h-full flex-col bg-[var(--os-surface-2)]">
      {/* address bar — read-only. it reports where you are, it isn't a browser. */}
      <div className="flex shrink-0 items-center gap-1.5 border-b border-[var(--os-line)] px-2 py-1.5">
        <button
          onClick={() => setNonce((n) => n + 1)}
          aria-label="Reload"
          title="Reload"
          className="pressable grid h-7 w-7 place-items-center rounded-[var(--os-r-chip)] text-[var(--os-fg-muted)] transition-colors hover:bg-[var(--os-surface-3)] hover:text-[var(--os-fg)]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M20 12a8 8 0 1 1-2.5-5.8" />
            <path d="M20 4v5h-5" />
          </svg>
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-ground)] px-2.5 py-1">
          <span className={loaded ? "text-[var(--os-ok)]" : "text-[var(--os-fg-faint)]"}>
            <Icon name="lock" size={11} />
          </span>
          <span className="truncate font-mono text-[0.68rem] text-[var(--os-fg-muted)]">{host}</span>
          {!loaded && (
            <span className="ml-auto shrink-0 font-mono text-[0.6rem] text-[var(--os-fg-faint)]">
              loading…
            </span>
          )}
        </div>

        <button
          onClick={openReal}
          aria-label="Open in a new tab"
          title="Open in a new tab"
          className="pressable grid h-7 w-7 place-items-center rounded-[var(--os-r-chip)] text-[var(--os-fg-muted)] transition-colors hover:bg-[var(--os-surface-3)] hover:text-[var(--os-fg)]"
        >
          <Icon name="external" size={13} />
        </button>
      </div>

      {/* the app itself */}
      <div className="relative min-h-0 flex-1 bg-white">
        <iframe
          key={nonce}
          ref={frame}
          src={url}
          title={title}
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0"
          // the app is ours, but scope it anyway — least privilege costs nothing here
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals"
          allow="clipboard-write; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />

        {!loaded && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[var(--os-surface-1)]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--os-line-strong)] border-t-[var(--os-accent)]" />
              <p className="font-mono text-[0.68rem] text-[var(--os-fg-faint)]">
                starting {title.toLowerCase()}…
              </p>
            </div>
          </div>
        )}
      </div>

      {/* honest escape hatch, only once it's plausibly stuck */}
      {slow && !loaded && (
        <div className="shrink-0 border-t border-[var(--os-line)] bg-[var(--os-surface-1)] px-3 py-2">
          <p className="text-[0.7rem] leading-relaxed text-[var(--os-fg-muted)]">
            Taking a while. Some apps refuse to be embedded, and sign-in can be
            blocked inside a frame.{" "}
            <button onClick={openReal} className="text-[var(--os-accent)] underline underline-offset-2">
              Open it in a real tab
            </button>
            .
          </p>
        </div>
      )}
    </div>
  );
}
