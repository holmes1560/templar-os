"use client";

import React from "react";
import { useProjects, useApps, useProfile, useSetting } from "./PortfolioProvider";
import { WORKSPACES } from "@/lib/apps";
import { Icon } from "./Icon";
import { TemplarLogo } from "./TemplarLogo";

export interface DesktopHeroProps {
  workspace: number;
}

/**
 * Desktop Hero HUD Watermark
 *
 * Exact code from the Admin Panel preview verbatim.
 * Strictly non-interactive (pointer-events-none select-none) so it never
 * obstructs desktop icon dragging, clicking, or window management.
 */
export function DesktopHero({ workspace }: DesktopHeroProps) {
  const enabled = useSetting("hero.enabled", "true") !== "false";
  const showOnAll = useSetting("hero.showOnAllWorkspaces", "false") === "true";

  // Only show on Workspace 0 (Home) unless configured for all workspaces
  if (!enabled || (!showOnAll && workspace !== 0)) {
    return null;
  }

  return <DesktopHeroContent />;
}

function DesktopHeroContent() {
  const profile = useProfile();
  const projects = useProjects();
  const apps = useApps();

  // Dynamic system counts
  const workspacesCount = useSetting("hero.workspacesCount") || String(WORKSPACES.length);
  const activeAppsCount = useSetting("hero.appsCount") || String(apps.filter((a) => a.appKey !== "webview").length);
  const projectsCount = useSetting("hero.projectsCount") || String(projects.length);
  const missionCount = useSetting("hero.missionCount", "1");
  const missionLabel = useSetting("hero.missionLabel", "Mission");

  const greeting = useSetting("hero.greeting", "WELCOME TO");
  const systemTitle = useSetting("hero.systemName", "Templar OS");
  const name = useSetting("hero.name", "ASENSO OWUSU ANSAH");
  const subtitle = useSetting("hero.subtitle", "Software Engineer  |  Problem Solver  |  Builder");
  const prompt = useSetting("hero.prompt", "Select an application to get started.");

  // Title formatting: split "Templar OS" into "Templar" + "OS" with cyan highlight
  const titleParts = systemTitle.split(" ");
  const mainTitle = titleParts.length > 1 ? titleParts.slice(0, -1).join(" ") : systemTitle;
  const suffix = titleParts.length > 1 ? titleParts[titleParts.length - 1] : "";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 flex select-none flex-col items-center justify-center pb-12"
    >
      <div className="relative z-10 mx-auto max-w-lg text-center">
        {/* Corner brackets */}
        <span className="pointer-events-none absolute left-0 top-0 h-3.5 w-3.5 border-l-2 border-t-2 border-[#38bdf8]/40" />
        <span className="pointer-events-none absolute right-0 top-0 h-3.5 w-3.5 border-r-2 border-t-2 border-[#38bdf8]/40" />
        <span className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-b-2 border-l-2 border-[#38bdf8]/40" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-3.5 w-3.5 border-b-2 border-r-2 border-[#38bdf8]/40" />

        <div className="px-6 py-6">
          <div className="mb-3 flex justify-center">
            <TemplarLogo size={48} glow />
          </div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.35em] text-slate-400">
            {greeting || "WELCOME TO"}
          </p>
          <h3 className="my-1 text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-slate-100">{mainTitle}</span>
            {suffix && (
              <span className="ml-2 text-[#38bdf8] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
                {suffix}
              </span>
            )}
          </h3>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-300">
            {name || "ASENSO OWUSU ANSAH"}
          </p>
          <p className="mt-0.5 text-[0.65rem] text-slate-400">
            {subtitle || "Software Engineer  |  Problem Solver  |  Builder"}
          </p>
          <div className="relative my-3.5 flex h-px w-24 mx-auto items-center justify-center">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#38bdf8]/70 to-transparent" />
            <div className="absolute h-1.5 w-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_6px_#38bdf8]" />
          </div>
          <p className="text-[0.62rem] text-slate-400">
            {prompt}
          </p>
        </div>
      </div>

      {/* Preview metrics */}
      <div className="relative z-10 mt-5 flex justify-center gap-6 border-t border-slate-800/80 pt-4">
        <div className="flex flex-col items-center">
          <Icon name="monitor" size={14} className="text-slate-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">{workspacesCount}</span>
          <span className="text-[0.55rem] uppercase tracking-wider text-slate-500">Workspaces</span>
        </div>
        <div className="flex flex-col items-center">
          <Icon name="grid" size={14} className="text-slate-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">{activeAppsCount}</span>
          <span className="text-[0.55rem] uppercase tracking-wider text-slate-500">Applications</span>
        </div>
        <div className="flex flex-col items-center">
          <Icon name="folder" size={14} className="text-slate-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">{projectsCount}</span>
          <span className="text-[0.55rem] uppercase tracking-wider text-slate-500">Projects</span>
        </div>
        <div className="flex flex-col items-center">
          <Icon name="code" size={14} className="text-slate-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">{missionCount}</span>
          <span className="text-[0.55rem] uppercase tracking-wider text-slate-500">{missionLabel}</span>
        </div>
      </div>
    </div>
  );
}
