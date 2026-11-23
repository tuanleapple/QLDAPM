# BÁO CÁO TỔNG HỢP KIỂM TRA & KIỂM THỬ TOÀN HỆ THỐNG (CP2, A61, A62 — INC 1, 2 & 3)

**Dự án:** Hệ thống Quản lý Thực tập Sinh viên (SIMS) — Môn học CO3011  
**Thời điểm kiểm tra & thực thi:**
- **18/11/2026:** Rà soát toàn diện hệ thống (Audit SRS, Gantt, HTTP Probe @ `main` `bd9534e`)
- **23/11/2026:** Chạy kiểm thử hồi quy `A61`, `A62` & đánh giá `CP2` (@ `main` `a41ae04`, kèm chỉnh sửa cục bộ `frontend/app/globals.css`)
**Tài liệu đối chiếu:**
- Đặc tả yêu cầu phần mềm (`SRS v1.0`) & Quy tắc nghiệp vụ (`BR1`–`BR11`, `FR1`–`FR8`, `NFR1`–`NFR4`, Mục `4.9` RBAC)
- Bảng lịch trình dự án & Gantt Chart (Tuần 6 – Tuần 16: `A39`–`A69`, `CP1`, `CP2`, `CP8`, `CP3`, `CP9`)
- Thiết kế & đặc tả kỹ thuật: `docs/backend-design.md`, `docs/api.md`, `docs/frontend-integration.md`, `test/TEST_CASES_A36_INCREMENT1.md`, `test/TEST_CASES_A37_INCREMENT2.md`

---

## 1. TỔNG QUAN & KẾT LUẬN NHANH

### 1.1. Bảng đánh giá mức độ hoàn thành theo từng Increment

| Giai đoạn (Increment) | Phạm vi mục tiêu theo SRS & Gantt Chart | Backend API | Frontend Web | Mức độ hoàn thành tổng thể | Trạng thái nghiệm thu |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Increment 1** | Xác thực, phân quyền 4 vai trò (`FR1`), Đăng ký thực tập (`FR2`), Xét duyệt (`FR3`), Tiến độ cơ bản (`FR4`), Checkpoint `CP1` | **~92%** *(còn 3 bug/thiếu sót nghiệp vụ nhẹ & chi tiết SRS)* | **~75%** *(thiếu UI quản trị của CB, trang đổi MK là mock tĩnh, 2 trang chi tiết là mock, lệch field)* | **~85%** | **Cơ bản đạt luồng chính**, còn lỗi nghiệp vụ `BR1` và thiếu màn hình quản trị |
| **Increment 2** | Nộp báo cáo (`FR5`), Phiếu đánh giá GVHD & DN (`FR6`), Tổng hợp kết quả (`FR7`), Luồng 5 bước xuyên suốt, Checkpoint `CP2` | **~96%** *(40/40 TC API Pass; còn vài sai khác nhẹ so với SRS như quyền xem kết quả của GVHD, làm tròn 2 số)* | **~65%** *(đã có trang cho SV/GVHD/CB/DN nhưng **gãy chức năng tải báo cáo**, sai nhãn trọng số `30/20/50`, thiếu chuông thông báo & cấu hình tiêu chí)* | **~80%** | **CHƯA ĐẠT hoàn toàn trên Web UI** do lỗi blocker tải file báo cáo & lỗi `next build` |
| **Increment 3** | Xử lý **Change Event** của Giảng viên (`A57`, `A58`, `CP8`, `A59`), tính năng tùy chọn **Nhập Excel/CSV (`FR8` – `A60`)**, ổn định & hồi quy (`A61`), tài liệu chạy/demo (`A63`), bàn giao `CP3` | **0%** *(chưa có Change Event; chưa có `FR8`)* | **0%** *(chưa có Change Event; chưa có `FR8`; `next build` đang fail)* | **~15%** *(chỉ có phần kiểm thử hồi quy A54 từ Inc 2)* | **CHƯA HOÀN THÀNH** — Chưa đủ điều kiện nghiệm thu bàn giao cuối kỳ (`CP3`) |

### 1.2. Kết luận điều hành (Executive Summary)

1. **Backend NestJS + PostgreSQL** được xây dựng bài bản, kiến trúc 3 lớp (`Controller -> Service -> Repository`), migration tường minh, bảo mật mật khẩu `scrypt`, HMAC Bearer token + refresh rotation, transaction kèm pessimistic lock chống race condition. **35/35 Unit Tests** và **40/40 API Test Cases của Increment 2** đều **PASS**, thời gian phản hồi rất nhanh (~18–107 ms).
2. **Tuy nhiên, toàn hệ thống CHƯA hoàn thành đầy đủ để nghiệm thu bàn giao cuối (CP3)**:
   - **Increment 3 hầu như chưa được thực hiện**: Chưa có phân tích tác động Change Event (`A57`), chưa có Baseline V2.0 (`A58`/`CP8`), chưa có mã nguồn xử lý Change Event (`A59`), chưa cài đặt tùy chọn Nhập Excel/CSV (`FR8` / `A60`), và tài liệu `README.md` gốc vẫn còn nội dung cũ *"Frontend chưa được khởi tạo"*.
   - **Frontend Next.js tồn tại 3 lỗi nghiêm trọng (Critical/Blocker)**:
     1. **Hỏng chức năng tải file báo cáo trên giao diện Sinh viên & Giảng viên (`BUG-CRIT-01`)**: Frontend gọi `GET /api/reports/:id/content` (`404 Not Found`) thay vì endpoint thật của Backend là `GET /api/reports/:id/download`.
     2. **Lỗ hổng Middleware bảo vệ route Doanh nghiệp (`BUG-CRIT-02`)**: Dù PR #7 (`dcbdeb5` / `bd9534e`) đã bổ sung các màn hình `/enterprise/*`, file `frontend/middleware.ts` chưa thêm `/enterprise/:path*` và `/change-password` vào matcher, khiến người chưa đăng nhập vẫn truy cập thẳng `/enterprise/dashboard` (`HTTP 200`).
     3. **Lỗi Production Build của Frontend (`BUG-CRIT-03`)**: `next build` thất bại ở cả chế độ mặc định **Turbopack** (panic tại `globals.css.css`) lẫn chế độ **`--webpack`** (lỗi prerender route động `/supervisor/evaluate/[id]` và `/enterprise/progress/[id]` do `cacheComponents: true` xung đột với `use(params)` ngoài `<Suspense>`).
   - **Bộ kiểm thử tự động cũ (`test/run-a54-tests.js`) chưa phản ánh lỗi trên UI**: Kịch bản này cho kết quả 85/89 PASS nhưng chủ yếu test API Backend trực tiếp và chỉ check HTTP status code của các trang Next.js chứ chưa thao tác UI/DOM thật, do đó không phát hiện các trang mock tĩnh (`/change-password`, `/admin/application/[id]`, `/admin/progress-tracking`, `/supervisor/progress/[id]`), lỗi sai đường dẫn tải báo cáo, và lỗi lệch tên field JSON.

### 1.3. Đối chiếu Checkpoints Kiểm thử & Nghiệm thu (`CP7`, `CP5`, `CP1`, `CP2`, `CP8`, `CP3`)

| CP | Mục tiêu | Tiêu chí đạt | Trạng thái hiện tại | Ghi chú / Vướng mắc |
| :---: | :--- | :--- | :---: | :--- |
| **`CP7`** | Kiểm tra kế hoạch & Baseline V1.0 (`A20`) | SRS & Test Plan chốt, ma trận truy vết đủ, 5 thành viên đã đọc | **ĐẠT** | Có Change Event ở Inc 3 $\rightarrow$ chuyển tiếp sang `CP8` (Baseline V2.0). |
| **`CP5`** | Rà soát thiết kế cho INC1 (`A34`) | FR1–FR4 map API/màn hình, RBAC 4.9 khớp API, Test case INC1 đã soạn & duyệt chéo | **ĐẠT** | Đã có `test/increment1/TEST_CASES_A36_INCREMENT1.md`. |
| **`CP1`** | Progress Check & Demo INC1 (`A47`) | Smoke test 100%, phân quyền 100%, High FR1–FR4 $\ge 90\%$, không còn Critical mở, demo 2 lần liên tiếp | **ĐẠT CƠ BẢN** | API Pass **93.9%** (`46/49`), không có lỗi Critical ở BE Inc 1; còn `BUG-INC1-02` (`BR1`), `BUG-INC1-03`, `BUG-MAJ-01` (`/change-password`). |
| **`CP2`** | Demo luồng 5 bước xuyên suốt — INC2 đạt (`A56`) | High FR5–FR6 $\ge 90\%$, điểm tổng đúng BR6, Regression INC1 100%, không còn Critical mở | **API: ĐẠT / UI: CHƯA ĐẠT** | API Inc 2 Pass **100%** (`40/40`), tính điểm BR6 đúng; nhưng còn **3 lỗi Critical** ở Frontend (`BUG-CRIT-01`, `02`, `03`) và Regression INC1 chưa đạt 100% (`46/49`). |
| **`CP8`** | Kiểm tra Change Event & Baseline V2.0 (`A58`) | Có phân tích tác động Change Event (dời deadline sớm hơn 1 tuần) và chốt Baseline V2.0 | **CHƯA ĐẠT** | Chưa hoàn tất hồ sơ Baseline V2.0 & log kiểm thử `TC-CE-01..03`. |
| **`CP3`** | Nghiệm thu & bàn giao cuối (`A64`) | Luồng 5 bước chạy không lỗi 2 lần liên tiếp; mọi Critical & Major đóng hoặc có workaround được duyệt; Change Event có test & kết quả; Test Report hoàn thành | **CHƯA ĐẠT** | Đang chờ Dev fix `BUG-CRIT-01..03` & `BUG-MAJ-01..03`, đồng thời kiểm thử Change Event theo `test/increment3/TEST_CASES_INCREMENT3_STABILIZATION.md`. |

---

## 2. KẾT QUẢ THỰC THI KIỂM TRA KỸ THUẬT & KIỂM THỬ TỰ ĐỘNG

### 2.1. Kiểm tra trạng thái Git & Working Tree

- **Nhánh hiện tại:** `main` tại `bd9534e` (*Merge pull request #7 from tuanleapple/feature/frontend-increment-2*, khớp `origin/main`).
- **Thay đổi cục bộ chưa commit (Working Tree dirty):**
  - **7 file modified:** `backend/package.json`, `frontend/package.json`, `package.json`, `package-lock.json` (chuyển script gọi CLI sang `run-nest.js`, `run-next.js`, `concurrently.js` để tránh lỗi dấu `&` trong đường dẫn Windows), `frontend/app/globals.css` (bổ sung CSS contrast cho input/disabled), `frontend/AGENTS.md`, `test/README.md`.
  - **6 file untracked trước khi xuất báo cáo này:** `backend/run-nest.js`, `frontend/run-next.js`, `test/TEST_CASES_A36_INCREMENT1.md`, `test/TEST_CASES_A37_INCREMENT2.md`, `test/BAO_CAO_KIEM_THU_A54_INCREMENT2_HOI_QUY.md`, `test/run-a54-tests.js`.

### 2.2. Kiểm tra tĩnh, Unit Test, Lint & Build (Thực thi thực tế)

> **Lưu ý môi trường Windows:** Đường dẫn workspace `C:\Users\T&T\...` chứa ký tự `&` (junction tới `C:\Users\MinhThuc\...`), làm các `.cmd` wrapper như `npm test`, `npm run lint`, `npx tsc` bị lỗi cắt lệnh tại `&`. Tất cả các bước kiểm tra dưới đây được chạy trực tiếp bằng Node.js binary từ realpath `C:\Users\MinhThuc\...`.

| Hạng mục kiểm tra | Lệnh / Cách thực thi thực tế | Kết quả | Chi tiết quan sát được |
| :--- | :--- | :---: | :--- |
| **Backend TypeScript Check** | `tsc --noEmit` trong `backend/` | **PASS** | `0` lỗi kiểu dữ liệu (exit code `0`). |
| **Frontend TypeScript Check** | `tsc --noEmit` trong `frontend/` (đã chạy lại trên `bd9534e`) | **PASS** | `0` lỗi kiểu dữ liệu (exit code `0`). |
| **Backend Unit Tests (Jest)** | `jest --config ./jest.config.js` (mặc định) | **FAIL (Env)** | Lỗi worker pool: `Jest worker encountered 4 child process exceptions, exceeding retry limit`. |
| **Backend Unit Tests (`--runInBand`)** | `jest --config ./jest.config.js --runInBand` | **PASS** | **9/9 test suites pass, 35/35 tests pass** (`23.005 s` ngày 18/11; `30.23 s` ngày 23/11). |
| **Frontend ESLint** | `eslint app components lib types middleware.ts` (trên `bd9534e`) | **PASS** | **28 files: 0 errors, 0 warnings** (`react-hooks/set-state-in-effect` đã tắt trong `eslint.config.mjs`). |
| **Backend ESLint (TS rules)** | `eslint` từ realpath với `--rule 'prettier/prettier: off'` | **PASS** | `0` lỗi logic ESLint/TypeScript. *(Chú ý: chạy từ junction `C:\Users\T&T\...` bị 74 lỗi parsing do mismatch `tsconfigRootDir`)*. |
| **Backend Prettier / Format Check** | `eslint` mặc định & `prettier --check` trên `{src,test,tools}/**/*.ts` | **FAIL** | **8.757 lỗi `Delete ␍` (`prettier/prettier`) trên 74 files** do Git Windows checkout line ending CRLF (`\r\n`). |
| **Backend Production Build** | `node ./run-nest.js build` trong `backend/` | **PASS** | Biên dịch sạch ra `backend/dist/` (exit code `0`). |
| **Frontend Production Build (Turbopack)** | `node ./run-next.js build` trong `frontend/` | **FAIL** | Panic tại `[project]/frontend/app/globals.css.css [app-client] (css)`: `creating new process - node process exited before we could connect to it with exit code: 0`. Kèm cảnh báo Next.js `16.4.3` có lỗ hổng bảo mật cần nâng cấp và `middleware` deprecated. |
| **Frontend Production Build (`--webpack` / prerender)** | `node ./run-next.js build --webpack` và `npm --prefix frontend run build` | **FAIL** | Compile & TypeScript pass, nhưng **fail khi prerender** route động `/enterprise/evaluate/[id]`, `/enterprise/progress/[id]`, `/supervisor/evaluate/[id]`: `Next.js encountered uncached or runtime data during prerendering` vì `cacheComponents: true` xung đột với `use(params)` ngoài `<Suspense>`. |

### 2.3. Kiểm thử Tích hợp & Hồi quy Tự động (`test/run-a54-tests.js` — `A54` / `A61` / `A62`)

- **Môi trường chạy:** PostgreSQL 16 (`postgres:16-alpine` trên Docker, cổng `5432`, database `internship_management_dev`), NestJS backend (`http://localhost:3000/api`), Next.js `16.4.3` (`http://localhost:3001`).
- **Kết quả chạy mới nhất (23/11/2026 @ `a41ae04`):**

| Phân hệ kiểm thử | Tổng TC | Đạt (Pass) | Không đạt (Fail) | Tỷ lệ Đạt | Ghi chú |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Hồi quy Increment 1 (`INC1`)** | **49** | **46** | **3** | **93.9%** | 3 ca Fail: `TC-FR2-03` (`BUG-INC1-04`), `TC-FR2-07` *(kỳ vọng script)*, `TC-FR3-09` (`BUG-INC1-02`). |
| **Chức năng mới Increment 2 (`INC2`)** | **40** | **40** | **0** | **100.0%** | Toàn bộ 27 TC High, 11 TC Medium, 2 TC Low trên API + `19` file trong `backend/var/private-reports/` đều Pass. |
| **Tổng cộng trong `run-a54-tests.js`** | **89** | **86** | **3** | **96.6%** | Thời gian phản hồi đo được (23/11): Upload `44 ms`, DN Submit `77 ms`, GV Submit `89 ms` (đạt ngưỡng `<= 150 ms`). |

> **Giải thích chênh lệch `85/89` (18/11) vs `86/89` (23/11):** Ca `TC-FR3-11` gọi `GET /internships/profiles?status=APPROVED&search=Minh`. Do `listProfiles` chỉ tìm `ILIKE` trên `profile.title`, `enterprise.name` và `supervisor.fullName` (chưa tìm trên `student.fullName`/`student.studentCode` — `BUG-INC1-03`), nên ở lần chạy `18/11` trả về `total=0` (FAIL), còn ở lần chạy `23/11` trong DB có bản ghi chứa chữ `"Minh"` ở tiêu đề/đơn vị/GVHD nên vô tình PASS. Khi probe theo đúng tên SV `"Nguyễn Minh Trần"` hoặc MSSV `"2210001"` vẫn trả về `total: 0`.

**Chi tiết 3 Test Case FAIL trong lần chạy `23/11/2026`:**
- **`TC-FR2-03`**: Validate định dạng email/SĐT người liên hệ DN $\rightarrow$ Backend DTO chưa có trường `contactEmail` / `contactPhone` (`BUG-INC1-04`).
- **`TC-FR2-07`**: Sửa hồ sơ khi đang `SUBMITTED` $\rightarrow$ Backend trả `HTTP 400` (*khóa sửa khi `SUBMITTED` là đúng theo `FR2.4`, cần sửa kỳ vọng test script*).
- **`TC-FR3-09`**: Xử lý sau khi hồ sơ bị `REJECTED` $\rightarrow$ Backend trả `HTTP 400` và DB đặt `UNIQUE(student_id, period_id)` cứng nên SV không đăng ký lại được (`BUG-INC1-02` / `BR1`).

### 2.4. Kiểm chứng Thực nghiệm Bổ sung (HTTP Probe Lệch Contract FE–BE & Increment 3)

Thực hiện gọi HTTP thực tế đối chiếu trực tiếp hành vi của Frontend và Backend đang chạy:

| Kịch bản Probe | Request thực tế | Kết quả HTTP thực tế | Kết luận xác minh |
| :--- | :--- | :--- | :--- |
| **Tải báo cáo trên Frontend (lỗi)** | `GET /api/reports/{reportId}/content` *(route Frontend đang gọi)* | **`404 Not Found`** | **Xác nhận `BUG-CRIT-01`**: SV và GVHD bấm tải báo cáo trên UI đều lỗi 404. |
| **Tải báo cáo đúng API Backend** | `GET /api/reports/{reportId}/download` | **`200 OK`** (`137 bytes`, `attachment; filename="final_report_v2.pdf"`) | Backend hoạt động đúng; lỗi nằm ở URL gọi từ Frontend. |
| **Route Doanh nghiệp thiếu Middleware** | `GET http://localhost:3001/enterprise/dashboard` *(không có cookie/token)* | **`200 OK`** *(không redirect `/login`)* | **Xác nhận `BUG-CRIT-02`**: Trong khi `/officer/dashboard` và `/admin/result` trả `307 -> /login`, `/enterprise/dashboard` lọt qua `middleware.ts`. |
| **Lệch trường `activePeriod` vs `period`** | `GET /api/internships/dashboard/student` | `period` có dữ liệu; **`activePeriod === undefined`** | `student/dashboard/page.tsx:105` luôn ẩn badge kỳ thực tập đang mở. |
| **Lệch trường `reportDeadlineAt` vs `reportDeadline`** | `GET /api/internships/periods` | `reportDeadline = "2026-12-20T23:59:59.000Z"`; **`reportDeadlineAt === undefined`** | `submit-report/page.tsx:148` luôn hiển thị *"Không có hạn chót cụ thể"*. |
| **Thiếu `student.email` & `statusHistory` trong list** | `GET /api/internships/profiles` | `student` chỉ có `userId, studentCode, fullName, phone, major`; `email === undefined`, `statusHistory === undefined` | Các trang dùng list profiles bị trống email SV; `student/dashboard` không lấy được `statusHistory[0].reason`. |
| **Quyền xem kết quả của GVHD (`SRS 4.9`)** | GVHD gọi `GET /api/evaluations/results/{profileId}` | **`403 Forbidden`** (`"Insufficient role"`) | Backend chỉ cho `STUDENT` và `OFFICER`, trái với ma trận RBAC `SRS 4.9` (GVHD xem SV được phân công). |
| **Làm tròn điểm tổng kết (`BR6`)** | SV gọi `GET /api/evaluations/results/{profileId}` | **`200 OK`**, `calculatedTotalScore: "8.85"`, `totalScore: "9.00"` | Làm tròn **2 chữ số thập phân** (theo `backend-design.md`), khác đặc tả **1 chữ số thập phân** trong `SRS BR6`. |
| **Tìm kiếm theo tên SV / MSSV (`FR3.1`)** | CB gọi `GET /api/internships/profiles?search=Nguyễn Minh Trần` và `?search=2210001` | **`total: 0`** cho cả hai | **Xác nhận `BUG-INC1-03`**: Query chưa tìm trên `student.fullName` và `student.studentCode`. |
| **Đăng nhập bằng MSSV (`FR1.2`)** | `POST /api/auth/login` với `{ email: "2210001", password: "..." }` | **`400 Bad Request`** (`"email must be an email"`) | Backend chỉ hỗ trợ đăng nhập bằng email, chưa hỗ trợ mã số SV (`FR1.2`). |
| **Doanh nghiệp đọc danh mục Đợt (`periods`)** | `ENTERPRISE_REP` gọi `GET /api/internships/periods` | **`403 Forbidden`** | Đúng như `docs/frontend-integration.md` ghi chú, DN không đọc được danh mục đợt độc lập. |
| **API Nhập Excel/CSV (`FR8` — Increment 3)** | CB gọi `POST /api/users/import` & `POST /api/internships/enterprises/import` | **`404 Not Found`** | **Xác nhận chưa cài đặt `FR8`** ở cả Backend lẫn Frontend. |

### 2.5. Đánh giá Checkpoint `CP2`: Luồng 5 bước xuyên suốt (API & Web UI)

| Bước | Nội dung luồng 5 bước | Tầng API (Backend) | Tầng Web UI (Frontend) | Ghi chú xác minh |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Đăng ký & nộp hồ sơ thực tập** (Sinh viên) | **PASS** | **Đạt cơ bản** | `student/dashboard` đọc `activePeriod` (`undefined`) thay vì `period`; chưa hiện `lastStatusReason` khi `REJECTED`. |
| **2** | **Xét duyệt & phân công GVHD** (Cán bộ) | **PASS** | **Đạt cơ bản** | `/officer/dashboard` hoạt động; `/admin/application/[id]` vẫn là trang mock tĩnh. |
| **3** | **Cập nhật tiến độ & nhận xét** (SV, GVHD, DN) | **PASS** | **Đạt một phần** | `/student/progress` và `/enterprise/progress/[id]` hoạt động; `/admin/progress-tracking` và `/supervisor/progress/[id]` là mock tĩnh. |
| **4** | **Nộp báo cáo & GVHD tải báo cáo** (SV, GVHD) | **PASS** | **FAIL (Blocker)** | `GET /api/reports/:id/download` trả `200 OK`, nhưng FE gọi `/reports/:id/content` trả `404`; `submit-report` đọc nhầm `reportDeadlineAt`. |
| **5** | **Đánh giá Rubric (DN + GVHD), Chốt & Công bố** | **PASS** | **Sai lệch hiển thị** | API tính đúng `40% DN / 30% GV_QT / 30% GV_BC`, nhưng `admin/result` và `student/dashboard` hiển thị cứng nhãn `30% / 20% / 50%`. |

---

## 3. ĐÁNH GIÁ CHI TIẾT THEO TỪNG INCREMENT (TRUY VẾT SRS & GANTT CHART)

### 3.1. Increment 1: Xác thực, Phân quyền 4 vai trò, Đăng ký, Phê duyệt & Tiến độ cơ bản

| Mã SRS | Nội dung yêu cầu | Backend | Frontend | Đánh giá & Sai lệch ghi nhận |
| :--- | :--- | :---: | :---: | :--- |
| **FR1.1** | CB tạo, sửa, khóa/mở khóa tài khoản SV, GVHD, DN và gán vai trò | **Đạt** (`UsersController`: `GET/POST/PATCH /users`, `/lock`, `/unlock`) | **Thiếu** | **Chưa có màn hình Quản lý tài khoản** nào trên Frontend (cả sidebar Officer lẫn route riêng). |
| **FR1.2** | Đăng nhập bằng định danh (email hoặc mã số) và mật khẩu; đăng xuất | **Đạt một phần** (`POST /auth/login`, `/logout`, `/refresh`, `/me`) | **Đạt** (`/login`, `AppHeader`/`AppSidebar` logout) | Chỉ đăng nhập được bằng **email** (`LoginDto` bắt `@IsEmail()`), chưa đăng nhập bằng mã số (`studentCode`). |
| **FR1.3** | Người dùng tự đổi mật khẩu; CB đặt lại mật khẩu cho người dùng | **Đạt một phần** (`POST /auth/change-password` có; CB reset MK chưa có) | **Hỏng (Mock)** | `/change-password` là **form HTML tĩnh**, không state/API, ghi sai độ dài tối thiểu (`8` thay vì `12` ký tự trong `auth.dto.ts:37`). |
| **FR1.4 – FR1.6** | Phân quyền 4 vai trò (`SV`, `GVHD`, `CB`, `DN`), kiểm tra phía máy chủ, ghi nhật ký trái quyền, cô lập phạm vi dữ liệu | **Đạt** (`AuthGuard`, `RolesGuard`, kiểm tra ownership/assignment/enterprise ở mọi Service + `AuditLogService`) | **Thiếu bảo vệ ở 1 route** | `frontend/middleware.ts` bảo vệ `/student`, `/officer`, `/admin`, `/supervisor` nhưng **bỏ sót `/enterprise/:path*`** và `/change-password`, đồng thời không decode kiểm tra `role` trong cookie. |
| **FR1.7** | Tài khoản bị khóa không đăng nhập được | **Đạt** (`AuthUserRepository` lọc `AccountStatus.ACTIVE`) | **Đạt** | Đăng nhập tài khoản `LOCKED` nhận `401 Invalid credentials`. |
| **FR2.1 – FR2.4** | SV chọn đợt mở, nhập đơn vị/vị trí/thời gian/mô tả, lưu nháp, nộp (`SUBMITTED`) & khóa sửa khi chờ duyệt | **Đạt một phần** (`InternshipsController`: `POST/PATCH/DELETE`, `/submit`) | **Đạt luồng cơ bản** (`/student/register-intern`) | Thiếu trường nhập **người phụ trách tại đơn vị (họ tên, email)**, **đề xuất đơn vị mới**, và **tệp thư tiếp nhận** (`FR2.2`); FE chưa có nút **Xóa nháp** dù BE có `DELETE /internships/profiles/:id`. |
| **FR2.5** | SV xem trạng thái và lý do (`Cần bổ sung` / `Từ chối`); khi `Cần bổ sung` thì sửa & gửi lại | **Đạt** (`lastStatusReason` & `statusHistory`) | **Lỗi hiển thị lý do** | `student/dashboard/page.tsx:82-86` đọc `statusHistory?.[0]?.reason` (không có trong list API và `[0]` là bản ghi cũ nhất) thay vì `lastStatusReason`; **không hiển thị lý do khi bị `REJECTED`**. |
| **FR2.6 / BR1** | Mỗi SV có tối đa **một hồ sơ hiệu lực** trong một đợt *(hiệu lực = khác Từ chối)* | **Lệch nghiệp vụ (`BUG-INC1-02`)** | **Khóa luôn form** | DB đặt `UNIQUE(student_id, period_id)` cứng (`entities.entity.ts:151`) và chặn sửa `REJECTED`, khiến SV bị từ chối **bị kẹt vĩnh viễn**, không thể đăng ký mới trong đợt mở như `BR1`. |
| **FR3.1 – FR3.4** | CB lọc theo đợt/trạng thái, tìm theo tên/mã số, duyệt kèm phân công GVHD, từ chối/bổ sung bắt buộc lý do, lưu lịch sử | **Đạt phần lớn** (`PATCH /review`, `/assign-supervisor`, `StatusHistory`) | **Thiếu chi tiết & lọc đợt** | BE tìm kiếm chưa khớp tên SV & MSSV (`BUG-INC1-03`); FE `/officer/dashboard` chưa có filter theo đợt (`periodId`), không có UI đổi GVHD sau duyệt, và `/admin/application/[id]` vẫn là **trang mock tĩnh**. |
| **FR4.1 – FR4.6** | SV (`APPROVED`) cập nhật tiến độ định kỳ; GVHD xem & nhận xét; DN xem (chỉ đọc); CB theo dõi tổng hợp & đánh dấu quá `N` ngày | **Đạt phần lớn** (`ProgressController`, `ProgressService`) | **Thiếu UI CB & còn Mock** | BE chưa có cấu hình chu kỳ tuần / đánh dấu SV quá `N` ngày (`FR4.5`); BE cho `ENTERPRISE_REP` gửi comment (trái `FR4.4` chỉ đọc) và không trả `author` trong comment; FE `/admin/progress-tracking` & `/supervisor/progress/[id]` là **mock tĩnh**. |

### 3.2. Increment 2: Nộp báo cáo, Đánh giá (GVHD & DN), Tổng hợp kết quả & Luồng 5 bước

| Mã SRS | Nội dung yêu cầu | Backend | Frontend | Đánh giá & Sai lệch ghi nhận |
| :--- | :--- | :---: | :---: | :--- |
| **FR5.1 – FR5.4** | SV (`APPROVED`) nộp báo cáo PDF/DOCX $\le 10\text{ MB}$; nộp lại nhiều phiên bản; GVHD & CB tải báo cáo; DN không tải được | **Đạt 100%** (magic-byte PDF + ZIP structure DOCX, private storage UUID, stream download, chặn `ENTERPRISE_REP` `403`) | **HỎNG TẢI FILE (`BUG-CRIT-01`)** | `submit-report/page.tsx:133` và `supervisor/evaluate/[id]/page.tsx:301` gọi sai URL **`/reports/:id/content`** $\rightarrow$ **404 Not Found** thay vì `/reports/:id/download`. Ngoài ra `submit-report` đọc nhầm `reportDeadlineAt` nên luôn báo *"Không có hạn chót cụ thể"*. |
| **FR5.5** | Đánh dấu báo cáo nộp muộn sau hạn (`CB quyết định cho phép nộp muộn hay không`) | **Đạt một phần** | **Đạt hiển thị** | Hệ thống tự gắn cờ `isLate = true` khi quá `period.reportDeadline`; chưa có cờ cấu hình ở đợt để CB chặn nộp muộn. |
| **FR6.1 – FR6.4** | DN & GVHD chấm phiếu theo tiêu chí thang 0–10 (`DRAFT` / `SUBMITTED`); khóa sau nộp; CB cấu hình tiêu chí & mở lại phiếu | **Đạt phần lớn** | **Chưa đầy đủ** | Backend có đủ CRUD tiêu chí & phiếu, nhưng **chưa có API để CB mở lại phiếu đã gửi (`BR5`)** và **chưa kiểm tra `BR11`** (mở phiếu khi đã nộp báo cáo hoặc hết hạn thực tập). Frontend **chưa có UI để CB tạo/sửa/xóa tiêu chí Rubric** (`FR6.3`). |
| **FR6.5 – FR6.7** | Đủ 2 phiếu thì tự tính tổng theo trọng số `a, b, c` (`0.4 / 0.3 / 0.3`); CB điều chỉnh có lý do & nhật ký; CB chốt; SV xem sau chốt/công bố | **Đạt** (tính chính xác bằng `decimal.js`, audit `score_adjustments`, `finalize`, `publish`) | **Lệch trọng số & chưa có UI lịch sử** | **Lỗi hiển thị trọng số nghiêm trọng**: `admin/result/page.tsx` và `student/dashboard/page.tsx` ghi cứng **`30% / 20% / 50%`** trong khi Backend tính **`40% / 30% / 30%`** (và `enterprise/evaluate/[id]` ghi `40%`). `admin/result` tạo `$N+1$` requests và không có giao diện xem lịch sử `adjustments` hay lọc theo đợt. |
| **FR7.1 – FR7.3** | Tra cứu lọc hồ sơ theo phạm vi; thống kê CB (theo trạng thái, DN, GVHD, tỷ lệ nộp BC, ĐTB); xuất CSV | **Đạt một phần** | **Thiếu thống kê & dùng CSV riêng** | Backend mới thống kê tổng tài khoản và số hồ sơ theo trạng thái — **thiếu thống kê theo DN, theo GVHD, tỷ lệ nộp báo cáo và điểm trung bình đợt (`FR7.2`)**. Backend có `GET /internships/profiles/export.csv` nhưng `admin/result` tự xuất CSV phía client (kèm header sai `30%/20%/50%`). |
| **FR7.4** | Thông báo in-app khi đổi trạng thái, chờ duyệt, phân công, có phiếu cần chấm, sắp đến hạn | **Đạt một phần** | **Chưa nối API** | Backend lưu bảng `notifications` cho các sự kiện chính (trừ nhắc hạn nộp BC và nhắc mở phiếu), nhưng **nút Chuông ở `AppHeader.tsx:54-60` là nút chết**, không gọi `GET /notifications`. |
| **Luồng 5 bước E2E** | Đăng ký $\rightarrow$ Xét duyệt $\rightarrow$ Tiến độ $\rightarrow$ Nộp báo cáo $\rightarrow$ Đánh giá & Chốt kết quả | **PASS 100% qua API** | **Gãy ở bước Tải báo cáo & Quản trị danh mục** | Trên API chạy thông suốt (`TC-E2E2-01` Pass). Trên giao diện Web: bước GVHD tải báo cáo để chấm điểm bị 404 (`BUG-CRIT-01`); chưa tạo được đợt/tiêu chí mới trên Web nếu không seed DB trực tiếp. |

### 3.3. Increment 3: Change Event, Tính năng tùy chọn `FR8` & Đóng dự án (Gantt Chart `A57`–`A69`)

| Mã Task (Gantt) | Tên công việc / Mốc | Tình trạng hiện tại | Bằng chứng kiểm chứng trong Repo |
| :--- | :--- | :---: | :--- |
| **A57** | Phân tích tác động Change Event (`E1, A20`, Đường găng) | **Chưa thực hiện** | Không có tài liệu Change Event hoặc `Phụ lục B` SRS cập nhật trong repo (`git log` 0 commit liên quan). |
| **A58 / CP8** | Lập Baseline V2.0 & Checkpoint Change Event | **Chưa thực hiện** | Chưa có hồ sơ Baseline V2.0 hay log xác nhận CP8. |
| **A59** | Cài đặt thay đổi theo Change Event (`16.3h`, Đường găng) | **Chưa thực hiện** | Không có endpoint, entity, migration hay UI nào cho Change Event. |
| **A60 (`FR8`, Could)** | Cài đặt nhập Excel/CSV danh sách tài khoản & đơn vị (`8.3h`) | **Chưa triển khai** | `POST /users/import` & `POST /internships/enterprises/import` trả `404`; `docs/api.md:165` ghi rõ *spreadsheet import not implemented*. *(Lưu ý: `FR8` ở mức ưu tiên `Could`, có thể cắt giảm hợp lệ nếu chốt phạm vi nhưng phải ghi rõ trong hồ sơ đóng dự án)*. |
| **A61** | Ổn định hệ thống và kiểm thử hồi quy toàn bộ | **Đang dở dang** | Đã có hồi quy Inc1+Inc2 (A54) ở tầng API, nhưng **Frontend production build đang gãy** và **nhiều bug FE/BE chưa được sửa**. |
| **A62** | Lập báo cáo kết quả kiểm thử | **Đã có Inc1 & Inc2; Đang hoàn tất bản tổng hợp** | Đã có `BAO_CAO_KIEM_THU_A45_INCREMENT1.md`, `BAO_CAO_KIEM_THU_A54_INCREMENT2_HOI_QUY.md`, và báo cáo tổng hợp này. |
| **A63** | Viết hướng dẫn chạy và demo | **Chưa cập nhật đồng bộ** | `README.md` gốc mới hướng dẫn Backend (*"Frontend chưa được khởi tạo"*), thiếu hướng dẫn chạy toàn bộ hệ thống & xử lý path có `&` trên Windows. |
| **A64 / CP3 / CP9** | Nghiệm thu & bàn giao bản cuối | **Chưa đạt điều kiện** | Bị chặn bởi các lỗi Critical ở mục 4.1 dưới đây. |

---

## 4. DANH MỤC CHI TIẾT CÁC LỖI & KHIẾM KHUYẾT CÒN TỒN TẠI

### 4.1. Mức 1 — Lỗi Nghiêm trọng (Critical / Blocker — Bắt buộc xử lý trước nghiệm thu)

| Mã lỗi | Tiêu đề & Mô tả | Vị trí chính xác trong mã nguồn | Tác động & Bằng chứng kiểm chứng |
| :--- | :--- | :--- | :--- |
| **`BUG-CRIT-01`** | **Sai endpoint tải báo cáo khiến SV và GVHD không tải được file báo cáo trên Web (`FR5.3`)** | - `frontend/app/student/submit-report/page.tsx#L133`<br>- `frontend/app/supervisor/evaluate/[id]/page.tsx#L301`<br>- `backend/src/modules/reports/reports.controller.ts#L111` | Frontend gọi `GET /reports/${id}/content` trong khi Backend định nghĩa `@Get(':id/download')`. Probe thực tế trả **`HTTP 404 Not Found`** (còn `/download` trả `200 OK`). GVHD không thể tải file báo cáo của SV để chấm điểm trên UI. |
| **`BUG-CRIT-02`** | **Lỗ hổng bảo vệ route Doanh nghiệp trong Next.js Middleware (`FR1.4`, `FR1.5`)** | - `frontend/middleware.ts#L9-L38` | `isProtectedRoute` và `config.matcher` chỉ kiểm tra `/student`, `/officer`, `/admin`, `/supervisor`; **thiếu hoàn toàn `/enterprise/:path*`** (và `/change-password`). Probe thực tế gọi `GET /enterprise/dashboard` không cần đăng nhập trả **`HTTP 200 OK`** thay vì redirect `307` về `/login`. |
| **`BUG-CRIT-03`** | **Hỏng Production Build của Frontend (`next build`)** | - `frontend/next.config.ts#L8-L17`<br>- `frontend/app/globals.css`<br>- `frontend/app/supervisor/evaluate/[id]/page.tsx#L31`<br>- `frontend/app/enterprise/evaluate/[id]/page.tsx#L31`<br>- `frontend/app/enterprise/progress/[id]/page.tsx#L37` | 1) Chế độ mặc định **Turbopack** bị panic ở `globals.css.css` (`node process exited before we could connect to it with exit code: 0`).<br>2) Chế độ **`--webpack`** lỗi prerender tại `/enterprise/progress/[id]` (và `/supervisor/evaluate/[id]`) vì `cacheComponents: true` xung đột với `use(params)` ngoài `<Suspense>`. Không đóng gói được bản production FE (`next start`).<br>3) Ngoài ra Next.js `16.4.3` phát cảnh báo **lỗ hổng bảo mật đã biết** cần nâng cấp. |
| **`BUG-CRIT-04`** | **Chưa hoàn tất hồ sơ & kiểm thử Change Event (Dời deadline sớm hơn 1 tuần — Inc 3)** | - Chưa có hồ sơ Baseline V2.0 & log kiểm thử `TC-CE-01..03` | Giảng viên đưa ra Change Event **dời deadline lên sớm hơn 1 tuần**. Cần chốt lại Baseline V2.0, cập nhật cấu hình hạn nộp/nhắc hạn nếu bị ảnh hưởng, và chạy xác nhận `TC-CE-01..03` trong `test/increment3/TEST_CASES_INCREMENT3_STABILIZATION.md`. |

### 4.2. Mức 2 — Lỗi Lớn (Major — Gãy chức năng phụ, Mock cứng hoặc sai lệch logic SRS)

| Mã lỗi | Tiêu đề & Mô tả | Vị trí chính xác trong mã nguồn | Tác động & Chi tiết |
| :--- | :--- | :--- | :--- |
| **`BUG-MAJ-01`** | **Trang Đổi mật khẩu (`/change-password`) là giao diện tĩnh 100% (`FR1.3`)** | - `frontend/app/change-password/page.tsx#L1-L128`<br>- `backend/src/modules/auth/auth.dto.ts#L24-L40` | Không có `useState`, không `onSubmit`, không gọi `POST /api/auth/change-password` (bấm "Cập nhật" chỉ reload form). Đồng thời UI ghi *"tối thiểu 8 ký tự"* trong khi Backend bắt `@MinLength(12)` đến `128`. |
| **`BUG-MAJ-02`** | **Lệch Data Contract & Hiển thị sai trọng số điểm giữa Frontend và Backend (`BR6`, `FR2.5`, `FR5.1`)** | - `frontend/types/api.ts#L30` & `submit-report/page.tsx#L148`<br>- `frontend/app/student/dashboard/page.tsx#L82-L86,L105,L382-L392`<br>- `frontend/app/admin/result/page.tsx#L205-L207,L325-L327`<br>- `officer/dashboard`, `supervisor/dashboard`, `supervisor/evaluate/[id]` | 1) **Sai trọng số điểm:** `admin/result` và `student/dashboard` ghi cứng **`30% DN / 20% QT / 50% BC`**, trong khi Backend (`entities.entity.ts:129-146`, `evaluation-score.ts:22-25`) tính theo **`0.4 / 0.3 / 0.3` (40% / 30% / 30%)** và `enterprise/evaluate/[id]` ghi `40%` — gây mâu thuẫn điểm hiển thị với điểm tính.<br>2) Đọc `reportDeadlineAt` thay vì `reportDeadline` (luôn trống hạn nộp).<br>3) Đọc `activePeriod` thay vì `period` trên Student Dashboard.<br>4) Đọc `statusHistory?.[0]?.reason` (không tồn tại trong list API) thay vì `lastStatusReason`, và bỏ sót lý do khi hồ sơ `REJECTED`.<br>5) Đọc `profile.student?.email` nhưng bảng `students` không join `user.email` nên luôn `undefined`.<br>6) Đọc `c.author?.fullName` trên nhận xét tiến độ trong khi BE không trả object `author`. |
| **`BUG-MAJ-03`** | **`BUG-INC1-02` — Sinh viên bị Từ chối (`REJECTED`) không thể đăng ký lại trong đợt mở (`BR1`, `FR2.6`)** | - `backend/src/database/entities.entity.ts#L151`<br>- `backend/src/modules/internships/internships.service.ts#L122-L124`<br>- `backend/src/modules/internships/profile.rules.ts#L4-L15` | Ràng buộc cứng `UNIQUE(student_id, period_id)` kèm khóa chuyển trạng thái `REJECTED -> []` làm SV bị từ chối không thể nộp đơn thực tập mới trong cùng học kỳ (trái `BR1`: *"hiệu lực là trạng thái khác Từ chối"*). *(Lưu ý: `TC-FR2-07` chặn sửa khi `SUBMITTED` là ĐÚNG theo `FR2.4`, cần sửa lại kỳ vọng của test case `TC-FR2-07` thay vì mở khóa `SUBMITTED`)*. |
| **`BUG-MAJ-04`** | **Thiếu toàn bộ UI Quản trị của Cán bộ (`OFFICER`) cho các API đã hoàn thiện** | - Backend có: `UsersController`, `CatalogController`, `EvaluationsController` (`criteria`)<br>- Frontend: **không có page** | Thiếu màn hình: (1) Quản lý tài khoản (`FR1.1`: tạo/sửa/khóa/mở khóa), (2) Quản lý đợt thực tập (`BR10`: mở/đóng đăng ký, cấu hình hạn báo cáo & trọng số), (3) Quản lý danh mục doanh nghiệp (`FR3.3`), (4) Cấu hình bộ tiêu chí Rubric (`FR6.3`), (5) Xem thống kê chi tiết (`FR7.2`) & đổi GVHD sau duyệt. |
| **`BUG-MAJ-05`** | **Còn 3 màn hình Mock dữ liệu giả lập & Nút Chuông thông báo không hoạt động** | - `frontend/app/admin/application/[id]/page.tsx`<br>- `frontend/app/admin/progress-tracking/page.tsx`<br>- `frontend/app/supervisor/progress/[id]/page.tsx`<br>- `frontend/components/layout/AppHeader.tsx#L54-L60` | 3 màn hình phụ trên vẫn hardcode dữ liệu mẫu (`Nguyễn Chí Thanh`, `2313079`, `HS-2026-001`, `BC-W01-001`) không gọi API; nút `BellIcon` trên `AppHeader` không nối `GET /notifications` và `PATCH /notifications/:id/read` (`FR7.4`). |

### 4.3. Mức 3 — Lỗi Nhỏ, Tùy chọn (`Could`) & Sai lệch Đặc tả / Kỹ thuật (Minor)

| Mã lỗi | Tiêu đề & Mô tả | Vị trí chính xác | Chi tiết thực tế |
| :--- | :--- | :--- | :--- |
| **`BUG-MIN-01`** | **`BUG-INC1-03` — Tìm kiếm hồ sơ không khớp tên SV và MSSV (`FR3.1`, `FR7.1`)** | `backend/src/modules/internships/internships.repository.ts#L86-L97` | `listProfiles` chỉ tìm `ILIKE` trên `profile.title`, `enterprise.name`, `supervisor.fullName` (bỏ quên `student.fullName` và `student.studentCode`, dù `exportProfiles` dòng 212 có tìm theo `student.full_name`). |
| **`BUG-MIN-02`** | **`BUG-INC1-04` — Thiếu thông tin người phụ trách DN & đề xuất DN mới khi đăng ký (`FR2.2`)** | `backend/src/modules/internships/internships.dto.ts`<br>`frontend/app/student/register-intern/page.tsx` | Form đăng ký chỉ chọn `enterpriseId` có sẵn, chưa có trường riêng cho người liên hệ tại DN (`contactName`, `contactEmail`, `contactPhone`), chưa cho SV đề xuất DN mới hoặc đính kèm thư tiếp nhận (tùy chọn). |
| **`BUG-MIN-03`** | **Chưa cài đặt Nhập Excel/CSV (`FR8`, mức ưu tiên `Could`)** | Không có module/endpoint | Thiếu `FR8.1`–`FR8.3` (nhập danh sách tài khoản/doanh nghiệp kèm kiểm tra từng dòng). Nếu nhóm quyết định bỏ qua theo quyền `Could`, cần chốt rõ trong báo cáo đóng dự án (`A65`–`A67`). |
| **`BUG-MIN-04`** | **Các sai lệch nhỏ khác giữa Cài đặt hiện tại và SRS v1.0** | Nhiều vị trí ở Backend & Frontend | 1) Chưa đăng nhập bằng MSSV (`FR1.2`), CB chưa reset được mật khẩu người dùng (`FR1.3`), chưa khóa tạm 5 lần sai MK (`NFR1.3`).<br>2) `SUPERVISOR` gọi `GET /evaluations/results/:id` bị `403` (SRS `4.9` cho xem SV được phân công); `ENTERPRISE_REP` được gửi comment tiến độ (SRS `FR4.4`/`4.9` là chỉ đọc).<br>3) Chưa có API đánh dấu SV quá `N` ngày không cập nhật tiến độ (`FR4.5`), chưa cho CB mở lại phiếu đánh giá đã nộp (`BR5`), chưa chặn mở phiếu đánh giá trước khi nộp báo cáo/hết đợt (`BR11`), chưa cho SV sửa tiến độ trên UI (`PATCH /progress/updates/:id`), `totalScore` làm tròn 2 chữ số thay vì 1 (`BR6`), không có thông báo nhắc hạn nộp báo cáo (`FR7.4`).<br>4) `student/dashboard` ẩn nút shortcut *"Nộp báo cáo cuối kỳ"* sau khi đã nộp v1 (`REPORT_SUBMITTED`), `register-intern` chỉ load `myProfiles[0]`, `supervisor/evaluate/[id]` tự chọn `reports[0]` không có dropdown chọn phiên bản. |
| **`BUG-MIN-05`** | **Vấn đề Chất lượng Code, Bảo mật Phiên & Công cụ trên Windows** | - `package.json` / `.eslintrc.js` / CRLF<br>- `frontend/lib/api-client.ts#L30-L35`<br>- `frontend/app/admin/result/page.tsx#L63-L75`<br>- `README.md` | 1) Tên thư mục user `C:\Users\T&T` chứa `&` làm gãy các `.cmd` script của npm (`npm test`, `npm run lint`), gây lỗi `tsconfigRootDir` ở ESLint Backend, và **8.757 lỗi Prettier CRLF** trên Windows.<br>2) `Jest` lỗi worker nếu không có `--runInBand`.<br>3) Token lưu ở `localStorage` + non-`HttpOnly` cookie (tăng rủi ro nếu có XSS).<br>4) `admin/result` gửi $N+1$ HTTP requests (tới 100 request `/evaluations/results/:id` song song).<br>5) `README.md` gốc chưa cập nhật hướng dẫn chạy Frontend. |
| **`BUG-MIN-06`** | **Lỗi mã hóa (font) khi upload file báo cáo đặt tên tiếng Việt (`FR5.1`)** | - `backend/src/modules/reports/reports.service.ts#L92` | Kiểm thử thủ công trên UI với file `kiến trúc phần mềm.pdf` ghi nhận tên hiển thị bị lỗi encoding thành `kiáº¿n trÃºc pháº§n má»m.pdf`, do `Multer` mặc định đọc `file.originalname` theo `latin1` và Backend lưu trực tiếp `basename(file.originalname)` mà chưa decode lại sang `utf8` (`Buffer.from(file.originalname, 'latin1').toString('utf8')`). |

---

## 5. KHUYẾN NGHỊ HÀNH ĐỘNG ƯU TIÊN TRƯỚC NGHIỆM THU (`CP3` / VIVA)

### Ưu tiên P0 — Bắt buộc sửa ngay (Blocker)
1. **Sửa URL tải báo cáo ở Frontend (`BUG-CRIT-01`)**: Đổi `/reports/${...}/content` thành `/reports/${...}/download` tại `frontend/app/student/submit-report/page.tsx#L133` và `frontend/app/supervisor/evaluate/[id]/page.tsx#L301`.
2. **Bảo vệ route Doanh nghiệp (`BUG-CRIT-02`)**: Thêm `pathname.startsWith('/enterprise')` và `pathname.startsWith('/change-password')` vào `frontend/middleware.ts` (hoặc nâng cấp sang `proxy.ts` theo Next.js 16), đồng thời giải mã/kiểm tra `role` hợp lệ.
3. **Khắc phục lỗi `next build` (`BUG-CRIT-03`)**: Bọc phần đọc `params` vào `<Suspense>` hoặc tắt `cacheComponents` nếu chưa dùng PPR trong `frontend/next.config.ts`, kiểm tra lỗi spawn CSS worker của Turbopack trên Windows, và chạy nâng cấp bản vá bảo mật cho Next.js (`16.4.3`).
4. **Thực hiện Change Event (`BUG-CRIT-04`)**: Tiếp nhận yêu cầu Change Event của Giảng viên, viết phân tích tác động (`A57`), chốt Baseline V2.0 (`A58`/`CP8`), và cài đặt code + test hồi quy (`A59`/`A61`).

### Ưu tiên P1 — Nên sửa sớm để hoàn chỉnh luồng Demo & Nghiệp vụ SRS
5. **Nối API cho `/change-password` (`BUG-MAJ-01`)** với `POST /api/auth/change-password` và sửa rule hiển thị tối thiểu 12 ký tự.
6. **Đồng bộ Contract & Trọng số (`BUG-MAJ-02`)**:
   - Đổi nhãn `30% / 20% / 50%` thành `40% / 30% / 30%` (tốt nhất lấy động từ `period.enterpriseWeight`, `supervisorProcessWeight`, `supervisorReportWeight`).
   - Sửa `reportDeadlineAt -> reportDeadline`, `activePeriod -> period`, hiển thị `profile.lastStatusReason` cho cả `NEEDS_REVISION` và `REJECTED`, join `student.user.email` và `comment.author` ở Backend.
7. **Sửa logic `BR1` & Tìm kiếm SV (`BUG-MAJ-03`, `BUG-MIN-01`)**:
   - Thay unique index toàn phần `(student_id, period_id)` bằng partial unique index `WHERE status <> 'REJECTED'` (cho phép SV bị từ chối tạo hồ sơ mới trong đợt đang mở theo `BR1`), đồng thời cập nhật lại kỳ vọng của `TC-FR2-07` khớp với `FR2.4`.
   - Bổ sung `student.fullName ILIKE :search OR student.studentCode ILIKE :search` trong `internships.repository.ts`.
8. **Hoàn thiện giao diện Quản trị CB & Chuông thông báo (`BUG-MAJ-04`, `BUG-MAJ-05`)**:
   - Bổ sung trang Quản lý tài khoản, Đợt thực tập, Doanh nghiệp, Tiêu chí Rubric và Thống kê cho `OFFICER`.
   - Nối API cho `AppHeader` Notification bell, thay thế hoặc gỡ 3 trang mock (`/admin/application/[id]`, `/admin/progress-tracking`, `/supervisor/progress/[id]`).

### Ưu tiên P2 — Chuẩn bị Đóng dự án & Bảo vệ (`A63`, `A65`–`A69`)
9. **Chốt rõ phạm vi tính năng `Could` (`FR8` Import Excel/CSV)**: Cài đặt nếu còn quỹ giờ hoặc ghi nhận chính thức vào mục *Scope Cuts / Lessons Learned* nếu giữ ngoài phạm vi bàn giao.
10. **Chuẩn hóa công cụ & tài liệu chạy (`A63`)**: Cập nhật `README.md` cho cả Backend + Frontend, thống nhất line-ending `.gitattributes` (`text=auto eol=lf`) để sạch 8.757 lỗi Prettier CRLF, và thêm endpoint tổng hợp kết quả theo danh sách thay cho $N+1$ HTTP call ở `/admin/result`.
