# BÁO CÁO KẾT QUẢ KIỂM THỬ INCREMENT 1 (TASK A45)
**Hệ thống Quản lý Thực tập Sinh viên (SIMS)**

| Thông tin | Nội dung chi tiết |
| :--- | :--- |
| **Môn học** | CO3011 – Software Project Management |
| **Hạng mục công việc** | **Task A45 – Kiểm thử Increment 1 (System Test & Acceptance Test)** |
| **Người thực hiện** | Thức (Tester & QA) |
| **Thời gian thực hiện** | 11/11/2026 |
| **Phiên bản mã nguồn (Build/Commit)** | Commit `bb474aa` trên nhánh `main` (Merge Pull Request #4 từ `feature/frontend-increment-1`) |
| **Tài liệu căn cứ** | A35 Chiến lược kiểm thử; A36 Test Case Increment 1 (49 test cases); SRS v1.0 |
| **Sản phẩm bàn giao PBS** | P11 (Kế hoạch & Kịch bản kiểm thử), P12 (Báo cáo kết quả kiểm thử hệ thống) |

---

## 1. Môi trường và Dữ liệu kiểm thử đã thiết lập (Theo Mục 1.7)

### 1.1. Môi trường thực thi
- **Cơ sở dữ liệu**: PostgreSQL 16 (`internship-management-postgres` trên Docker container, cổng `5432`), đã chạy toàn bộ 3 bản migration khởi tạo schema và seed danh mục.
- **Backend API**: NestJS v10 chạy tại `http://localhost:3000/api` (Swagger Documentation: `http://localhost:3000/api/docs`).
- **Frontend Web**: Next.js 16.4.3 (Turbopack) chạy tại `http://localhost:3001` (Tích hợp đầy đủ `apiClient`, `auth-context`, `middleware` bảo vệ route, và hệ thống giao diện chuẩn của Increment 1).
- **Công cụ tự động hóa**: Script [`test/run-a45-tests.js`](./run-a45-tests.js) kết nối trực tiếp CSDL PostgreSQL, gọi API qua HTTP REST Client và kiểm tra phản hồi từ máy chủ giao diện `http://localhost:3001`.

### 1.2. Dữ liệu tài khoản kiểm thử chuẩn đã nạp vào CSDL
Mật khẩu mặc định cho toàn bộ tài khoản: **`Password123!`** (Lưu băm bằng giải thuật `scrypt` kèm salt 16-bytes).

| Vai trò | Mã TK | Email đăng nhập | Dữ liệu khởi tạo trong CSDL |
| :--- | :--- | :--- | :--- |
| **Student** | `SV01` | `sv01@hcmut.edu.vn` | **Nguyễn Minh Trần** (MSSV: `2210001`) – Hồ sơ tại FPT Software (`DV01`), trạng thái **Đã duyệt (`APPROVED`)**, do `GV01` hướng dẫn, có 3 bản ghi báo cáo tuần. |
| **Student** | `SV02` | `sv02@hcmut.edu.vn` | **Nguyễn Thị Trinh** (MSSV: `2210002`) – Hồ sơ tại FPT Software, trạng thái **Chờ duyệt (`SUBMITTED`)**. |
| **Student** | `SV03` | `sv03@hcmut.edu.vn` | **Phạm Thị Hương** (MSSV: `2210003`) – Hồ sơ tại VNG Corp (`DV02`), trạng thái **Đã duyệt (`APPROVED`)**, do `GV02` hướng dẫn. |
| **Student** | `SV04` | `sv04@hcmut.edu.vn` | **Nguyễn Minh Trí** (MSSV: `2210004`) – Hồ sơ bị **Từ chối (`REJECTED`)** kèm lý do. |
| **Student** | `SV05` | `sv05@hcmut.edu.vn` | **Lê Hoàng Nam** (MSSV: `2210005`) – Chưa có hồ sơ (dùng để test tạo mới). |
| **Officer** | `CB01` | `cb01@hcmut.edu.vn` | **Cán bộ Quản lý 01** – Duyệt hồ sơ, phân công GVHD, xuất CSV, theo dõi tiến độ. |
| **Officer** | `CB02` | `cb02@hcmut.edu.vn` | **Cán bộ Quản lý 02** – Kiểm thử xử lý đồng thời (`TC-FR3-08`). |
| **Lecturer** | `GV01` | `gv01@hcmut.edu.vn` | **TS. Nguyễn Văn Giảng** – Hướng dẫn `SV01`. |
| **Lecturer** | `GV02` | `gv02@hcmut.edu.vn` | **PGS.TS. Trần Thị Hướng** – Hướng dẫn `SV03`. |
| **Host Org** | `DV01` | `dv01@fpt.com` | Đại diện **FPT Software** (`DV01`). |
| **Host Org** | `DV02` | `dv02@vng.com.vn` | Đại diện **VNG Corporation** (`DV02`). |

---

## 2. Bảng kết quả kiểm thử 49 Test Cases Increment 1 (Mục 1.12 & Phần 2)

> **Cập nhật quan trọng sau khi tích hợp mã nguồn mới (`bb474aa`)**:
> - **Lỗi `BUG-INC1-01` (Frontend chưa nối API) đã được KHẮC PHỤC HOÀN TOÀN**: Toàn bộ luồng đăng nhập, nộp đơn, xét duyệt, cập nhật tiến độ và nhận xét đều đã kết nối dữ liệu thật giữa Frontend và Backend.
> - **100% các test case Priority High (26/26) và Priority Low (8/8) đều ĐẠT (PASS)**.
> - Hiện tại chỉ còn 4 test case thất bại thuộc về 3 lỗi logic nhỏ đã ghi nhận ở Backend (`BUG-INC1-02`, `BUG-INC1-03`, `BUG-INC1-04`).

| TC-ID | Ngày chạy | Người chạy | Build/Commit | Priority | Kết quả | Mã lỗi | Ghi chú kết quả thực tế |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **TC-FR1-01** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Đăng nhập thành công với `sv01@hcmut.edu.vn`, cấp Bearer token và chuyển hướng tới `/student/dashboard`. |
| **TC-FR1-02** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Đăng nhập thành công và điều hướng đúng theo vai trò: `CB01` -> `/officer/dashboard`, `GV01` -> `/supervisor/dashboard`, `DV01` -> `ENTERPRISE_REP`. |
| **TC-FR1-03** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Nhập sai mật khẩu trả về `401 Unauthorized` (`"Invalid credentials"`), hiển thị thông báo lỗi trên form đăng nhập. |
| **TC-FR1-04** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Email không tồn tại trả về `401 Unauthorized`, không làm lộ thông tin tài khoản. |
| **TC-FR1-05** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Để trống email/password: form chặn trực tiếp ở Client và API trả về `400 Bad Request`. |
| **TC-FR1-06** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Nút Đăng xuất ở Sidebar & Header gọi `POST /api/auth/logout`, xóa token trong cookie/localStorage và đưa về `/login`. |
| **TC-FR1-07** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Mở trực tiếp các URL được bảo vệ (`/student/*`, `/officer/*`, `/supervisor/*`) khi chưa đăng nhập bị `middleware.ts` chặn và redirect `307` về `/login`. |
| **TC-FR1-08** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Sinh viên mở trang hoặc gọi API của Cán bộ bị chặn với `403 Forbidden`. |
| **TC-FR1-09** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Sinh viên gọi lệnh duyệt hồ sơ của sinh viên khác bị chặn với `403 Forbidden`. |
| **TC-FR1-10** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | CSDL lưu trữ mật khẩu băm chuẩn `scrypt` dạng `saltHex:derivedHex`, không lưu plaintext. |
| **TC-FR1-11** | 11/11/2026 | Thức | `bb474aa` | Low | **Pass** | — | Token hết hạn sau 15 phút (900s), hệ thống tự refresh hoặc yêu cầu đăng nhập lại an toàn. |
| **TC-FR2-01** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Sinh viên điền form đăng ký đầy đủ thông tin, bấm "Nộp hồ sơ" chuyển sang trạng thái `SUBMITTED` (201 Created). |
| **TC-FR2-02** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Nộp đơn khi thiếu doanh nghiệp, vị trí hoặc ngày thực tập bị chặn với `400 Bad Request`. |
| **TC-FR2-03** | 11/11/2026 | Thức | `bb474aa` | Medium | **Fail** | `BUG-INC1-04` | DTO đăng ký chưa tách trường riêng cho email và SĐT người liên hệ tại đơn vị để kiểm tra định dạng. |
| **TC-FR2-04** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Ngày bắt đầu > ngày kết thúc bị hệ thống từ chối với `400 Bad Request`. |
| **TC-FR2-05** | 11/11/2026 | Thức | `bb474aa` | Low | **Pass** | — | Biên độ dài: 255 ký tự hợp lệ (`200 OK`), 256 ký tự bị chặn với `400 Bad Request`. |
| **TC-FR2-06** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Đăng ký hồ sơ thứ 2 trong cùng học kỳ bị chặn bởi ràng buộc `UNIQUE(student_id, period_id)`. |
| **TC-FR2-07** | 11/11/2026 | Thức | `bb474aa` | Medium | **Fail** | `BUG-INC1-02` | Hồ sơ đang ở trạng thái `SUBMITTED` (Chờ duyệt) không cho phép sửa thông tin (`Only draft or revision-requested profiles can be edited`). |
| **TC-FR2-08** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Khi hồ sơ đã được `APPROVED`, sinh viên không thể tự ý sửa đổi (`400 Bad Request`). |
| **TC-FR2-09** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Bảo mật IDOR: Sinh viên `SV01` không thể đọc hoặc can thiệp hồ sơ của sinh viên `SV02` (`403 Forbidden`). |
| **TC-FR2-10** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Dữ liệu hồ sơ và trạng thái lưu trữ bền vững trong PostgreSQL, đăng xuất/đăng nhập lại giữ nguyên. |
| **TC-FR2-11** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Chống XSS: Các chuỗi HTML/script được lưu dạng text thuần, React tự động escape khi render. |
| **TC-FR2-12** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Cán bộ quản lý không có form đăng ký thực tập và bị chặn `403 Forbidden` nếu gọi API tạo hồ sơ. |
| **TC-FR2-13** | 11/11/2026 | Thức | `bb474aa` | Low | **Pass** | — | Hỗ trợ tiếng Việt có dấu và ký tự đặc biệt chuẩn UTF-8 trong tên công ty, đề tài và mô tả. |
| **TC-FR3-01** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Cán bộ xem danh sách đơn chờ duyệt tại `/officer/dashboard`, lọc theo trạng thái `SUBMITTED` hiển thị đầy đủ và chính xác. |
| **TC-FR3-02** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Cán bộ xem chi tiết hồ sơ: hiển thị đầy đủ thông tin sinh viên, vị trí, công ty và lịch sử duyệt. |
| **TC-FR3-03** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Cán bộ chọn Giảng viên hướng dẫn (`GV01`) và bấm "Phê duyệt": hồ sơ chuyển sang `APPROVED`, gán đúng `supervisorId`. |
| **TC-FR3-04** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Cán bộ từ chối hồ sơ kèm lý do: hồ sơ chuyển sang `REJECTED`, lý do được lưu vào `lastStatusReason` và `statusHistory`. |
| **TC-FR3-05** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Cán bộ từ chối nhưng để trống lý do: hệ thống chặn với `400 Bad Request` (`"Review reason is required"`). |
| **TC-FR3-06** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Phê duyệt lặp lại hồ sơ đã duyệt: chặn với `400 Bad Request` (`"Cannot change APPROVED to APPROVED"`). |
| **TC-FR3-07** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Giảng viên và Đại diện doanh nghiệp không có quyền xét duyệt hồ sơ (`403 Forbidden`). |
| **TC-FR3-08** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Thao tác đồng thời: `CB01` đã xử lý xong, `CB02` gửi lệnh duyệt tiếp theo trên cùng hồ sơ bị từ chối (`400 Bad Request`), đảm bảo tính nhất quán. |
| **TC-FR3-09** | 11/11/2026 | Thức | `bb474aa` | Medium | **Fail** | `BUG-INC1-02` | Hồ sơ bị `REJECTED` không cho phép sửa để nộp lại (`Only draft or revision-requested profiles can be edited`). |
| **TC-FR3-10** | 11/11/2026 | Thức | `bb474aa` | Low | **Pass** | — | Bảng `status_histories` lưu chính xác `changedBy`, `fromStatus`, `toStatus`, `reason` và thời gian thay đổi. |
| **TC-FR3-11** | 11/11/2026 | Thức | `bb474aa` | Medium | **Fail** | `BUG-INC1-03` | Tìm kiếm theo tên sinh viên hoặc MSSV trên API trả về 0 kết quả do query chưa tìm trên `student.fullName`. |
| **TC-FR4-01** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Sinh viên có hồ sơ `APPROVED` gửi báo cáo tiến độ tuần thành công (`201 Created`), xuất hiện ngay trong lịch sử tiến độ. |
| **TC-FR4-02** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Báo cáo tiến độ để trống nội dung công việc bị chặn với `400 Bad Request`. |
| **TC-FR4-03** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Sinh viên có hồ sơ chưa được duyệt (`SUBMITTED`/`DRAFT`) không thể nộp tiến độ (`400 Bad Request`). |
| **TC-FR4-04** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Sinh viên xem danh sách các đợt tiến độ đã nộp: hiển thị đủ 3 tuần kèm công việc, kết quả, khó khăn. |
| **TC-FR4-05** | 11/11/2026 | Thức | `bb474aa` | Low | **Pass** | — | Sinh viên chỉnh sửa nội dung báo cáo tuần 1: hệ thống cập nhật thành công (`200 OK`). |
| **TC-FR4-06** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Cán bộ quản lý xem được toàn bộ tiến độ các tuần của sinh viên. |
| **TC-FR4-07** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Giảng viên hướng dẫn (`GV01`) mở `/supervisor/dashboard`, xem danh sách sinh viên mình phụ trách, xem tiến độ và viết nhận xét thành công. |
| **TC-FR4-08** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Giảng viên `GV01` xem tiến độ sinh viên của `GV02` phụ trách bị chặn với `403 Forbidden`. |
| **TC-FR4-09** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | Sinh viên `SV02` xem tiến độ của `SV01` bị chặn với `403 Forbidden`. |
| **TC-FR4-10** | 11/11/2026 | Thức | `bb474aa` | Low | **Pass** | — | Giới hạn độ dài nội dung tiến độ: vượt quá 10.000 ký tự bị chặn với `400 Bad Request`. |
| **TC-E2E-01** | 11/11/2026 | Thức | `bb474aa` | High | **Pass** | — | **Kịch bản E2E hoàn tất 100%**: SV tạo & nộp hồ sơ -> CB duyệt & phân công GVHD -> SV nộp báo cáo tuần -> GVHD xem báo cáo & gửi nhận xét -> Tất cả dữ liệu hiển thị đồng bộ trên Frontend và lưu nhất quán vào CSDL. |
| **TC-NFR-01** | 11/11/2026 | Thức | `bb474aa` | Medium | **Pass** | — | Kiểm thử hiệu năng với 504 hồ sơ trong CSDL: API trả về kết quả trong **20 ms** (nhanh hơn rất nhiều so với ngưỡng yêu cầu $\le 3000\text{ ms}$). |
| **TC-NFR-02** | 11/11/2026 | Thức | `bb474aa` | Low | **Pass** | — | Tương thích tốt trên Chrome và Edge, layout responsive, font chữ rõ ràng, độ tương phản input đạt chuẩn. |
| **TC-NFR-03** | 11/11/2026 | Thức | `bb474aa` | Low | **Pass** | — | Toàn bộ giao diện các vai trò (Login, Student Dashboard, Register Intern, Student Progress, Officer Dashboard, Supervisor Dashboard) khớp bản thiết kế giao diện A25. |

---

## 3. Thống kê kết quả kiểm thử & Đánh giá Tiêu chí kết thúc (Mục 1.8)

### 3.1. Thống kê theo Nhóm yêu cầu và Mức độ ưu tiên

| Nhóm / Độ ưu tiên | Tổng số TC | Đạt (Pass) | Thất bại (Fail) | Tỷ lệ Đạt (%) |
| :--- | :---: | :---: | :---: | :---: |
| **Theo Nhóm yêu cầu** | | | | |
| - `FR1` (Xác thực & Phân quyền) | 11 | 11 | 0 | **100%** |
| - `FR2` (Đăng ký thực tập) | 13 | 11 | 2 (`TC-FR2-03`, `TC-FR2-07`) | **84.6%** |
| - `FR3` (Xét duyệt & Phân công) | 11 | 9 | 2 (`TC-FR3-09`, `TC-FR3-11`) | **81.8%** |
| - `FR4` (Cập nhật & Theo dõi tiến độ) | 10 | 10 | 0 | **100%** |
| - `E2E` (Kịch bản tích hợp xuyên suốt) | 1 | 1 | 0 | **100%** |
| - `NFR` (Phi chức năng) | 3 | 3 | 0 | **100%** |
| **Theo Mức độ ưu tiên** | | | | |
| - **High (Ưu tiên cao)** | **26** | **26** | **0** | **100%** |
| - **Medium (Ưu tiên trung bình)** | **15** | **11** | **4** | **73.3%** |
| - **Low (Ưu tiên thấp)** | **8** | **8** | **0** | **100%** |
| **TỔNG CỘNG** | **49** | **45** | **4** | **91.8%** |

### 3.2. Đánh giá theo Tiêu chí kết thúc kiểm thử (Exit Criteria – Mục 1.8)
- [x] **100% Test Case mức High ĐẠT**: **26/26 (100%)** test case High đều vượt qua.
- [x] **Tỷ lệ Đạt tổng thể vượt chỉ tiêu**: Đạt **45/49 (91.8%)**, vượt xa mức tối thiểu 90% quy định cho Increment 1.
- [x] **Không có lỗi nghiêm trọng (Blocker/Critical)**: Toàn bộ luồng nghiệp vụ E2E từ Đăng nhập, Đăng ký, Xét duyệt, Phân công đến Theo dõi tiến độ hoạt động trơn tru trên cả giao diện Web và API.

---

## 4. Danh sách Báo cáo lỗi (Defect Log – Mục 1.9 & 1.12)

### Mã lỗi `BUG-INC1-01`: *(ĐÃ KHẮC PHỤC Ở COMMIT `bb474aa`)*
- **Tiêu đề**: Tích hợp Frontend – Backend API.
- **Trạng thái**: **Đã giải quyết (Closed / Resolved)**.
- **Kết quả kiểm chứng**: Toàn bộ các trang Frontend (`/login`, `/student/dashboard`, `/student/register-intern`, `/student/progress`, `/officer/dashboard`, `/supervisor/dashboard`) đã kết nối API hoàn tất và kiểm thử E2E đạt 100%.

---

### Mã lỗi `BUG-INC1-02`: Chặn sửa hồ sơ khi đang "Chờ duyệt" (`SUBMITTED`) và không nộp lại được khi bị "Từ chối" (`REJECTED`)
| Trường | Chi tiết |
| :--- | :--- |
| **Mã lỗi & Tiêu đề** | `BUG-INC1-02` – Logic kiểm tra trạng thái ở Backend chặn sửa hồ sơ khi đang `SUBMITTED` và khi bị `REJECTED`. |
| **Test case liên quan** | `TC-FR2-07`, `TC-FR3-09` |
| **Môi trường** | Build commit `bb474aa`, API `PATCH /api/internships/profiles/:id`, tài khoản `SV01`, `SV04`. |
| **Kết quả thực tế** | Nhận lỗi `400 Bad Request` (`"Only draft or revision-requested profiles can be edited"`). Backend hiện chỉ cho sửa khi trạng thái là `DRAFT` hoặc `NEEDS_REVISION`. |
| **Kết quả mong đợi** | Cho phép sinh viên sửa khi đang `SUBMITTED` (`TC-FR2-07`) và sửa/nộp lại sau khi bị `REJECTED` (`TC-FR3-09`), hoặc thống nhất chuẩn hóa theo nút "Yêu cầu bổ sung" (`NEEDS_REVISION`). |
| **Mức độ (Severity)** | **Major** |
| **Trạng thái** | **Mở (Open)** – Chờ fix tại Backend `internships.service.ts`. |

---

### Mã lỗi `BUG-INC1-03`: Tìm kiếm hồ sơ không tìm theo tên sinh viên và mã số sinh viên
| Trường | Chi tiết |
| :--- | :--- |
| **Mã lỗi & Tiêu đề** | `BUG-INC1-03` – API `GET /api/internships/profiles?search=...` chỉ tìm theo tiêu đề hồ sơ, công ty và GVHD, bỏ quên sinh viên. |
| **Test case liên quan** | `TC-FR3-11` |
| **Môi trường** | Build commit `bb474aa`, API `GET /api/internships/profiles`, tài khoản `CB01`. |
| **Kết quả thực tế** | Tìm kiếm `search=Minh` hoặc `search=2210001` trả về `total: 0`. |
| **Kết quả mong đợi** | Bổ sung tìm kiếm khớp `student.fullName` và `student.studentCode` trong `internships.repository.ts`. |
| **Mức độ (Severity)** | **Minor** |
| **Trạng thái** | **Mở (Open)** – Chờ fix tại Backend `internships.repository.ts`. |

---

### Mã lỗi `BUG-INC1-04`: Thiếu kiểm tra định dạng email và số điện thoại người liên hệ
| Trường | Chi tiết |
| :--- | :--- |
| **Mã lỗi & Tiêu đề** | `BUG-INC1-04` – `CreateProfileDto` liên kết công ty qua `enterpriseId`, chưa có trường riêng cho email và SĐT người liên hệ. |
| **Test case liên quan** | `TC-FR2-03` |
| **Môi trường** | Build commit `bb474aa`, API `POST /api/internships/profiles`, tài khoản `SV01`. |
| **Kết quả thực tế** | DTO chưa có trường `contactEmail` và `contactPhone` để validate. |
| **Kết quả mong đợi** | Bổ sung trường và decorator `@IsEmail()`, `@Matches()` trong DTO nếu SRS yêu cầu nhập trực tiếp, hoặc cập nhật test case nếu dùng theo danh mục doanh nghiệp. |
| **Mức độ (Severity)** | **Minor** |
| **Trạng thái** | **Mở (Open)**. |
