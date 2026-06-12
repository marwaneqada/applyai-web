import { Card } from "@/components/ui/card";
import { Reveal, RevealItem, StaggerReveal } from "@/components/landing/reveal";
import { FEATURES } from "@/constants/landing";

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#fbfaf4] px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[#588100]">Core workflow</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight text-[#062b1f] sm:text-5xl">
              Everything you need before and after you apply.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[#405047] lg:ml-auto">
            ApplyAI focuses on the practical application flow: upload your resume,
            check the match score, close keyword gaps, export a PDF, and track the job.
          </p>
        </Reveal>

        <StaggerReveal className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4" delay={0.1}>
          {FEATURES.map((feature, index) => (
            <RevealItem key={feature.title}>
              <Card className="h-full bg-white p-6 shadow-[0_18px_50px_rgba(6,43,31,0.06)]">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#eff3df] text-sm font-semibold text-[#315000]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-8 text-2xl font-semibold leading-tight text-[#062b1f]">
                  {feature.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#405047]">
                  {feature.description}
                </p>
              </Card>
            </RevealItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
