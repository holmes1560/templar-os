/**
 * One geometric line set, drawn on a 24-grid with a consistent 1.5 stroke.
 * Deliberately not an icon-font dependency — a dozen glyphs is not worth
 * shipping a package for, and hand-drawn keeps the set visually coherent.
 */

const P: Record<string, React.ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M9.5 20V4M15 20v-7M20.5 20v-4" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z" />
      <path d="M14 3v5h5M8.5 13h7M8.5 16.5h4" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5z" />
    </>
  ),
  files: (
    <>
      <rect x="3.5" y="6.5" width="12" height="14" rx="1.5" />
      <path d="M8.5 3.5h10A1.5 1.5 0 0 1 20 5v12" />
      <path d="M7 11h5M7 14.5h5" />
    </>
  ),
  github: (
    <>
      <path d="M12 2.8a9.2 9.2 0 0 0-2.9 17.9c.46.09.63-.2.63-.44v-1.7c-2.55.55-3.1-1.23-3.1-1.23-.41-1.06-1-1.34-1-1.34-.83-.57.06-.56.06-.56.92.07 1.4.95 1.4.95.82 1.4 2.15 1 2.67.76.08-.6.32-1 .58-1.24-2.04-.23-4.18-1.02-4.18-4.54 0-1 .36-1.82.94-2.46-.1-.23-.41-1.17.09-2.43 0 0 .77-.25 2.52.94a8.7 8.7 0 0 1 4.6 0c1.74-1.19 2.5-.94 2.5-.94.51 1.26.19 2.2.1 2.43.59.64.94 1.46.94 2.46 0 3.53-2.15 4.3-4.19 4.53.33.28.62.84.62 1.7v2.52c0 .24.17.53.64.44A9.2 9.2 0 0 0 12 2.8z" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <path d="m7 9.5 3 2.5-3 2.5M12.5 15h4.5" />
    </>
  ),
  pulse: (
    <>
      <path d="M3 12.5h4l2.5-6 4 12 2.5-6h5" />
    </>
  ),
  cog: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
    </>
  ),
  note: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),

  // window chrome + ui
  min: <path d="M6 12h12" />,
  max: <rect x="6" y="6" width="12" height="12" rx="1" />,
  restore: (
    <>
      <rect x="5" y="8" width="11" height="11" rx="1" />
      <path d="M8.5 8V6.5A1.5 1.5 0 0 1 10 5h8.5A1.5 1.5 0 0 1 20 6.5V15a1.5 1.5 0 0 1-1.5 1.5H17" />
    </>
  ),
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </>
  ),
  chevron: <path d="m9 5.5 7 6.5-7 6.5" />,
  external: (
    <>
      <path d="M14 4.5h5.5V10" />
      <path d="M19.5 4.5 11 13" />
      <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10.5" rx="1.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  timeline: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  check: <path d="m5 13 4 4L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
    </>
  ),
  edit: (
    <>
      <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M5 15H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 3h9A1.5 1.5 0 0 1 14.5 4.5V5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8M15 8l2 2M18 5l2 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.4L21 8M21 3v5h-5" />
    </>
  ),
  monitor: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  code: (
    <>
      <path d="m8 9-4 3 4 3M16 9l4 3-4 3M13 6l-2 12" />
    </>
  ),
};

export type IconName = keyof typeof P | string;

export function Icon({
  name,
  size = 20,
  className = "",
  strokeWidth = 1.5,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const path = P[name];
  if (!path) return null;
  // github is a filled glyph; the rest are strokes
  const filled = name === "github";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}
