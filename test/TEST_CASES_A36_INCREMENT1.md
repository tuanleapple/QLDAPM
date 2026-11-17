# TÀI LIỆU ĐẶC TẢ TEST CASE INCREMENT 1 (TASK A36)
**Hệ thống Quản lý Thực tập Sinh viên (SIMS) — Trường ĐH Bách Khoa ĐHQG-HCM**

| Thông tin | Nội dung chi tiết |
| :--- | :--- |
| **Môn học** | CO3011 – Quản lý Dự án Phần mềm (Software Project Management) |
| **Hạng mục công việc** | **Task A36 – Viết Test Case Increment 1** |
| **Người thực hiện** | Thức (Tester & QA Specialist) |
| **Thời gian thiết kế** | 10/11/2026 |
| **Tài liệu căn cứ** | SRS v1.0, Architecture & API Specification (`docs/api.md`, `docs/frontend-integration.md`), Kế hoạch kiểm thử A35 |
| **Sản phẩm bàn giao PBS** | P11 – Kế hoạch & Kịch bản kiểm thử (Test Cases Specification) |
| **Trạng thái tài liệu** | **Approved / Đã nghiệm thu** |

---

## 1. Tổng quan & Phạm vi kiểm thử Increment 1

### 1.1. Phạm vi nghiệp vụ Increment 1
Giai đoạn Increment 1 tập trung xây dựng nền tảng cốt lõi của hệ thống SIMS, bao gồm xác thực phân quyền, quy trình nộp và duyệt hồ sơ thực tập, cùng hệ thống ghi nhận tiến độ hàng tuần giữa Sinh viên, Cán bộ và Giảng viên:
1. **FR1 – Xác thực người dùng & Phân quyền truy cập (Authentication & RBAC):**
   - Đăng nhập đa vai trò: Sinh viên (`STUDENT`), Cán bộ quản lý (`OFFICER`), Giảng viên hướng dẫn (`SUPERVISOR`), Đại diện doanh nghiệp (`ENTERPRISE_REP`).
   - Cấp phát và quản lý cặp JWT token (Access Token 15 phút, Refresh Token 7 ngày có cơ chế xoay vòng - token rotation).
   - Đăng xuất an toàn và thu hồi session.
   - Bảo vệ route Frontend bằng Next.js Middleware và bảo vệ API Backend bằng NestJS `AuthGuard` & `RolesGuard`.
   - Băm mật khẩu một chiều chuẩn bảo mật cao bằng thuật toán `scrypt` kèm salt 16-bytes.
2. **FR2 – Sinh viên nộp đơn đăng ký thực tập:**
   - Tạo hồ sơ nháp (`DRAFT`), chọn đợt thực tập đang mở và chọn doanh nghiệp tiếp nhận.
   - Điền đầy đủ thông tin: đề tài thực tập, vị trí công việc, thời gian thực tập (ngày bắt đầu $\le$ ngày kết thúc).
   - Nộp chính thức (`SUBMITTED`) để chuyển tiếp cho Cán bộ xét duyệt.
   - Ràng buộc toàn vẹn: Mỗi sinh viên chỉ được nộp duy nhất 1 hồ sơ trong 1 đợt thực tập.
   - Chống tấn công XSS và kiểm soát truy cập trực tiếp tài nguyên (IDOR protection).
3. **FR3 – Cán bộ quản lý xét duyệt hồ sơ & Phân công Giảng viên:**
   - Xem danh sách hồ sơ chờ duyệt, lọc theo trạng thái và tìm kiếm sinh viên.
   - Xem chi tiết hồ sơ sinh viên kèm thông tin doanh nghiệp đăng ký.
   - Phê duyệt hồ sơ (`APPROVED`) bắt buộc kèm phân công Giảng viên hướng dẫn (`supervisorId`).
   - Từ chối hồ sơ (`REJECTED`) bắt buộc đính kèm lý do từ chối rõ ràng.
   - Kiểm soát tính bất biến (không cho duyệt lại hồ sơ đã đóng) và kiểm soát xung đột thao tác đồng thời (Concurrency control).
   - Ghi vết kiểm toán lịch sử chuyển trạng thái vào bảng `status_histories`.
4. **FR4 – Cập nhật & Theo dõi tiến độ thực tập hàng tuần:**
   - Sinh viên có hồ sơ `APPROVED` gửi báo cáo tiến độ theo tuần: nội dung công việc (`work`), kết quả đạt được (`outcome`), khó khăn gặp phải (`difficulties`).
   - Sinh viên xem lại lịch sử các tuần và chỉnh sửa nội dung khi cần.
   - Giảng viên hướng dẫn xem tiến độ của sinh viên thuộc quyền phụ trách và gửi nhận xét/góp ý.
   - Phân quyền chặt chẽ: Giảng viên chỉ xem được sinh viên mình phụ trách; Sinh viên không xem được tiến độ của sinh viên khác.
5. **E2E & NFR – Kịch bản tích hợp và Yêu cầu phi chức năng:**
   - Chuỗi nghiệp vụ đầu cuối (End-to-End) xuyên suốt từ Đăng ký $\rightarrow$ Xét duyệt $\rightarrow$ Phân công $\rightarrow$ Báo cáo tuần $\rightarrow$ Nhận xét.
   - Hiệu năng phản hồi của API với tải cơ sở dữ liệu lớn (500 bản ghi).
   - Tính tương thích đa trình duyệt, layout Responsive, độ tương phản form nhập liệu và độ khớp bản thiết kế PBS.

---

## 2. Quy ước mã Test Case & Phân loại

### 2.1. Quy tắc đặt mã TC-ID
Mã kiểm thử tuân thủ cấu trúc: `TC-<NHÓM YÊU CẦU>-<SỐ THỨ TỰ>`
- `TC-FR1-xx`: Nhóm Xác thực & Phân quyền (11 Test Cases).
- `TC-FR2-xx`: Nhóm Đăng ký thực tập (13 Test Cases).
- `TC-FR3-xx`: Nhóm Xét duyệt & Phân công (11 Test Cases).
- `TC-FR4-xx`: Nhóm Báo cáo tiến độ & Nhận xét (10 Test Cases).
- `TC-E2E-xx`: Kịch bản tích hợp toàn diện đầu cuối (1 Test Case).
- `TC-NFR-xx`: Nhóm Yêu cầu phi chức năng (3 Test Cases).

### 2.2. Phân cấp mức độ ưu tiên (Priority)
- **High (Cao):** Các luồng nghiệp vụ cốt lõi, bắt buộc ĐẠT để hoàn thành nghiệm thu Increment 1.
- **Medium (Trung bình):** Các trường hợp kiểm thử biên, validation dữ liệu, kiểm tra quyền chéo và ngoại lệ logic.
- **Low (Thấp):** Các trường hợp giao diện, ký tự đặc biệt, cấu hình thời gian sống phụ.

---

## 3. Danh mục 49 Test Cases chi tiết Increment 1

### Nhóm FR1: Xác thực người dùng & Phân quyền truy cập

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FR1-01** | Đăng nhập tài khoản Sinh viên thành công | Tài khoản `SV01` kích hoạt | 1. Nhập email & mật khẩu đúng<br>2. Bấm "Đăng nhập" | `sv01@hcmut.edu.vn`<br>`Password123!` | Trả về `200 OK`, cấp Bearer Access Token, thông tin user role=`STUDENT`, chuyển hướng `/student/dashboard`. | **High** |
| **TC-FR1-02** | Đăng nhập đa vai trò và điều hướng tương ứng | Tài khoản CB01, GV01, DV01 kích hoạt | 1. Đăng nhập lần lượt từng tài khoản | `cb01@...`, `gv01@...`, `dv01@...` | Trả về `200 OK`, vai trò nhận diện đúng: CB01 $\rightarrow$ `OFFICER`, GV01 $\rightarrow$ `SUPERVISOR`, DV01 $\rightarrow$ `ENTERPRISE_REP`. | **High** |
| **TC-FR1-03** | Đăng nhập sai mật khẩu bị từ chối | Tài khoản tồn tại | 1. Nhập email đúng, mật khẩu sai<br>2. Bấm "Đăng nhập" | Email: `sv01@hcmut.edu.vn`<br>Mật khẩu: `WrongPassword!` | Trả về `401 Unauthorized` (`"Invalid credentials"`), hiển thị thông báo lỗi trên giao diện. | **High** |
| **TC-FR1-04** | Đăng nhập bằng email không tồn tại | Email chưa đăng ký | 1. Nhập email lạ<br>2. Bấm "Đăng nhập" | `nonexistent@hcmut.edu.vn`<br>`Password123!` | Trả về `401 Unauthorized`, không làm lộ thông tin tài khoản hay cấu trúc CSDL. | **Medium** |
| **TC-FR1-05** | Validate form đăng nhập khi để trống dữ liệu | Màn hình `/login` | 1. Để trống email và mật khẩu<br>2. Bấm "Đăng nhập" | Email: `""`<br>Mật khẩu: `""` | Form Client chặn trực tiếp (HTML5/React validation), API trả về `400 Bad Request`. | **Medium** |
| **TC-FR1-06** | Đăng xuất người dùng an toàn | Người dùng đang đăng nhập | 1. Bấm nút "Đăng xuất" tại Header hoặc Sidebar | Bearer Token hợp lệ | Gọi `POST /api/auth/logout`, hủy refresh session, xóa token trong client storage, chuyển về `/login`. | **High** |
| **TC-FR1-07** | Chặn truy cập các URL bảo vệ khi chưa xác thực | Chưa đăng nhập (khách) | 1. Truy cập trực tiếp `/student/dashboard` hoặc `/officer/dashboard` | Không có cookie/token | Next.js Middleware chặn và chuyển hướng redirect HTTP `307` về `/login`. | **High** |
| **TC-FR1-08** | Phân quyền RBAC: Sinh viên gọi API Cán bộ | Đăng nhập tài khoản Sinh viên | 1. Gọi `GET /internships/dashboard/officer` | Token của `SV01` | Trả về `403 Forbidden`, từ chối quyền truy cập tài nguyên của vai trò Cán bộ. | **High** |
| **TC-FR1-09** | Sinh viên gọi lệnh duyệt hồ sơ của sinh viên khác | Đăng nhập tài khoản Sinh viên | 1. Gọi `PATCH /internships/profiles/:id/review` | Token `SV01`, profileId của `SV02` | Trả về `403 Forbidden`, chỉ có Cán bộ quản lý mới có quyền duyệt hồ sơ. | **High** |
| **TC-FR1-10** | Kiểm tra lưu trữ mật khẩu băm bảo mật trong CSDL | Tài khoản đã tạo trong DB | 1. Truy vấn trực tiếp trường `password_hash` trong bảng `users` | Query: `SELECT password_hash FROM users` | Mật khẩu được băm dạng `salt:hash` bằng thuật toán `scrypt`, tuyệt đối không lưu plaintext. | **High** |
| **TC-FR1-11** | Kiểm tra thời gian sống của JWT Token | Token đã được cấp phát | 1. Kiểm tra cấu hình TTL và cơ chế refresh token | Access Token TTL = 900s, Refresh Token TTL = 7 ngày | Token tự động làm mới khi còn hạn refresh; khi hết hạn cả hai thì buộc người dùng đăng nhập lại. | **Low** |

---

### Nhóm FR2: Sinh viên nộp đơn đăng ký thực tập

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FR2-01** | Sinh viên điền form đăng ký đầy đủ và nộp thành công | SV chưa có hồ sơ trong đợt mở | 1. Chọn đợt, doanh nghiệp<br>2. Nhập tiêu đề, vị trí, ngày bắt đầu/kết thúc<br>3. Bấm "Nộp hồ sơ" | Đợt: HK261, DN: FPT Software, Vị trí: Backend Dev, 15/09/2026 - 15/12/2026 | Tạo hồ sơ (`201 Created`), nộp thành công (`200 OK`), trạng thái chuyển sang `SUBMITTED`. | **High** |
| **TC-FR2-02** | Chặn nộp hồ sơ khi thiếu thông tin bắt buộc | Form đăng ký | 1. Bỏ trống vị trí hoặc ngày thực tập<br>2. Bấm nộp hồ sơ | Thiếu `position` hoặc `internshipStartAt` | Trả về `400 Bad Request` (`"Enterprise, position and internship dates are required before submission"`). | **High** |
| **TC-FR2-03** | Ràng buộc định dạng email/SĐT người liên hệ DN | Form đăng ký | 1. Nhập email hoặc SĐT người liên hệ sai định dạng | Email: `abc`, Phone: `123` | Hệ thống kiểm tra định dạng email và số điện thoại hợp lệ (Ghi nhận `BUG-INC1-04` do DTO chưa tách trường). | **Medium** |
| **TC-FR2-04** | Ràng buộc thời gian: Ngày bắt đầu > Ngày kết thúc | Form đăng ký | 1. Nhập ngày bắt đầu sau ngày kết thúc<br>2. Gửi đăng ký | Bắt đầu: `2026-11-15`<br>Kết thúc: `2026-10-01` | Trả về `400 Bad Request` (`"Internship dates must be valid and within the selected period"`). | **High** |
| **TC-FR2-05** | Kiểm tra giới hạn biên độ dài trường dữ liệu (255 ký tự) | Form đăng ký | 1. Nhập trường tiêu đề/vị trí 255 ký tự<br>2. Thử lại với 256 ký tự | 255 ký tự chữ 'A'<br>256 ký tự chữ 'A' | 255 ký tự chấp nhận (`200 OK`), 256 ký tự bị từ chối với `400 Bad Request`. | **Low** |
| **TC-FR2-06** | Chặn tạo hồ sơ thứ 2 trong cùng học kỳ | SV đã có hồ sơ trong đợt | 1. Gửi request tạo thêm hồ sơ mới cùng đợt | Token `SV01`, cùng `periodId` | Trả về `400 Bad Request` hoặc `409 Conflict` do ràng buộc Unique `(student_id, period_id)`. | **High** |
| **TC-FR2-07** | Chỉnh sửa hồ sơ khi đang ở trạng thái `SUBMITTED` | Hồ sơ đang `SUBMITTED` | 1. SV gửi lệnh PATCH sửa vị trí khi đang chờ duyệt | Vị trí mới | Hệ thống chỉ cho phép sửa khi hồ sơ ở trạng thái `DRAFT` hoặc `NEEDS_REVISION` (Ghi nhận `BUG-INC1-02`). | **Medium** |
| **TC-FR2-08** | Chặn chỉnh sửa hồ sơ sau khi đã được `APPROVED` | Hồ sơ đã `APPROVED` | 1. SV gửi lệnh PATCH sửa hồ sơ đã duyệt | Vị trí mới | Trả về `400 Bad Request`, hồ sơ đã duyệt không thể tự ý sửa đổi. | **Medium** |
| **TC-FR2-09** | Bảo mật IDOR: Sinh viên không xem được hồ sơ người khác | SV01 và SV02 đều có hồ sơ | 1. SV01 gọi `GET /internships/profiles/:id` của SV02 | Token `SV01`, profileId `SV02` | Trả về `403 Forbidden`, đảm bảo tính riêng tư thông tin sinh viên. | **High** |
| **TC-FR2-10** | Dữ liệu hồ sơ lưu trữ bền vững sau khi đăng xuất/đăng nhập | Hồ sơ đã tạo thành công | 1. Đăng xuất tài khoản<br>2. Đăng nhập lại<br>3. Xem danh sách hồ sơ | Token mới sau khi re-login | Dữ liệu hồ sơ vẫn tồn tại nguyên vẹn trong CSDL PostgreSQL, hiển thị đúng trạng thái. | **High** |
| **TC-FR2-11** | Chống tấn công XSS trong các trường văn bản | Form đăng ký | 1. Nhập mã script vào trường tiêu đề/mô tả | `<script>alert(1)</script>` | Dữ liệu được lưu an toàn dạng text thuần, React tự động escape ký tự HTML khi render trên UI. | **Medium** |
| **TC-FR2-12** | Chặn Cán bộ quản lý gọi lệnh tạo hồ sơ sinh viên | Đăng nhập tài khoản Cán bộ | 1. Cán bộ gửi `POST /internships/profiles` | Token `CB01` | Trả về `403 Forbidden`, chỉ tài khoản vai trò `STUDENT` mới có quyền tạo hồ sơ. | **Medium** |
| **TC-FR2-13** | Hỗ trợ tiếng Việt có dấu và ký tự đặc biệt UTF-8 | Form đăng ký | 1. Nhập tiếng Việt có dấu đầy đủ vào đề tài | `"Công ty TNHH Phần mềm Đà Nẵng"` | Dữ liệu lưu và truy xuất chuẩn xác UTF-8, không bị lỗi font hay ký tự lạ. | **Low** |

---

### Nhóm FR3: Xét duyệt hồ sơ & Phân công Giảng viên hướng dẫn

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FR3-01** | Cán bộ xem danh sách hồ sơ chờ duyệt (`SUBMITTED`) | Có các hồ sơ đang chờ duyệt | 1. Cán bộ gọi `GET /internships/profiles?status=SUBMITTED` | Token `CB01` | Trả về `200 OK`, danh sách đầy đủ các hồ sơ ở trạng thái `SUBMITTED`. | **High** |
| **TC-FR3-02** | Cán bộ xem thông tin chi tiết một hồ sơ | Hồ sơ tồn tại trong hệ thống | 1. Cán bộ gọi `GET /internships/profiles/:id` | Token `CB01`, ID hồ sơ | Trả về `200 OK`, hiển thị chi tiết thông tin sinh viên, công ty, vị trí, thời gian. | **Medium** |
| **TC-FR3-03** | Cán bộ phê duyệt hồ sơ và phân công Giảng viên hướng dẫn | Hồ sơ đang `SUBMITTED` | 1. Chọn GVHD (`GV01`)<br>2. Bấm "Phê duyệt" | Body: `{ status: "APPROVED", supervisorId: gv01Id }` | Trả về `200 OK`, trạng thái hồ sơ đổi thành `APPROVED`, gán đúng `supervisorId`. | **High** |
| **TC-FR3-04** | Cán bộ từ chối hồ sơ kèm lý do | Hồ sơ đang `SUBMITTED` | 1. Nhập lý do từ chối<br>2. Bấm "Từ chối" | Reason: `"Thiếu thông tin người hướng dẫn tại DN"` | Trả về `200 OK`, trạng thái đổi thành `REJECTED`, lưu lý do vào `lastStatusReason`. | **High** |
| **TC-FR3-05** | Chặn Cán bộ từ chối hồ sơ khi để trống lý do | Hồ sơ đang `SUBMITTED` | 1. Gửi lệnh từ chối nhưng `reason=""` | Reason: `""` hoặc khoảng trắng | Trả về `400 Bad Request` (`"Review reason is required"`). | **Medium** |
| **TC-FR3-06** | Chặn phê duyệt lặp lại hồ sơ đã ở trạng thái `APPROVED` | Hồ sơ đã `APPROVED` | 1. Cán bộ gửi lại lệnh phê duyệt trên hồ sơ đã duyệt | Status: `"APPROVED"` | Trả về `400 Bad Request` (`"Cannot change APPROVED to APPROVED"`). | **Medium** |
| **TC-FR3-07** | Giảng viên và Doanh nghiệp không có quyền duyệt hồ sơ | Hồ sơ đang `SUBMITTED` | 1. GV hoặc DN gọi API xét duyệt hồ sơ | Token `GV01` hoặc `DV01` | Trả về `403 Forbidden`, chỉ Cán bộ quản lý mới có quyền xét duyệt. | **High** |
| **TC-FR3-08** | Kiểm soát thao tác duyệt đồng thời (Concurrency Control) | Hồ sơ vừa được xử lý | 1. CB02 gửi tiếp lệnh duyệt lên hồ sơ mà CB01 vừa đóng | Token `CB02` | Trả về `400 Bad Request`, đảm bảo tính nhất quán giao dịch và trạng thái dữ liệu. | **Medium** |
| **TC-FR3-09** | Chỉnh sửa hồ sơ sau khi bị từ chối (`REJECTED`) | Hồ sơ bị `REJECTED` | 1. SV thử cập nhật hồ sơ để nộp lại | Vị trí sửa đổi | Hệ thống từ chối cập nhật trên hồ sơ đã đóng (Ghi nhận `BUG-INC1-02`). | **Medium** |
| **TC-FR3-10** | Ghi nhận vết kiểm toán vào bảng `status_histories` | Thao tác duyệt thành công | 1. Truy vấn bảng `status_histories` trong CSDL | Query theo `profile_id` | Bản ghi lưu chính xác `changedBy` (CB01), `fromStatus`, `toStatus`, `createdAt`. | **Low** |
| **TC-FR3-11** | Tìm kiếm hồ sơ theo tên sinh viên hoặc MSSV | Có hồ sơ trong CSDL | 1. Cán bộ tìm kiếm với từ khóa tên sinh viên | Search: `"Minh"` | API lọc trả về danh sách tương ứng (Ghi nhận `BUG-INC1-03` do query chưa tìm trên `student.fullName`). | **Medium** |

---

### Nhóm FR4: Cập nhật & Theo dõi tiến độ thực tập hàng tuần

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FR4-01** | Sinh viên có hồ sơ `APPROVED` gửi báo cáo tiến độ tuần | Hồ sơ đã `APPROVED` | 1. Nhập đợt báo cáo: "Tuần 1"<br>2. Nhập công việc, kết quả, khó khăn<br>3. Gửi báo cáo | Work: `"Cài đặt môi trường Docker"`, Outcome: `"Xong"`, Difficulties: `"Không"` | Trả về `201 Created`, bản ghi tiến độ mới được lưu thành công vào CSDL. | **High** |
| **TC-FR4-02** | Chặn nộp báo cáo tiến độ khi để trống nội dung công việc | Hồ sơ đã `APPROVED` | 1. Bỏ trống trường `work`<br>2. Gửi báo cáo | Work: `""` | Trả về `400 Bad Request` (`"Work description is required"`). | **High** |
| **TC-FR4-03** | Chặn nộp tiến độ khi hồ sơ chưa được duyệt | Hồ sơ đang `SUBMITTED` | 1. SV gửi báo cáo tiến độ tuần | Token của `SV02` | Trả về `400 Bad Request` (`"Progress updates require an approved profile"`). | **High** |
| **TC-FR4-04** | Sinh viên xem danh sách các đợt tiến độ đã nộp | Đã nộp 3 tuần báo cáo | 1. SV gọi `GET /progress/profiles/:id/updates` | Token `SV01` | Trả về `200 OK`, hiển thị đầy đủ 3 tuần tiến độ kèm thời gian tạo. | **Medium** |
| **TC-FR4-05** | Sinh viên chỉnh sửa nội dung báo cáo tuần đã nộp | Đã nộp báo cáo tuần 1 | 1. SV gửi `PATCH /progress/updates/:id` | Work cập nhật mới | Trả về `200 OK`, nội dung công việc được cập nhật thành công. | **Low** |
| **TC-FR4-06** | Cán bộ quản lý xem toàn bộ tiến độ của sinh viên | Có tiến độ đã nộp | 1. Cán bộ gọi GET xem tiến độ của sinh viên | Token `CB01`, ID hồ sơ | Trả về `200 OK`, Cán bộ xem được toàn bộ danh sách tiến độ các tuần. | **High** |
| **TC-FR4-07** | Giảng viên hướng dẫn xem tiến độ và gửi nhận xét | GV được phân công SV01 | 1. GV01 xem tiến độ SV01<br>2. Gửi nhận xét góp ý | Content: `"Tiến độ tốt, cần hoàn thiện tài liệu"` | Trả về `201 Created`, nhận xét của GVHD được lưu và hiển thị trên hồ sơ sinh viên. | **High** |
| **TC-FR4-08** | Giảng viên xem tiến độ sinh viên của Giảng viên khác bị chặn | GV01 và GV02 phụ trách riêng | 1. GV01 gọi GET xem tiến độ SV03 (của GV02) | Token `GV01`, profileId `SV03` | Trả về `403 Forbidden`, chỉ GVHD phụ trách mới được xem tiến độ sinh viên đó. | **High** |
| **TC-FR4-09** | Sinh viên xem tiến độ của sinh viên khác bị chặn | SV01 và SV02 | 1. SV02 gọi GET xem tiến độ của SV01 | Token `SV02`, profileId `SV01` | Trả về `403 Forbidden`, bảo mật dữ liệu tiến độ giữa các sinh viên. | **High** |
| **TC-FR4-10** | Giới hạn độ dài nội dung tiến độ tối đa 10.000 ký tự | Form nộp tiến độ | 1. Nhập nội dung `work` vượt quá 10.000 ký tự | Chuỗi 10.001 ký tự | Trả về `400 Bad Request`, từ chối dữ liệu vượt ngưỡng lưu trữ. | **Low** |

---

### Nhóm E2E & NFR: Tích hợp đầu cuối & Phi chức năng Increment 1

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-E2E-01** | **Kịch bản E2E toàn diện Increment 1:**<br>SV tạo & nộp hồ sơ $\rightarrow$ CB duyệt & gán GVHD $\rightarrow$ SV nộp tiến độ tuần $\rightarrow$ GVHD xem tiến độ & gửi nhận xét | Đợt mở, dữ liệu mẫu sẵn sàng | Thực thi tuần tự toàn bộ chuỗi nghiệp vụ giữa Sinh viên, Cán bộ và Giảng viên | Luồng dữ liệu hoàn chỉnh của `SV01` | Toàn bộ các bước hoàn tất trơn tru, mã HTTP trả về đúng, dữ liệu đồng bộ trên UI và CSDL. | **High** |
| **TC-NFR-01** | Kiểm tra hiệu năng phản hồi với tải lớn (500 hồ sơ) | 500 hồ sơ được nạp vào DB | Đo thời gian API Cán bộ lấy danh sách 500 hồ sơ có phân trang | `GET /internships/profiles?page=1&limit=100` | Thời gian phản hồi $\le 100\text{ ms}$ (vượt xa yêu cầu quy định tối đa $3000\text{ ms}$). | **Medium** |
| **TC-NFR-02** | Khả năng tương thích trình duyệt & Giao diện Responsive | Trình duyệt Chrome & Edge | Kiểm tra hiển thị responsive, font chữ tiếng Việt, độ tương phản text input trên nền trắng | Các độ phân giải Desktop / Tablet / Mobile | Giao diện hiển thị rõ ràng, không vỡ layout, chữ trong input có độ tương phản cao, dễ đọc. | **Low** |
| **TC-NFR-03** | Độ khớp các màn hình giao diện với tài liệu thiết kế A25 | Frontend đang chạy port 3001 | Rà soát cấu trúc các trang: Login, Student Dashboard, Register Intern, Student Progress, Officer Dashboard, Supervisor Dashboard, Header, Sidebar | Các file mã nguồn và route tương ứng | Toàn bộ 8 màn hình giao diện cốt lõi Increment 1 tồn tại đầy đủ, khớp bản vẽ thiết kế PBS. | **Low** |

---

## 4. Bảng thống kê Test Case theo Nhóm & Priority

| Nhóm yêu cầu chức năng / phi chức năng | High | Medium | Low | Tổng số Test Cases |
| :--- | :---: | :---: | :---: | :---: |
| **FR1 – Xác thực người dùng & Phân quyền RBAC** | 8 | 2 | 1 | **11** |
| **FR2 – Sinh viên nộp đơn đăng ký thực tập** | 6 | 4 | 3 | **13** |
| **FR3 – Xét duyệt hồ sơ & Phân công GVHD** | 5 | 5 | 1 | **11** |
| **FR4 – Cập nhật & Theo dõi tiến độ thực tập** | 6 | 2 | 2 | **10** |
| **E2E – Tích hợp chuỗi nghiệp vụ đầu cuối** | 1 | 0 | 0 | **1** |
| **NFR – Yêu cầu phi chức năng (Hiệu năng, UI)** | 0 | 1 | 2 | **3** |
| **TỔNG CỘNG INCREMENT 1** | **26** | **14** | **9** | **49** |
