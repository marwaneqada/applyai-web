import Link from "next/link";

export function ApplyAiLogo({ className = "" }: { className?: string }) {
  return (
    <Link className={`inline-flex items-center gap-3 ${className}`} href="/">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#154b38] bg-[#062b1f] text-sm font-semibold text-[#a6f20f]">
        A
      </span>
      <span className="text-xl font-semibold text-[#062b1f]">ApplyAI</span>
    </Link>
  );
}
