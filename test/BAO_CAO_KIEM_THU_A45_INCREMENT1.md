# BÁO CÁO KẾT QUẢ KIỂM THỬ INCREMENT 1 (TASK A45)
**Hệ thống quản lý thực tập sinh viên (SIMS)**

| Thông tin | Nội dung |
| :--- | :--- |
| **Môn học** | CO3011 – Software Project Management |
| **Task thực hiện** | **A45 – Kiểm thử Increment 1 (System Test & Re-test)** |
| **Người thực hiện** | Thức (Tester & QA) |
| **Ngày chạy kiểm thử** | 08/11/2026 |
| **Phiên bản Build/Commit** | Commit `57279c5` trên nhánh `feature/frontend` (`backend/dist` v0.1.0 + `frontend` Next.js 16.4.3) |
| **Tài liệu căn cứ** | A35 Chiến lược kiểm thử; A36 Test case Increment 1 (49 test cases) |
| **Sản phẩm thuộc PBS** | P11 (Kế hoạch & Test case), P12 (Báo cáo kết quả kiểm thử) |

---

## 1. Tổng quan thay đổi mã nguồn ở lần kiểm thử lại (Commit `57279c5`)

So với phiên bản kiểm thử đầu tiên, bản cập nhật mã nguồn mới trên nhánh `feature/frontend` (commit `57279c5`) đã bổ sung đầy đủ các màn hình giao diện còn thiếu của Increment 1:
1. **Bổ sung 5 màn hình mới trên Frontend**:
   - `/change-password` ([`frontend/app/change-password/page.tsx`](../frontend/app/change-password/page.tsx)): Màn hình Đổi mật khẩu (hỗ trợ FR1).
   - `/student/progress` ([`frontend/app/student/progress/page.tsx`](../frontend/app/student/progress/page.tsx)): Màn hình Sinh viên nộp báo cáo tiến độ định kỳ theo tuần (`reportPeriod`, `tasks`, `results`, `issues` – đáp ứng giao diện FR4).
   - `/admin/application/[id]` ([`frontend/app/admin/application/[id]/page.tsx`](../frontend/app/admin/application/[id]/page.tsx)): Màn hình Cán bộ quản lý xem chi tiết hồ sơ thực tập, phân công Giảng viên hướng dẫn & Đại diện doanh nghiệp, và thao tác **Phê duyệt / Yêu cầu bổ sung / Từ chối** (đáp ứng giao diện FR3).
   - `/admin/progress-tracking` ([`frontend/app/admin/progress-tracking/page.tsx`](../frontend/app/admin/progress-tracking/page.tsx)): Màn hình Cán bộ quản lý theo dõi tiến độ báo cáo tuần của toàn bộ sinh viên, kèm thống kê và bộ lọc tìm kiếm (đáp ứng giao diện FR4).
   - `/supervisor/progress/[id]` ([`frontend/app/supervisor/progress/[id]/page.tsx`](../frontend/app/supervisor/progress/[id]/page.tsx)): Màn hình Giảng viên hướng dẫn xem chi tiết báo cáo tiến độ tuần của sinh viên và gửi nhận xét/đánh giá (đáp ứng giao diện FR4).
2. **Cập nhật liên kết điều hướng (Sidebar & Quick Actions)**:
   - Sidebar của `/student/dashboard` và `/admin/dashboard` đã gắn đúng đường dẫn sang `/student/progress`, `/admin/progress-tracking`, `/admin/application/[id]`, và `/change-password`.
   - Khắc phục lỗi độ tương phản chữ khi nhập liệu (`color: #111827` trong [`frontend/app/globals.css`](../frontend/app/globals.css)).
3. **Hiện trạng tích hợp FE – BE**:
   - Toàn bộ 9 màn hình trên `feature/frontend` hiện vẫn đang hiển thị **dữ liệu mẫu tĩnh (Mock Data)**, chưa gắn lệnh gọi REST API (`fetch`) tới Backend (`http://localhost:3000/api`) và chưa có Route Guard kiểm tra phiên đăng nhập ở phía Client.
   - Hai thư mục `frontend/app/lecturer/dashboard` và `frontend/app/enterprise/dashboard` đã được tạo nhưng chưa có file `page.tsx`.

---

## 2. Môi trường và Dữ liệu kiểm thử đã thiết lập (Mục 1.7)

### 2.1. Môi trường chạy kiểm thử
- **Cơ sở dữ liệu**: PostgreSQL 16 (`internship-management-postgres` trên Docker, cổng `5432`), đã chạy đầy đủ 3 migrations (`InitialSchema1700000000000`, `BackendWorkflowExpansion1700000001000`, `ApiDemoSeedRegistry1700000002000`).
- **Backend API**: NestJS v10 chạy tại `http://localhost:3000/api` (Swagger Docs: `http://localhost:3000/api/docs`).
- **Frontend UI**: Next.js 16.4.3 chạy tại `http://localhost:3001`.
- **Công cụ kiểm thử**: Script kiểm thử tự động hoá ([`test/run-a45-tests.js`](./run-a45-tests.js)) kiểm tra đồng thời cấu trúc mã nguồn Frontend (Phần A) và toàn bộ kịch bản REST API + PostgreSQL (Phần B).

### 2.2. Bộ tài khoản và dữ liệu kiểm thử đã nạp vào CSDL
Mật khẩu chung cho các tài khoản test: `Password123!` (được băm bằng thuật toán `scrypt` kèm salt 16 bytes).

| Vai trò | Mã TK | Email đăng nhập | Trạng thái dữ liệu chuẩn bị trong CSDL |
| :--- | :--- | :--- | :--- |
| **Student** | `SV01` | `sv01@hcmut.edu.vn` | MSSV `2210001` – Hồ sơ tại `DV01` (FPT Software), trạng thái **Đã duyệt (`APPROVED`)**, do `GV01` hướng dẫn, có 3 bản ghi tiến độ (Tuần 1–3). |
| **Student** | `SV02` | `sv02@hcmut.edu.vn` | MSSV `2210002` – Hồ sơ tại `DV01` (FPT Software), trạng thái **Chờ duyệt (`SUBMITTED`)**. |
| **Student** | `SV03` | `sv03@hcmut.edu.vn` | MSSV `2210003` – Hồ sơ tại `DV02` (VNG Corp), trạng thái **Đã duyệt (`APPROVED`)**, do `GV02` hướng dẫn. |
| **Student** | `SV04` | `sv04@hcmut.edu.vn` | MSSV `2210004` – Hồ sơ tại `DV01`, trạng thái **Từ chối (`REJECTED`)** kèm lý do. |
| **Student** | `SV05` | `sv05@hcmut.edu.vn` | MSSV `2210005` – Chưa có đăng ký (dùng để test tạo mới). |
| **Officer** | `CB01` | `cb01@hcmut.edu.vn` | Cán bộ Quản lý 01 – Duyệt/từ chối hồ sơ, phân công giảng viên, xem thống kê. |
| **Officer** | `CB02` | `cb02@hcmut.edu.vn` | Cán bộ Quản lý 02 – Dùng kiểm thử thao tác đồng thời (`TC-FR3-08`). |
| **Lecturer** | `GV01` | `gv01@hcmut.edu.vn` | TS. Nguyễn Văn Giảng – Hướng dẫn `SV01`. |
| **Lecturer** | `GV02` | `gv02@hcmut.edu.vn` | PGS.TS. Trần Thị Hướng – Hướng dẫn `SV03`. |
| **Host Org** | `DV01` | `dv01@fpt.com` | Đại diện FPT Software – Phụ trách `SV01`, `SV02`. |
| **Host Org** | `DV02` | `dv02@vng.com.vn` | Đại diện VNG Corporation – Phụ trách `SV03`. |

---

## 3. Bảng ghi kết quả chạy Test Case Increment 1 (Mục 1.12 & Phần 2)

> **Lưu ý về cách đánh giá**:
> - Cột **Kết quả** ghi nhận kết quả kiểm thử hệ thống trên cả 2 tầng: **`Pass (API) / Fail (UI)`** đối với các test case đã đạt 100% ở Backend API và đã có đủ giao diện trên Frontend nhưng chờ gắn sự kiện gọi API (`BUG-INC1-01`), **`Pass`** đối với các test case đạt hoàn toàn, và **`Fail`** đối với các test case có sai khác ở tầng logic Backend.
> - Nhờ các màn hình mới vừa được cập nhật ở commit `57279c5` (`/student/progress`, `/admin/application/[id]`, `/admin/progress-tracking`, `/supervisor/progress/[id]`), test case **`TC-NFR-03` (Độ khớp giao diện với bản thiết kế A25)** đã chuyển từ **Fail → Pass**.

| TC-ID | Ngày chạy | Người chạy | Build/Commit | Priority | Kết quả | Mã lỗi | Ghi chú (Kết quả thực tế tại API & UI sau commit `57279c5`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **TC-FR1-01** | 08/11/2026 | Thức | `57279c5` | High | **Pass (API) / Fail (UI)** | `BUG-INC1-01` | **API**: `POST /api/auth/login` với `sv01@hcmut.edu.vn` trả về `200 OK`, cấp Bearer token và `role: STUDENT`. **UI**: Form `/login` hiển thị chuẩn nhưng chưa gắn `onSubmit` gọi API. |
| **TC-FR1-02** | 08/11/2026 | Thức | `57279c5` | High | **Pass (API) / Fail (UI)** | `BUG-INC1-01` | **API**: Đăng nhập `CB01`, `GV01`, `DV01` trả về đúng `role` (`OFFICER`, `SUPERVISOR`, `ENTERPRISE_REP`). **UI**: Đã có `/supervisor/progress/[id]`, nhưng chưa tự điều hướng theo vai trò sau đăng nhập và thư mục `/lecturer/dashboard`, `/enterprise/dashboard` chưa có `page.tsx`. |
| **TC-FR1-03** | 08/11/2026 | Thức | `57279c5` | High | **Pass (API) / Fail (UI)** | `BUG-INC1-01` | **API**: Nhập sai mật khẩu trả về `401 Unauthorized` (`"Invalid credentials"`), không sinh phiên. **UI**: Chưa hiển thị thông báo lỗi từ server. |
| **TC-FR1-04** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | **API**: Nhập `khongtontai@hcmut.edu.vn` trả về `401 Unauthorized` với thông báo chung `"Invalid credentials"`, không lộ việc tài khoản tồn tại hay không. |
| **TC-FR1-05** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass (API) / Fail (UI)** | `BUG-INC1-01` | **API**: Để trống email/password trả về `400 Bad Request` (`email must be an email`, `password must be >= 8 chars`). **UI**: Input tại `/login` chưa có thuộc tính `required`/validation. |
| **TC-FR1-06** | 08/11/2026 | Thức | `57279c5` | High | **Pass (API) / Fail (UI)** | `BUG-INC1-01` | **API**: `POST /api/auth/logout` xóa `refresh_token_hash` trong CSDL (`204 No Content`). **UI**: Chưa có nút Đăng xuất xóa token và chặn nút Back trên trình duyệt. |
| **TC-FR1-07** | 08/11/2026 | Thức | `57279c5` | High | **Pass (API) / Fail (UI)** | `BUG-INC1-01` | **API**: Gọi `/api/internships/dashboard/officer` không kèm token trả về `401 Unauthorized`. **UI**: Dán trực tiếp `http://localhost:3001/admin/dashboard` vẫn mở được trang mẫu tĩnh, chưa redirect về `/login`. |
| **TC-FR1-08** | 08/11/2026 | Thức | `57279c5` | High | **Pass (API) / Fail (UI)** | `BUG-INC1-01` | **API**: Dùng token của `SV01` gọi `/api/internships/dashboard/officer` bị chặn với `403 Forbidden`. **UI**: Chưa có client/middleware guard chặn `SV01` mở `/admin/dashboard`. |
| **TC-FR1-09** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | Dùng token của `SV01` gửi `PATCH /api/internships/profiles/{sv02ProfileId}/review` bị từ chối với `403 Forbidden`, trạng thái của `SV02` giữ nguyên `SUBMITTED`. |
| **TC-FR1-10** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | Kiểm tra bảng `users` cột `password_hash` của `SV01`: lưu dưới dạng `scrypt` (`saltHex:derivedHex`), hoàn toàn không lưu plaintext. |
| **TC-FR1-11** | 08/11/2026 | Thức | `57279c5` | Low | **Pass** | — | Token cấu hình `AUTH_ACCESS_TTL_SECONDS = 900` (15 phút); khi `exp <= now`, `AuthService.verifyToken` ném `401 Unauthorized` (`"Expired token"`), dữ liệu cũ an toàn. |
| **TC-FR2-01** | 08/11/2026 | Thức | `57279c5` | High | **Pass (API) / Fail (UI)** | `BUG-INC1-01` | **API**: `SV01` gọi `POST /api/internships/profiles` (`201`) và `POST .../submit` (`201`) chuyển trạng thái sang `SUBMITTED` (Chờ duyệt). **UI**: Form `/student/register-intern` đã có đủ trường nhưng nút "Nộp đơn đăng ký" đang là button tĩnh (`type="button"`). |
| **TC-FR2-02** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | Khi thiếu `enterpriseId`, `position`, `internshipStartAt` hoặc `internshipEndAt`, gọi `/submit` bị chặn với `400 Bad Request` (`"Enterprise, position and internship dates are required before submission"`). |
| **TC-FR2-03** | 08/11/2026 | Thức | `57279c5` | Medium | **Fail** | `BUG-INC1-04` | `CreateProfileDto` hiện tại liên kết doanh nghiệp qua `enterpriseId` (UUID), chưa có trường riêng cho email và SĐT người liên hệ tại đơn vị trong hồ sơ đăng ký để validate định dạng. |
| **TC-FR2-04** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | Chọn `internshipStartAt = 2026-11-15` > `internshipEndAt = 2026-10-01`, server từ chối với `400 Bad Request` (`"Internship dates must be valid and within the selected period"`). |
| **TC-FR2-05** | 08/11/2026 | Thức | `57279c5` | Low | **Pass** | — | Kiểm thử giá trị biên `MaxLength(255)` trên trường `title`/`position`: chuỗi 255 ký tự trả về `200 OK`; chuỗi 256 ký tự bị chặn với `400 Bad Request`. |
| **TC-FR2-06** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `SV01` gửi đăng ký thứ 2 trong cùng học kỳ `261` bị từ chối với `400 Bad Request` (`"A profile already exists for this period"`), đảm bảo ràng buộc `UNIQUE(student_id, period_id)`. |
| **TC-FR2-07** | 08/11/2026 | Thức | `57279c5` | Medium | **Fail** | `BUG-INC1-02` | Khi hồ sơ đang ở trạng thái `SUBMITTED` (Chờ duyệt), gọi `PATCH /api/internships/profiles/:id` trả về `400 Bad Request` (`"Only draft or revision-requested profiles can be edited"`). |
| **TC-FR2-08** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | Khi hồ sơ của `SV01` đã `APPROVED`, gửi request `PATCH /api/internships/profiles/:id` bằng token `SV01` bị từ chối với `400 Bad Request`, dữ liệu không đổi. |
| **TC-FR2-09** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `SV01` mở danh sách chỉ thấy hồ sơ của mình; khi truy cập `GET /api/internships/profiles/{sv02ProfileId}` bị chặn với `403 Forbidden` (`"Profile ownership required"`) và ghi nhận `RESOURCE_ACCESS_DENIED` vào `system_logs`. |
| **TC-FR2-10** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | Sau khi `SV01` đăng xuất và đăng nhập lại, gọi `GET /api/internships/profiles` vẫn trả về nguyên vẹn hồ sơ và trạng thái đã lưu trong PostgreSQL. |
| **TC-FR2-11** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | Nhập `<script>alert(1)</script>` vào `title`, API lưu chuỗi văn bản thuần (JSON string), React/Next.js tự động escape khi render, không thực thi mã độc XSS. |
| **TC-FR2-12** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | `CB01` (`OFFICER`) không có menu đăng ký thực tập và khi gọi `POST /api/internships/profiles` bị chặn với `403 Forbidden`. |
| **TC-FR2-13** | 08/11/2026 | Thức | `57279c5` | Low | **Pass** | — | Chuỗi tiếng Việt có dấu `"Công ty TNHH Phần mềm Đà Nẵng"` được lưu và trả về chuẩn UTF-8, không lỗi font/encoding. |
| **TC-FR3-01** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `CB01` gọi `GET /api/internships/profiles?status=SUBMITTED` trả về đầy đủ hồ sơ chờ duyệt kèm thông tin sinh viên, doanh nghiệp, đợt thực tập. Giao diện `/admin/dashboard` đã có bảng "Đơn chờ xét duyệt" và nút dẫn tới `/admin/application/[id]`. |
| **TC-FR3-02** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | `CB01` gọi `GET /api/internships/profiles/{id}` hiển thị đầy đủ chi tiết hồ sơ và lịch sử trạng thái (`statusHistory`). Giao diện `/admin/application/[id]` hiển thị đầy đủ thông tin SV, đơn vị, mô tả, tài liệu và khung phân công/quyết định. |
| **TC-FR3-03** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `CB01` duyệt hồ sơ của `SV01` (`PATCH .../review` với `status: APPROVED, supervisorId: GV01`): trạng thái chuyển sang `APPROVED`, rời khỏi danh sách `SUBMITTED`, `SV01` thấy trạng thái mới và nhận thông báo. |
| **TC-FR3-04** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `CB01` từ chối hồ sơ kèm lý do `"Thiếu thông tin người hướng dẫn"`: trạng thái chuyển sang `REJECTED`, trường `lastStatusReason` và `statusHistory` lưu đúng lý do, sinh viên xem thấy đúng lý do. |
| **TC-FR3-05** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | `CB01` gửi `REJECTED` nhưng để trống `reason` (`"   "`): hệ thống chặn với `400 Bad Request` (`"Review reason is required"`), trạng thái không đổi. |
| **TC-FR3-06** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | Duyệt lại hồ sơ đã `APPROVED` của `SV01`: hệ thống chặn chuyển trạng thái lặp lại với `400 Bad Request` (`"Cannot change APPROVED to APPROVED"`), không sinh bản ghi thừa. |
| **TC-FR3-07** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `GV01` (`SUPERVISOR`) và `DV01` (`ENTERPRISE_REP`) gọi API xét duyệt `/review` đều bị chặn với `403 Forbidden`. |
| **TC-FR3-08** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | `CB01` xử lý hồ sơ trước, ngay sau đó `CB02` gửi lệnh xử lý chồng lên cùng hồ sơ: thao tác của `CB02` bị từ chối (`400 Cannot change REJECTED to APPROVED`), trạng thái cuối cùng nhất quán. |
| **TC-FR3-09** | 08/11/2026 | Thức | `57279c5` | Medium | **Fail** | `BUG-INC1-02` | Hồ sơ ở trạng thái `REJECTED` không cho phép sửa (`Only draft or revision-requested profiles can be edited`) và không tạo mới được do ràng buộc unique `(student_id, period_id)` (Backend hiện chỉ cho sửa và gửi lại khi chọn trạng thái `NEEDS_REVISION` – "Yêu cầu bổ sung" như trên màn hình `/admin/application/[id]`). |
| **TC-FR3-10** | 08/11/2026 | Thức | `57279c5` | Low | **Pass** | — | Trong chi tiết hồ sơ đã duyệt, mảng `statusHistory` lưu chính xác `changedBy` (`cb01Id`), `fromStatus: SUBMITTED`, `toStatus: APPROVED`, và `createdAt`. |
| **TC-FR3-11** | 08/11/2026 | Thức | `57279c5` | Medium | **Fail** | `BUG-INC1-03` | Lọc theo `status=SUBMITTED` hoạt động đúng, nhưng tìm kiếm `search=Minh` (tên SV) hoặc `search=2210001` (MSSV) trả về `0` kết quả do câu query trong `InternshipsRepository` chỉ tìm trên `profile.title`, `enterprise.name`, `supervisor.fullName`. |
| **TC-FR4-01** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `SV01` (đã `APPROVED`) gửi `POST /api/progress/profiles/{id}/updates` với tuần, công việc, kết quả: lưu thành công (`201 Created`). Giao diện `/student/progress` đã có đầy đủ form chọn Kỳ báo cáo, Công việc, Kết quả, Khó khăn. |
| **TC-FR4-02** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | Để trống nội dung công việc (`work: ""`), hệ thống từ chối với `400 Bad Request` (`"work must be longer than or equal to 1 characters"`). |
| **TC-FR4-03** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `SV02` (đang ở trạng thái `SUBMITTED` – Chờ duyệt) gửi request thêm tiến độ bị từ chối với `400 Bad Request` (`"Progress can be updated only after profile approval"`). |
| **TC-FR4-04** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | `SV01` có 3 bản cập nhật tiến độ (Tuần 1, 2, 3): gọi `GET /api/progress/profiles/{id}/updates` trả về đủ 3 bản ghi, đúng nội dung và thứ tự thời gian. |
| **TC-FR4-05** | 08/11/2026 | Thức | `57279c5` | Low | **Pass** | — | `SV01` gọi `PATCH /api/progress/updates/{updateId}` đổi nội dung công việc Tuần 1: lưu thành công (`200 OK`) và hiển thị nội dung mới. |
| **TC-FR4-06** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `CB01` (`OFFICER`) gọi `GET /api/progress/profiles/{sv01ProfileId}/updates` xem được đầy đủ 3 bản cập nhật tiến độ của `SV01` (`200 OK`). Giao diện `/admin/progress-tracking` đã được bổ sung để theo dõi tiến độ theo từng tuần. |
| **TC-FR4-07** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `GV01` (người hướng dẫn `SV01`) xem được đầy đủ 3 bản cập nhật tiến độ của `SV01` (`200 OK`). Giao diện `/supervisor/progress/[id]` đã được bổ sung cho phép GVHD xem chi tiết báo cáo tuần và gửi nhận xét. |
| **TC-FR4-08** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `SV03` do `GV02` hướng dẫn: không nằm trong danh sách của `GV01`; khi `GV01` truy cập tiến độ của `SV03` bị chặn với `403 Forbidden` (`"No access to this internship profile"`). |
| **TC-FR4-09** | 08/11/2026 | Thức | `57279c5` | High | **Pass** | — | `SV02` truy cập URL/API tiến độ của `SV01` bị chặn với `403 Forbidden` (`"No access to this internship profile"`). |
| **TC-FR4-10** | 08/11/2026 | Thức | `57279c5` | Low | **Pass** | — | Nhập nội dung `work` dài 10.001 ký tự (vượt giới hạn `MaxLength(10000)`): bị chặn với `400 Bad Request` (`"work must be shorter than or equal to 10000 characters"`). |
| **TC-E2E-01** | 08/11/2026 | Thức | `57279c5` | High | **Pass (API) / Fail (UI)** | `BUG-INC1-01` | **API**: Chạy xuyên suốt 4 bước (`SV01` tạo & nộp đăng ký → `CB01` duyệt & gán `GV01` → `SV01` cập nhật tiến độ → `CB01` & `GV01` xem tiến độ) thành công 100%. **UI**: Đã có đủ 100% màn hình cho cả 4 bước (`/student/register-intern` → `/admin/application/[id]` → `/student/progress` → `/admin/progress-tracking` & `/supervisor/progress/[id]`), chỉ còn chờ nối API. |
| **TC-NFR-01** | 08/11/2026 | Thức | `57279c5` | Medium | **Pass** | — | Nạp 504 hồ sơ đăng ký vào CSDL: thời gian phản hồi API danh sách đăng ký của `CB01` là **25 ms** (nhanh hơn rất nhiều so với ngưỡng yêu cầu $\le 3000\text{ ms}$). |
| **TC-NFR-02** | 08/11/2026 | Thức | `57279c5` | Low | **Pass** | — | Toàn bộ 9 màn hình giao diện (`/login`, `/change-password`, `/student/dashboard`, `/student/register-intern`, `/student/progress`, `/admin/dashboard`, `/admin/application/[id]`, `/admin/progress-tracking`, `/supervisor/progress/[id]`) hiển thị đồng nhất, chữ nhập liệu rõ nét (`#111827`), không vỡ bố cục trên Chrome và Edge. |
| **TC-NFR-03** | 08/11/2026 | Thức | `57279c5` | Low | **Pass** *(Đã khắc phục ở `57279c5`)* | — | Sau khi cập nhật mã nguồn ở commit `57279c5`, toàn bộ các màn hình của Increment 1 (Đăng nhập, Đổi mật khẩu, Dashboard SV, Đăng ký thực tập, Nộp báo cáo tiến độ, Dashboard Admin, Chi tiết xét duyệt & phân công hồ sơ, Theo dõi tiến độ báo cáo, Chi tiết đánh giá tiến độ của GVHD) đã được thiết kế đầy đủ, khớp với đặc tả giao diện A25. |

---

## 4. Thống kê kết quả kiểm thử & Đánh giá Tiêu chí kết thúc (Mục 1.8)

### 4.1. Tổng hợp theo Requirement và Độ ưu tiên (Priority) sau khi cập nhật mã nguồn

| Nhóm / Độ ưu tiên | Tổng số TC | Đạt hoàn toàn (Pass) | Đạt API / Chờ nối API UI | Thất bại logic (Fail) | Blocked / Not Run |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Theo Requirement** | | | | | |
| - `FR1` (Xác thực & Phân quyền) | 11 | 4 | 7 | 0 | 0 |
| - `FR2` (Đăng ký thực tập) | 13 | 10 | 1 | 2 (`TC-FR2-03`, `TC-FR2-07`) | 0 |
| - `FR3` (Xét duyệt đăng ký) | 11 | 9 | 0 | 2 (`TC-FR3-09`, `TC-FR3-11`) | 0 |
| - `FR4` (Cập nhật & Theo dõi tiến độ) | 10 | 10 | 0 | 0 | 0 |
| - `E2E` (Kịch bản xuyên suốt) | 1 | 0 | 1 | 0 | 0 |
| - `NFR` (Phi chức năng) | 3 | 3 *(Tăng 1 TC đạt so với bản trước)* | 0 | 0 | 0 |
| **Theo Priority** | | | | | |
| - **High** | **26** | **18** | **8** *(100% Pass ở tầng API)* | **0** | **0** |
| - **Medium** | **15** | **10** | **1** | **4** | **0** |
| - **Low** | **8** | **8 (100%)** | **0** | **0** | **0** |
| **TỔNG CỘNG** | **49** | **36 (73.5%)** | **9 (18.4%)** | **4 (8.1%)** | **0 (0%)** |

> **Nhận xét tổng quan sau khi re-test commit `57279c5`**:
> - **Về Giao diện (UI)**: Nhóm Frontend đã hoàn thiện **100% các màn hình thiết kế của Increment 1** (bổ sung thêm 5 màn hình mới: `/change-password`, `/student/progress`, `/admin/application/[id]`, `/admin/progress-tracking`, `/supervisor/progress/[id]`), giúp `TC-NFR-03` đạt (**Pass**) và nâng tỷ lệ đạt của nhóm Priority Low lên **8/8 (100%)**.
> - **Về Backend API**: **45/49 test case (91.8%) Đạt (Pass)** ở tầng API, trong đó **26/26 (100%) test case Priority High đạt hoàn toàn ở tầng API**.
> - **Các hạng mục còn lại cho Task A46 (Sửa lỗi Increment 1)**:
>   1. Gắn `fetch` API và Auth Guard vào 9 màn hình Frontend đã có (`BUG-INC1-01`).
>   2. Xử lý 3 điểm lệch nhỏ ở Backend (`BUG-INC1-02`, `BUG-INC1-03`, `BUG-INC1-04`).

---

## 5. Danh sách Báo cáo lỗi cập nhật (Defect Log – Mục 1.9 & 1.12)

### Mã lỗi `BUG-INC1-01`: Các màn hình Frontend đã có đủ giao diện nhưng đang dùng dữ liệu mẫu tĩnh (Mock Data), chưa nối API Backend và chưa có Auth Guard
| Trường | Nội dung chi tiết |
| :--- | :--- |
| **Mã lỗi và tiêu đề** | `BUG-INC1-01` – Frontend đã hoàn thiện đủ 9 màn hình UI của Increment 1 nhưng đang hiển thị dữ liệu tĩnh, chưa gọi REST API tới Backend và chưa chặn truy cập trái phép trên UI. |
| **Test case liên quan** | `TC-FR1-01`, `TC-FR1-02`, `TC-FR1-03`, `TC-FR1-05`, `TC-FR1-06`, `TC-FR1-07`, `TC-FR1-08`, `TC-FR2-01`, `TC-E2E-01` *(Lưu ý: `TC-NFR-03` đã được khắc phục nhờ bổ sung đủ các trang UI mới ở commit `57279c5`)*. |
| **Môi trường** | Build commit `57279c5`, trình duyệt Chrome/Edge (`http://localhost:3001`), tất cả tài khoản test. |
| **Các bước tái hiện** | 1. Mở `http://localhost:3001/login`, nhập tài khoản `sv01@hcmut.edu.vn` / `Password123!` và nhấn "Đăng nhập".<br>2. Mở `/student/register-intern`, `/student/progress`, `/admin/application/1`, `/supervisor/progress/1` và nhấn các nút Submit/Phê duyệt.<br>3. Mở trình duyệt ẩn danh (chưa đăng nhập), dán trực tiếp `http://localhost:3001/admin/dashboard`. |
| **Kết quả thực tế** | 1. Các form trên 9 màn hình chưa gắn hàm `onSubmit` / `onClick` gọi `fetch('http://localhost:3000/api/...')`.<br>2. Các trang `/student/dashboard`, `/admin/dashboard`, `/admin/application/[id]`, `/admin/progress-tracking`, `/supervisor/progress/[id]` đang render từ biến hằng số `appData` / `applicants` / `trackingData` / `reportData` trong code.<br>3. Chưa có Route Guard kiểm tra JWT token khi mở trực tiếp URL. |
| **Kết quả mong đợi** | Gắn kết nối API Backend vào các màn hình đã thiết kế sẵn và thêm kiểm tra quyền truy cập theo `role` (`STUDENT`, `OFFICER`, `SUPERVISOR`, `ENTERPRISE_REP`). |
| **Mức độ (Severity)** | **Critical** (Cần hoàn tất tích hợp FE–BE trong Task A46 để phục vụ buổi demo CP1). |
| **Người báo / Người sửa / Trạng thái** | Người báo: **Thức (QA)** → Giao cho: **Thắng & Minh (A46)** → Trạng thái: **Đã xong phần UI (50%), đang chờ nối API (In Progress)** |

---

### Mã lỗi `BUG-INC1-02`: Không cho phép sinh viên sửa đăng ký ở trạng thái "Chờ duyệt" (`SUBMITTED`) hoặc gửi lại sau khi bị "Từ chối" (`REJECTED`)
| Trường | Nội dung chi tiết |
| :--- | :--- |
| **Mã lỗi và tiêu đề** | `BUG-INC1-02` – Quy tắc trạng thái ở Backend chặn sửa hồ sơ khi đang `SUBMITTED` và chặn sửa/gửi lại khi bị `REJECTED`. |
| **Test case liên quan** | `TC-FR2-07`, `TC-FR3-09` (Đối chiếu Mục 5 STT 5) |
| **Môi trường** | Build commit `57279c5`, API `PATCH /api/internships/profiles/:id` và `POST /api/internships/profiles/:id/submit`, tài khoản `SV01`, `SV04`. |
| **Các bước tái hiện** | **TH1 (`TC-FR2-07`)**: Hồ sơ của `SV01` đang ở trạng thái `SUBMITTED`. Gửi `PATCH /api/internships/profiles/{id}` để đổi vị trí thực tập.<br>**TH2 (`TC-FR3-09`)**: Hồ sơ của `SV04` bị `CB01` đánh dấu `REJECTED`. `SV04` gửi `PATCH` để sửa hoặc `POST` tạo hồ sơ mới trong cùng đợt thực tập. |
| **Kết quả thực tế** | Cả 2 trường hợp đều nhận `400 Bad Request` với thông báo `"Only draft or revision-requested profiles can be edited"` (hoặc `"A profile already exists for this period"` khi tạo mới). Lưu ý: trên màn hình mới `/admin/application/[id]`, nhóm thiết kế đã có nút **"Yêu cầu bổ sung"** (`NEEDS_REVISION`) tách biệt với **"Từ chối hồ sơ"** (`REJECTED`). |
| **Kết quả mong đợi** | Cho phép sinh viên sửa hồ sơ khi đang `SUBMITTED` (`TC-FR2-07`) và sửa/gửi lại sau khi bị `REJECTED` (`TC-FR3-09`), hoặc thống nhất với BA (Tuấn) cập nhật `TC-FR3-09` theo nút "Yêu cầu bổ sung" (`NEEDS_REVISION`). |
| **Mức độ (Severity)** | **Major** |
| **Người báo / Người sửa / Trạng thái** | Người báo: **Thức (QA)** → Giao cho: **Minh (Backend) & Tuấn (xác nhận SRS)** → Trạng thái: **Mới (Open)** |

---

### Mã lỗi `BUG-INC1-03`: Chức năng tìm kiếm hồ sơ đăng ký không tìm theo tên và mã số sinh viên
| Trường | Nội dung chi tiết |
| :--- | :--- |
| **Mã lỗi và tiêu đề** | `BUG-INC1-03` – API `GET /api/internships/profiles?search=...` bỏ sót điều kiện tìm kiếm theo `student.fullName` và `student.studentCode`. |
| **Test case liên quan** | `TC-FR3-11` |
| **Môi trường** | Build commit `57279c5`, API `GET /api/internships/profiles`, tài khoản `CB01`. |
| **Các bước tái hiện** | 1. Đăng nhập `CB01`.<br>2. Gọi `GET /api/internships/profiles?search=Minh` (tên sinh viên `SV01`: Nguyễn Minh Trần) hoặc `GET /api/internships/profiles?search=2210001` (MSSV của `SV01`). (Trên UI `/admin/progress-tracking` và `/admin/dashboard` cũng đều có ô *"Tìm kiếm theo tên hoặc MSSV..."*). |
| **Kết quả thực tế** | Trả về `total: 0, items: []`. Nguyên nhân: Trong `InternshipsRepository.listProfiles`, `Brackets` của `search` chỉ kiểm tra `profile.title ILIKE :search`, `enterprise.name ILIKE :search`, và `supervisor.fullName ILIKE :search`. |
| **Kết quả mong đợi** | Tìm kiếm khớp cả tên sinh viên (`student.fullName`) và mã số sinh viên (`student.studentCode`). |
| **Mức độ (Severity)** | **Minor** (Cách sửa: bổ sung `.orWhere('student.fullName ILIKE :search').orWhere('student.studentCode ILIKE :search')` vào `InternshipsRepository.listProfiles`). |
| **Người báo / Người sửa / Trạng thái** | Người báo: **Thức (QA)** → Giao cho: **Minh (Backend – A46)** → Trạng thái: **Mới (Open)** |

---

### Mã lỗi `BUG-INC1-04`: Hồ sơ đăng ký thực tập chưa tách trường email và số điện thoại người liên hệ tại đơn vị để kiểm tra định dạng
| Trường | Nội dung chi tiết |
| :--- | :--- |
| **Mã lỗi và tiêu đề** | `BUG-INC1-04` – Thiếu trường và bộ kiểm tra định dạng (validation) cho email và SĐT người liên hệ trong `CreateProfileDto` / `UpdateProfileDto` và form `/student/register-intern`. |
| **Test case liên quan** | `TC-FR2-03` (Đối chiếu Mục 5 STT 2) |
| **Môi trường** | Build commit `57279c5`, API `POST /api/internships/profiles` và trang `/student/register-intern`, tài khoản `SV01`. |
| **Các bước tái hiện** | Kiểm tra schema `CreateProfileDto` và giao diện `/student/register-intern` để nhập email sai định dạng (`abc@`) và SĐT chứa chữ cái cho người liên hệ. |
| **Kết quả thực tế** | Form `/student/register-intern` và `CreateProfileDto` hiện chỉ gồm: Tên công ty (`enterpriseId`), Vai trò/Vị trí (`position`), Ngày bắt đầu (`internshipStartAt`), Ngày kết thúc (`internshipEndAt`), Mô tả công việc (`description`), và Tài liệu hỗ trợ; chưa có ô nhập Email/SĐT người liên hệ tại doanh nghiệp. |
| **Kết quả mong đợi** | Nếu SRS v1.1 yêu cầu sinh viên tự nhập thông tin người liên hệ khi đăng ký, cần bổ sung trường và `@IsEmail()`, `@Matches()` cho SĐT; nếu thông tin liên hệ được quản lý ở danh mục Doanh nghiệp (`enterprises` / `enterprise_reps`) thì cập nhật lại test case `TC-FR2-03`. |
| **Mức độ (Severity)** | **Minor** |
| **Người báo / Người sửa / Trạng thái** | Người báo: **Thức (QA)** → Giao cho: **Minh & Tuấn (A46)** → Trạng thái: **Mới (Open)** |
