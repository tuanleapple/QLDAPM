# API guide for frontend integration

**Dành cho team FE:** bắt đầu tại [Hướng dẫn màn hình → thao tác → API bằng tiếng Việt](frontend-integration.md). Tài liệu đó ghi từng nút bấm, nguồn ID, trường hiển thị, thứ tự gọi, trạng thái và phần chưa được backend hỗ trợ. Tên màn hình là đề xuất tích hợp; chưa phải thiết kế FE đã được xác nhận.

This guide documents the backend routes implemented in the current source. API prefix is `/api`; OpenAPI/Swagger is available at `/api/docs` when the backend is running. The repository implementation brief is [`backend-requirements.md`](backend-requirements.md). No route described as planned is represented as an implemented API here.

## Run and connect

Requirements: Node.js 20+, npm 9+, PostgreSQL. From the repository root:

```bash
cd backend
npm install
npm run start:dev
```

Configure the variables named in `backend/.env.example` in a local, untracked `backend/.env`. The backend listens on port `3000` by default; `PORT` changes it. Use:

- Base URL: `http://localhost:3000/api`
- Health: `GET http://localhost:3000/api/health`
- Swagger UI: `http://localhost:3000/api/docs`

The root URL `/` has no route and returns 404. CORS allows the single origin configured by `CORS_ORIGIN` (default `http://localhost:3001`). Set it to the exact frontend origin used in development. It is not a secret. The frontend may set its API base URL to `http://localhost:3000/api` or use a development proxy to that URL. Do not put database credentials, signing keys, passwords or other server secrets in frontend environment variables.

No frontend is present in this repository. A frontend mock can be used offline while the backend is unavailable, but live integration should use the API response shapes below; mocks are not backend data and must not be treated as authorization.

## Authentication

`POST /auth/login` accepts `{ "email": "student@example.test", "password": "not-a-real-password" }`. It returns:

```json
{
  "accessToken": "example.access.token",
  "refreshToken": "example.refresh.token",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": { "id": "user-uuid", "email": "student@example.test", "role": "STUDENT" }
}
```

Use `Authorization: Bearer <accessToken>` on protected routes. On an expired access token, call `POST /auth/refresh` with `{ "refreshToken": "example.refresh.token" }`, replace **both** returned tokens, then retry the request. Refresh rotates and revokes the previous refresh token. `POST /auth/logout` revokes the current refresh session. `GET /auth/me` returns the current identity. `POST /auth/change-password` takes `currentPassword` and `newPassword` (12–128 characters for the new password) and clears the refresh session; sign in again afterward. An already issued access token can remain usable until its short expiry, unless the account is locked.

Public account registration, OAuth and OTP are not implemented. An OFFICER creates and locks/unlocks accounts. A one-time bootstrap officer can be created after migrations using the manual seed command in the root README; it does not reset an existing account.

For a complete local/test fixture dataset and manual Swagger checks, see [`testing-api.md`](testing-api.md). The demo seed refuses non-local/production targets and never runs during application startup.

## Response and validation conventions

- Successful paginated list routes return `{ "items": [], "total": 0, "page": 1, "limit": 20, "totalPages": 0 }`. The evaluation-form list returns an array directly. Page numbering starts at 1; default page size is 20 and maximum is 100 unless noted for CSV.
- Timestamps are ISO-8601. IDs are UUIDs. Scores and numeric database values may be serialized as decimal strings in entity responses; result score fields are formatted to two decimal places.
- NestJS errors use `{ "statusCode": 400, "message": "...", "error": "Bad Request" }`. Validation errors use an array in `message`. Common statuses are 400 validation/workflow, 401 authentication, 403 role/resource access, 404 missing or intentionally hidden unpublished data, and 409 uniqueness conflict where used.
- Creating or renaming an enterprise to an existing name returns 409. Evaluation submission, result finalization and result publication return 200; creation endpoints return 201 and supported deletions return 204.
- DTO validation rejects unknown body properties. Do not send `role` when changing an account, `evaluatorId` when saving an evaluation, or a report storage URL/path.
- Every protected endpoint below needs a Bearer access token. Roles are `STUDENT`, `OFFICER`, `SUPERVISOR`, `ENTERPRISE_REP`; access is further limited by record ownership, supervisor assignment or enterprise membership.

## Screen/action to API matrix

| Screen or workflow | Action/data | Endpoint | Permission and resource scope | Status |
|---|---|---|---|---|
| Sign in | Login, rotate, logout, identity, password change | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password` | Login/refresh public; other routes authenticated | Implemented |
| Officer account administration | Search/list, detail, create, edit, lock/unlock | `GET /users`, `GET /users/{id}`, `POST /users`, `PATCH /users/{id}`, `PATCH /users/{id}/lock`, `PATCH /users/{id}/unlock` | OFFICER | Implemented; no delete or role mutation |
| Student dashboard | Status counts, latest/current profile, period, enterprise, supervisor, deadline, progress count, latest report metadata | `GET /internships/dashboard/student` | STUDENT; own account | Implemented; no invented progress percent/tasks |
| Officer dashboard | Account total, profile counts by status and recent profiles | `GET /internships/dashboard/officer?periodId={id}` | OFFICER | Implemented; period filter optional |
| Period catalog | Search/list/detail and manage period | `GET /internships/periods`, `GET /internships/periods/{id}`, `POST /internships/periods`, `PATCH /internships/periods/{id}`, `DELETE /internships/periods/{id}` | STUDENT/OFFICER read; OFFICER writes | Implemented; delete only if unreferenced |
| Enterprise catalog | Search/list/detail and manage enterprise | `GET /internships/enterprises`, `GET /internships/enterprises/{id}`, `POST /internships/enterprises`, `PATCH /internships/enterprises/{id}`, `DELETE /internships/enterprises/{id}` | STUDENT/OFFICER read; OFFICER writes | Implemented; delete only if unreferenced |
| Supervisor selection | List supervisors for assignment | `GET /internships/supervisors` | OFFICER | Implemented; IDs are supervisor User IDs |
| Student profile list/create/edit/submit | Current student's profiles, draft, update, submit | `GET /internships/profiles`, `POST /internships/profiles`, `PATCH /internships/profiles/{id}`, `POST /internships/profiles/{id}/submit`, `DELETE /internships/profiles/{id}` | STUDENT; own records | Implemented; delete only own DRAFT with no history |
| Officer profile review | List, detail, approve/reject/request revision, assign supervisor | `GET /internships/profiles`, `GET /internships/profiles/{id}`, `PATCH /internships/profiles/{id}/review`, `PATCH /internships/profiles/{id}/assign-supervisor` | OFFICER | Implemented; rejection/revision require reason; approval requires supervisor; assignment cannot change after progress, report or evaluation activity |
| Supervisor/enterprise profile review | Scoped profile list/detail | `GET /internships/profiles`, `GET /internships/profiles/{id}` | SUPERVISOR: assigned profiles; ENTERPRISE_REP: its enterprise | Implemented |
| Progress | List/detail/create/edit progress; list/create/edit comments | `/progress/profiles/{profileId}/updates`, `/progress/updates/{id}`, `/progress/profiles/{profileId}/comments`, `/progress/comments/{id}` with GET/POST/PATCH as supported | Student owns progress; reviewer scope follows assigned supervisor/enterprise; OFFICER can review; comment author edits | Implemented; no deletes |
| Final report | Version list, upload, download | `GET /reports/profiles/{profileId}/versions`, `POST /reports/profiles/{profileId}`, `GET /reports/{id}/download` | Owner student uploads; student/assigned supervisor/OFFICER downloads; enterprise representative sees metadata only | Implemented; PDF/DOCX <=10 MiB |
| Evaluation criteria | List/detail and OFFICER manage period/type criteria | `GET /evaluations/periods/{periodId}/criteria`, `GET /evaluations/criteria/{id}`, `POST /evaluations/periods/{periodId}/criteria/{formType}`, `PATCH /evaluations/criteria/{id}`, `DELETE /evaluations/criteria/{id}` | Authenticated roles read active criteria; OFFICER can also read inactive criteria and write | Implemented; cannot change once a form exists in period |
| Evaluation forms | List, create/get draft, save, submit | `GET /evaluations/profiles/{profileId}/forms`, `POST /evaluations/profiles/{profileId}/forms/{formType}`, `GET /evaluations/forms/{id}`, `PATCH /evaluations/forms/{id}`, `POST /evaluations/forms/{id}/submit` | Enterprise rep for its enterprise/ENTERPRISE form; assigned supervisor/SUPERVISOR form; OFFICER reads | Implemented; exactly ENTERPRISE and SUPERVISOR |
| Result | Adjust, finalize, publish, view | `PATCH /evaluations/results/{profileId}/adjustment`, `POST /evaluations/results/{profileId}/finalize`, `POST /evaluations/results/{profileId}/publish`, `GET /evaluations/results/{profileId}` | OFFICER manages; student owner reads only published result | Implemented; no reopening |
| Notifications | List own, mark own as read | `GET /notifications`, `PATCH /notifications/{id}/read` | Any authenticated role; recipient scope | Implemented |
| CSV report | Export filtered profile list | `GET /internships/profiles/export.csv` | OFFICER | Implemented; up to 10,000 rows; formula-leading cells neutralized |
| Audit | Internal audit records for access denial and workflow events | No public route | Internal only | Implemented internally; no audit browsing API |

## Where frontend obtains IDs

Do not hardcode database IDs. Load options from `GET /internships/periods`, `GET /internships/enterprises`, and (for OFFICER assignment) `GET /internships/supervisors`; use each item's `id`. Creating a draft returns its `id`; use it for profile detail, submit, update and report/progress actions. The profile list/detail/dashboard returns `period`, `enterprise`, `supervisor` display data alongside the corresponding IDs. Evaluation criteria IDs come from the period/type criteria endpoint. Create a form with the current `profileId` and `formType`; the server derives `evaluatorId` from the access token. The report version list returns report `id`; use that exact ID in the supervisor form's `reportId`.

## Main integration sequence

1. Sign in at `POST /auth/login`; store access and refresh tokens using the frontend's secure session approach.
2. Load `GET /internships/dashboard/student` and `GET /internships/periods`. If no profile exists, load `GET /internships/enterprises` for selection.
3. Create a draft with `POST /internships/profiles` (at minimum `periodId`; draft selection fields may be incomplete), then edit it with `PATCH /internships/profiles/{id}`.
4. Submit with `POST /internships/profiles/{id}/submit`. The server requires enterprise, position and internship dates, validates the registration window and date range, and moves the status to `SUBMITTED`.
5. OFFICER loads `GET /internships/profiles?status=SUBMITTED`, opens detail, then calls `PATCH /internships/profiles/{id}/review`. Approval requires `supervisorId`; obtain it from `GET /internships/supervisors`. A revision/rejection requires `reason`.
6. Student refreshes dashboard/detail to see status and assigned supervisor. Once approved, the student can submit progress updates and a final report. Report versions appear through `GET /reports/profiles/{profileId}/versions`.
7. The enterprise representative and assigned supervisor each create their form using `formType=ENTERPRISE` or `SUPERVISOR`. Load criteria first. Save the complete draft with `PATCH /evaluations/forms/{id}` and submit with `POST /evaluations/forms/{id}/submit`. Supervisor submission includes a report version ID and scores for every active criterion in both `PROCESS` and `REPORT` categories.
8. After both forms are submitted the backend calculates the result. OFFICER may adjust it with a reason, finalize, then publish. Student reads it from `GET /evaluations/results/{profileId}` after publication.

## Request examples

### Create a draft and submit it

```http
POST /api/internships/profiles
Authorization: Bearer example.access.token
Content-Type: application/json
```

```json
{ "periodId": "period-uuid", "enterpriseId": "enterprise-uuid", "position": "Backend intern" }
```

The response is a profile with `id`, `status: "DRAFT"`, and linked display data. Complete/update the draft fields, then:

```http
POST /api/internships/profiles/profile-uuid/submit
Authorization: Bearer example.access.token
```

### Review and assign

```json
{
  "status": "APPROVED",
  "supervisorId": "supervisor-user-uuid"
}
```

For revision/rejection, send for example `{ "status": "NEEDS_REVISION", "reason": "Please complete the internship dates." }`.

### Upload a final report

```http
POST /api/reports/profiles/profile-uuid
Authorization: Bearer example.access.token
Content-Type: multipart/form-data
```

Form field `file` must contain a valid PDF or DOCX, size >0 and <=10 MiB (10,485,760 bytes). Upload is only for the owner student after approval and before supervisor evaluation is submitted/result finalized. The response contains metadata (`id`, `version`, `originalName`, `mimeType`, `sizeBytes`, `submittedAt`, `isLate`); it does not contain a public file URL. Download via `GET /api/reports/{reportId}/download`; response is binary with `Content-Disposition: attachment`. Registration supporting documents are not accepted by this route.

### Save and submit evaluations

```json
{
  "details": [
    { "criteriaId": "criterion-uuid-1", "score": 8.5, "comment": "Clear technical communication" },
    { "criteriaId": "criterion-uuid-2", "score": 9 }
  ],
  "reportId": "report-version-uuid"
}
```

`reportId` is required only for supervisor form submission and must belong to the same profile. Score range is 0–10. A submitted form is locked. `evaluatorId` is never accepted from the client.

### Adjust and finalize result

```json
{ "score": 8.25, "reason": "Approved correction after committee review" }
```

Adjustment is permitted only before finalization. The result retains the calculated score and stores each adjustment's old/new score, reason, actor and timestamp. Finalize only after both submitted forms exist; publish afterward.

## Implemented workflow rules and current limits

- Profile transitions: `DRAFT → SUBMITTED → NEEDS_REVISION → SUBMITTED`, or `SUBMITTED → APPROVED/REJECTED`; approved profiles can move to `REPORT_SUBMITTED` when a report is uploaded. Approval requires assignment. Registration submission requires complete fields and the active period window. Supervisor reassignment is locked after progress, report or evaluation activity begins.
- Student can delete only an owned DRAFT with no status history. Account delete, catalog delete with references, report deletion, progress deletion, submitted form deletion and finalized result reopening are not available.
- Progress period/work/outcome/difficulties are required on new updates. Only student authors update progress. Review comments are role/resource scoped; only their author edits them. Writes lock after finalization.
- Final reports retain prior versions and use private server storage. The upload endpoint is not for application/registration support documents. Enterprise representatives cannot download report contents.
- Current forms are exactly `ENTERPRISE` and `SUPERVISOR`; supervisor criteria must cover both `PROCESS` and `REPORT`. Component scores are arithmetic means. Period weights default to 40/30/30 and must sum to 1. Decimal math calculates before rounding; effective total is stored/displayed to two decimals.
- Notifications are in-app only. Email, OTP, OAuth, public account registration, task/progress-percent dashboard, spreadsheet import and audit browsing API are not implemented.
- Existing legacy `SUPERVISOR_PROCESS` and `SUPERVISOR_REPORT` form rows are retained with legacy enum values by the migration. Human reconciliation is required before historical rows can become the new unified supervisor form; this task does not rewrite historical scores.

## Manual database preparation (not performed by the implementation task)

After selecting a dedicated local PostgreSQL database and setting local environment variables, an operator may run:

```bash
cd backend
npm run migration:run
```

To bootstrap the first OFFICER once the schema exists, set `OFFICER_BOOTSTRAP_EMAIL`, `OFFICER_BOOTSTRAP_NAME` and `OFFICER_BOOTSTRAP_PASSWORD` locally and run:

```bash
npm run seed:officer
```

The seed refuses to modify an existing account. Never run either command against an unidentified or production database without the team's deployment procedure. This task does not run migrations or seed against any database.

For the complete, idempotent API demo seed (all roles, workflow states, reports, evaluations, results, notifications and audit fixtures), follow [`testing-api.md`](testing-api.md) and run `npm run seed` only after migrations on a clearly named local/test database.

The previous HTTP/database workflow check passed 268 requests across 60 routes with no 5xx in that run. Standalone verification scripts and generated reports have been removed; use Swagger for manual integration checks. Successful create/delete calls may return 201/204, and intentional permission/validation rejection scenarios return the documented 4xx status.
