"use client";

import Link from "next/link";
import { useState } from "react";

const LOGO_SRC = "/applyai-logo.png";

export function AppLogo({
  className = "",
  href = "/",
  imgClassName = "h-9 w-auto",
}: {
  className?: string;
  href?: string;
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(true);

  return (
    <Link
      aria-label="ApplyAI home"
      className={`inline-flex items-center ${className}`}
      href={href}
    >
      {loaded ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt="ApplyAI"
          className={imgClassName}
          onError={() => setLoaded(false)}
          src={LOGO_SRC}
        />
      ) : (
        <span className="inline-flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#154b38] bg-[#062b1f] text-sm font-semibold text-[#a6f20f]">
            A
          </span>
          <span className="text-xl font-semibold">
            <span className="text-[#062b1f]">Apply</span>
            <span className="text-[#4a8f16]">AI</span>
          </span>
        </span>
      )}
    </Link>
  );
}
