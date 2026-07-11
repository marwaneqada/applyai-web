import { Reveal, RevealItem, StaggerReveal } from "@/components/landing/reveal";

export function NarrativeBridgeSection() {
  return (
    <section className="overflow-hidden bg-[#fbfaf4] px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-[350px] text-center sm:max-w-4xl">
          <p className="text-sm font-semibold text-[#588100]">Resume workflow</p>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.08] text-[#062b1f] sm:text-5xl lg:text-6xl">
            One workspace for each application.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#405047] sm:text-lg sm:leading-8">
            Resume upload, job description, match score, rewrites, PDF export,
            and application status stay connected.
          </p>
        </Reveal>

        <div className="relative mx-auto mt-12 min-h-[360px] max-w-5xl">
          <div
            className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-[120px] border border-dashed border-[#c9c5b7]"
            aria-hidden="true"
          />
          <div
            className="absolute left-1/2 top-1/2 h-[410px] w-[410px] -translate-x-1/2 -translate-y-1/2 rounded-[96px] border border-dashed border-[#d8d5c8]"
            aria-hidden="true"
          />
          <div
            className="absolute left-1/2 top-1/2 h-[270px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-[46px] bg-[#e9ebdf]"
            aria-hidden="true"
          />

          <div className="relative grid min-h-[360px] place-items-center">
            <StaggerReveal className="grid w-full gap-5 md:grid-cols-[0.92fr_1.08fr] md:items-center" delay={0.16}>
              <RevealItem>
                <div className="rounded-[18px] bg-white p-5 shadow-[0_22px_70px_rgba(6,43,31,0.09)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6ffd6] text-sm font-semibold text-[#062b1f]">
                      PDF
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#062b1f]">
                        Parsed resume
                      </p>
                      <p className="text-xs text-[#657167]">resume.pdf</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {["Parse status: success", "Experience extracted", "Skills detected"].map(
                      (item, index) => (
                        <div
                          className="flex items-center justify-between rounded-full border border-[#e6e2d5] bg-[#fbfaf4] px-4 py-3 text-sm font-semibold text-[#20332a]"
                          key={item}
                        >
                          <span>{item}</span>
                          <span
                            className={
                              index === 0
                                ? "h-2 w-16 rounded-full bg-[#a6f20f]"
                                : "h-2 w-12 rounded-full bg-[#d8d5c8]"
                            }
                            aria-hidden="true"
                          />
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </RevealItem>

              <RevealItem>
                <div className="rounded-[22px] border border-[#d8d5c8] bg-white p-6 shadow-[0_28px_90px_rgba(6,43,31,0.1)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#405047]">
                        Job analysis
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold text-[#062b1f]">
                        Backend Developer at Acme
                      </h3>
                    </div>
                    <span className="rounded-full bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]">
                      Completed
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4 lg:grid-cols-[0.7fr_1fr]">
                    <div className="rounded-[18px] bg-[#062b1f] p-5 text-white">
                      <p className="text-sm text-[#cbd8c5]">Match score</p>
                      <p className="mt-2 text-5xl font-semibold leading-none">91%</p>
                      <div className="mt-5 h-2 rounded-full bg-white/10">
                        <div className="h-2 w-[91%] rounded-full bg-[#a6f20f]" />
                      </div>
                    </div>
                    <div className="grid gap-3">
                      {["Missing keywords: Docker, CI/CD", "Cover letter generated"].map(
                        (item) => (
                          <div
                            className="rounded-2xl border border-[#e6e2d5] bg-[#fbfaf4] p-4 text-sm font-semibold text-[#20332a]"
                            key={item}
                          >
                            {item}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </RevealItem>
            </StaggerReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
