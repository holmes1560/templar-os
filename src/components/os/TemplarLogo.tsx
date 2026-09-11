import React from "react";
import Image from "next/image";

export interface TemplarLogoProps {
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  glow?: boolean;
  priority?: boolean;
}

/**
 * Official Templar OS winged cyber emblem.
 * Rendered from the brand asset with ambient cyan luminescence.
 */
export function TemplarLogo({
  size = 72,
  width,
  height,
  className = "",
  glow = true,
  priority = true,
}: TemplarLogoProps) {
  const w = width ?? size;
  const h = height ?? Math.round((w * 620) / 789);

  return (
    <div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: w,
        height: h,
        filter: glow
          ? "drop-shadow(0 0 16px rgba(56, 189, 248, 0.45)) drop-shadow(0 0 4px rgba(56, 189, 248, 0.3))"
          : undefined,
      }}
      aria-hidden="true"
    >
      <Image
        src="/brand/templar-logo.png"
        alt="Templar OS"
        width={w}
        height={h}
        priority={priority}
        className="h-full w-full object-contain pointer-events-none select-none"
        draggable={false}
      />
    </div>
  );
}
