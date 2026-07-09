import { TRUST_ITEMS } from "@/constants/landing";
import { Reveal, RevealItem, StaggerReveal } from "@/components/landing/reveal";

export function TrustSection() {
  return (
    <section className="border-y border-[#e8e4d8] bg-[#f5f3ea] px-5 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal y={14}>
          <p className="mx-auto max-w-[260px] text-center text-sm font-semibold leading-6 text-[#405047] sm:max-w-none">
            Built for applicants tailoring resumes before they apply
          </p>
        </Reveal>
        <StaggerReveal className="mx-auto mt-6 grid max-w-[300px] gap-5 sm:max-w-none sm:grid-cols-2 lg:grid-cols-4" delay={0.08}>
          {TRUST_ITEMS.map((item, index) => (
            <RevealItem key={item} y={12}>
              <div className="flex items-center justify-center gap-3 text-center text-sm font-semibold text-[#657167]">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    index === 0
                      ? "bg-[#062b1f]"
                      : index === 1
                        ? "bg-[#a6f20f]"
                        : "bg-[#c9c5b7]"
                  }`}
                  aria-hidden="true"
                />
                <span>{item}</span>
              </div>
            </RevealItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
