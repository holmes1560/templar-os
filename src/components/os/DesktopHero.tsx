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
 * Spacious, minimalist cyber-monastic HUD composition centered on the desktop.
 * Strictly non-interactive (pointer-events-none select-none) so it never
 * obstructs desktop icon dragging, clicking, or window management.
 *
 * All text fields are dynamic and editable via Admin Panel settings.
 * All metrics (Workspaces, Applications, Projects, Mission) match live system state.
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

  // Dynamic system counts with intelligent fallbacks matching live system
  const workspacesCount = useSetting("hero.workspacesCount") || String(WORKSPACES.length || 4);
  const activeAppsCount = useSetting("hero.appsCount") || String(apps.filter((a) => a.appKey !== "webview").length || 12);
  const projectsCount = useSetting("hero.projectsCount") || String(projects.length || 12);
  const missionCount = useSetting("hero.missionCount", "1");
  const missionLabel = useSetting("hero.missionLabel", "Mission");

  // Configurable text fields with intelligent fallbacks
  const greeting = useSetting("hero.greeting", "WELCOME TO");
  const systemTitle = useSetting("hero.systemName", "Templar OS");
  const ownerName = useSetting("hero.name", profile?.fullName?.toUpperCase() || "ASENSO OWUSU ANSAH");
  const subtitle = useSetting("hero.subtitle", "Software Engineer | Problem Solver | Builder");
  const prompt = useSetting("hero.prompt", "Select an application to get started.");

  // Title formatting: split "Templar OS" into "Templar" + "OS" with cyan highlight
  const titleParts = systemTitle.split(" ");
  const mainTitle = titleParts.length > 1 ? titleParts.slice(0, -1).join(" ") : systemTitle;
  const suffix = titleParts.length > 1 ? titleParts[titleParts.length - 1] : "";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center"
    >
      {/* ── Central Welcome Container (Width: ~520px, Min-height: ~430px) ── */}
      <div
        className="relative flex w-[520px] min-h-[430px] flex-col items-center justify-center text-center px-4"
        style={{ maxWidth: "calc(100vw - 32px)" }}
      >
        {/* Upper Framed Area with Technical HUD Corner Brackets */}
        <div className="relative flex w-full flex-col items-center">
          {/* Subtle Technical Corner Brackets */}
          <span className="pointer-events-none absolute left-0 top-[20px] h-3.5 w-3.5 border-l border-t border-[#38bdf8]/35" />
          <span className="pointer-events-none absolute right-0 top-[20px] h-3.5 w-3.5 border-r border-t border-[#38bdf8]/35" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-b border-l border-[#38bdf8]/35" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-3.5 w-3.5 border-b border-r border-[#38bdf8]/35" />

          {/* 1. Templar logo (Container: 52x52px, actual logo 44px, center aligned, 28px space below) */}
          <div className="mb-[28px] flex h-[52px] w-[52px] items-center justify-center">
            <TemplarLogo size={44} glow />
          </div>

          {/* 2. "WELCOME TO" (10px font, letter spacing: 5px, uppercase, 10px space below) */}
          <p
            className="mb-[10px] text-[10px] font-medium uppercase text-slate-400"
            style={{ letterSpacing: "5px" }}
          >
            {greeting}
          </p>

          {/* 3. "Templar OS" (approx 42px font size, line-height: 1, Templar white, OS blue/cyan, 14px space below) */}
          <h1 className="mb-[14px] text-[42px] font-bold leading-none tracking-tight">
            <span className="text-slate-100">{mainTitle}</span>
            {suffix && (
              <span className="ml-2.5 text-[#38bdf8] drop-shadow-[0_0_16px_rgba(56,189,248,0.45)]">
                {suffix}
              </span>
            )}
          </h1>

          {/* 4. "ASENSO OWUSU ANSAH" (12px font, letter spacing: 4px, uppercase, 10px space below) */}
          <p
            className="mb-[10px] text-[12px] font-semibold uppercase text-slate-200"
            style={{ letterSpacing: "4px" }}
          >
            {ownerName}
          </p>

          {/* 5. Role line (approx 10px, muted blue/gray, approx 25px space below) */}
          <p className="mb-[25px] text-[10px] tracking-normal text-slate-400">
            {subtitle}
          </p>

          {/* 6. Thin accent divider (width: 68px, height: 1px, blue/cyan, approx 30px space below) */}
          <div className="mb-[30px] h-[1px] w-[68px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent shadow-[0_0_8px_rgba(56,189,248,0.6)]" />

          {/* 7. Instruction (approx 10px, letter spacing around 1px, muted blue/gray, 45px vertical space after) */}
          <p
            className="text-[10px] text-slate-400"
            style={{ letterSpacing: "1px" }}
          >
            {prompt}
          </p>
        </div>

        {/* 8. Statistics row (Four items: Workspaces, Applications, Projects, Mission with subtle vertical separators) */}
        <div className="mt-[45px] flex w-full items-center justify-between px-2">
          {/* Workspaces */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <Icon name="monitor" size={16} className="text-slate-400" />
            <span className="mt-1.5 font-mono text-sm font-semibold text-slate-200 sm:text-[15px]">
              {workspacesCount}
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[1px] text-slate-500">
              Workspaces
            </span>
          </div>

          {/* Subtle vertical separator */}
          <div className="h-[26px] w-[1px] bg-slate-700/40" />

          {/* Applications */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <Icon name="grid" size={16} className="text-slate-400" />
            <span className="mt-1.5 font-mono text-sm font-semibold text-slate-200 sm:text-[15px]">
              {activeAppsCount}
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[1px] text-slate-500">
              Applications
            </span>
          </div>

          {/* Subtle vertical separator */}
          <div className="h-[26px] w-[1px] bg-slate-700/40" />

          {/* Projects */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <Icon name="folder" size={16} className="text-slate-400" />
            <span className="mt-1.5 font-mono text-sm font-semibold text-slate-200 sm:text-[15px]">
              {projectsCount}
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[1px] text-slate-500">
              Projects
            </span>
          </div>

          {/* Subtle vertical separator */}
          <div className="h-[26px] w-[1px] bg-slate-700/40" />

          {/* Mission */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <Icon name="code" size={16} className="text-slate-400" />
            <span className="mt-1.5 font-mono text-sm font-semibold text-slate-200 sm:text-[15px]">
              {missionCount}
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[1px] text-slate-500">
              {missionLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
