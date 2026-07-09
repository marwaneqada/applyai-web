export default function AppPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
      <section className="rounded-[28px] border border-[#e1ded1] bg-white p-8 shadow-sm">
        <p className="inline-flex rounded-full border border-[#d9e9c5] bg-[#f2ffd4] px-3 py-1.5 text-xs font-semibold text-[#315000]">
          Protected workspace
        </p>
        <h1 className="mt-5 text-3xl font-semibold text-[#062b1f]">
          Your ApplyAI session is ready.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#657167]">
          Resume uploads, analysis workflows, PDF generation, and application tracking
          will live here next.
        </p>
      </section>
    </main>
  );
}
