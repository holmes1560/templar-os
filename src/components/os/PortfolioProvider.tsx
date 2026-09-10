"use client";

import { createContext, useContext, useMemo } from "react";
import type { PortfolioData, PublicApp, PublicProject } from "@/lib/portfolio-types";

/**
 * Content flows one way: database → server component → this provider → OS.
 *
 * Kept separate from the Zustand store on purpose. The store owns *runtime*
 * state (which windows are open, z-order, settings); this owns *content*,
 * which is read-only in the client and never mutated by the OS. Conflating
 * them would make it possible for a UI bug to appear to edit the portfolio.
 */
const Ctx = createContext<PortfolioData | null>(null);

export function PortfolioProvider({
  data, children,
}: { data: PortfolioData; children: React.ReactNode }) {
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

function usePortfolio(): PortfolioData {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePortfolio must be used inside <PortfolioProvider>");
  return v;
}

export function useProjects(): PublicProject[] {
  return usePortfolio().projects;
}

export function useProject(slug?: string): PublicProject | undefined {
  const projects = useProjects();
  return useMemo(() => projects.find((p) => p.slug === slug), [projects, slug]);
}

/** every enabled application, regardless of whether it shows on the desktop */
export function useApps(): PublicApp[] {
  return usePortfolio().apps;
}

export function useApp(appKey: string): PublicApp | undefined {
  const apps = useApps();
  return useMemo(() => apps.find((a) => a.appKey === appKey), [apps, appKey]);
}

/** desktop icons for one workspace, in cell order */
export function useDesktopApps(workspace: number): PublicApp[] {
  const apps = useApps();
  return useMemo(
    () => apps.filter((a) => a.workspace === workspace).sort((a, b) => a.cell - b.cell),
    [apps, workspace]
  );
}

export function useSetting(key: string, fallback = ""): string {
  return usePortfolio().settings[key] ?? fallback;
}

export function useIsStale(): boolean {
  return usePortfolio().stale === true;
}

export function useProfile() {
  return usePortfolio().profile;
}

export function useSkills() {
  return usePortfolio().skills;
}

export function useTimeline() {
  return usePortfolio().timeline;
}

export function useExperience() {
  return usePortfolio().experience;
}

export function useEducation() {
  return usePortfolio().education;
}

export function useCertifications() {
  return usePortfolio().certifications;
}

export function useAchievements() {
  return usePortfolio().achievements;
}

export function useSocialLinks() {
  return usePortfolio().socialLinks;
}

export function useResume() {
  return usePortfolio().resume;
}
