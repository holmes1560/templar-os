"use client";

import { useState } from "react";
import { useProjects } from "../os/PortfolioProvider";
import { CATEGORY_LABEL, type CategoryKey as Category, type PublicProject as Project } from "@/lib/portfolio-types";
import { useOS } from "@/lib/store";
import { openExternalUrl } from "@/lib/navigation";
import { Icon } from "../os/Icon";

const CATS = Object.keys(CATEGORY_LABEL) as Category[];

export function ProjectsApp({ initialSlug }: { initialSlug?: string }) {
  const projects = useProjects();
  const [cat, setCat] = useState<Category | "all">("all");
  const [open, setOpen] = useState<string | null>(initialSlug ?? null);

  const list = cat === "all" ? projects : projects.filter((p) => p.category === cat);
  const active = projects.find((p) => p.slug === open);

  return (
    <div className="flex h-full min-h-0">
      {/* ── tree ── */}
      <nav className="hidden w-52 shrink-0 flex-col border-r border-[var(--os-line)] bg-[var(--os-surface-2)] p-2 sm:flex">
        <div className="label px-2 py-1.5">/home/guest/Projects</div>
        <Row
          label="All"
          count={projects.length}
          on={cat === "all"}
          onClick={() => { setCat("all"); setOpen(null); }}
        />
        {CATS.map((c) => {
          const n = projects.filter((p) => p.category === c).length;
          if (!n) return null;
          return (
            <Row
              key={c}
              label={CATEGORY_LABEL[c]}
              count={n}
              on={cat === c}
              onClick={() => { setCat(c); setOpen(null); }}
            />
          );
        })}
      </nav>

      {/* ── list / detail ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {active ? (
          <Detail project={active} onBack={() => setOpen(null)} />
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-[var(--os-line)] overflow-auto">
            {list.map((p) => (
              <li key={p.slug}>
                <button
                  onClick={() => setOpen(p.slug)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--os-surface-2)]"
                >
                  <span className="mt-0.5 text-[var(--os-fg-faint)]">
                    <Icon name="folder" size={17} strokeWidth={1.4} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-medium text-[var(--os-fg)]">{p.title}</span>
                      {p.featured && (
                        <span className="rounded-[var(--os-r-chip)] bg-[var(--os-accent-wash)] px-1.5 py-px font-mono text-[0.6rem] text-[var(--os-accent)]">
                          featured
                        </span>
                      )}
                      <span className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">{p.period}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--os-fg-muted)]">
                      {p.summary}
                    </span>
                  </span>
                  <span className="mt-1 shrink-0 text-[var(--os-fg-faint)]">
                    <Icon name="chevron" size={13} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="flex shrink-0 items-center justify-between border-t border-[var(--os-line)] bg-[var(--os-surface-2)] px-4 py-1.5">
          <span className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
            {active ? active.slug : `${list.length} item${list.length === 1 ? "" : "s"}`}
          </span>
          <span className="font-mono text-[0.65rem] text-[var(--os-fg-faint)]">
            {active ? CATEGORY_LABEL[active.category] : cat === "all" ? "all categories" : CATEGORY_LABEL[cat]}
          </span>
        </footer>
      </div>
    </div>
  );
}

function Row({ label, count, on, onClick }: { label: string; count: number; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between rounded-[var(--os-r-chip)] px-2 py-1.5 text-left text-xs transition-colors ${
        on ? "bg-[var(--os-surface-4)] text-[var(--os-fg)]" : "text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-3)]"
      }`}
    >
      <span className="truncate">{label}</span>
      <span className="tnum ml-2 font-mono text-[0.65rem] text-[var(--os-fg-faint)]">{count}</span>
    </button>
  );
}

/* ───────────────────────────  detail  ──────────────────────────── */

function Detail({ project: p, onBack }: { project: Project; onBack: () => void }) {
  const notify = useOS((s) => s.notify);
  const openApp = useOS((s) => s.openApp);

  const openExternal = (url: string, what: string) => {
    openExternalUrl(url);
    notify({ title: "Opened externally", body: what });
  };

  /** run the real deployment as a window in the OS */
  const runHere = () => {
    openApp(`live:${p.slug}`, {
      title: p.title,
      w: 1024,
      h: 680,
      props: { url: p.demoUrl, name: p.title },
    });
    notify({ title: `Launching ${p.title}`, body: "Running the real deployment." });
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="border-b border-[var(--os-line)] bg-[var(--os-surface-2)] px-4 py-2">
        <button
          onClick={onBack}
          className="pressable flex items-center gap-1.5 text-xs text-[var(--os-fg-muted)] transition-colors hover:text-[var(--os-fg)]"
        >
          <span className="rotate-180"><Icon name="chevron" size={12} /></span>
          Back
        </button>
      </div>

      <article className="px-5 py-5">
        <header>
          <h1 className="text-xl font-semibold tracking-tight text-[var(--os-fg)]">{p.title}</h1>
          <p className="mt-1 font-mono text-[0.7rem] text-[var(--os-fg-faint)]">
            {p.period}
            {p.team ? ` · ${p.team}` : ""}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--os-fg-muted)]">{p.description}</p>
        </header>

        {/* honest flags, before anything else */}
        {(p.caveat || p.clientWork) && (
          <div className="mt-4 space-y-2">
            {p.clientWork && (
              <Flag tone="warn">
                Built for someone else. Shared with their permission.
              </Flag>
            )}
            {p.caveat && <Flag tone="warn">{p.caveat}</Flag>}
          </div>
        )}

        {/* links — only ones that actually resolve */}
        <div className="mt-5 flex flex-wrap gap-2">
          {p.visibility === "public" && p.githubUrl && (
            <LinkBtn
              href={p.githubUrl}
              onClick={() => notify({ title: "Opened externally", body: `${p.title} repository` })}
              icon="github"
            >
              Repository
            </LinkBtn>
          )}
          {/* if the deployment allows framing, it runs here as a window;
              otherwise the only honest option is a real tab */}
          {p.demoUrl && p.embeddable && (
            <LinkBtn onClick={runHere} icon="grid" accent>
              Run in TEMPLAR OS
            </LinkBtn>
          )}
          {p.demoUrl && (
            <LinkBtn
              href={p.demoUrl}
              onClick={() => notify({ title: "Opened externally", body: `${p.title} live demo` })}
              icon="external"
              accent={!p.embeddable}
            >
              {p.embeddable ? "Open in a tab" : "Live demo"}
            </LinkBtn>
          )}
          {p.visibility === "private" && (
            <span className="flex items-center gap-1.5 rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1.5 font-mono text-[0.68rem] text-[var(--os-fg-faint)]">
              <Icon name="lock" size={12} /> private repository
            </span>
          )}
          {p.visibility === "local" && (
            <span className="flex items-center gap-1.5 rounded-[var(--os-r-chip)] border border-[var(--os-line)] px-2.5 py-1.5 font-mono text-[0.68rem] text-[var(--os-fg-faint)]">
              not published
            </span>
          )}
        </div>

        <Section title="Technologies">
          <div className="flex flex-wrap gap-1.5">
            {p.technologies.map((t) => (
              <span
                key={t}
                className="rounded-[var(--os-r-chip)] border border-[var(--os-line)] bg-[var(--os-surface-2)] px-2 py-0.5 font-mono text-[0.68rem] text-[var(--os-fg-muted)]"
              >
                {t}
              </span>
            ))}
          </div>
        </Section>

        <Section title="What it does"><Bullets items={p.features} /></Section>
        <Section title="What fought back"><Bullets items={p.challenges} /></Section>
        <Section title="What I learned"><Bullets items={p.learned} /></Section>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="label mb-2.5">{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-[var(--os-fg-muted)]">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--os-fg-faint)]" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Flag({ tone, children }: { tone: "warn"; children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-[var(--os-r-chip)] border border-[var(--os-warn)]/30 bg-[var(--os-warn)]/[0.07] px-3 py-2 text-xs leading-relaxed text-[var(--os-fg-muted)]">
      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--os-warn)]" />
      <span>{children}</span>
    </p>
  );
}

function LinkBtn({
  href, onClick, icon, children, accent,
}: {
  href?: string; onClick?: () => void; icon: string; children: React.ReactNode; accent?: boolean;
}) {
  const className = `pressable inline-flex items-center gap-1.5 rounded-[var(--os-r-chip)] px-2.5 py-1.5 text-xs font-medium transition-colors ${
    accent
      ? "bg-[var(--os-accent)] text-[var(--os-accent-fg)]"
      : "border border-[var(--os-line-strong)] text-[var(--os-fg)] hover:bg-[var(--os-surface-3)]"
  }`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={className}
      >
        <Icon name={icon} size={13} />
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={className}
    >
      <Icon name={icon} size={13} />
      {children}
    </button>
  );
}
