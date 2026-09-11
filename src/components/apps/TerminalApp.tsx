"use client";

import { useEffect, useRef, useState } from "react";
import { useProjects, useProfile, useTimeline } from "../os/PortfolioProvider";
import { site, os } from "@/lib/site";
import { useOS } from "@/lib/store";
import { openExternalUrl } from "@/lib/navigation";

type Line = { kind: "in" | "out" | "err"; text: string };

const PROMPT = `${os.user}@${os.host}:~$`;

const HELP = `Available commands

  help        this list
  about       who I am
  projects    list every project
  open <slug> open a project in the Projects app
  timeline    view career timeline milestones
  skills      technologies I actually use
  github      open my GitHub profile
  whoami      short version
  neofetch    system information
  date        current date and time
  clear       clear the screen

Tab completes. ↑ / ↓ walk history.`;

export function TerminalApp() {
  const projects = useProjects();
  const profile = useProfile();
  const timeline = useTimeline();
  const openApp = useOS((s) => s.openApp);
  const notify = useOS((s) => s.notify);

  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: `${site.system} ${site.systemVersion} — portfolio shell` },
    { kind: "out", text: `Type "help" for commands.` },
  ]);
  const [val, setVal] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hp, setHp] = useState(-1);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [lines]);

  const push = (...l: Line[]) => setLines((p) => [...p, ...l]);

  function run(raw: string) {
    const cmd = raw.trim();
    push({ kind: "in", text: `${PROMPT} ${cmd}` });
    if (!cmd) return;

    setHist((h) => [cmd, ...h].slice(0, 50));
    setHp(-1);

    const [name, ...args] = cmd.split(/\s+/);

    switch (name.toLowerCase()) {
      case "help":
        push({ kind: "out", text: HELP });
        break;

      case "about":
        push({
          kind: "out",
          text: `${profile.fullName || site.name}\n${profile.title || site.role}\n\n${profile.bio || site.tagline}\n\nBased in ${profile.location || site.location}.`,
        });
        break;

      case "projects":
        push({
          kind: "out",
          text: projects
            .map((p) => `  ${p.slug.padEnd(22)} ${p.period.padEnd(18)} ${p.summary}`)
            .join("\n"),
        });
        push({ kind: "out", text: `\n${projects.length} projects. Try: open <slug>` });
        break;

      case "open": {
        const slug = args[0];
        const hit = projects.find((p) => p.slug === slug);
        if (!hit) {
          push({ kind: "err", text: `open: no project "${slug ?? ""}". Run "projects" for the list.` });
          break;
        }
        openApp("projects", { title: "Projects", w: 940, h: 620, props: { slug } });
        push({ kind: "out", text: `Opening ${hit.title}…` });
        break;
      }

      case "timeline": {
        if (args[0] === "open") {
          openApp("timeline", { title: "Career Timeline", w: 900, h: 580 });
          push({ kind: "out", text: "Opening Career Timeline window…" });
          break;
        }
        push({
          kind: "out",
          text: timeline
            .map(
              (t) =>
                `  [${t.startDate.padEnd(8)}] ${(t.title + (t.organization ? ` (${t.organization})` : "")).padEnd(42)} ${t.shortDescription}`
            )
            .join("\n"),
        });
        push({ kind: "out", text: `\n${timeline.length} milestones. Try: timeline open` });
        break;
      }

      case "skills": {
        const all = [...new Set(projects.flatMap((p) => p.technologies))].sort();
        push({ kind: "out", text: all.join(" · ") });
        break;
      }

      case "github":
        openExternalUrl(site.github);
        notify({ title: "Opened externally", body: "GitHub profile" });
        push({ kind: "out", text: `Opening ${site.github}` });
        break;

      case "whoami":
        push({ kind: "out", text: os.user });
        break;

      case "date":
        push({ kind: "out", text: new Date().toString() });
        break;

      case "neofetch": {
        const pub = projects.filter((p) => p.visibility === "public").length;
        const techs = new Set(projects.flatMap((p) => p.technologies)).size;
        push({
          kind: "out",
          text: [
            `    ▄▄▄▄▄▄▄     ${os.user}@${os.host}`,
            `   █       █    ${"─".repeat(24)}`,
            `   █  ███  █    os        ${site.system} ${site.systemVersion}`,
            `   █  ███  █    host      ${site.role}`,
            `   █       █    projects  ${projects.length} (${pub} public)`,
            `   █▄▄▄▄▄▄▄█    stack     ${techs} technologies`,
            `                shell     portfolio-sh`,
            `                location  ${site.location}`,
          ].join("\n"),
        });
        break;
      }

      case "sudo":
        push({ kind: "err", text: `${os.user} is not in the sudoers file. This incident has been reported.` });
        break;

      case "clear":
        setLines([]);
        break;

      default:
        push({ kind: "err", text: `${name}: command not found. Try "help".` });
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(val);
      setVal("");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const n = Math.min(hist.length - 1, hp + 1);
      if (n >= 0) { setHp(n); setVal(hist[n]); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const n = hp - 1;
      setHp(n);
      setVal(n >= 0 ? hist[n] : "");
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const cmds = ["help", "about", "projects", "open", "timeline", "skills", "github", "whoami", "neofetch", "date", "clear"];
      const hit = cmds.find((c) => c.startsWith(val.trim()));
      if (hit) setVal(hit + " ");
    }
  }

  return (
    <div
      className="h-full bg-[var(--os-ground)] p-3 font-mono text-[0.72rem] leading-relaxed"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="space-y-1">
        {lines.map((l, i) => (
          <pre
            key={i}
            className={`whitespace-pre-wrap break-words ${
              l.kind === "in"
                ? "text-[var(--os-fg)]"
                : l.kind === "err"
                ? "text-[var(--os-crit)]"
                : "text-[var(--os-fg-muted)]"
            }`}
          >
            {l.text}
          </pre>
        ))}
      </div>

      <div className="mt-1 flex items-center gap-2">
        <span className="shrink-0 text-[var(--os-accent)]">{PROMPT}</span>
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={onKey}
          spellCheck={false}
          autoComplete="off"
          aria-label="Terminal input"
          className="min-w-0 flex-1 bg-transparent text-[var(--os-fg)] outline-none"
        />
      </div>
      <div ref={endRef} />
    </div>
  );
}
