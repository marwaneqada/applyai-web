import { Button } from "@/components/ui/button";
import { FullProductMockup } from "@/components/landing/product-mockups";
import { Reveal } from "@/components/landing/reveal";

export function ProductPreviewSection() {
  return (
    <section
      id="product"
      className="overflow-hidden bg-[#04140f] px-5 py-16 text-[#f7f5ec] sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[#a6f20f]">Application tracker</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
              Track every application after your resume is ready.
            </h2>
          </div>
          <div className="max-w-2xl lg:ml-auto">
            <p className="text-lg leading-8 text-[#cbd8c5]">
              Save jobs, move cards across stages, and keep notes, recruiter contacts,
              job URLs, applied dates, and tailored PDFs in one place.
            </p>
            <div className="mt-6">
              <Button className="h-12 bg-[#a6f20f] px-7 text-[#062b1f] hover:bg-[#c3ff45]" href="#final-cta">
                View kanban board
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-12" delay={0.12} y={28}>
          <FullProductMockup />
        </Reveal>
      </div>
    </section>
  );
}
