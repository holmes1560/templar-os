import React from "react";

export interface TemplarLogoProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Handcrafted vector SVG recreation of the futuristic winged "T" Templar OS emblem.
 * Features dual chamfered wings and a tapered central spine rendered in a radiant white-to-cyan-blue gradient.
 */
export function TemplarLogo({
  size = 72,
  width,
  height,
  className = "",
  glow = true,
}: TemplarLogoProps) {
  const w = width ?? size;
  const h = height ?? (size * 80) / 100;
  const gradId = "templar-logo-grad";

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{
        filter: glow ? "drop-shadow(0 0 14px rgba(56, 189, 248, 0.5))" : undefined,
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#bae6fd" />
          <stop offset="55%" stopColor="#38bdf8" />
          <stop offset="85%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      {/* Top Wings */}
      <path
        d="M 47 13 L 8 13 L 15 24 L 47 24 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M 53 13 L 92 13 L 85 24 L 53 24 Z"
        fill={`url(#${gradId})`}
      />

      {/* Middle Wings */}
      <path
        d="M 47 28 L 18 28 L 24 38 L 47 38 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M 53 28 L 82 28 L 76 38 L 53 38 Z"
        fill={`url(#${gradId})`}
      />

      {/* Vertical Central Tapered Spine */}
      <path
        d="M 47 42 L 39 42 L 44 71 L 47 75 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M 53 42 L 61 42 L 56 71 L 53 75 Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}
