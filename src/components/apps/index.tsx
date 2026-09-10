"use client";

import { useEffect, useState } from "react";
import {
  useProjects,
  useProfile,
  useSkills,
  useSocialLinks,
  useResume,
} from "../os/PortfolioProvider";
import { site } from "@/lib/site";
import { useOS } from "@/lib/store";
import { Icon } from "../os/Icon";
import { ProjectsApp } from "./ProjectsApp";
import { TimelineApp } from "./TimelineApp";
import { TerminalApp } from "./TerminalApp";
import { LiveApp } from "./LiveApp";

/* ─────────────────────────────  host  ────────────────────────────── */

export function AppHost({ appId, props }: { appId: string; props?: Record<string, unknown> }) {
  // Launch behaviour comes from the application row, not from the app id.
  // An admin flipping launchMode to "iframe" is all it takes to make a
  // project run in a window — no frontend change (§6, §7).
  if (props?.launchMode === "iframe" && props?.url) {
    return (
      <LiveApp
        url={String(props.url)}
        title={String(props.name ?? "Application")}
      />
    );
  }

  // §17 — anything tied to a project that has no live deployment still opens
  // to something worth reading: the project itself, with its real links.
  // This also catches an "iframe" app whose hosting was switched off, so a
  // project going offline degrades to its overview rather than a dead window.
  if (props?.projectSlug) {
    return <ProjectsApp initialSlug={String(props.projectSlug)} />;
  }

  switch (appId) {
    case "projects": return <ProjectsApp initialSlug={props?.slug as string | undefined} />;
    case "timeline": return <TimelineApp />;
    case "terminal": return <TerminalApp />;
    case "about":    return <AboutApp />;
    case "skills":   return <SkillsApp />;
    case "settings": return <SettingsApp />;
    case "contact":  return <ContactApp />;
    case "resume":   return <ResumeApp />;
    case "files":    return <FilesApp />;
    case "netmon":   return <NetMonApp />;
    case "notes":    return <NotesApp />;
    default:         return <Empty label={appId} />;
  }
}

function Empty({ label }: { label: string }) {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <p className="text-sm text-[var(--os-fg-faint)]">
        <span className="font-mono">{label}</span> isn’t built yet.
      </p>
    </div>
  );
}

function Pane({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-auto px-6 py-6">{children}</div>;
}

function H({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-4 text-lg font-semibold tracking-tight text-[var(--os-fg)]">{children}</h1>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 max-w-[52ch] text-sm leading-relaxed text-[var(--os-fg-muted)]">{children}</p>;
}

/* ─────────────────────────────  about  ───────────────────────────── */

function AboutApp() {
  const profile = useProfile();

  return (
    <Pane>
      <H>{profile.fullName || site.name}</H>
      <p className="label mb-5">
        {profile.title || site.role} · {profile.location || site.location}
      </p>

      {profile.bio && <P>{profile.bio}</P>}
      {profile.aboutMe && <P>{profile.aboutMe}</P>}

      {profile.whatImDrawnTo && profile.whatImDrawnTo.length > 0 && (
        <>
          <h2 className="label mb-2.5 mt-7">What I&apos;m drawn to</h2>
          <ul className="space-y-2">
            {profile.whatImDrawnTo.map((t) => (
              <li key={t} className="flex gap-2.5 text-sm leading-relaxed text-[var(--os-fg-muted)]">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--os-accent)]" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {profile.howIWorkWithAi && (
        <>
          <h2 className="label mb-2.5 mt-7">How I work with AI</h2>
          <P>{profile.howIWorkWithAi}</P>
        </>
      )}
    </Pane>
  );
}

/* ─────────────────────────────  skills  ──────────────────────────── */

function SkillsApp() {
  const categories = useSkills();
  const projects = useProjects();

  return (
    <Pane>
      <H>Skills</H>
      <P>
        Only what the projects actually demonstrate. Each technology below appears
        in something on this machine — nothing here is aspirational.
      </P>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="label mb-2">{cat.name}</h2>
            <div className="flex flex-wrap gap-1.5">
              {cat.skills.map((s) => {
                const uses =
                  s.projectCount ??
                  projects.filter((p) =>
                    p.technologies.some((t) =>
                      t.toLowerCase().includes(s.name.toLowerCase().split(" ")[0])
                    )
                  ).length;
                return (
                  <span
                    key={s.id}
                    title={uses ? `${uses} project${uses === 1 ? "" : "s"}` : undefined}
                    className="flex items-center gap-1.5 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2 py-0.5 font-mono text-[0.68rem] text-[var(--os-fg-muted)]"
                  >
                    {s.name}
                    {uses > 0 && (
                      <span className="tnum text-[0.6rem] text-[var(--os-accent)]">{uses}</span>
                    )}
                  </span>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-7 font-mono text-[0.65rem] leading-relaxed text-[var(--os-fg-faint)]">
        The number beside a technology is how many projects use it.
      </p>
    </Pane>
  );
}

/* ────────────────────────────  settings  ─────────────────────────── */

const ACCENTS = ["#6280ff", "#4fb8a5", "#d4813f", "#c2607f", "#8a7ad4"];

function SettingsApp() {
  const settings = useOS((s) => s.settings);
  const update = useOS((s) => s.update);

  return (
    <Pane>
      <H>Settings</H>

      <Setting label="Theme" hint="The OS defaults to dark. Light is fully designed, not inverted.">
        <div className="flex gap-1.5">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              onClick={() => update({ theme: t })}
              className={`pressable rounded-[var(--os-r-chip)] border px-3 py-1.5 text-xs capitalize transition-colors ${
                settings.theme === t
                  ? "border-[var(--os-accent)] bg-[var(--os-accent-wash)] text-[var(--os-fg)]"
                  : "border-[var(--os-line)] text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-3)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Setting>

      <Setting label="Accent" hint="Used sparingly — active window, focus ring, one live indicator.">
        <div className="flex gap-2">
          {ACCENTS.map((c) => (
            <button
              key={c}
              onClick={() => update({ accent: c })}
              aria-label={`Accent ${c}`}
              style={{ background: c }}
              className={`pressable h-6 w-6 rounded-full transition-transform ${
                settings.accent === c ? "ring-2 ring-[var(--os-fg)] ring-offset-2 ring-offset-[var(--os-surface-1)]" : ""
              }`}
            />
          ))}
        </div>
      </Setting>

      <Setting label="Animations" hint="Off also respects your system's reduced-motion setting automatically.">
        <Toggle on={settings.animations} onChange={(v) => update({ animations: v })} label="Animations" />
      </Setting>

      <Setting label="Sound" hint="Off by default. Nothing in the interface depends on audio.">
        <Toggle on={settings.sound} onChange={(v) => update({ sound: v })} label="Sound effects" />
      </Setting>

      <div className="mt-8 border-t border-[var(--os-line)] pt-4">
        <p className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
          Preferences persist in localStorage. Nothing is sent anywhere.
        </p>
      </div>
    </Pane>
  );
}

function Setting({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 border-b border-[var(--os-line)] pb-5 last:border-0">
      <div className="mb-1 text-sm font-medium text-[var(--os-fg)]">{label}</div>
      <p className="mb-3 max-w-[46ch] text-xs leading-relaxed text-[var(--os-fg-faint)]">{hint}</p>
      {children}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full border transition-colors duration-150 ${
        on ? "border-[var(--os-accent)] bg-[var(--os-accent)]" : "border-[var(--os-line-strong)] bg-[var(--os-surface-3)]"
      }`}
    >
      <span
        className="absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-transform duration-150 ease-[var(--os-ease-out)]"
        style={{ height: 18, width: 18, transform: `translateX(${on ? 22 : 3}px)` }}
      />
    </button>
  );
}

/* ────────────────────────────  contact  ──────────────────────────── */

function ContactApp() {
  const profile = useProfile();
  const socialLinks = useSocialLinks();

  return (
    <Pane>
      <H>Contact</H>
      <P>The fastest way to reach me is GitHub. Everything else is below.</P>
      <div className="mt-5 space-y-2">
        {profile.githubUrl && (
          <ContactRow
            icon="github"
            label="GitHub"
            value={profile.shortName || "holmes1560"}
            href={profile.githubUrl}
          />
        )}
        {profile.email && (
          <ContactRow
            icon="mail"
            label="Email"
            value={profile.email}
            href={`mailto:${profile.email}`}
          />
        )}
        {profile.linkedinUrl && (
          <ContactRow
            icon="globe"
            label="LinkedIn"
            value="Profile"
            href={profile.linkedinUrl}
          />
        )}
        {socialLinks.map((s) => (
          <ContactRow
            key={s.id}
            icon={s.icon || "globe"}
            label={s.label}
            value={s.username || s.platform}
            href={s.url}
          />
        ))}
      </div>
      {!profile.email && (
        <p className="mt-6 font-mono text-[0.65rem] leading-relaxed text-[var(--os-fg-faint)]">
          Email not published yet — add it in the Admin Panel or profile settings.
        </p>
      )}
    </Pane>
  );
}

function ContactRow({ icon, label, value, href }: { icon: string; label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2.5 transition-colors hover:bg-[var(--os-surface-3)]"
    >
      <span className="text-[var(--os-fg-muted)]"><Icon name={icon} size={16} /></span>
      <span className="flex-1">
        <span className="label block">{label}</span>
        <span className="text-sm text-[var(--os-fg)]">{value}</span>
      </span>
      <span className="text-[var(--os-fg-faint)]"><Icon name="external" size={13} /></span>
    </a>
  );
}

/* ────────────────────────────  résumé  ───────────────────────────── */

function ResumeApp() {
  const resume = useResume();
  const resumeUrl = resume?.downloadUrl || site.resumePath;

  return (
    <Pane>
      <H>Résumé</H>
      {resumeUrl ? (
        <>
          <P>
            {resume ? `Version: ${resume.version} (${resume.fileName})` : "The current version, as a PDF."}
          </P>
          <a
            href={resumeUrl}
            download
            className="pressable inline-flex items-center gap-2 rounded-[var(--os-r-chip)] bg-[var(--os-accent)] px-3 py-2 text-sm font-medium text-[var(--os-accent-fg)]"
          >
            <Icon name="doc" size={15} /> Download CV
          </a>
        </>
      ) : (
        <p className="font-mono text-xs leading-relaxed text-[var(--os-fg-faint)]">
          No CV attached yet. Upload a CV via the Admin Panel or drop a PDF into{" "}
          <span className="text-[var(--os-fg-muted)]">/public</span>.
        </p>
      )}
    </Pane>
  );
}

/* ─────────────────────────────  files  ───────────────────────────── */

function FilesApp() {
  const openApp = useOS((s) => s.openApp);
  const projects = useProjects();
  const [path, setPath] = useState<string[]>([]);

  const tree: Record<string, string[]> = {
    "": ["Desktop", "Documents", "Projects", "Resume", "About"],
    Projects: projects.map((p) => p.slug),
  };
  const here = tree[path.join("/")] ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-[var(--os-line)] bg-[var(--os-surface-2)] px-3 py-2 font-mono text-xs">
        <button onClick={() => setPath([])} className="text-[var(--os-fg-muted)] hover:text-[var(--os-fg)]">
          /home/guest
        </button>
        {path.map((seg, i) => (
          <span key={i} className="flex items-center gap-1 text-[var(--os-fg-muted)]">
            <span className="text-[var(--os-fg-faint)]">/</span>
            <button onClick={() => setPath(path.slice(0, i + 1))} className="hover:text-[var(--os-fg)]">{seg}</button>
          </span>
        ))}
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-[var(--os-line)] overflow-auto">
        {here.map((name) => {
          const isProject = path[0] === "Projects";
          return (
            <li key={name}>
              <button
                onClick={() => {
                  if (isProject) {
                    openApp("projects", { title: "Projects", w: 940, h: 620, props: { slug: name } });
                  } else if (tree[name]) {
                    setPath([name]);
                  }
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-[var(--os-fg-muted)] transition-colors hover:bg-[var(--os-surface-2)] hover:text-[var(--os-fg)]"
              >
                <Icon name={isProject ? "doc" : "folder"} size={15} strokeWidth={1.4} />
                {name}
              </button>
            </li>
          );
        })}
        {here.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-[var(--os-fg-faint)]">Empty.</li>
        )}
      </ul>
    </div>
  );
}

/* ──────────────────────────  net monitor  ────────────────────────── */

/** Real measurements only — the same percentile treatment used on the
 *  packet captures in the latency investigation. Nothing simulated. */
function NetMonApp() {
  const [rtt, setRtt] = useState<number[]>([]);
  const [frames, setFrames] = useState<{ p50: number; p95: number; p99: number } | null>(null);
  const [ttfb, setTtfb] = useState<number | null>(null);

  useEffect(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav) setTtfb(nav.responseStart - nav.requestStart);

    let cancelled = false;
    (async () => {
      const got: number[] = [];
      for (let i = 0; i < 8 && !cancelled; i++) {
        const t0 = performance.now();
        try {
          await fetch(location.href, { method: "HEAD", cache: "no-store" });
          got.push(performance.now() - t0);
          if (!cancelled) setRtt([...got]);
        } catch { break; }
        await new Promise((r) => setTimeout(r, 140));
      }
    })();

    const f: number[] = [];
    let last = performance.now();
    let n = 0;
    const tick = (now: number) => {
      f.push(now - last); last = now;
      if (++n < 90) { requestAnimationFrame(tick); return; }
      f.sort((a, b) => a - b);
      const p = (q: number) => f[Math.min(f.length - 1, Math.floor(f.length * q))];
      if (!cancelled) setFrames({ p50: p(0.5), p95: p(0.95), p99: p(0.99) });
    };
    requestAnimationFrame(tick);

    return () => { cancelled = true; };
  }, []);

  const min = rtt.length ? Math.min(...rtt) : null;
  const med = rtt.length ? [...rtt].sort((a, b) => a - b)[Math.floor(rtt.length / 2)] : null;
  const fmt = (v: number | null) => (v == null ? "—" : `${v < 10 ? v.toFixed(1) : Math.round(v)} ms`);

  return (
    <Pane>
      <H>Net Monitor</H>
      <P>
        Live measurements of your own connection to this server, taken the same way
        I measured my ISP: several samples, and trust the minimum, because it&apos;s the
        one least polluted by queueing.
      </P>

      <div className="mt-5 divide-y divide-[var(--os-line)] rounded-[var(--os-r-panel)] border border-[var(--os-line)] font-mono text-xs">
        <Metric k="time to first byte" v={fmt(ttfb)} />
        <Metric k={`server rtt · min of ${rtt.length || 0}`} v={fmt(min)} accent />
        <Metric k="server rtt · median" v={fmt(med)} />
        <Metric k="frame time p50" v={fmt(frames?.p50 ?? null)} />
        <Metric k="frame time p95" v={fmt(frames?.p95 ?? null)} />
        <Metric k="frame time p99" v={fmt(frames?.p99 ?? null)} />
      </div>

      <p className="mt-4 font-mono text-[0.65rem] leading-relaxed text-[var(--os-fg-faint)]">
        Nothing here is simulated. If these numbers look bad, they are genuinely bad.
      </p>
    </Pane>
  );
}

function Metric({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-[var(--os-fg-faint)]">{k}</span>
      <span className={`tnum ${accent ? "text-[var(--os-accent)]" : "text-[var(--os-fg-muted)]"}`}>{v}</span>
    </div>
  );
}

/* ─────────────────────────────  notes  ───────────────────────────── */

function NotesApp() {
  return (
    <Pane>
      <H>Notes</H>
      <P>Things I wrote down after they stopped being obvious.</P>
      <div className="mt-5 space-y-4">
        {[
          ["Exit codes lie", "LibreOffice returns 0 after failing to load a document. Define success by observable output, not by what a process claims about itself."],
          ["Design the failure mode first", "“No power means locked” decided most of the door lock. Deciding how a system fails is more load-bearing than deciding how it succeeds."],
          ["Write the retraction", "When a measurement turns out wrong, correct it in the same document, with the reason. Notes you can't trust are worse than no notes."],
          ["Two ways to do one thing", "…is how they drift apart. I deleted a whole feature once I realised it was a second door onto the same code path."],
        ].map(([t, b]) => (
          <article key={t} className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-2)] p-4">
            <h2 className="mb-1.5 text-sm font-medium text-[var(--os-fg)]">{t}</h2>
            <p className="text-xs leading-relaxed text-[var(--os-fg-muted)]">{b}</p>
          </article>
        ))}
      </div>
    </Pane>
  );
}
