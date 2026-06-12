# ApplyAI Frontend API Guide

This document is a frontend handoff for the ApplyAI Laravel API.

All protected endpoints require:

```http
Authorization: Bearer {token}
Accept: application/json
```

For JSON requests, also send:

```http
Content-Type: application/json
```

For resume upload, use `multipart/form-data`.

## Core Flow

1. Register or login.
2. Store the returned bearer token.
3. Upload a resume PDF.
4. Confirm the resume `parse_status` is `success`.
5. Create an analysis with that `resume_id` and a job description.
6. Poll analysis status until `completed`.
7. Read the analysis result.
8. Start resume structuring for PDF.
9. Poll structured resume status until `ready`.
10. Generate/download a PDF with one of the supported templates.
11. Optionally create an application card from the analysis and manage it in the kanban board.

## Response Envelopes

Most entity responses use Laravel resource envelopes:

```json
{
  "data": {}
}
```

Auth responses are different:

```json
{
  "user": {},
  "token": "plain-text-token"
}
```

Validation errors:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field": ["Validation message."]
  }
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `202` | Queued/accepted |
| `204` | Deleted/no content |
| `401` | Missing or invalid bearer token |
| `403` | Resource belongs to another user |
| `404` | Missing resource |
| `409` | Structured resume not ready for PDF generation |
| `422` | Validation/domain error |

## Auth

### Register

```http
POST /api/auth/register
```

Body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

Validation:

| Field | Rules |
| --- | --- |
| `name` | required, string, max 255 |
| `email` | required, email, unique, max 255 |
| `password` | required, string, min 8 |

Success `201`:

```json
{
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "token": "1|..."
}
```

### Login

```http
POST /api/auth/login
```

Body:

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

Success `200`:

```json
{
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "token": "1|..."
}
```

Wrong credentials return `422` on `email`.

### Logout

```http
POST /api/auth/logout
```

Requires auth.

Success `200`:

```json
{
  "message": "Logged out successfully."
}
```

### Current User

```http
GET /api/me
```

Requires auth.

Success `200`:

```json
{
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

## Resumes

Resume upload parses the PDF immediately. If parsing fails, the upload still returns `201`, but the resume has `parse_status: "failed"` and `parse_error`.

Parse statuses:

```text
pending
success
failed
```

### Upload Resume

```http
POST /api/resumes
```

Requires auth.

Request type:

```text
multipart/form-data
```

Field:

| Field | Rules |
| --- | --- |
| `resume` | required, PDF file, max 5120 KB |

Success `201`:

```json
{
  "data": {
    "id": 10,
    "original_filename": "resume.pdf",
    "file_size": 123456,
    "mime_type": "application/pdf",
    "parse_status": "success",
    "parse_error": null,
    "created_at": "2026-05-21T10:00:00.000000Z"
  }
}
```

Frontend behavior:

- If `parse_status` is `success`, allow analysis creation.
- If `parse_status` is `failed`, show `parse_error` and ask the user to upload a readable PDF.

### List Resumes

```http
GET /api/resumes
```

Requires auth.

Success `200`:

```json
{
  "data": [
    {
      "id": 10,
      "original_filename": "resume.pdf",
      "file_size": 123456,
      "mime_type": "application/pdf",
      "parse_status": "success",
      "parse_error": null,
      "created_at": "2026-05-21T10:00:00.000000Z"
    }
  ]
}
```

### Show Resume

```http
GET /api/resumes/{resume}
```

Requires auth and ownership.

Success `200`: same object shape as upload.

### Delete Resume

```http
DELETE /api/resumes/{resume}
```

Requires auth and ownership.

Success `204` with empty body.

## Analyses

An analysis compares a parsed resume to a job description using AI.

Statuses:

```text
pending
processing
completed
failed
```

Important frontend behavior:

- Creating an analysis queues an AI job.
- The create response usually has `result: null`.
- Poll `/api/analyses/{analysis}/status` until `completed` or `failed`.
- Once completed, fetch `/api/analyses/{analysis}` to get the full result.

### Create Analysis

```http
POST /api/analyses
```

Requires auth.

Body:

```json
{
  "resume_id": 10,
  "job_title": "Backend Developer",
  "company_name": "Acme",
  "job_url": "https://example.com/jobs/backend-developer",
  "job_description": "Long job description with at least 100 characters..."
}
```

Validation:

| Field | Rules |
| --- | --- |
| `resume_id` | required, integer, exists |
| `job_title` | required, string, max 255 |
| `company_name` | nullable, string, max 255 |
| `job_url` | nullable, url, max 1000 |
| `job_description` | required, string, min 100 |

Domain rules:

- The resume must belong to the current user.
- The resume must have `parse_status: "success"`.
- Invalid ownership or parse state returns `422` on `resume_id`.

Success `201`:

```json
{
  "data": {
    "id": 25,
    "resume_id": 10,
    "job_title": "Backend Developer",
    "company_name": "Acme",
    "job_url": "https://example.com/jobs/backend-developer",
    "job_description": "Long job description...",
    "status": "pending",
    "error_message": null,
    "result": null,
    "created_at": "2026-05-21T10:05:00.000000Z",
    "updated_at": "2026-05-21T10:05:00.000000Z"
  }
}
```

### List Analyses

```http
GET /api/analyses
```

Requires auth.

Returns latest first.

Success `200`:

```json
{
  "data": [
    {
      "id": 25,
      "resume_id": 10,
      "job_title": "Backend Developer",
      "company_name": "Acme",
      "job_url": "https://example.com/jobs/backend-developer",
      "job_description": "Long job description...",
      "status": "completed",
      "error_message": null,
      "result": {
        "overall_score": 91,
        "keyword_score": 90,
        "experience_score": 92,
        "skills_score": 93,
        "matched_keywords": ["Laravel"],
        "missing_keywords": ["Docker"],
        "strengths": ["Strong PHP experience."],
        "weaknesses": ["Needs more deployment detail."],
        "gap_analysis": [
          {
            "skill": "Docker",
            "severity": "important",
            "explanation": "The role mentions containerized environments."
          }
        ],
        "rewritten_bullets": [
          {
            "original": "Built APIs.",
            "rewritten": "Built production Laravel APIs with tested queue workflows."
          }
        ],
        "cover_letter": "Dear Hiring Manager...",
        "model_used": "gemini-2.5-flash"
      },
      "created_at": "2026-05-21T10:05:00.000000Z",
      "updated_at": "2026-05-21T10:06:00.000000Z"
    }
  ]
}
```

### Show Analysis

```http
GET /api/analyses/{analysis}
```

Requires auth and ownership.

Success `200`: same object shape as list item.

### Analysis Status

```http
GET /api/analyses/{analysis}/status
```

Requires auth and ownership.

Success `200`:

```json
{
  "data": {
    "status": "completed"
  }
}
```

Recommended polling:

- Poll every 2-3 seconds after create.
- Stop when status is `completed` or `failed`.
- If `failed`, fetch the analysis and show `error_message`.

## Resume PDF Flow

PDF generation is intentionally split into two phases.

Phase 1 prepares structured resume data using AI and caches it.
Phase 2 generates the PDF quickly from cached structured data.

Supported templates:

```text
harvard
modern
minimal
```

### Start Resume Structuring

```http
POST /api/analyses/{analysis}/resume/structure
```

Requires auth and ownership.

Use this after the analysis is `completed`.

Success `202` when queued:

```json
{
  "data": {
    "status": "queued",
    "ready": false
  }
}
```

Success `200` when already cached:

```json
{
  "data": {
    "status": "ready",
    "ready": true
  }
}
```

### Check Resume Structuring Status

```http
GET /api/analyses/{analysis}/resume/structure/status
```

Requires auth and ownership.

Pending:

```json
{
  "data": {
    "status": "pending",
    "ready": false
  }
}
```

Ready:

```json
{
  "data": {
    "status": "ready",
    "ready": true
  }
}
```

Recommended polling:

- After starting structuring, poll every 2-3 seconds.
- Once `ready` is true, enable template selection/download.

### Generate Resume PDF

```http
POST /api/analyses/{analysis}/resume/pdf
```

Requires auth and ownership.

Body:

```json
{
  "template": "minimal"
}
```

Validation:

| Field | Rules |
| --- | --- |
| `template` | required, one of `harvard`, `modern`, `minimal` |

Success `200`:

```http
Content-Type: application/pdf
Content-Disposition: inline; filename="resume-minimal-25.pdf"
```

The response body is binary PDF content.

If structured resume is not ready:

```json
{
  "message": "Structured resume is not ready. Start resume structuring and try again once it is ready."
}
```

Status: `409`.

Frontend download example:

```ts
async function downloadResumePdf(analysisId: number, template: string, token: string) {
  const response = await fetch(`/api/analyses/${analysisId}/resume/pdf`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template }),
  });

  if (!response.ok) {
    throw await response.json();
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `resume-${template}-${analysisId}.pdf`;
  link.click();

  URL.revokeObjectURL(url);
}
```

## Applications

Applications are kanban cards for job tracking.

Statuses:

```text
saved
applied
interview
offer
rejected
```

### List Applications

```http
GET /api/applications
```

Requires auth.

Returns cards grouped by every status.

Success `200`:

```json
{
  "data": {
    "saved": [],
    "applied": [
      {
        "id": 1,
        "analysis_id": 25,
        "company_name": "Acme",
        "job_title": "Backend Developer",
        "job_url": "https://example.com/jobs/backend-developer",
        "status": "applied",
        "applied_date": "2026-05-21",
        "contact_name": "Jane Recruiter",
        "contact_email": "recruiter@example.com",
        "notes": "Follow up next week.",
        "position": 1,
        "created_at": "2026-05-21T10:10:00.000000Z",
        "updated_at": "2026-05-21T10:10:00.000000Z"
      }
    ],
    "interview": [],
    "offer": [],
    "rejected": []
  }
}
```

Use `position` for ordering inside each column.

### Create Application

```http
POST /api/applications
```

Requires auth.

Body:

```json
{
  "analysis_id": 25,
  "company_name": "Acme",
  "job_title": "Backend Developer",
  "job_url": "https://example.com/jobs/backend-developer",
  "applied_date": "2026-05-21",
  "contact_name": "Jane Recruiter",
  "contact_email": "recruiter@example.com",
  "notes": "Follow up next week."
}
```

Validation:

| Field | Rules |
| --- | --- |
| `analysis_id` | nullable, integer, exists |
| `company_name` | required, string, max 255 |
| `job_title` | required, string, max 255 |
| `job_url` | nullable, url, max 1000 |
| `applied_date` | nullable, date |
| `contact_name` | nullable, string, max 255 |
| `contact_email` | nullable, email, max 255 |
| `notes` | nullable, string |

Domain rules:

- If `analysis_id` is present, it must belong to the current user.
- New cards default to `status: "saved"`.
- New cards append to the end of the `saved` column.

Success `201`: returns an application resource.

### Show Application

```http
GET /api/applications/{application}
```

Requires auth and ownership.

Success `200`: returns an application resource.

### Update Application

```http
PUT /api/applications/{application}
```

Requires auth and ownership.

Body may contain any subset of:

```json
{
  "analysis_id": 25,
  "company_name": "Acme",
  "job_title": "Senior Backend Developer",
  "job_url": "https://example.com/jobs/senior-backend-developer",
  "applied_date": "2026-05-21",
  "contact_name": "Jane Recruiter",
  "contact_email": "recruiter@example.com",
  "notes": "Updated notes."
}
```

Status cannot be changed here. Use the move endpoint.

Success `200`: returns an application resource.

### Move Application

```http
PATCH /api/applications/{application}/move
```

Requires auth and ownership.

Body:

```json
{
  "status": "interview",
  "after_application_id": 5,
  "before_application_id": 8
}
```

Validation:

| Field | Rules |
| --- | --- |
| `status` | required, one of `saved`, `applied`, `interview`, `offer`, `rejected` |
| `after_application_id` | nullable, integer, exists |
| `before_application_id` | nullable, integer, exists |

Drag-and-drop behavior:

- Send `status` as the target column.
- Send `after_application_id` when dropped after another card.
- Send `before_application_id` when dropped before another card.
- Send both when dropped between two cards.
- Send neither when dropping into an empty column or appending.

Rules:

- Neighbor cards must belong to the current user.
- Neighbor cards must already be in the target status.
- Backend calculates a float `position`.

Success `200`: returns the moved application resource.

### Delete Application

```http
DELETE /api/applications/{application}
```

Requires auth and ownership.

Success `204` with empty body.

### Application Stats

```http
GET /api/applications/stats
```

Requires auth.

Success `200`:

```json
{
  "data": {
    "total": 8,
    "active": 7,
    "by_status": {
      "saved": 2,
      "applied": 3,
      "interview": 1,
      "offer": 1,
      "rejected": 1
    }
  }
}
```

`active` excludes rejected applications.

## Recommended Frontend Screens

### Auth

- Register
- Login
- Logout action

### Resume Library

- Upload PDF.
- List uploaded resumes.
- Show parse status.
- Disable analysis creation for failed/pending resumes.

### Analysis Builder

- Select parsed resume.
- Paste job description.
- Submit analysis.
- Show queued/processing state.
- Poll status.
- Render analysis scores, keywords, gaps, rewritten bullets, and cover letter.

### Resume PDF Generator

- Available only after analysis is `completed`.
- Start structuring with `POST /resume/structure`.
- Poll structure status.
- Let user choose `harvard`, `modern`, or `minimal`.
- Generate PDF with `POST /resume/pdf`.
- Handle `409` by restarting/polling structure status.

### Application Kanban

- Use `/api/applications` for grouped columns.
- Use `/api/applications/stats` for dashboard counters.
- Use `/move` for drag-and-drop.
- Use create/update/delete for card management.

## Notes For Frontend Team

- Store the bearer token securely according to the frontend platform.
- Always send `Accept: application/json` for API requests.
- For PDF download, expect binary `application/pdf`.
- All user-owned resources are protected. Wrong-owner access returns `403`.
- Do not assume AI work is instant. Analysis and resume structuring are asynchronous.
- The backend does not currently expose raw extracted resume text.
- The backend does not currently expose delete for analyses.
- There is no admin/super-admin API yet.
