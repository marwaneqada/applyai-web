import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";

export function FinalCtaSection() {
  return (
    <section
      id="final-cta"
      className="bg-[#fbfaf4] px-5 pb-16 pt-0 sm:px-6 lg:px-8 lg:pb-20"
    >
      <Reveal
        className="mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-[#062b1f] px-6 py-12 text-center text-[#f7f5ec] shadow-[0_28px_90px_rgba(6,43,31,0.18)] sm:px-10 lg:py-16"
        y={30}
      >
        <p className="text-sm font-semibold text-[#a6f20f]">Ready for the next role</p>
        <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          Start tailoring your next application.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#cbd8c5]">
          Upload your resume, paste the job description, improve the match, export
          the PDF, and save the application to your kanban board.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button className="h-12 px-8" href="/register" variant="secondary">
            Start for free
          </Button>
          <Link
            className="text-sm font-semibold text-[#cbd8c5] transition hover:text-white"
            href="/login"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
