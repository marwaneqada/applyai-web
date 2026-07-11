export const NAV_ITEMS = [
  { label: "Workflow", href: "#story" },
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
] as const;

export const TRUST_ITEMS = [
  "Resume PDF upload",
  "Match & keyword analysis",
  "Bullet & cover letter rewrite",
  "PDF export & kanban tracking",
] as const;

export const STORY_STEPS = [
  {
    eyebrow: "Upload resume PDF",
    title: "Upload your resume and paste the job description.",
    description:
      "Upload your resume, confirm the parse status is success, then paste the target job description.",
    metric: "Parse status: success",
    mockup: "intake",
    bullets: ["Resume parsed successfully", "Text extracted for analysis", "Job description added"],
  },
  {
    eyebrow: "View match analysis",
    title: "Review the match score and keyword gaps.",
    description:
      "See the overall match score, matched and missing keywords, strengths, weaknesses, and a gap analysis before you apply.",
    metric: "Match score & gaps",
    mockup: "score",
    bullets: ["Matched & missing keywords", "Strengths & weaknesses", "Gap analysis"],
  },
  {
    eyebrow: "Rewrite application",
    title: "Rewrite bullets and generate a cover letter.",
    description:
      "Turn broad resume bullets into role-specific proof and generate a cover letter draft for the target role.",
    metric: "Rewrites ready",
    mockup: "rewrite",
    bullets: ["Before & after bullets", "Cover letter draft", "Keywords added naturally"],
  },
  {
    eyebrow: "Export and track",
    title: "Choose a template, download the PDF, and track it.",
    description:
      "Pick Harvard, Modern, or Minimal, export a polished PDF, and save the job to your application board.",
    metric: "PDF ready",
    mockup: "export",
    bullets: ["Harvard / Modern / Minimal templates", "Download tailored PDF", "Save to tracker board"],
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
  "Add the missing keywords to your skills section.",
  "Rewrite the API bullet with measurable backend impact.",
  "Generate a cover letter for the target role.",
] as const;

export const METRICS = [
  {
    value: 4,
    suffix: "",
    decimals: 0,
    label: "analysis scores",
    detail: "Overall, keyword, experience, and skills scores for every job match.",
  },
  {
    value: 3,
    suffix: "",
    decimals: 0,
    label: "resume templates",
    detail: "Export a tailored PDF in Harvard, Modern, or Minimal.",
  },
  {
    value: 5,
    suffix: "",
    decimals: 0,
    label: "tracker stages",
    detail: "Move each role from saved to applied, interview, offer, or rejected.",
  },
] as const;
