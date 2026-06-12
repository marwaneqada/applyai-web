import Link from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#062b1f] text-[#f7f5ec] shadow-[0_16px_34px_rgba(6,43,31,0.18)] hover:bg-[#031a13]",
  secondary:
    "border border-[#d8d5c8] bg-[#fbfaf4] text-[#062b1f] shadow-sm hover:border-[#b7b29f] hover:bg-white",
  ghost: "text-[#405047] hover:bg-[#eff3df] hover:text-[#062b1f]",
};

export function Button({
  children,
  className = "",
  variant = "primary",
  href,
  ...props
}: ButtonProps) {
  return (
    <Link
      className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6f20f] ${variantClasses[variant]} ${className}`}
      href={href}
      {...props}
    >
      {children}
    </Link>
  );
}
