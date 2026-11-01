# Kế hoạch tổ chức repository và triển khai FE/BE

> Trạng thái: kế hoạch phục vụ triển khai backend; frontend nằm ngoài phạm vi task hiện tại.
>
> Phạm vi xác minh: repository `/Users/tuanle/Documents/qlda/source` tại branch `main`.

## 1. Kết quả kiểm tra hiện trạng

### Đã xác minh

- Repository hiện chỉ có backend, chưa có `frontend/`, `docs/`, ERD, tài liệu nghiệp vụ, CI hoặc test directory.
- Git đang sạch, không có staged/unstaged change tại thời điểm lập kế hoạch.
- Backend sử dụng NestJS 10, TypeScript, Express, TypeORM 0.3, PostgreSQL và npm.
- `src/database/migrations/1700000000000-InitialSchema.ts` là migration rỗng; chưa có entity hoặc bảng nghiệp vụ.
- `src/modules/auth`, `users`, `internships`, `progress`, `reports`, `evaluations` chỉ là module rỗng.
- API đang có là `GET /api/health`; Swagger ở `/api/docs`.
- `test/` chưa tồn tại, dù `package.json` đã khai báo script `test:e2e` trỏ tới `test/jest-e2e.json`.
- `.env` tồn tại và bị ignore. Nội dung bí mật không thuộc phạm vi kiểm tra và không được đưa vào Git.

### Chưa thể kết luận

- Chưa có quyết định công nghệ frontend trong source. Frontend không được khởi tạo trong task này; chỉ giữ chỗ `frontend/` nếu cần biểu diễn cấu trúc.
- Chưa có ERD, schema nghiệp vụ, vai trò, trạng thái workflow hoặc API contract được phê duyệt.
- Chưa có quy ước branch/PR/CI chính thức; quy ước ở cuối tài liệu là đề xuất.

## 2. Cấu trúc hiện tại và mục tiêu

### Hiện tại

```text
source/
├── src/
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── .eslintrc.js
├── .prettierrc
├── .env.example
├── docker-compose.yml
├── README.md
├── .gitignore
├── node_modules/       # ignored, generated/local
└── dist/               # ignored, generated/local
```

### Mục tiêu

```text
source/
├── backend/
│   ├── src/
│   ├── test/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── nest-cli.json
│   ├── .eslintrc.js
│   └── .env.example
├── frontend/           # placeholder בלבד, không khởi tạo ứng dụng trong task BE
├── docs/
├── docker-compose.yml
├── .gitignore
├── .prettierrc         # dùng chung nếu tiếp tục giữ một cấu hình format
└── README.md
```

Repository Git duy nhất tiếp tục nằm tại `source/.git`. Không tạo `.git` trong `backend/` hoặc `frontend/`. Không dùng Nx, Turborepo hoặc npm workspaces trong thay đổi tổ chức này.

## 3. Bảng ánh xạ đường dẫn

| Hiện tại | Sau khi tách | Cách xử lý |
|---|---|---|
| `src/` | `backend/src/` | Di chuyển nguyên trạng; chưa thêm nghiệp vụ |
| `package.json` | `backend/package.json` | Di chuyển; giữ stack NestJS + TypeORM và cập nhật phạm vi script nếu cần |
| `package-lock.json` | `backend/package-lock.json` | Di chuyển cùng package.json; không tạo lockfile root |
| `tsconfig.json` | `backend/tsconfig.json` | Di chuyển; giữ strict TypeScript |
| `tsconfig.build.json` | `backend/tsconfig.build.json` | Di chuyển; rà soát exclude/path sau khi đổi cwd |
| `nest-cli.json` | `backend/nest-cli.json` | Di chuyển; `sourceRoot` vẫn là `src` |
| `.eslintrc.js` | `backend/.eslintrc.js` | Di chuyển vì config hiện tham chiếu `src` và `test` của backend |
| `.prettierrc` | `source/.prettierrc` | Giữ root làm config format dùng chung; xác nhận tool chạy từ backend vẫn tìm thấy config cha |
| `.env.example` | `backend/.env.example` | Di chuyển; chỉ giữ tên biến và giá trị mẫu không nhạy cảm |
| `.env` | `backend/.env` | Không commit, không in nội dung; chuyển local một cách có kiểm soát nếu chủ sở hữu xác nhận |
| `docker-compose.yml` | `source/docker-compose.yml` | Giữ root vì là cấu hình dịch vụ dùng chung |
| `README.md` | `source/README.md` | Giữ root nhưng viết lại thành hướng dẫn monorepo; phần backend có thể tách thêm thành `backend/README.md` nếu cần |
| `.gitignore` | `source/.gitignore` | Giữ root; bổ sung pattern cho `backend/`, `frontend/`, env và output tương ứng |
| `dist/` | Không di chuyển | Artefact ignored; không commit; chỉ xóa/rebuild sau khi thay đổi cấu trúc được kiểm tra |
| `node_modules/` | Không di chuyển | Không commit; cài lại trong `backend/` ở bước triển khai cấu trúc |
| `docs/` | `source/docs/` | Tạo mới; file kế hoạch này là tài liệu đầu tiên |

`README.md` hiện là README backend-specific. Khi thực hiện, nội dung phải được phân tách rõ: root README hướng dẫn toàn repository; backend README (nếu tạo) hướng dẫn NestJS, migration và biến môi trường backend.

## 4. Kế hoạch chuyển folder độc lập

Thay đổi này phải là một PR/commit cấu trúc riêng, không gộp entity, migration nghiệp vụ, auth hoặc màn hình frontend.

### Trình tự đề xuất

1. Kiểm tra lại `git status --short --branch` và lưu ý mọi thay đổi phát sinh; không dùng reset/checkout để làm sạch.
2. Tạo `backend/` và chuyển các file backend theo bảng ánh xạ.
3. Cập nhật script và đường dẫn chạy theo working directory mới.
4. Cập nhật root `.gitignore` và root README.
5. Giữ nguyên `docker-compose.yml` ở root.
6. Không di chuyển `node_modules/` hoặc `dist/`; chúng là output/local state và không được commit.
7. Kiểm tra Git diff, cấu trúc file, build/lint/typecheck và health API.
8. Chỉ sau khi xác minh xong mới cân nhắc dọn artefact cũ; việc xóa phải là thao tác riêng, có mục tiêu cụ thể.

### Ảnh hưởng kỹ thuật cần xử lý

- TypeORM CLI: chạy từ `backend/` để các script hiện tại tiếp tục dùng `src/database/data-source.ts`; migration source là `src/database/migrations/*.ts`.
- Runtime TypeORM: sau build, `backend/dist` phải chứa migration JavaScript tương ứng với `dist/database/migrations/*.js`.
- Nest CLI: `sourceRoot: "src"` vẫn đúng khi lệnh được chạy trong `backend/`.
- TypeScript: kiểm tra `outDir`, `exclude` và mọi path tương đối sau khi đổi working directory.
- Jest: giữ script trong `backend/package.json`; tạo `backend/test/` và config e2e chỉ khi bắt đầu viết test. Hiện chưa được coi là đã có test.
- ESLint/Prettier: ESLint chạy theo `backend/src` và `backend/test`; Prettier dùng config root nếu không đặt config riêng trong backend.
- Docker Compose: compose ở root không tự động lấy `backend/.env` như env file mặc định. Khi chạy local phải dùng rõ `docker compose --env-file backend/.env up -d postgres`, hoặc thống nhất cơ chế env khác trước khi triển khai.
- CI: hiện không có CI file; sau khi có CI, mỗi job phải đặt `working-directory: backend` cho lệnh backend và dùng root path cho Compose.
- README và command examples: tất cả lệnh backend phải ghi rõ `cd backend` hoặc dùng `npm --prefix backend ...`.

### Xử lý env, node_modules và dist

- Không đọc, log hoặc commit nội dung `backend/.env`.
- Chỉ commit `backend/.env.example` với tên biến cần thiết: `NODE_ENV`, `PORT`, `CORS_ORIGIN`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_SSL`.
- Không đặt secret trong frontend. Các biến Vite public chỉ chứa URL/API flags không nhạy cảm.
- Không commit `node_modules/`, `dist/`, coverage hoặc log ở bất kỳ app nào.
- Trong bước chuyển, giữ các thư mục local hiện có ngoài Git để tránh mất dữ liệu; sau khi kiểm tra thành công có thể dọn artefact stale bằng thao tác riêng, không dùng chúng làm nguồn build.

### Lệnh kiểm tra backend sau khi chuyển

Chạy từ `source/` sau khi cấu trúc đã được chuyển:

```bash
npm --prefix backend run lint:check
npm --prefix backend run format:check
npm --prefix backend exec tsc -- --noEmit
npm --prefix backend run build
npm --prefix backend run test
npm --prefix backend run test:e2e
npm --prefix backend run migration:run
```

`migration:run` chỉ chạy khi database local đã được xác định và người thực hiện chủ động cho phép; nó không thuộc bước kiểm tra tĩnh bắt buộc của PR cấu trúc. Nếu cần kiểm tra runtime, khởi động PostgreSQL bằng Compose rồi chạy backend và gọi `GET /api/health`.

## 5. Phạm vi frontend

Frontend nằm ngoài phạm vi task hiện tại. Không tạo package, source, dependency, `.env.example` hoặc cấu hình frontend. Chỉ có thể tạo thư mục rỗng `frontend/` như placeholder nếu cần biểu diễn cấu trúc repository; thư mục này không được coi là frontend đã khởi tạo.

## 6. Kế hoạch triển khai backend theo giai đoạn

### Giai đoạn 1 — Tách backend vào `backend/`

- FE: không thực hiện.
- BE: chuyển code/config NestJS, cập nhật path, script, README và `.gitignore`; giữ nguyên NestJS + TypeORM + PostgreSQL.
- API/dữ liệu: không đổi API; health endpoint vẫn là `GET /api/health`.
- Phụ thuộc: không cần ERD hay đặc tả nghiệp vụ.
- Hoàn thành khi: Git chỉ ghi nhận thay đổi cấu trúc; lint, format check, typecheck, build chạy từ `backend/`; health API và Swagger vẫn truy cập được; không có secret/generated artefact trong diff.

### Giai đoạn 2 — Backend foundation sau khi tách folder

- FE: không thực hiện.
- BE: xác nhận health endpoint, config, TypeORM CLI, migration path và test harness sau khi đổi folder.
- API/dữ liệu: giữ `GET /api/health`; chưa thêm nghiệp vụ.
- Phụ thuộc: hoàn tất giai đoạn 1.
- Hoàn thành khi: backend build/lint/typecheck/test được từ `backend/` và health API hoạt động.

### Giai đoạn 3 — Thống nhất schema, phân quyền, trạng thái và API contract

- FE: không thực hiện.
- BE: chuyển đặc tả được duyệt thành entity, migration, DTO, enum trạng thái và OpenAPI; xác định error contract.
- API/dữ liệu: ERD, role/permission matrix, lifecycle/status transition, pagination/filter, date/timezone và mã lỗi.
- Phụ thuộc: cần ERD và tài liệu nghiệp vụ chính thức.
- Hoàn thành khi: có tài liệu contract được review, migration tạo schema được kiểm tra trên DB local, Swagger phản ánh endpoint đã thống nhất.

### Giai đoạn 4 — Đăng nhập và quản lý tài khoản

- FE: không thực hiện.
- BE: user entity, credential/auth flow, password policy, token/session strategy, role guard và endpoint quản lý tài khoản theo quyền.
- API/dữ liệu: login/refresh hoặc session contract, user profile, role claims, lỗi 401/403.
- Phụ thuộc: giai đoạn 3; cần quyết định cơ chế auth và cách cấp tài khoản.
- Hoàn thành khi: các role được kiểm tra bằng test backend; FE không thể bypass quyền bằng cách sửa UI; secret chỉ nằm ở backend/runtime.

### Giai đoạn 5 — Đợt thực tập, doanh nghiệp và hồ sơ đăng ký

- FE: không thực hiện.
- BE: entity, migration, CRUD có phân quyền, business validation, trạng thái đăng ký và transaction cần thiết.
- API/dữ liệu: định danh, quan hệ sinh viên-doanh nghiệp-đợt thực tập, status transition, pagination/filter, conflict rules.
- Phụ thuộc: auth/RBAC và schema được duyệt.
- Hoàn thành khi: happy path và các trường hợp bị từ chối quyền/vi phạm trạng thái có test; FE dùng API thật.

### Giai đoạn 6 — Tiến độ, nhận xét và nộp báo cáo

- FE: không thực hiện.
- BE: progress/report model, validation thời hạn, quyền xem/sửa/duyệt, lưu metadata file nếu có, audit sự kiện quan trọng.
- API/dữ liệu: file policy, kích thước/loại file, người nhận xét, deadline, versioning và trạng thái nộp.
- Phụ thuộc: hồ sơ thực tập và quyết định có dùng object storage/file service.
- Hoàn thành khi: quyền truy cập dữ liệu theo vai trò được test; các deadline/status transition được kiểm tra ở backend.

### Giai đoạn 7 — Đánh giá, tính điểm và chốt kết quả

- FE: không thực hiện.
- BE: evaluation model, rubric/weight configuration, tính điểm, quyền nhập/sửa/chốt, khóa dữ liệu sau khi chốt nếu cần.
- API/dữ liệu: tiêu chí, trọng số, thang điểm, làm tròn, người duyệt, quy tắc sửa sau chốt.
- Phụ thuộc: phải có quy chế đánh giá được phê duyệt; không suy diễn từ tên module hiện tại.
- Hoàn thành khi: công thức có test biên, kết quả tái lập được, quyền sửa sau chốt được kiểm soát.

### Giai đoạn 8 — Thông báo, audit, kiểm thử và tài liệu

- FE: không thực hiện.
- BE: notification integration, audit log, rate/error handling, observability, test coverage, migration/deployment runbook.
- API/dữ liệu: event/notification contract, retention, audit fields, error envelope, OpenAPI và versioning policy.
- Phụ thuộc: các workflow chính đã ổn định; chốt nhu cầu email/in-app và vận hành production.
- Hoàn thành khi: unit/integration/e2e chạy trong CI, tài liệu cập nhật, migration được kiểm tra trên database sạch và dữ liệu nâng cấp nếu có.

## 7. Quy ước phối hợp branch, PR và API contract

Đây là đề xuất vì repository chưa có quy ước chính thức:

- PR cấu trúc riêng: `chore/repo-layout-backend`.
- Chỉ tạo PR backend trong task này; quy ước frontend để dành cho task khác.
- Không gộp di chuyển folder với thay đổi nghiệp vụ hoặc migration domain.
- Mọi PR phải mô tả ảnh hưởng path, command kiểm tra, migration và env; không đính kèm secret.
- Backend là nguồn kiểm soát API contract. Swagger/OpenAPI phải được cập nhật cùng endpoint; contract thay đổi phải nêu rõ breaking/non-breaking.
- Client consumer dùng API contract đã thống nhất, không đọc database schema trực tiếp.
- Migration được review như code; không dùng `synchronize: true`.
- Mỗi PR nên nhỏ, review được độc lập; thay đổi chung giữa FE/BE phải có phần “API/data contract” trong mô tả PR.
- Khi có breaking change, dùng version hoặc compatibility window đã được chốt trước; không âm thầm đổi response.

## 8. Checklist sau khi chuyển cấu trúc

- [ ] `git status` trước và sau thay đổi đã được ghi nhận; không mất thay đổi của người khác.
- [ ] Chỉ còn một `.git` tại root.
- [ ] Backend nằm trong `backend/`; không còn source backend hoạt động ở root.
- [ ] `backend/package.json` và `backend/package-lock.json` đồng bộ.
- [ ] `backend/src/database/data-source.ts` vẫn trỏ đúng entity/migration source.
- [ ] Runtime migration path trỏ đúng `backend/dist/database/migrations/*.js` khi chạy từ backend.
- [ ] `backend/.env.example` có đủ tên biến; `.env` không xuất hiện trong diff.
- [ ] `node_modules/`, `dist/`, coverage và log không xuất hiện trong Git.
- [ ] `docker-compose.yml` vẫn khởi tạo PostgreSQL bằng env file được chỉ định rõ.
- [ ] `npm --prefix backend run lint:check` chạy được.
- [ ] `npm --prefix backend run format:check` chạy được.
- [ ] `npm --prefix backend exec tsc -- --noEmit` chạy được.
- [ ] `npm --prefix backend run build` chạy được.
- [ ] Health API và Swagger vẫn hoạt động.
- [ ] Test script được rà soát; không báo test e2e đã tồn tại nếu chưa có `backend/test/`.
- [ ] Root README mô tả đúng cách chạy backend và Compose; không yêu cầu hướng dẫn frontend trong task này.
- [ ] `docs/implementation-plan.md` được cập nhật nếu có quyết định khác với kế hoạch này.

## 9. Các quyết định còn cần chốt

1. Có phê duyệt React + TypeScript + Vite hay frontend sẽ dùng stack khác?
2. Frontend dev dùng CORS trực tiếp hay Vite proxy? Port frontend chính thức là bao nhiêu?
3. Có tạo `backend/README.md` riêng hay giữ toàn bộ hướng dẫn trong root README?
4. Có cần root `.prettierrc` dùng chung hay mỗi app có config riêng?
5. Cơ chế auth, token/session, refresh, logout và quản lý secret là gì?
6. Vai trò và ma trận quyền chính thức là gì?
7. ERD, schema nghiệp vụ và các status transition được phê duyệt ở đâu?
8. Có upload file, email, notification, audit log hoặc object storage không?
9. Quy tắc tính điểm và chốt kết quả là gì?
10. CI sẽ dùng Node/npm version nào và chạy PostgreSQL service thế nào?
11. Có yêu cầu API versioning, pagination, error envelope và timezone cụ thể không?

## Tóm tắt để review

Repository nên giữ một Git root duy nhất và tách backend hiện tại vào `backend/`, giữ Compose và tài liệu dùng chung ở root. Frontend không được khởi tạo trong task này; chỉ giữ placeholder nếu cần. Backend giữ NestJS + TypeORM + PostgreSQL, sau đó triển khai schema, authentication, phân quyền và các module nghiệp vụ theo tài liệu thiết kế cùng các giả định đã được ghi rõ.
