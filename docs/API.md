# CivicPulse API (draft)

All application endpoints use JSON unless noted otherwise. Successful JSON
responses use `{ "success": true, "data": ... }`; validation and known
application errors use `{ "success": false, "error": { "code": ..., "message": ... } }`.
Validation errors return HTTP 400. Protected routes require a valid session;
the role and resource scopes below are enforced server-side.

## Authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| Auth.js handler | `/api/auth/*` | Public entry point; credentials are checked by Auth.js | Sign in/out and session handling |
| POST | `/api/auth/register` | Public | Register a citizen account |

## Issues

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/issues` | Signed-in users; citizen sees own, staff sees issues on own tasks, manager sees own department, admin sees all | Filtered, sorted, paginated issue list |
| POST | `/api/issues` | Citizen | Submit an issue; department is routed from category and nearby duplicates are flagged without blocking submission |
| GET | `/api/issues/nearby` | Signed-in users | Search active nearby issues for duplicate warnings |
| GET | `/api/issues/:id` | Same issue scope as the list | Issue details |
| PATCH | `/api/issues/:id` | Manager in issue department or admin | Update issue details |
| POST | `/api/issues/:id/status` | Role and transition rules | Apply a permitted workflow transition |
| POST | `/api/issues/:id/verify` | Manager in issue department or admin | Verify a submitted issue |
| POST | `/api/issues/:id/assign` | Manager in issue department or admin | Set priority and assign department staff |
| PATCH | `/api/issues/:id/priority` | Manager in issue department or admin | Update an active issue's priority |
| GET | `/api/issues/:id/history` | Same issue scope as the issue | Read the append-only issue history |

List query parameters:

| Parameter | Meaning |
| --- | --- |
| `page`, `limit` | Pagination; page starts at 1 and limit is 1–50 (default 20) |
| `q` | Search issue title or address |
| `status` | `SUBMITTED`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `category` | `ROAD_DAMAGE`, `STREETLIGHT`, `DRAINAGE`, `FOOTPATH`, `WASTE_MANAGEMENT`, `PUBLIC_INFRASTRUCTURE` |
| `departmentId`, `locationId` | Department and location filters |
| `from`, `to` | ISO date/date-time bounds for issue creation |
| `sort` | `createdAt`, `updatedAt`, `priority`, `status`, or `title`, followed by `:asc` or `:desc` (for example `createdAt:desc`) |

Nearby search accepts `latitude`, `longitude`, optional `radius` in meters,
and optional `category`. The radius defaults to the system duplicate radius
(50 meters when not configured). Candidates are warnings only.

`POST /api/issues/:id/assign` accepts `assigneeId`, `priority`, optional ISO
`dueAt`, and optional `note`. `/status` accepts `status` plus transition-specific
fields: `taskId`, assignment fields, or a required `note` and `closeReason`
(`CANCELLED`, `INVALID`, or `DUPLICATE`) for early closure.

## Tasks

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/tasks` | Staff sees own tasks; manager sees department tasks; admin sees all | Paginated task list |
| GET | `/api/tasks/:id` | Assigned staff, own-department manager, or admin | Task details |
| PATCH | `/api/tasks/:id` | Own-department manager or admin | Update assignment/due date; status changes use workflow actions |
| POST | `/api/tasks/:id/updates` | Assigned staff | Add a progress update or submit completion photos |
| POST | `/api/tasks/:id/review` | Own-department manager or admin | Approve or return completed work |

Task list accepts `page`, `limit` (maximum 50), and `status` (`PENDING`,
`IN_PROGRESS`, `COMPLETED`, `REJECTED`). The updates body is tagged with
`action: "PROGRESS"` and progress fields, or `action: "COMPLETE"` and
`completionPhotoUrls`. A return review requires a note.

## Departments, users, locations, and settings

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET / POST | `/api/departments` | Signed-in / admin | List active departments / create department |
| GET / PATCH | `/api/departments/:id` | Signed-in / admin | Read department / update department and manager |
| GET / POST | `/api/users` | Admin | Paginated user list / create user |
| GET / PATCH | `/api/users/:id` | Admin | Read or update user, role, department, or active status |
| GET / PATCH / PUT | `/api/users/me` | Signed-in user | Read profile / update profile / change password |
| GET | `/api/locations` | Signed-in user | Paginated locations |
| GET / PATCH | `/api/settings` | Admin | Read or update system configuration |

User list accepts `page`, `limit`, `role`, and `departmentId`. Location list
accepts `page`, `limit`, `area`, `ward`, and `q`. System settings cover
priority-based SLA hours, duplicate radius, dispatch policy, and reminder
interval.

## Feedback, notifications, uploads, reminders, and analytics

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/feedback` | Citizen; own resolved issue | Submit a 1–5 rating and optional comment |
| GET | `/api/notifications` | Signed-in user; own notifications only | Paginated notifications |
| PATCH | `/api/notifications/:id/read` | Signed-in user; own notification only | Mark notification read |
| POST | `/api/upload` | Signed-in user | Multipart image upload (`file`); JPEG, PNG, WebP, max 5 MiB |
| GET | `/api/cron/reminders` | `Authorization: Bearer <CRON_SECRET>` | Send due-task and breached-SLA reminders |
| GET | `/api/analytics/summary` | Manager (own department) or admin | Summary and SLA compliance |
| GET | `/api/analytics/trends` | Manager (own department) or admin | Issue trends |
| GET | `/api/analytics/departments` | Manager (own department) or admin | Department issue counts |
| GET | `/api/analytics/satisfaction` | Manager (own department) or admin | Feedback rating totals and average |
| GET | `/api/export/issues/:id/pdf` | Same issue scope as issue details | Download issue report PDF |

Notification polling accepts optional `since` (ISO date-time), `page`, and
`limit`. Analytics trends accepts optional `from`, `to`, and `interval` (`day`
or `month`).
