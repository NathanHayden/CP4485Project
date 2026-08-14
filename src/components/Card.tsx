import type { CSSProperties, ReactNode } from "react";

export default function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-sm ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
