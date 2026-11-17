# TÀI LIỆU ĐẶC TẢ TEST CASE INCREMENT 2 (TASK A37)
**Hệ thống Quản lý Thực tập Sinh viên (SIMS) — Trường ĐH Bách Khoa ĐHQG-HCM**

| Thông tin | Nội dung chi tiết |
| :--- | :--- |
| **Môn học** | CO3011 – Quản lý Dự án Phần mềm (Software Project Management) |
| **Hạng mục công việc** | **Task A37 – Viết Test Case Increment 2** |
| **Người thực hiện** | Thức (Tester & QA Specialist) |
| **Thời gian thiết kế** | 17/11/2026 |
| **Tài liệu căn cứ** | SRS v1.0, Architecture & API Specification (`docs/api.md`, `docs/frontend-integration.md`), Kế hoạch kiểm thử A35 |
| **Sản phẩm bàn giao PBS** | P11 – Kế hoạch & Kịch bản kiểm thử (Test Cases Specification) |
| **Trạng thái tài liệu** | **Approved / Sẵn sàng thực thi** |

---

## 1. Tổng quan & Phạm vi kiểm thử Increment 2

### 1.1. Phạm vi nghiệp vụ mới trong Increment 2
Increment 2 tập trung vào giai đoạn kết thúc và nghiệm thu kỳ thực tập của sinh viên, bao gồm 3 nhóm yêu cầu chức năng cốt lõi (Functional Requirements) và các ràng buộc bảo mật / phi chức năng:
1. **FR5 – Nộp báo cáo tổng kết thực tập:**
   - Cho phép sinh viên tải file báo cáo tổng kết (định dạng PDF hoặc DOCX, dung lượng tối đa 10 MB).
   - Quản lý phiên bản nộp (v1, v2,...) và kiểm tra hạn chót nộp báo cáo (`isLate`).
   - Tải file báo cáo an toàn (Streamable File qua Private Storage) cho Sinh viên, Giảng viên và Cán bộ.
   - Khóa quyền nộp báo cáo khi giảng viên đã nộp phiếu đánh giá hoặc kết quả đã được chốt.
2. **FR6 – Đánh giá thực tập theo Rubric (Doanh nghiệp & Giảng viên hướng dẫn):**
   - Quản lý danh mục tiêu chí đánh giá phân bổ theo đợt và theo loại phiếu (`ENTERPRISE`, `PROCESS`, `REPORT`).
   - Doanh nghiệp thực hiện chấm điểm theo tiêu chí đơn vị (thang điểm 0–10), lưu nháp (`DRAFT`) và nộp chính thức (`SUBMITTED`).
   - Giảng viên hướng dẫn chấm điểm 2 nhóm tiêu chí: Quá trình (`PROCESS`) và Báo cáo (`REPORT`), bắt buộc liên kết với phiên bản báo cáo (`reportId`), lưu nháp và nộp chính thức.
   - Khóa phiếu đánh giá sau khi nộp (bất biến / immutable).
3. **FR7 – Tổng hợp, Điều chỉnh và Công bố kết quả thực tập:**
   - Hệ thống tự động tính toán điểm tổng kết theo trọng số chuẩn (mặc định: 40% Doanh nghiệp + 30% GVHD Quá trình + 30% GVHD Báo cáo).
   - Cán bộ quản lý xem tổng hợp điểm, thực hiện điều chỉnh điểm (`adjusted_total_score`) kèm lý do bắt buộc và ghi vết lịch sử kiểm toán (`score_adjustments`).
   - Cán bộ chốt kết quả (`finalize`) và công bố (`publish`) kết quả thực tập.
   - Hệ thống tự động phát thông báo (`notification`) cho sinh viên khi điểm được công bố.
   - Sinh viên tra cứu kết quả chính thức sau khi được công bố.
4. **FR-SEC & NFR – Phân quyền, Bảo mật & Phi chức năng:**
   - Kiểm soát quyền truy cập theo vai trò (RBAC) và phân định quyền trên từng tài nguyên (IDOR).
   - Sinh viên không được xem form đánh giá chi tiết của DN/GVHD và không xem được điểm trước khi công bố.
   - Đại diện doanh nghiệp không được tải file báo cáo hoàn chỉnh của sinh viên.
   - Hiệu năng tính điểm, nộp file và tính toàn vẹn dữ liệu trong cơ sở dữ liệu PostgreSQL.

---

## 2. Quy ước mã Test Case & Tiêu chí phân loại

### 2.1. Quy tắc đặt mã TC-ID
Mã kiểm thử tuân thủ cấu trúc: `TC-<NHÓM YÊU CẦU>-<SỐ THỨ TỰ>`
- `TC-FR5-xx`: Kịch bản kiểm thử Nộp và quản lý Báo cáo tổng kết.
- `TC-FR6-xx`: Kịch bản kiểm thử Đánh giá thực tập theo Rubric.
- `TC-FR7-xx`: Kịch bản kiểm thử Tổng hợp, Điều chỉnh & Công bố kết quả.
- `TC-SEC2-xx`: Kịch bản kiểm thử Phân quyền và Bảo mật Increment 2.
- `TC-E2E2-xx`: Kịch bản kiểm thử Tích hợp đầu cuối (End-to-End).
- `TC-NFR2-xx`: Kịch bản kiểm thử Phi chức năng (Hiệu năng, Giao diện, Toàn vẹn dữ liệu).

### 2.2. Phân cấp mức độ ưu tiên (Priority)
- **High (Cao):** Các luồng nghiệp vụ chính yếu (Happy Path), bắt buộc phải ĐẠT 100% để hệ thống đủ điều kiện nghiệm thu.
- **Medium (Trung bình):** Các trường hợp kiểm thử điều kiện biên, dữ liệu không hợp lệ, ràng buộc phụ thuộc logic.
- **Low (Thấp):** Các trường hợp giao diện, định dạng thông báo, giới hạn phụ.

---

## 3. Danh mục 40 Test Cases chi tiết Increment 2

### Nhóm FR5: Nộp và Quản lý Báo cáo tổng kết thực tập

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FR5-01** | Sinh viên nộp báo cáo tổng kết lần đầu (v1) hợp lệ | SV có hồ sơ `APPROVED` trong đợt mở | 1. Đăng nhập tài khoản SV<br>2. Chọn hồ sơ thực tập<br>3. Upload file PDF hợp lệ $\le 10\text{ MB}$<br>4. Gửi yêu cầu | File `final_report_v1.pdf` (magic byte `%PDF-1.4...%%EOF`) | Trả về `201 Created`, sinh bản ghi Report với `version=1`, trạng thái hồ sơ đổi thành `REPORT_SUBMITTED`. | **High** |
| **TC-FR5-02** | Sinh viên nộp phiên bản báo cáo mới (v2) trước khi GV chấm | Đã có báo cáo v1, GV chưa nộp form đánh giá | 1. Đăng nhập tài khoản SV<br>2. Chọn nộp lại báo cáo<br>3. Upload file PDF mới | File `final_report_v2.pdf` | Trả về `201 Created`, sinh bản ghi mới với `version=2`, lưu độc lập trên hệ thống. | **High** |
| **TC-FR5-03** | Chặn upload file sai định dạng (không phải PDF/DOCX) | SV có hồ sơ `APPROVED` | 1. SV upload file text/exe/zip giả mạo | File `malicious.exe` hoặc `report.txt` | Trả về `400 Bad Request` (`"Only valid PDF or DOCX files are accepted"`). | **High** |
| **TC-FR5-04** | Chặn upload file vượt quá kích thước cho phép (> 10MB) | SV có hồ sơ `APPROVED` | 1. SV chọn file có dung lượng 10.5 MB<br>2. Gửi upload | File PDF dung lượng $11\text{ MB}$ | Bị chặn với lỗi `413 Payload Too Large` hoặc `400 Bad Request`. | **Medium** |
| **TC-FR5-05** | Chặn nộp báo cáo khi hồ sơ chưa được duyệt (`SUBMITTED`/`DRAFT`) | SV có hồ sơ đang chờ duyệt (`SUBMITTED`) | 1. SV gửi request upload báo cáo vào hồ sơ chưa duyệt | Profile ID của `SV02` | Trả về `400 Bad Request` (`"Evaluation requires an approved profile"`). | **High** |
| **TC-FR5-06** | Xem danh sách lịch sử các phiên bản báo cáo | SV đã nộp v1 và v2 | 1. Gọi `GET /reports/profiles/:id/versions` | Token của SV chủ sở hữu | Trả về `200 OK`, danh sách gồm v1 và v2, có đủ `version`, `originalName`, `sizeBytes`, `createdAt`, không lộ `storageName`. | **Medium** |
| **TC-FR5-07** | Sinh viên và GVHD tải file báo cáo tổng kết | Đã có báo cáo v1 | 1. SV/GVHD gọi `GET /reports/:id/download` | ID bản ghi report v1 | Trả về `200 OK`, binary stream kèm `Content-Disposition: attachment; filename="..."`. | **High** |
| **TC-FR5-08** | Khóa nộp báo cáo sau khi GVHD đã nộp phiếu đánh giá | GVHD đã submit form đánh giá | 1. SV cố tình upload phiên bản báo cáo v3 | File PDF hợp lệ | Trả về `400 Bad Request` (Báo cáo đã bị khóa do GVHD đã chấm điểm). | **High** |

---

### Nhóm FR6: Đánh giá thực tập theo Rubric (Doanh nghiệp & Giảng viên)

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FR6-01** | Lấy danh mục tiêu chí đánh giá phân bổ theo đợt | Đợt thực tập đã thiết lập tiêu chí | 1. Gọi `GET /evaluations/periods/:id/criteria` | Token Cán bộ / GV / DN | Trả về `200 OK`, danh sách tiêu chí có đầy đủ `category` (`ENTERPRISE`, `PROCESS`, `REPORT`), `weight`, `active`. | **High** |
| **TC-FR6-02** | Cán bộ quản lý tạo tiêu chí đánh giá mới | Tài khoản Cán bộ | 1. Cán bộ gửi POST tạo tiêu chí form ENTERPRISE | Category `ENTERPRISE`, weight `0.2` | Trả về `201 Created`, tiêu chí mới được lưu thành công. | **Medium** |
| **TC-FR6-03** | Chặn tạo tiêu chí có category không khớp loại form | Tài khoản Cán bộ | 1. Cán bộ tạo tiêu chí form ENTERPRISE nhưng category là PROCESS | Form `ENTERPRISE`, Cat `PROCESS` | Trả về `400 Bad Request` (`"Criterion category does not match evaluation type"`). | **Medium** |
| **TC-FR6-04** | Doanh nghiệp khởi tạo form đánh giá (`ENTERPRISE`) | Hồ sơ `APPROVED`, đúng DN phụ trách | 1. DN gọi `POST /evaluations/profiles/:id/forms/ENTERPRISE` | Token `DV01` | Trả về `201 Created` (hoặc form hiện tại), trạng thái `DRAFT`, evaluatorId khớp DN. | **High** |
| **TC-FR6-05** | Doanh nghiệp lưu nháp đánh giá tiêu chí | Đã tạo form DN | 1. Gửi `PATCH /evaluations/forms/:id`<br>2. Nhập điểm một số tiêu chí | Điểm: `9.0`, `8.5`, kèm nhận xét | Trả về `200 OK`, form vẫn ở trạng thái `DRAFT`, chi tiết điểm được lưu. | **Medium** |
| **TC-FR6-06** | Doanh nghiệp nộp chính thức phiếu đánh giá | Đã chấm đủ tiêu chí DN | 1. Gửi `POST /evaluations/forms/:id/submit`<br>2. Đầy đủ điểm tiêu chí | Điểm các tiêu chí từ 8.0 đến 9.5 | Trả về `200 OK`, trạng thái form đổi thành `SUBMITTED`, phiếu bị khóa. | **High** |
| **TC-FR6-07** | Chặn Doanh nghiệp sửa phiếu đánh giá sau khi đã nộp | Form DN đã `SUBMITTED` | 1. DN gửi lệnh PATCH sửa điểm form đã nộp | Điểm mới: `10.0` | Trả về `400 Bad Request` (`"Submitted evaluation forms are locked"`). | **High** |
| **TC-FR6-08** | Giảng viên hướng dẫn khởi tạo form đánh giá (`SUPERVISOR`) | Hồ sơ `APPROVED`, đúng GVHD phụ trách | 1. GVHD gọi `POST /evaluations/profiles/:id/forms/SUPERVISOR` | Token `GV01` | Trả về `201 Created`, trạng thái form `DRAFT`, gán đúng `evaluatorId`. | **High** |
| **TC-FR6-09** | Chặn GVHD nộp form khi chưa chọn phiên bản báo cáo (`reportId`) | Form GVHD đang `DRAFT` | 1. GVHD gọi submit form nhưng không truyền `reportId` | Body không có `reportId` | Trả về `400 Bad Request` (`"A report version must be selected for supervisor evaluation"`). | **High** |
| **TC-FR6-10** | Chặn GVHD nộp form khi chưa chấm đủ 2 nhóm PROCESS và REPORT | Form GVHD có `reportId` | 1. GVHD chỉ chấm điểm nhóm PROCESS, bỏ trống REPORT | Thiếu điểm REPORT | Trả về `400 Bad Request` (`"Supervisor form requires PROCESS and REPORT criteria"`). | **High** |
| **TC-FR6-11** | Giảng viên nộp chính thức phiếu đánh giá hoàn chỉnh | Đã nộp báo cáo v1 | 1. GVHD submit form kèm `reportId` và chấm đủ cả 2 nhóm tiêu chí | `reportId` hợp lệ, điểm 8.0–9.0 | Trả về `200 OK`, trạng thái form chuyển sang `SUBMITTED`, phiếu bị khóa. | **High** |
| **TC-FR6-12** | Chặn nhập điểm ngoài khoảng hợp lệ [0, 10] | Form đang `DRAFT` | 1. Evaluator nhập điểm `-1` hoặc `10.5` | Score = `-1` hoặc `11` | Trả về `400 Bad Request` (`"Scores must be between 0 and 10"`). | **Medium** |

---

### Nhóm FR7: Tổng hợp, Điều chỉnh và Công bố kết quả thực tập

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-FR7-01** | Hệ thống tự động tính điểm tổng kết khi đủ 2 phiếu | Cả DN và GVHD đều đã submit form | 1. Kiểm tra bảng `results` sau khi cả 2 form nộp | Profile ID của `SV01` | Bản ghi `results` tự động sinh, tính chính xác `enterpriseScore`, `supervisorProcessScore`, `supervisorReportScore`, `totalScore`. | **High** |
| **TC-FR7-02** | Cán bộ quản lý xem kết quả tổng hợp | Kết quả đã được tính toán | 1. Cán bộ gọi `GET /evaluations/results/:profileId` | Token `CB01` | Trả về `200 OK`, hiển thị chi tiết điểm thành phần, điểm tính toán, trạng thái chưa finalize. | **High** |
| **TC-FR7-03** | Cán bộ điều chỉnh điểm tổng kết kèm lý do bắt buộc | Điểm đã tính, chưa finalize | 1. Cán bộ gửi `PATCH /evaluations/results/:id/adjustment` | Score = `8.75`, Reason = `"Cộng điểm NCKH xuất sắc"` | Trả về `200 OK`, `adjustedTotalScore=8.75`, `totalScore=8.75`, lưu vết vào `score_adjustments`. | **High** |
| **TC-FR7-04** | Chặn Cán bộ điều chỉnh điểm nhưng để trống lý do | Điểm đã tính, chưa finalize | 1. Cán bộ gửi request đổi điểm nhưng `reason=""` | Score = `9.0`, Reason = `""` | Trả về `400 Bad Request` (`"Adjustment reason is required"`). | **High** |
| **TC-FR7-05** | Cán bộ chốt kết quả thực tập (`finalize`) | Điểm đã tính toán/điều chỉnh | 1. Cán bộ gọi `POST /evaluations/results/:id/finalize` | Token `CB01` | Trả về `200 OK`, ghi nhận `finalizedAt` và `finalizedBy`, khóa kết quả. | **High** |
| **TC-FR7-06** | Chặn điều chỉnh điểm sau khi kết quả đã finalize | Kết quả đã finalize | 1. Cán bộ cố tình gọi API điều chỉnh điểm | Score = `9.5` | Trả về `400 Bad Request` (`"Finalized result cannot be adjusted"`). | **High** |
| **TC-FR7-07** | Cán bộ công bố kết quả thực tập (`publish`) | Kết quả đã finalize | 1. Cán bộ gọi `POST /evaluations/results/:id/publish` | Token `CB01` | Trả về `200 OK`, ghi nhận `publishedAt`, tự động tạo bản ghi `notifications` cho sinh viên. | **High** |
| **TC-FR7-08** | Sinh viên xem kết quả chính thức sau khi công bố | Kết quả đã được publish | 1. Sinh viên gọi `GET /evaluations/results/:profileId` | Token `SV01` | Trả về `200 OK`, hiển thị đầy đủ điểm thành phần và điểm tổng kết cuối cùng. | **High** |
| **TC-FR7-09** | Sinh viên kiểm tra danh sách thông báo hệ thống | Sau khi kết quả publish | 1. Sinh viên gọi `GET /notifications` | Token `SV01` | Trả về `200 OK`, có thông báo mới: `"Internship result published"`. | **Medium** |
| **TC-FR7-10** | Chặn sinh viên xem lịch sử điều chỉnh điểm nội bộ của cán bộ | Kết quả có điều chỉnh điểm | 1. Sinh viên gọi xem kết quả của mình | Token `SV01` | Trả về `200 OK` nhưng mảng `adjustments` là rỗng `[]` (chỉ cán bộ mới thấy lịch sử điều chỉnh). | **Medium** |

---

### Nhóm FR-SEC: Phân quyền & Bảo mật thông tin Increment 2

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-SEC2-01** | Sinh viên xem kết quả trước khi công bố bị từ chối | Kết quả đã tính hoặc đã chốt nhưng chưa publish | 1. Sinh viên gọi `GET /evaluations/results/:id` | Token `SV01` trước publish | Trả về `404 Not Found` (`"Result has not been published"`), bảo mật tuyệt đối điểm số. | **High** |
| **TC-SEC2-02** | Sinh viên xem kết quả của sinh viên khác (IDOR) | Kết quả của SV01 đã công bố | 1. Sinh viên SV02 gọi GET kết quả của SV01 | Token `SV02`, profileId `SV01` | Trả về `403 Forbidden` (`"Result belongs to another student"`). | **High** |
| **TC-SEC2-03** | Sinh viên nộp báo cáo cho hồ sơ của sinh viên khác (IDOR) | Hồ sơ SV01 đã duyệt | 1. Sinh viên SV02 gọi POST nộp file vào profile SV01 | Token `SV02`, profileId `SV01` | Trả về `403 Forbidden` (`"Profile ownership required"`). | **High** |
| **TC-SEC2-04** | Doanh nghiệp cố tình tải file báo cáo của sinh viên | Có báo cáo v1 | 1. DN gọi `GET /reports/:id/download` | Token `DV01` | Trả về `403 Forbidden` (`"Enterprise representatives cannot download final reports"`). | **High** |
| **TC-SEC2-05** | Doanh nghiệp DV02 đánh giá sinh viên của DN01 | Sinh viên thuộc DN01 | 1. Đại diện DV02 gửi form đánh giá cho SV01 | Token `DV02`, profileId `SV01` | Trả về `403 Forbidden` (`"No access to this evaluation resource"`). | **High** |
| **TC-SEC2-06** | Đổi mật khẩu tài khoản và thu hồi session cũ | Người dùng đang đăng nhập | 1. Gọi `POST /auth/change-password`<br>2. Thử dùng refresh token cũ | Mật khẩu mới $\ge 12$ ký tự | Đổi mật khẩu thành công (`200 OK`), refresh token cũ bị thu hồi, đăng nhập bằng mật khẩu mới thành công. | **Medium** |

---

### Nhóm E2E & NFR: Tích hợp đầu cuối & Phi chức năng Increment 2

| TC-ID | Mô tả kịch bản | Tiền điều kiện | Các bước thực hiện | Dữ liệu thử nghiệm | Kết quả mong đợi | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-E2E2-01** | **Kịch bản E2E toàn diện Increment 2:**<br>SV nộp báo cáo $\rightarrow$ DN đánh giá $\rightarrow$ GVHD tải báo cáo & đánh giá $\rightarrow$ Tính điểm $\rightarrow$ CB điều chỉnh & chốt $\rightarrow$ CB công bố $\rightarrow$ SV nhận thông báo & tra cứu điểm | Hồ sơ SV đã duyệt bởi CB | Thực thi tuần tự toàn bộ chuỗi nghiệp vụ kết thúc thực tập giữa 4 Actor (SV, DN, GV, CB) | Luồng dữ liệu hoàn chỉnh của `SV01` | Toàn bộ chuỗi thao tác hoàn tất trơn tru, mã HTTP tương ứng trả về đúng, dữ liệu đồng bộ 100% trong CSDL. | **High** |
| **TC-NFR2-01** | Kiểm tra hiệu năng tính điểm và upload báo cáo | Hệ thống đang chạy | Đo lường thời gian phản hồi API upload và tính điểm | API calls trong luồng | Thời gian phản hồi $\le 150\text{ ms}$ (ngưỡng quy định tối đa $3000\text{ ms}$). | **Medium** |
| **TC-NFR2-02** | Kiểm tra sự sẵn sàng của các màn hình Frontend Increment 2 | Frontend đang chạy tại cổng 3001 | Quét các trang giao diện Increment 2: `/student/submit-report`, `/supervisor/evaluate/[id]`, `/admin/result`, `/admin/dashboard`, `/admin/application/[id]`, `/admin/progress-tracking`, `/change-password` | Các route Frontend | Tất cả các file mã nguồn giao diện tồn tại đầy đủ, trả về HTTP status hợp lệ. | **Low** |
| **TC-NFR2-03** | Kiểm tra lưu trữ file an toàn và toàn vẹn dữ liệu CSDL | Đã có báo cáo upload | Kiểm tra thư mục private storage trên ổ đĩa và liên kết foreign key trong PostgreSQL | Thư mục `var/private-reports` | File trên đĩa được lưu với tên ngẫu nhiên UUID (không lộ tên gốc), không thể truy cập trực tiếp qua static URL, các khóa ngoại CSDL toàn vẹn. | **Low** |

---

## 4. Bảng thống kê Test Case theo Nhóm & Priority

| Nhóm yêu cầu chức năng / phi chức năng | High | Medium | Low | Tổng số Test Cases |
| :--- | :---: | :---: | :---: | :---: |
| **FR5 – Nộp và quản lý Báo cáo tổng kết** | 6 | 2 | 0 | **8** |
| **FR6 – Đánh giá thực tập theo Rubric** | 8 | 4 | 0 | **12** |
| **FR7 – Tổng hợp, Điều chỉnh & Công bố kết quả** | 7 | 3 | 0 | **10** |
| **FR-SEC – Phân quyền & Bảo mật thông tin** | 5 | 1 | 0 | **6** |
| **E2E – Tích hợp chuỗi nghiệp vụ đầu cuối** | 1 | 0 | 0 | **1** |
| **NFR – Phi chức năng (Hiệu năng, UI, Toàn vẹn)** | 0 | 1 | 2 | **3** |
| **TỔNG CỘNG INCREMENT 2** | **27** | **11** | **2** | **40** |
