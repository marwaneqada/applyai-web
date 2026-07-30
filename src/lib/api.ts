export type AccountType = "candidate" | "hr";

export const INVALID_CREDENTIALS_MESSAGE =
  "The email or password you entered is incorrect.";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  account_type: AccountType;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type MeResponse = {
  data: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  account_type?: AccountType;
  company_name?: string;
};

export type Company = {
  id: number;
  name: string;
  membership_role: "owner" | "member";
  created_at: string | null;
};

export type JobStatus = "draft" | "open" | "closed";
export type JobApplicationState = "applied" | "not_applied";
export type PostedWithinDays = 1 | 3 | 7 | 14 | 30;
export type JobSearchFilters = {
  q?: string;
  skill?: string;
  employment_type?: EmploymentType;
  work_mode?: WorkMode;
  experience_level?: "junior" | "mid" | "senior" | "lead";
  application_state?: JobApplicationState;
  posted_within_days?: PostedWithinDays;
};
export type HrJob = {
  id: number;
  company_id: number;
  title: string;
  summary: string | null;
  company_name?: string;
  description: string;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  location: string | null;
  experience_level: string | null;
  work_mode: string | null;
  employment_type: string | null;
  status: JobStatus;
  opens_at: string | null;
  closes_at: string | null;
  accepting_applications: boolean;
  submissions_count?: number;
  application_status?: ApplicationStatus | null;
  created_at: string | null;
  updated_at: string | null;
};
export type UpsertHrJobPayload = Omit<
  HrJob,
  | "id"
  | "company_id"
  | "company_name"
  | "accepting_applications"
  | "submissions_count"
  | "application_status"
  | "created_at"
  | "updated_at"
>;

export type JobSubmissionStatus =
  | "new"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export type JobSubmissionSource =
  | "applyai"
  | "gmail"
  | "linkedin_email"
  | "indeed_email"
  | "other_email";

export type JobSubmissionDocument = {
  id: number;
  type: "resume" | "cover_letter" | "other";
  original_filename: string;
  mime_type: string;
  file_size: number;
  download_url: string;
};

export type JobSubmissionMatch = {
  status: "pending" | "processing" | "completed" | "failed";
  overall_score: number | null;
  skills_score: number | null;
  experience_score: number | null;
  matched_requirements: string[] | null;
  missing_requirements: string[] | null;
  strengths: string[] | null;
  concerns: string[] | null;
  summary: string | null;
  error_message: string | null;
  analyzed_at: string | null;
};

export type JobSubmission = {
  id: number;
  job: {
    id: number;
    title: string;
    company_name: string;
  };
  candidate_user_id: number | null;
  source: JobSubmissionSource;
  source_reference: string | null;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  status: JobSubmissionStatus;
  cover_letter: string | null;
  notes: string | null;
  documents: JobSubmissionDocument[];
  match: JobSubmissionMatch | null;
  submitted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type JobSubmissionFilters = {
  q?: string;
  job_id?: number;
  status?: JobSubmissionStatus;
  source?: JobSubmissionSource;
  sort?: "submitted_at" | "match_score";
  direction?: "asc" | "desc";
};

export type UpdateJobSubmissionPayload = {
  status?: JobSubmissionStatus;
  notes?: string | null;
};

export type HrJobOption = {
  id: number;
  title: string;
};

export type SubmitJobApplicationPayload = {
  resume_id: number;
  cover_letter?: string | null;
};

export type CandidateProfile = {
  id: number;
  name: string;
  email: string;
  account_type: "candidate";
  headline: string | null;
  phone: string | null;
  location: string | null;
  professional_summary: string | null;
  desired_roles: string[] | null;
  preferred_locations: string[] | null;
  work_modes: WorkMode[] | null;
  employment_types: EmploymentType[] | null;
  availability: CandidateAvailability | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type UpdateCandidateProfilePayload = {
  name?: string;
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  professional_summary?: string | null;
  desired_roles?: string[] | null;
  preferred_locations?: string[] | null;
  work_modes?: WorkMode[] | null;
  employment_types?: EmploymentType[] | null;
  availability?: CandidateAvailability | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
};

export type WorkMode = "remote" | "hybrid" | "on_site";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type CandidateAvailability =
  | "actively_looking"
  | "open_to_opportunities"
  | "not_looking";

export type ResumeParseStatus = "pending" | "success" | "failed";

export type Resume = {
  id: number;
  original_filename: string;
  file_size: number;
  mime_type: string;
  parse_status: ResumeParseStatus;
  parse_error: string | null;
  created_at: string | null;
};

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";
export type GapSeverity = "critical" | "important" | "nice_to_have";

export type GapAnalysisItem = {
  skill: string;
  severity: GapSeverity;
  explanation: string;
};

export type RewrittenBullet = {
  original: string;
  rewritten: string;
};

export type AnalysisResult = {
  overall_score: number;
  keyword_score: number;
  experience_score: number;
  skills_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  strengths: string[];
  weaknesses: string[];
  gap_analysis: GapAnalysisItem[];
  rewritten_bullets: RewrittenBullet[];
  cover_letter: string;
  model_used: string | null;
};

export type Analysis = {
  id: number;
  resume_id: number;
  job_title: string;
  company_name: string | null;
  job_url: string | null;
  job_description: string;
  status: AnalysisStatus;
  error_message: string | null;
  result: AnalysisResult | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateAnalysisPayload = {
  resume_id: number;
  job_title: string;
  company_name?: string | null;
  job_url?: string | null;
  job_description: string;
};

export type ResumePdfTemplate = "harvard" | "modern" | "minimal";

export type ResumeStructureState = {
  status: string;
  ready: boolean;
};

export type ApplicationStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export type Application = {
  id: number;
  analysis_id: number | null;
  job_post_id: number | null;
  job_submission_id: number | null;
  company_name: string;
  job_title: string;
  job_url: string | null;
  status: ApplicationStatus;
  applied_date: string | null;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  position: number;
  created_at: string | null;
  updated_at: string | null;
};

export type ApplicationBoard = Record<ApplicationStatus, Application[]>;

export type CreateApplicationPayload = {
  analysis_id?: number | null;
  company_name: string;
  job_title: string;
  job_url?: string | null;
  applied_date?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  notes?: string | null;
};

export type UpdateApplicationPayload = Partial<CreateApplicationPayload>;

export type MoveApplicationPayload = {
  status: ApplicationStatus;
  after_application_id?: number | null;
  before_application_id?: number | null;
};

type CollectionResponse<T> = { data: T[] };
type ResourceResponse<T> = { data: T };
export type PaginationMeta = {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
};
export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type FieldErrors = Record<string, string>;

type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: unknown;
  headers?: HeadersInit;
  token?: string | null;
};

function getApiBaseUrl() {
  const configuredUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

  return configuredUrl.endsWith("/api")
    ? configuredUrl.slice(0, -"/api".length)
    : configuredUrl;
}

const API_BASE_URL = getApiBaseUrl();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === "string");
  }

  return undefined;
}

function safeFieldMessage(field: string, message: string | undefined, status: number) {
  if (field === "name") {
    return "Enter your name.";
  }

  if (field === "email") {
    const lowerMessage = message?.toLowerCase() ?? "";

    if (lowerMessage.includes("taken") || lowerMessage.includes("already")) {
      return "That email is already registered.";
    }

    if (status === 422 && lowerMessage.includes("credential")) {
      return INVALID_CREDENTIALS_MESSAGE;
    }

    return "Enter a valid email address.";
  }

  if (field === "password") {
    return "Use at least 8 characters.";
  }

  if (field === "resume") {
    return "Upload a PDF that is 5 MB or smaller.";
  }

  if (field === "resume_id") {
    return message ?? "Select a resume from your library.";
  }

  if (field === "cover_letter") {
    return "Keep your cover letter to 10,000 characters or fewer.";
  }

  if (field === "job_title") {
    return "Enter the job title.";
  }

  if (field === "job_description") {
    return "Paste the job description (at least 100 characters).";
  }

  if (field === "job_url") {
    return "Enter a valid URL, or leave it blank.";
  }

  if (field === "title") {
    return "Enter a job title.";
  }

  if (field === "summary") {
    return "Write a card summary between 20 and 300 characters.";
  }

  if (field === "description") {
    return "Write a job description with at least 50 characters.";
  }

  if (field === "status") {
    return "Choose a valid job status.";
  }

  if (field === "opens_at") {
    return message ?? "Choose when applications open.";
  }

  if (field === "closes_at") {
    return message ?? "Choose when applications close.";
  }

  if (field === "required_skills" || field.startsWith("required_skills.")) {
    return "Add valid required skills, one at a time.";
  }

  if (field === "preferred_skills" || field.startsWith("preferred_skills.")) {
    return "Add valid preferred skills, one at a time.";
  }

  if (field === "experience_level") {
    return "Choose a valid experience level.";
  }

  if (field === "work_mode") {
    return "Choose a valid work mode.";
  }

  if (field === "employment_type") {
    return "Choose a valid employment type.";
  }

  if (field === "company_name") {
    return "Enter the company name.";
  }

  if (field === "headline") {
    return "Keep your headline to 160 characters or fewer.";
  }

  if (field === "phone") {
    return "Keep your phone number to 30 characters or fewer.";
  }

  if (field === "location") {
    return "Keep your location to 255 characters or fewer.";
  }

  if (field === "professional_summary") {
    return "Keep your summary to 2,000 characters or fewer.";
  }

  if (["linkedin_url", "github_url", "portfolio_url"].includes(field)) {
    return "Enter a complete http:// or https:// URL, or leave it blank.";
  }

  if (field === "contact_email") {
    return "Enter a valid email, or leave it blank.";
  }

  if (field === "applied_date") {
    return "Enter a valid date, or leave it blank.";
  }

  if (field === "analysis_id") {
    return message ?? "The selected analysis is invalid.";
  }

  return undefined;
}

function normalizeFieldErrors(payload: unknown, status: number): FieldErrors {
  if (!isRecord(payload) || !isRecord(payload.errors)) {
    return {};
  }

  return Object.entries(payload.errors).reduce<FieldErrors>((errors, [field, value]) => {
    const message = firstString(value);
    const safeMessage = safeFieldMessage(field, message, status);

    if (safeMessage) {
      errors[field] = safeMessage;
    }

    return errors;
  }, {});
}

function messageForStatus(status: number, payload: unknown) {
  const hasFieldErrors =
    isRecord(payload) && isRecord(payload.errors) && Object.keys(payload.errors).length > 0;

  if (hasFieldErrors) {
    return "Please check the highlighted fields.";
  }

  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }

  if (status === 422) {
    return "We could not verify those details. Please try again.";
  }

  if (status >= 500) {
    return "ApplyAI is having trouble responding right now. Please try again shortly.";
  }

  if (status === 404) {
    return "This ApplyAI action is not available right now. Please try again shortly.";
  }

  return "Something went wrong. Please try again.";
}

export class ApiError extends Error {
  fieldErrors: FieldErrors;
  status: number;

  constructor({
    fieldErrors = {},
    message,
    status,
  }: {
    fieldErrors?: FieldErrors;
    message: string;
    status: number;
  }) {
    super(message);
    this.name = "ApiError";
    this.fieldErrors = fieldErrors;
    this.status = status;
  }
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export async function apiRequest<T>(
  path: string,
  { body, headers, token, ...options }: ApiRequestOptions = {},
) {
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");

  let requestBody: BodyInit | undefined;

  if (body instanceof FormData) {
    // Let the browser set the multipart boundary; don't force a Content-Type.
    requestBody = body;
  } else if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body: requestBody,
    headers: requestHeaders,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as unknown)
    : undefined;

  if (!response.ok) {
    throw new ApiError({
      fieldErrors: normalizeFieldErrors(payload, response.status),
      message: messageForStatus(response.status, payload),
      status: response.status,
    });
  }

  return payload as T;
}

export function loginRequest(payload: LoginRequest) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    body: payload,
    method: "POST",
  });
}

export function registerRequest(payload: RegisterRequest) {
  return apiRequest<AuthResponse>("/api/auth/register", {
    body: payload,
    method: "POST",
  });
}

export async function currentUserRequest(token: string) {
  const response = await apiRequest<MeResponse>("/api/me", {
    method: "GET",
    token,
  });

  return response.data;
}

export function logoutRequest(token: string) {
  return apiRequest<{ message?: string }>("/api/auth/logout", {
    method: "POST",
    token,
  });
}

export async function getCandidateProfile(token: string) {
  const response = await apiRequest<ResourceResponse<CandidateProfile>>(
    "/api/candidate/profile",
    {
      method: "GET",
      token,
    },
  );

  return response.data;
}

export async function updateCandidateProfile(
  token: string,
  payload: UpdateCandidateProfilePayload,
) {
  const response = await apiRequest<ResourceResponse<CandidateProfile>>(
    "/api/candidate/profile",
    {
      body: payload,
      method: "PATCH",
      token,
    },
  );

  return response.data;
}

export async function getHrCompany(token: string) {
  const response = await apiRequest<ResourceResponse<Company>>("/api/hr/company", {
    method: "GET",
    token,
  });

  return response.data;
}

export async function listHrJobs(token: string, page = 1, perPage = 10) {
  return apiRequest<PaginatedResponse<HrJob>>(
    `/api/hr/jobs?page=${page}&per_page=${perPage}`,
    { method: "GET", token },
  );
}

export async function getHrJob(token: string, id: number) {
  const response = await apiRequest<ResourceResponse<HrJob>>(
    `/api/hr/jobs/${id}`,
    { method: "GET", token },
  );

  return response.data;
}

export async function listHrJobOptions(token: string) {
  const response = await apiRequest<CollectionResponse<HrJobOption>>(
    "/api/hr/jobs/options",
    { method: "GET", token },
  );

  return response.data;
}

export async function createHrJob(token: string, payload: UpsertHrJobPayload) {
  const response = await apiRequest<ResourceResponse<HrJob>>("/api/hr/jobs", { body: payload, method: "POST", token });
  return response.data;
}

export async function updateHrJob(token: string, id: number, payload: Partial<UpsertHrJobPayload>) {
  const response = await apiRequest<ResourceResponse<HrJob>>(`/api/hr/jobs/${id}`, { body: payload, method: "PATCH", token });
  return response.data;
}

export function deleteHrJob(token: string, id: number) {
  return apiRequest<void>(`/api/hr/jobs/${id}`, { method: "DELETE", token });
}

function jobSearchParams(
  filters: JobSearchFilters,
  page = 1,
  perPage = 10,
  preferences = false,
) {
  const params = new URLSearchParams();

  if (preferences) params.set("match_preferences", "1");
  params.set("page", String(page));
  params.set("per_page", String(perPage));

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, String(value));
    }
  }

  return params;
}

export async function listCandidateJobs(
  token: string,
  filters: JobSearchFilters = {},
  page = 1,
  perPage = 10,
) {
  const params = jobSearchParams(filters, page, perPage);
  return apiRequest<PaginatedResponse<HrJob>>(
    `/api/candidate/jobs?${params}`,
    { method: "GET", token },
  );
}

export async function getCandidateJob(token: string, id: number) {
  const response = await apiRequest<ResourceResponse<HrJob>>(`/api/candidate/jobs/${id}`, { method: "GET", token });
  return response.data;
}

export async function applyToJob(
  token: string,
  id: number,
  payload: SubmitJobApplicationPayload,
) {
  const response = await apiRequest<ResourceResponse<HrJob>>(`/api/candidate/jobs/${id}/apply`, {
    body: payload,
    method: "POST",
    token,
  });

  return response.data;
}

export async function listHrSubmissions(
  token: string,
  filters: JobSubmissionFilters = {},
  page = 1,
  perPage = 10,
) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, String(value));
    }
  }

  return apiRequest<PaginatedResponse<JobSubmission>>(
    `/api/hr/submissions?${params}`,
    { method: "GET", token },
  );
}

export async function updateHrSubmission(
  token: string,
  id: number,
  payload: UpdateJobSubmissionPayload,
) {
  const response = await apiRequest<ResourceResponse<JobSubmission>>(
    `/api/hr/submissions/${id}`,
    { body: payload, method: "PATCH", token },
  );

  return response.data;
}

export async function reanalyzeHrSubmission(token: string, id: number) {
  const response = await apiRequest<ResourceResponse<JobSubmission>>(
    `/api/hr/submissions/${id}/reanalyze`,
    { method: "POST", token },
  );

  return response.data;
}

export async function downloadHrSubmissionDocument(
  token: string,
  submissionId: number,
  document: JobSubmissionDocument,
) {
  const response = await fetch(
    `${API_BASE_URL}/api/hr/submissions/${submissionId}/documents/${document.id}`,
    {
      headers: {
        Accept: document.mime_type,
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new ApiError({
      message: messageForStatus(response.status, undefined),
      status: response.status,
    });
  }

  return response.blob();
}

export async function listPublicJobs(
  filters: JobSearchFilters = {},
  page = 1,
  perPage = 10,
) {
  const params = jobSearchParams(filters, page, perPage);
  return apiRequest<PaginatedResponse<HrJob>>(`/api/jobs?${params}`, {
    method: "GET",
  });
}

export async function listResumes(token: string) {
  const response = await apiRequest<CollectionResponse<Resume>>("/api/resumes", {
    method: "GET",
    token,
  });

  return response.data;
}

export async function uploadResume(token: string, file: File) {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await apiRequest<ResourceResponse<Resume>>("/api/resumes", {
    body: formData,
    method: "POST",
    token,
  });

  return response.data;
}

export function deleteResume(token: string, id: number) {
  return apiRequest<void>(`/api/resumes/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function listAnalyses(token: string) {
  const response = await apiRequest<CollectionResponse<Analysis>>("/api/analyses", {
    method: "GET",
    token,
  });

  return response.data;
}

export async function createAnalysis(token: string, payload: CreateAnalysisPayload) {
  const response = await apiRequest<ResourceResponse<Analysis>>("/api/analyses", {
    body: payload,
    method: "POST",
    token,
  });

  return response.data;
}

export async function getAnalysis(token: string, id: number) {
  const response = await apiRequest<ResourceResponse<Analysis>>(`/api/analyses/${id}`, {
    method: "GET",
    token,
  });

  return response.data;
}

export async function getAnalysisStatus(token: string, id: number) {
  const response = await apiRequest<{ data: { status: AnalysisStatus } }>(
    `/api/analyses/${id}/status`,
    {
      method: "GET",
      token,
    },
  );

  return response.data.status;
}

export async function retryAnalysis(token: string, id: number) {
  const response = await apiRequest<ResourceResponse<Analysis>>(
    `/api/analyses/${id}/retry`,
    {
      method: "POST",
      token,
    },
  );

  return response.data;
}

export async function prepareResumeStructure(token: string, analysisId: number) {
  const response = await apiRequest<{ data: ResumeStructureState }>(
    `/api/analyses/${analysisId}/resume/structure`,
    {
      method: "POST",
      token,
    },
  );

  return response.data;
}

export async function getResumeStructureStatus(token: string, analysisId: number) {
  const response = await apiRequest<{ data: ResumeStructureState }>(
    `/api/analyses/${analysisId}/resume/structure/status`,
    {
      method: "GET",
      token,
    },
  );

  return response.data;
}

export async function generateResumePdf(
  token: string,
  analysisId: number,
  template: ResumePdfTemplate,
): Promise<Blob> {
  // This endpoint returns raw PDF bytes, so it bypasses the JSON-only client.
  const response = await fetch(
    `${API_BASE_URL}/api/analyses/${analysisId}/resume/pdf`,
    {
      body: JSON.stringify({ template }),
      headers: {
        Accept: "application/pdf",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    const serverMessage =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : undefined;

    throw new ApiError({
      fieldErrors: normalizeFieldErrors(payload, response.status),
      message: serverMessage ?? messageForStatus(response.status, payload),
      status: response.status,
    });
  }

  return response.blob();
}

export async function getApplicationBoard(token: string) {
  const response = await apiRequest<{ data: ApplicationBoard }>("/api/applications", {
    method: "GET",
    token,
  });

  return response.data;
}

export async function createApplication(
  token: string,
  payload: CreateApplicationPayload,
) {
  const response = await apiRequest<ResourceResponse<Application>>("/api/applications", {
    body: payload,
    method: "POST",
    token,
  });

  return response.data;
}

export async function updateApplication(
  token: string,
  id: number,
  payload: UpdateApplicationPayload,
) {
  const response = await apiRequest<ResourceResponse<Application>>(
    `/api/applications/${id}`,
    {
      body: payload,
      method: "PATCH",
      token,
    },
  );

  return response.data;
}

export async function moveApplication(
  token: string,
  id: number,
  payload: MoveApplicationPayload,
) {
  const response = await apiRequest<ResourceResponse<Application>>(
    `/api/applications/${id}/move`,
    {
      body: payload,
      method: "PATCH",
      token,
    },
  );

  return response.data;
}

export function deleteApplication(token: string, id: number) {
  return apiRequest<void>(`/api/applications/${id}`, {
    method: "DELETE",
    token,
  });
}
