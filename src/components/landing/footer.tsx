import { Reveal, RevealItem, StaggerReveal } from "@/components/landing/reveal";

const footerGroups = [
  {
    title: "Product",
    links: [
      { label: "Resume analysis", href: "#story" },
      { label: "PDF generator", href: "#product" },
      { label: "Application tracker", href: "#product" },
    ],
  },
  {
    title: "Workflow",
    links: [
      { label: "Upload resume", href: "#story" },
      { label: "Paste job description", href: "#story" },
      { label: "Export PDF", href: "#product" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: "mailto:hello@applyai.com" },
      { label: "Start tailoring", href: "#final-cta" },
      { label: "Sign in", href: "#product" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-[#e8e4d8] bg-[#fbfaf4] px-5 pb-10 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]" delay={0.08}>
          <div>
            <a className="inline-flex items-center gap-3" href="#top" aria-label="ApplyAI home">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#154b38] bg-[#062b1f] text-sm font-semibold text-[#a6f20f]">
                A
              </span>
              <span className="text-xl font-semibold text-[#062b1f]">ApplyAI</span>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-6 text-[#657167]">
              Resume tailoring for applicants who want each job application
              matched, rewritten, exported, and tracked in one place.
            </p>
          </div>

          <StaggerReveal className="grid gap-8 sm:grid-cols-3">
            {footerGroups.map((group) => (
              <RevealItem key={group.title} y={14}>
                <div>
                  <h3 className="text-sm font-semibold text-[#87917f]">{group.title}</h3>
                  <div className="mt-4 grid gap-3">
                    {group.links.map((link) => (
                      <a
                        className="text-sm font-semibold text-[#062b1f] transition hover:text-[#588100]"
                        href={link.href}
                        key={link.label}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              </RevealItem>
            ))}
          </StaggerReveal>
        </Reveal>

        <Reveal className="mt-12 flex flex-col gap-4 border-t border-[#e8e4d8] pt-6 text-sm text-[#657167] sm:flex-row sm:items-center sm:justify-between" delay={0.1} y={12}>
          <p>(c) 2026 ApplyAI. All rights reserved.</p>
          <div className="flex gap-5">
            <a className="transition hover:text-[#062b1f]" href="#top">
              Privacy
            </a>
            <a className="transition hover:text-[#062b1f]" href="#top">
              Terms
            </a>
            <a className="transition hover:text-[#062b1f]" href="#top">
              Security
            </a>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
