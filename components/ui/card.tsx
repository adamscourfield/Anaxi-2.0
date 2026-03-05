import { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-border/80 bg-surface/95 p-4 shadow-sm backdrop-blur-sm calm-transition hover:border-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
