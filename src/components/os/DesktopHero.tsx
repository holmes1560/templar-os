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
 * Recreates the cyber-monastic HUD emblem from the design reference.
 * Strictly non-interactive (pointer-events-none select-none) so it never
 * obstructs desktop icon dragging, clicking, or window management.
 *
 * All text fields are dynamic and editable via Admin Panel settings.
 * All metrics (Workspaces, Applications, Projects) are calculated live
 * from the database and active applications state.
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

  // Configurable text fields with intelligent fallbacks
  const greeting = useSetting("hero.greeting", "WELCOME TO");
  const systemTitle = useSetting("hero.systemName", "Templar OS");
  const ownerName = useSetting("hero.name", profile?.fullName?.toUpperCase() || "ASENSO OWUSU ANSAH");
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
      {/* ── Main HUD Box with Corner Brackets ── */}
      <div className="relative mx-4 flex max-w-2xl flex-col items-center px-8 py-8 text-center sm:px-14 sm:py-10">
        {/* HUD Corner Brackets */}
        <span className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-[#38bdf8]/40" />
        <span className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-[#38bdf8]/40" />
        <span className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#38bdf8]/40" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#38bdf8]/40" />

        {/* Logo */}
        <div className="mb-4">
          <TemplarLogo size={62} glow />
        </div>

        {/* Welcome Overline */}
        <p className="mb-1 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.38em] text-[#94a3b8] sm:text-[0.7rem]">
          {greeting}
        </p>

        {/* Main Title */}
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-5xl">
          <span className="text-slate-100">{mainTitle}</span>
          {suffix && <span className="ml-2.5 text-[#38bdf8] drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]">{suffix}</span>}
        </h1>

        {/* Display Name */}
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300 sm:text-sm">
          {ownerName}
        </p>

        {/* Subtitle / Roles */}
        <p className="mb-5 text-[0.7rem] font-normal tracking-wide text-slate-400 sm:text-xs">
          {subtitle}
        </p>

        {/* Glowing Divider Line with Center Pip */}
        <div className="relative mb-5 flex h-px w-28 items-center justify-center sm:w-36">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#38bdf8]/70 to-transparent" />
          <div className="absolute h-1.5 w-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
        </div>

        {/* Instruction Prompt */}
        <p className="text-[0.7rem] tracking-wide text-slate-400 sm:text-xs">
          {prompt}
        </p>
      </div>

      {/* ── Dynamic System Metrics Row ── */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-7 sm:gap-12">
        {/* Workspaces */}
        <div className="flex flex-col items-center gap-1.5">
          <Icon name="monitor" size={17} className="text-slate-400" />
          <span className="font-mono text-sm font-semibold text-slate-200 sm:text-base">
            {workspacesCount}
          </span>
          <span className="text-[0.62rem] uppercase tracking-wider text-slate-500">
            Workspaces
          </span>
        </div>

        {/* Applications */}
        <div className="flex flex-col items-center gap-1.5">
          <Icon name="grid" size={17} className="text-slate-400" />
          <span className="font-mono text-sm font-semibold text-slate-200 sm:text-base">
            {activeAppsCount}
          </span>
          <span className="text-[0.62rem] uppercase tracking-wider text-slate-500">
            Applications
          </span>
        </div>

        {/* Projects */}
        <div className="flex flex-col items-center gap-1.5">
          <Icon name="folder" size={17} className="text-slate-400" />
          <span className="font-mono text-sm font-semibold text-slate-200 sm:text-base">
            {projectsCount}
          </span>
          <span className="text-[0.62rem] uppercase tracking-wider text-slate-500">
            Projects
          </span>
        </div>

        {/* Mission */}
        <div className="flex flex-col items-center gap-1.5">
          <Icon name="code" size={17} className="text-slate-400" />
          <span className="font-mono text-sm font-semibold text-slate-200 sm:text-base">
            {missionCount}
          </span>
          <span className="text-[0.62rem] uppercase tracking-wider text-slate-500">
            {missionLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
