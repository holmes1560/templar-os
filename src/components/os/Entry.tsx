"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useOS } from "@/lib/store";
import { site, os } from "@/lib/site";
import { Icon } from "./Icon";

/* ─────────────────────────────  clock  ───────────────────────────── */

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/* ─────────────────────────────  boot  ────────────────────────────── */

const BOOT_LINES = [
  "TEMPLAR BIOS v3.0 — POST",
  "cpu ............ ok",
  "memory ......... ok",
  "mounting /home/guest",
  "loading window manager",
  "starting session",
];

function Boot({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [line, setLine] = useState(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };

  useEffect(() => {
    if (reduce) {
      finish();
      return;
    }
    // deliberately brisk — §1 says short enough not to annoy on repeat visits
    const per = 230;
    const t = setInterval(() => {
      setLine((n) => {
        if (n >= BOOT_LINES.length - 1) {
          clearInterval(t);
          setTimeout(finish, 420);
          return n;
        }
        return n + 1;
      });
    }, per);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // any key or click skips
  useEffect(() => {
    const skip = () => finish();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = ((line + 1) / BOOT_LINES.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--os-ground)] px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-baseline gap-3">
          <span className="font-mono text-lg font-semibold tracking-[0.2em] text-[var(--os-fg)]">
            {site.system}
          </span>
          <span className="font-mono text-xs text-[var(--os-fg-faint)]">
            v{site.systemVersion}
          </span>
        </div>

        <div className="min-h-[7.5rem] font-mono text-xs leading-relaxed text-[var(--os-fg-muted)]">
          {BOOT_LINES.slice(0, line + 1).map((l, i) => (
            <div key={l} className="flex gap-2">
              <span className="text-[var(--os-fg-faint)]">
                {String(i).padStart(2, "0")}
              </span>
              <span>{l}</span>
              {i === line && (
                <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-[var(--os-accent)]" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 h-px w-full overflow-hidden bg-[var(--os-line)]">
          <div
            className="h-full bg-[var(--os-accent)] transition-[width] duration-200 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-4 font-mono text-[0.65rem] tracking-[0.12em] text-[var(--os-fg-faint)]">
          PRESS ANY KEY TO SKIP
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────  lock screen  ────────────────────────── */

function Lock({ onUnlock }: { onUnlock: () => void }) {
  const now = useClock();
  // Boot listens on window to let any click skip it. Without a short guard
  // that same gesture also lands here, and one click blows through two
  // screens before the visitor has seen either.
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 220);
    return () => clearTimeout(t);
  }, []);

  const unlock = useCallback(() => { if (armed) onUnlock(); }, [armed, onUnlock]);

  useEffect(() => {
    const go = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); unlock(); }
    };
    window.addEventListener("keydown", go);
    return () => window.removeEventListener("keydown", go);
  }, [unlock]);

  return (
    <motion.button
      type="button"
      onClick={unlock}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(6px)" }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[90] flex w-full cursor-pointer flex-col items-center justify-center bg-[var(--os-ground)] text-left"
      aria-label="Unlock TEMPLAR OS"
    >
      {/* subtle animated ground — a slow drifting grid, not a particle field */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.35]">
        <div className="drift os-grid absolute inset-[-50%]" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,var(--os-ground)_78%)]" />

      <div className="relative z-10 flex flex-col items-center">
        <div
          className="tnum font-mono text-[clamp(3.5rem,12vw,7rem)] font-light leading-none tracking-tight text-[var(--os-fg)]"
          suppressHydrationWarning
        >
          {now
            ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : "--:--"}
        </div>
        <div className="mt-3 text-sm text-[var(--os-fg-muted)]" suppressHydrationWarning>
          {now
            ? now.toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long",
              })
            : ""}
        </div>

        <div className="mt-14 flex flex-col items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] text-lg font-semibold text-[var(--os-fg)]">
            {site.shortName.charAt(0)}
          </div>
          <div className="text-sm font-medium text-[var(--os-fg)]">{site.name}</div>
          <div className="label">{site.system}</div>
        </div>

        <div className="mt-12 flex items-center gap-2 text-[var(--os-fg-faint)]">
          <Icon name="lock" size={13} />
          <span className="label">click anywhere to unlock</span>
        </div>
      </div>

    </motion.button>
  );
}

/* ────────────────────────────  login  ────────────────────────────── */

/** Auto-login. The visitor never types — the system signs itself in while
 *  they watch. Whole sequence is budgeted under a second, because this is
 *  the one screen standing between someone and the actual portfolio. */
const SECRET = "templar";
const TYPE_MS = 42;   // 7 chars ≈ 295ms
const HOLD_MS = 70;   // beat before it commits
const SUBMIT_MS = 175; // "Welcome back" → desktop

function Login({ onIn }: { onIn: () => void }) {
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    const go = () => {
      if (fired.current) return;
      fired.current = true;
      setBusy(true);
      setTimeout(onIn, SUBMIT_MS);
    };

    if (reduce) {
      setTyped(SECRET);
      const t = setTimeout(go, 140);
      return () => clearTimeout(t);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    SECRET.split("").forEach((_, i) => {
      timers.push(setTimeout(() => setTyped(SECRET.slice(0, i + 1)), i * TYPE_MS));
    });
    timers.push(setTimeout(go, SECRET.length * TYPE_MS + HOLD_MS));
    return () => timers.forEach(clearTimeout);
  }, [reduce, onIn]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: "blur(8px)", scale: 1.01 }}
      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[90] grid place-items-center bg-[var(--os-ground)] px-6"
    >
      <div className="w-full max-w-[19rem]">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full border border-[var(--os-line-strong)] bg-[var(--os-surface-2)] text-lg font-semibold">
            {site.shortName.charAt(0)}
          </div>
          <div className="text-sm font-medium">{site.name}</div>
        </div>

        <label className="label mb-1.5 block" htmlFor="os-user">username</label>
        <input
          id="os-user"
          value={os.user}
          readOnly
          className="mb-4 w-full rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 font-mono text-sm text-[var(--os-fg-muted)]"
        />

        <div className="label mb-1.5">password</div>
        {/* Presentational, not an input — nothing is typed, submitted or
            stored, so a real password field would be a lie about what
            this screen does. Announced once, politely, for screen readers. */}
        <div
          className={`flex h-[38px] w-full items-center gap-px rounded-[var(--os-r-chip)] border bg-[var(--os-surface-2)] px-3 transition-colors duration-150 ${
            busy ? "border-[var(--os-accent)]" : "border-[var(--os-line)]"
          }`}
        >
          {typed.split("").map((_, i) => (
            <span
              key={i}
              className="dot-in h-1.5 w-1.5 rounded-full bg-[var(--os-fg)]"
              style={{ marginRight: 3 }}
            />
          ))}
          {!busy && <span className="caret h-4 w-px bg-[var(--os-accent)]" />}
        </div>

        <div
          aria-live="polite"
          className={`pressable mt-5 w-full rounded-[var(--os-r-chip)] px-3 py-2.5 text-center text-sm font-medium transition-colors duration-150 ${
            busy
              ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)]"
              : "bg-[var(--os-surface-3)] text-[var(--os-fg-muted)]"
          }`}
        >
          {busy ? "Welcome back" : "Authenticating…"}
        </div>

        <p className="mt-4 text-center font-mono text-[0.65rem] leading-relaxed text-[var(--os-fg-faint)]">
          {os.hint}
        </p>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────  orchestrator  ───────────────────────── */

export function Entry() {
  const phase = useOS((s) => s.phase);
  const setPhase = useOS((s) => s.setPhase);
  const hasBooted = useOS((s) => s.hasBooted);
  const finishBoot = useOS((s) => s.finishBoot);
  const notify = useOS((s) => s.notify);
  const [hydrated, setHydrated] = useState(false);

  // §1 — returning visitors skip straight past the theatre
  useEffect(() => {
    setHydrated(true);
    if (hasBooted) setPhase("lock");
  }, [hasBooted, setPhase]);

  if (!hydrated) return null;

  return (
    <AnimatePresence mode="wait">
      {phase === "boot" && (
        <Boot
          key="boot"
          onDone={() => { finishBoot(); setPhase("lock"); }}
        />
      )}
      {phase === "lock" && <Lock key="lock" onUnlock={() => setPhase("login")} />}
      {phase === "login" && (
        <Login
          key="login"
          onIn={() => {
            setPhase("desktop");
            notify({ title: "Welcome to TEMPLAR OS", body: "Open Projects — everything in it is real.", tone: "info" });
          }}
        />
      )}
    </AnimatePresence>
  );
}
