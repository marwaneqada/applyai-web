import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-[28px] border border-[#e1ded1] bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
