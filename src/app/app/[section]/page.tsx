import { notFound } from "next/navigation";

const sections = {
  analyses: "Analyses",
  applications: "Applications",
  resumes: "Resumes",
} as const;

export default async function ProtectedSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const title = sections[section as keyof typeof sections];

  if (!title) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-[#e1ded1] bg-white p-8 shadow-sm">
        <p className="inline-flex rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]">
          Protected route
        </p>
        <h1 className="mt-5 text-3xl font-semibold text-[#062b1f]">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657167]">
          This authenticated ApplyAI area is available for the next product build.
        </p>
      </section>
    </main>
  );
}
