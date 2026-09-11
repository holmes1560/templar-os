import React from "react";

export interface TemplarLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Handcrafted vector SVG recreation of the futuristic winged "T" Templar OS emblem.
 * Features dual chamfered wings and a tapered central spine rendered in a radiant cyan-blue gradient.
 */
export function TemplarLogo({
  size = 56,
  className = "",
  glow = true,
}: TemplarLogoProps) {
  const filterId = "templar-logo-glow";
  const gradId = "templar-logo-grad";

  return (
    <svg
      width={size}
      height={(size * 80) / 100}
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
      style={{
        filter: glow ? "drop-shadow(0 0 12px rgba(56, 189, 248, 0.45))" : undefined,
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="25%" stopColor="#38bdf8" />
          <stop offset="75%" stopColor="#60a5fa" />
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
