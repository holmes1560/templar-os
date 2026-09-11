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
 * Measurements, typography weights, letter-spacing, and vertical spacing are
 * grounded directly in the 1650x925 reference composition.
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
  const projectsCount = useSetting("hero.projectsCount") || String(projects.length || 18);
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
      {/* ── Central Welcome Container (Width: 560px, visually centered) ── */}
      <div
        className="relative flex w-[560px] flex-col items-center justify-center text-center px-4"
        style={{ maxWidth: "calc(100vw - 32px)" }}
      >
        {/* Upper Framed Area with Technical HUD Corner Brackets */}
        <div className="relative flex w-full flex-col items-center">
          {/* Subtle Technical Corner Brackets */}
          <span className="pointer-events-none absolute left-0 top-[28px] h-4 w-4 border-l border-t border-[#38bdf8]/40" />
          <span className="pointer-events-none absolute right-0 top-[28px] h-4 w-4 border-r border-t border-[#38bdf8]/40" />
          <span className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b border-l border-[#38bdf8]/40" />
          <span className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b border-r border-[#38bdf8]/40" />

          {/* 1. Templar Logo (84px wide, 72px high, center aligned, 26px space below) */}
          <div className="mb-[26px] flex items-center justify-center">
            <TemplarLogo width={84} height={72} glow />
          </div>

          {/* 2. "WELCOME TO" (10.5px monospace font, 6px letter spacing, uppercase, 20px space below) */}
          <p
            className="mb-[20px] font-mono text-[10.5px] font-normal uppercase text-[#7c94b6]"
            style={{ letterSpacing: "6px" }}
          >
            {greeting}
          </p>

          {/* 3. "Templar OS" (48-52px font size, clean font-normal / font-medium weight, leading-none, 26px space below) */}
          <h1 className="mb-[26px] font-sans text-[48px] font-normal leading-none tracking-tight sm:text-[52px]">
            <span className="text-white font-normal">{mainTitle}</span>
            {suffix && (
              <span className="ml-3 text-[#3894ff] font-normal drop-shadow-[0_0_18px_rgba(56,148,255,0.45)]">
                {suffix}
              </span>
            )}
          </h1>

          {/* 4. "ASENSO OWUSU ANSAH" (12px font, 4.5px letter spacing, uppercase, 16px space below) */}
          <p
            className="mb-[16px] font-sans text-[12px] font-medium uppercase text-[#cbd5e1]"
            style={{ letterSpacing: "4.5px" }}
          >
            {ownerName}
          </p>

          {/* 5. Role line (11px font, font-normal, muted blue-gray, 36px space below) */}
          <p className="mb-[36px] font-sans text-[11px] font-normal tracking-wide text-[#7c94b6]">
            {subtitle.includes("|") ? (
              subtitle.split("|").map((part, i, arr) => (
                <React.Fragment key={i}>
                  <span>{part.trim()}</span>
                  {i < arr.length - 1 && (
                    <span className="mx-3.5 text-[#475569] font-light">|</span>
                  )}
                </React.Fragment>
              ))
            ) : (
              subtitle
            )}
          </p>

          {/* 6. Thin accent divider (76px width, 1.5px height, cyan glowing gradient, 34px space below) */}
          <div className="mb-[34px] h-[1.5px] w-[76px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent shadow-[0_0_10px_rgba(56,189,248,0.7)]" />

          {/* 7. Instruction (11px font, font-normal, muted blue-gray, 38px space below) */}
          <p
            className="font-sans text-[11px] font-normal text-[#7c94b6]"
            style={{ letterSpacing: "0.5px" }}
          >
            {prompt}
          </p>
        </div>

        {/* 8. Statistics row (Four items: Workspaces, Applications, Projects, Mission with subtle vertical separators) */}
        <div className="mt-[38px] flex w-full max-w-[540px] items-center justify-between px-2">
          {/* Workspaces */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <Icon name="monitor" size={18} className="text-[#60a5fa]" />
            <span className="mt-[14px] font-sans text-[18px] font-medium leading-none text-white">
              {workspacesCount}
            </span>
            <span className="mt-[9px] font-sans text-[11px] font-normal text-[#7c94b6]">
              Workspaces
            </span>
          </div>

          {/* Subtle vertical separator */}
          <div className="h-[44px] w-[1px] bg-[#334155]/40" />

          {/* Applications */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <Icon name="grid" size={18} className="text-[#60a5fa]" />
            <span className="mt-[14px] font-sans text-[18px] font-medium leading-none text-white">
              {activeAppsCount}
            </span>
            <span className="mt-[9px] font-sans text-[11px] font-normal text-[#7c94b6]">
              Applications
            </span>
          </div>

          {/* Subtle vertical separator */}
          <div className="h-[44px] w-[1px] bg-[#334155]/40" />

          {/* Projects */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <Icon name="folder" size={18} className="text-[#60a5fa]" />
            <span className="mt-[14px] font-sans text-[18px] font-medium leading-none text-white">
              {projectsCount}
            </span>
            <span className="mt-[9px] font-sans text-[11px] font-normal text-[#7c94b6]">
              Projects
            </span>
          </div>

          {/* Subtle vertical separator */}
          <div className="h-[44px] w-[1px] bg-[#334155]/40" />

          {/* Mission */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <Icon name="code" size={18} className="text-[#60a5fa]" />
            <span className="mt-[14px] font-sans text-[18px] font-medium leading-none text-white">
              {missionCount}
            </span>
            <span className="mt-[9px] font-sans text-[11px] font-normal text-[#7c94b6]">
              {missionLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
