export const NAV_ITEMS = [
  { label: "Product", href: "#product" },
  { label: "Story", href: "#story" },
  { label: "Results", href: "#results" },
  { label: "Contact", href: "#final-cta" },
] as const;

export const TRUST_ITEMS = [
  "Resume PDF upload",
  "91% match analysis",
  "Bullet and cover letter rewrite",
  "PDF export and kanban tracking",
] as const;

export const STORY_STEPS = [
  {
    eyebrow: "Upload resume PDF",
    title: "Upload your resume and paste the job description.",
    description:
      "Start with marwane-resume.pdf, confirm the parse status is success, then paste the target job description.",
    metric: "Parse status: success",
    mockup: "intake",
    bullets: ["Resume uploaded: marwane-resume.pdf", "Parse status: success", "Job description added"],
  },
  {
    eyebrow: "View match analysis",
    title: "Review the match score and keyword gaps.",
    description:
      "Review the match score, matched keywords, missing keywords, strengths, weaknesses, and gap analysis before you apply.",
    metric: "91% match score",
    mockup: "score",
    bullets: ["Missing keywords: Docker, CI/CD", "Strengths and weaknesses", "Gap analysis"],
  },
  {
    eyebrow: "Rewrite application",
    title: "Rewrite bullets and generate a cover letter.",
    description:
      "Turn broad resume bullets into role-specific proof and generate a cover letter draft for the target role.",
    metric: "Rewrites ready",
    mockup: "rewrite",
    bullets: ["Before and after bullets", "Cover letter draft", "Keywords added naturally"],
  },
  {
    eyebrow: "Export and track",
    title: "Choose a template, download the PDF, and save the application.",
    description:
      "Select Harvard, Modern, or Minimal, export a polished PDF, and save the job to the application kanban.",
    metric: "PDF ready",
    mockup: "export",
    bullets: ["Harvard / Modern / Minimal templates", "Download tailored PDF", "Save to kanban board"],
  },
] as const;

export const FEATURES = [
  {
    title: "PDF resume parsing",
    description:
      "Upload a resume PDF and confirm it parsed successfully before starting an analysis.",
  },
  {
    title: "Job match analysis",
    description:
      "Compare your resume with a job description across overall score, keywords, skills, and experience.",
  },
  {
    title: "Role-specific rewriting",
    description:
      "Generate stronger resume bullets and a cover letter draft tailored to the target role.",
  },
  {
    title: "PDF export and tracking",
    description:
      "Choose a template, download a polished PDF, and track each application in a kanban board.",
  },
] as const;

export const PRODUCT_TABS = [
  "Analysis",
  "Keywords",
  "PDF Export",
  "Kanban",
] as const;

export const SCORE_BREAKDOWN = [
  { label: "Keyword score", value: "90%" },
  { label: "Experience score", value: "92%" },
  { label: "Skills score", value: "93%" },
] as const;

export const REVIEW_NOTES = [
  "Add Docker and CI/CD to the skills section.",
  "Rewrite the API bullet with measurable backend impact.",
  "Generate a cover letter for Acme's Backend Developer role.",
] as const;

export const METRICS = [
  {
    value: 91,
    suffix: "%",
    decimals: 0,
    label: "match score",
    detail: "after comparing marwane-resume.pdf with the target job description",
  },
  {
    value: 2,
    suffix: "",
    decimals: 0,
    label: "missing keywords found",
    detail: "Docker and CI/CD surfaced before the application is sent",
  },
  {
    value: 3,
    suffix: "",
    decimals: 0,
    label: "PDF templates",
    detail: "Harvard, Modern, and Minimal exports from structured resume data",
  },
] as const;
