import { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-lg border border-border/80 bg-surface/95 p-4 shadow-sm backdrop-blur-sm calm-transition",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/35 before:to-transparent",
        "hover:-translate-y-[1px] hover:border-border hover:shadow-md",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
