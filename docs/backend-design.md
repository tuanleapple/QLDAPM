# Backend design

> This design was updated to match the implementation brief recorded in [`backend-requirements.md`](backend-requirements.md). It supersedes older draft statements that described three evaluation forms or a 20 MB report limit.

## Architecture and conventions

- Backend stack: NestJS, TypeScript, TypeORM and PostgreSQL.
- Module flow: Controller handles HTTP/DTO validation, Service enforces workflow and resource authorization, Repository owns TypeORM access.
- PostgreSQL schema changes are delivered as explicit migrations. TypeORM `synchronize` and `migrationsRun` remain disabled; migrations are run manually by an operator.
- Authentication roles are `STUDENT`, `OFFICER`, `SUPERVISOR` and `ENTERPRISE_REP`. Supervisor is a role/profile of `User`.
- API prefix is `/api`; Swagger UI is `/api/docs`.
- Keep passwords, token values, secrets, and private storage names out of responses and logs.

DTOs are grouped in each module's `*.dto.ts` files; request handlers remain in controllers. Shared pagination validation is in `common/pagination.dto.ts`. Within `InternshipsModule`, `catalog.controller/service/repository.ts` handles period/enterprise catalogs and supervisor lookup; `internships.*` handles profiles, dashboards and CSV. Profile transition/submission rules are in `profile.rules.ts`. Pure score calculation is in `evaluations/evaluation-score.ts`. HTTP paths and the catalog's original OpenAPI operation IDs are preserved. For a Vietnamese walkthrough, see [`code-walkthrough.md`](code-walkthrough.md).

Runtime application code is confined to `backend/src/`. Local seed/fixture tooling lives in `backend/tools/`; business and seed-safety unit tests live in `backend/test/unit/`. Build includes only `src/`. Standalone bulk HTTP verification, trivial health/Swagger tests, the health-only e2e configuration and generated test reports were removed. Applied migrations are retained unchanged.

## Current workflow model

```text
DRAFT → SUBMITTED → NEEDS_REVISION → SUBMITTED
                   ├→ APPROVED → REPORT_SUBMITTED
                   └→ REJECTED
```

- Student owns the profile; an OFFICER reviews it and assigns a supervisor.
- A DRAFT created without status history can be deleted by its owner. Submitted or historical profiles cannot be deleted.
- Profile submission requires completed registration fields and an open registration window.
- Progress updates and comments are immutable after result finalization. Students author progress; permitted reviewers comment; comment authors may edit their own comments.

## Reports and evaluation

- A final report accepts a structurally valid PDF or DOCX up to 10 MiB. It is saved with a generated private filename and versioned per profile. The original file name is metadata only.
- Enterprise representatives may see report metadata but cannot download report contents. Students, their assigned supervisor and OFFICER can download within resource scope.
- Registration support documents have no upload endpoint in this scope and are distinct from final reports.
- There are two current form types: `ENTERPRISE` and `SUPERVISOR`. Supervisor criteria are grouped as `PROCESS` and `REPORT`. Legacy split-form values are retained as legacy data by migration and require a separately reviewed reconciliation; they are not exposed as current forms.
- Criteria use averages within each category. Period weights default to 0.4 enterprise, 0.3 supervisor process and 0.3 supervisor report. Decimal arithmetic is used without intermediate rounding; component/calculated values retain precision, while the effective result is displayed to two decimal places.
- OFFICER may adjust a calculated result with a reason before finalization. The adjustment log preserves old/new score, actor and time. Finalized results cannot be changed; publication happens after finalization, and students see results only after publication.

## API and ownership

- List endpoints are paginated and bounded to 100 items where applicable.
- Authorization is both role-based and resource-based. OFFICER manages business workflows; STUDENT sees owned resources; SUPERVISOR sees assigned profiles; ENTERPRISE_REP sees resources associated with its enterprise.
- Client input never chooses the evaluator identity, user role on update, storage path, or report URL.
- Endpoint methods, validation constraints, permissions and known errors are documented in [`api.md`](api.md).

## Verification boundaries and open operational steps

- Unit tests can run without a database. API/database integration tests require a dedicated PostgreSQL database with migrations applied manually.
- No migration is run automatically at application startup. Migration execution, any legacy evaluation reconciliation and production file-storage provisioning are operator tasks.
- Registration support-document rules, public registration/OAuth/OTP, email notifications, progress percentage/tasks and result reopening are outside the current implementation brief.
