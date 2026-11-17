# BÁO CÁO KẾT QUẢ KIỂM THỬ INCREMENT 2 VÀ HỒI QUY INCREMENT 1 (TASK A54)
**Hệ thống Quản lý Thực tập Sinh viên (SIMS) — Trường ĐH Bách Khoa ĐHQG-HCM**

| Thông tin | Nội dung chi tiết |
| :--- | :--- |
| **Môn học** | CO3011 – Quản lý Dự án Phần mềm (Software Project Management) |
| **Hạng mục công việc** | **Task A54 – Kiểm thử Increment 2 và Kiểm thử hồi quy Increment 1 (System & Acceptance Test)** |
| **Người thực hiện** | Thức (Tester & QA Specialist) |
| **Thời gian thực hiện** | 17/11/2026 |
| **Phiên bản mã nguồn (Build/Commit)** | Nhánh `main` (Đã tích hợp hoàn tất Increment 1 và Increment 2) |
| **Tài liệu căn cứ** | A35 Chiến lược kiểm thử; A36 Test Case Increment 1; A37 Test Case Increment 2; SRS v1.0 |
| **Sản phẩm bàn giao PBS** | P11 (Kế hoạch & Kịch bản kiểm thử), P12 (Báo cáo kết quả kiểm thử hệ thống) |
| **Công cụ tự động hóa** | Script [`test/run-a54-tests.js`](./run-a54-tests.js) thực thi tự động 89 Test Cases |

---

## 1. Môi trường và Dữ liệu kiểm thử đã thiết lập

### 1.1. Môi trường thực thi
- **Cơ sở dữ liệu**: PostgreSQL 16 (`internship-management-postgres` trên Docker container, cổng `5432`), database `internship_management_dev`, đã chạy đầy đủ 3 bản migration khởi tạo schema và các ràng buộc toàn vẹn khóa ngoại.
- **Backend API**: NestJS v10 chạy tại `http://localhost:3000/api` (Swagger Documentation: `http://localhost:3000/api/docs`).
- **Frontend Web**: Next.js 16.4.3 (Turbopack) chạy tại `http://localhost:3001` (Bao gồm đầy đủ các màn hình giao diện của Increment 1 và Increment 2).
- **Bộ công cụ kiểm thử**: Script `test/run-a54-tests.js` kết nối trực tiếp database PostgreSQL, thực hiện các REST API calls qua HTTP, xử lý multipart upload file binary, và kiểm tra tính sẵn sàng của các route Frontend.

### 1.2. Danh mục tài khoản kiểm thử chuẩn
Mật khẩu mặc định cho toàn bộ tài khoản: **`Password123!`** (Lưu băm bằng giải thuật `scrypt` kèm salt 16-bytes).

| Vai trò | Mã TK | Email đăng nhập | Dữ liệu khởi tạo trong CSDL |
| :--- | :--- | :--- | :--- |
| **Student** | `SV01` | `sv01@hcmut.edu.vn` | **Nguyễn Minh Trần** (MSSV: `2210001`) – Hồ sơ tại FPT Software (`DV01`), do `GV01` hướng dẫn, nộp báo cáo v1/v2, được chấm điểm và công bố kết quả. |
| **Student** | `SV02` | `sv02@hcmut.edu.vn` | **Nguyễn Thị Trinh** (MSSV: `2210002`) – Hồ sơ tại FPT Software, trạng thái `SUBMITTED`, dùng test kiểm soát quyền và IDOR. |
| **Student** | `SV03` | `sv03@hcmut.edu.vn` | **Phạm Thị Hương** (MSSV: `2210003`) – Hồ sơ tại VNG Corp (`DV02`), do `GV02` hướng dẫn. |
| **Student** | `SV04` | `sv04@hcmut.edu.vn` | **Nguyễn Minh Trí** (MSSV: `2210004`) – Hồ sơ bị từ chối (`REJECTED`) kèm lý do mẫu. |
| **Student** | `SV05` | `sv05@hcmut.edu.vn` | **Lê Hoàng Nam** (MSSV: `2210005`) – Dùng test đổi mật khẩu và kịch bản đăng ký biên. |
| **Officer** | `CB01` | `cb01@hcmut.edu.vn` | **Cán bộ Quản lý 01** – Duyệt hồ sơ, phân công GVHD, tạo tiêu chí rubric, điều chỉnh điểm, finalize và publish kết quả. |
| **Officer** | `CB02` | `cb02@hcmut.edu.vn` | **Cán bộ Quản lý 02** – Kiểm thử xử lý đồng thời (`TC-FR3-08`). |
| **Supervisor** | `GV01` | `gv01@hcmut.edu.vn` | **TS. Nguyễn Văn Giảng** – Hướng dẫn `SV01`, tải báo cáo, chấm điểm Rubric nhóm Quá trình & Báo cáo. |
| **Supervisor** | `GV02` | `gv02@hcmut.edu.vn` | **PGS.TS. Trần Thị Hướng** – Hướng dẫn `SV03`. |
| **Host Org** | `DV01` | `dv01@fpt.com` | Đại diện **FPT Software** (`DV01`) – Chấm điểm Rubric tiêu chí Doanh nghiệp cho `SV01`. |
| **Host Org** | `DV02` | `dv02@vng.com.vn` | Đại diện **VNG Corporation** (`DV02`). |

### 1.3. Bộ tiêu chí Rubric đánh giá được thiết lập
- **Doanh nghiệp (`ENTERPRISE`):** `ENT-1` (Chuyên môn, trọng số 0.4), `ENT-2` (Kỷ luật, trọng số 0.3), `ENT-3` (Làm việc nhóm, trọng số 0.3).
- **Giảng viên hướng dẫn (`SUPERVISOR`):**
  - Nhóm Quá trình (`PROCESS`): `PROC-1` (Tiến độ công việc, trọng số 0.5), `PROC-2` (Thái độ tương tác, trọng số 0.5).
  - Nhóm Báo cáo (`REPORT`): `REPORT-1` (Bố cục hình thức, trọng số 0.5), `REPORT-2` (Hàm lượng kỹ thuật, trọng số 0.5).

---

## 2. Kết quả kiểm thử chức năng mới Increment 2 (40 Test Cases – Task A37)

| TC-ID | Module | Mô tả kịch bản | Priority | Kết quả | Ghi chú kết quả thực tế |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **TC-FR5-01** | Báo cáo | SV nộp báo cáo v1 hợp lệ (PDF $\le 10\text{ MB}$) | High | **Pass** | `201 Created`, version=1, trạng thái hồ sơ đổi thành `REPORT_SUBMITTED`. |
| **TC-FR5-02** | Báo cáo | SV nộp tiếp phiên bản báo cáo mới (v2) | High | **Pass** | `201 Created`, version=2, lưu trữ độc lập trên private storage. |
| **TC-FR5-03** | Báo cáo | Chặn upload file không phải PDF/DOCX (vd: `.exe`) | High | **Pass** | `400 Bad Request` (`"Only valid PDF or DOCX files are accepted"`). |
| **TC-FR5-04** | Báo cáo | Chặn upload file vượt quá kích thước 10MB (11MB) | Medium | **Pass** | `400 Bad Request` / `413 Payload Too Large`. |
| **TC-FR5-05** | Báo cáo | Chặn nộp báo cáo khi hồ sơ chưa `APPROVED` | High | **Pass** | `400 Bad Request` (`"Evaluation requires an approved profile"`). |
| **TC-FR5-06** | Báo cáo | Xem danh sách lịch sử các phiên bản báo cáo | Medium | **Pass** | `200 OK`, trả về đủ v1 & v2, ẩn đường dẫn file vật lý `storageName`. |
| **TC-FR5-07** | Báo cáo | SV và GVHD tải file báo cáo tổng kết | High | **Pass** | `200 OK`, binary stream kèm `Content-Disposition: attachment`. |
| **TC-FR5-08** | Báo cáo | Khóa nộp báo cáo sau khi GVHD đã nộp phiếu đánh giá | High | **Pass** | `400 Bad Request` (Báo cáo đã khóa do GVHD đã chấm điểm). |
| **TC-FR6-01** | Rubric | Lấy danh mục tiêu chí đánh giá phân bổ theo đợt | High | **Pass** | `200 OK`, danh sách 7 tiêu chí đầy đủ category, weight, active. |
| **TC-FR6-02** | Rubric | Cán bộ quản lý tạo tiêu chí đánh giá mới | Medium | **Pass** | `201 Created`, lưu tiêu chí mới thành công. |
| **TC-FR6-03** | Rubric | Chặn tạo tiêu chí có category không khớp loại form | Medium | **Pass** | `400 Bad Request` (`"Criterion category does not match evaluation type"`). |
| **TC-FR6-04** | Rubric | Doanh nghiệp khởi tạo form đánh giá (`ENTERPRISE`) | High | **Pass** | `201 Created`, form trạng thái `DRAFT`, gán đúng `evaluatorId`. |
| **TC-FR6-05** | Rubric | Doanh nghiệp lưu nháp đánh giá tiêu chí | Medium | **Pass** | `200 OK`, form vẫn ở trạng thái `DRAFT`, chi tiết điểm được cập nhật. |
| **TC-FR6-06** | Rubric | Doanh nghiệp nộp chính thức phiếu đánh giá | High | **Pass** | `200 OK`, form chuyển sang `SUBMITTED` và bị khóa. |
| **TC-FR6-07** | Rubric | Chặn Doanh nghiệp sửa phiếu đánh giá sau khi đã nộp | High | **Pass** | `400 Bad Request` (`"Submitted evaluation forms are locked"`). |
| **TC-FR6-08** | Rubric | Giảng viên khởi tạo form đánh giá (`SUPERVISOR`) | High | **Pass** | `201 Created`, form trạng thái `DRAFT`, gán đúng `evaluatorId`. |
| **TC-FR6-09** | Rubric | Chặn GVHD nộp form khi chưa chọn `reportId` | High | **Pass** | `400 Bad Request` (`"A report version must be selected for supervisor evaluation"`). |
| **TC-FR6-10** | Rubric | Chặn GVHD nộp form khi chưa chấm đủ 2 nhóm PROCESS & REPORT | High | **Pass** | `400 Bad Request` (`"Supervisor form requires PROCESS and REPORT criteria"`). |
| **TC-FR6-11** | Rubric | Giảng viên nộp chính thức form đánh giá hoàn chỉnh | High | **Pass** | `200 OK`, form chuyển sang `SUBMITTED`, liên kết đúng `reportId`. |
| **TC-FR6-12** | Rubric | Chặn nhập điểm ngoài khoảng hợp lệ [0, 10] | Medium | **Pass** | `400 Bad Request` (`"Scores must be between 0 and 10"`). |
| **TC-FR7-01** | Kết quả | Hệ thống tự động tính điểm tổng kết khi đủ 2 phiếu | High | **Pass** | Tự động sinh `results`: DN=9.00, GV_QT=8.75, GV_BC=8.75, Tổng=8.85. |
| **TC-FR7-02** | Kết quả | Cán bộ xem kết quả tổng hợp của sinh viên | High | **Pass** | `200 OK`, hiển thị chi tiết các điểm thành phần, chưa finalize. |
| **TC-FR7-03** | Kết quả | Cán bộ điều chỉnh điểm tổng kết kèm lý do | High | **Pass** | `200 OK`, `adjustedTotalScore=9.00`, lưu vết vào `score_adjustments`. |
| **TC-FR7-04** | Kết quả | Chặn Cán bộ điều chỉnh điểm khi để trống lý do | High | **Pass** | `400 Bad Request` (`"Adjustment reason is required"`). |
| **TC-FR7-05** | Kết quả | Cán bộ chốt kết quả thực tập (`finalize`) | High | **Pass** | `200 OK`, `isFinalized=true`, ghi nhận `finalizedAt` và `finalizedBy`. |
| **TC-FR7-06** | Kết quả | Chặn điều chỉnh điểm sau khi kết quả đã finalize | High | **Pass** | `400 Bad Request` (`"Finalized result cannot be adjusted"`). |
| **TC-FR7-07** | Kết quả | Cán bộ công bố kết quả thực tập (`publish`) | High | **Pass** | `200 OK`, `publishedAt` ghi nhận, tự động tạo notification cho SV. |
| **TC-FR7-08** | Kết quả | Sinh viên xem kết quả chính thức sau khi công bố | High | **Pass** | `200 OK`, hiển thị đầy đủ điểm thành phần và điểm tổng kết cuối cùng. |
| **TC-FR7-09** | Kết quả | Sinh viên kiểm tra danh sách thông báo hệ thống | Medium | **Pass** | `200 OK`, nhận thông báo: `"Internship result published"`. |
| **TC-FR7-10** | Kết quả | Bảo mật lịch sử điều chỉnh điểm nội bộ của cán bộ | Medium | **Pass** | Sinh viên nhận mảng `adjustments: []` (chỉ Cán bộ mới thấy lịch sử). |
| **TC-SEC2-01** | Bảo mật | SV xem kết quả trước khi công bố bị từ chối | High | **Pass** | `404 Not Found` (`"Result has not been published"`), bảo mật tuyệt đối. |
| **TC-SEC2-02** | Bảo mật | SV xem kết quả của SV khác bị chặn (IDOR) | High | **Pass** | `403 Forbidden` (`"Result belongs to another student"`). |
| **TC-SEC2-03** | Bảo mật | SV nộp báo cáo vào hồ sơ của SV khác bị chặn | High | **Pass** | `403 Forbidden` (`"Profile ownership required"`). |
| **TC-SEC2-04** | Bảo mật | Đại diện Doanh nghiệp tải file báo cáo bị chặn | High | **Pass** | `403 Forbidden` (`"Enterprise representatives cannot download final reports"`). |
| **TC-SEC2-05** | Bảo mật | Đại diện DN02 đánh giá sinh viên của DN01 bị chặn | High | **Pass** | `403 Forbidden` (`"No access to this evaluation resource"`). |
| **TC-SEC2-06** | Bảo mật | Đổi mật khẩu tài khoản và thu hồi session cũ | Medium | **Pass** | Đổi MK thành công, refresh token cũ bị hủy, MK mới đăng nhập OK. |
| **TC-E2E2-01** | E2E | **Kịch bản E2E toàn diện Increment 2** | High | **Pass** | Chuỗi thao tác SV $\rightarrow$ DN $\rightarrow$ GV $\rightarrow$ CB $\rightarrow$ SV hoàn tất 100%. |
| **TC-NFR2-01** | Hiệu năng | Hiệu năng xử lý tính điểm và nộp báo cáo | Medium | **Pass** | Upload=32ms, Submit=60ms, tính điểm tự động dưới 5ms (chuẩn $\le 3000\text{ms}$). |
| **TC-NFR2-02** | UI Web | Các màn hình Frontend Increment 2 sẵn sàng | Low | **Pass** | Các route giao diện `/student/submit-report`, `/admin/result`,... phản hồi tốt. |
| **TC-NFR2-03** | Toàn vẹn | Lưu trữ file an toàn và toàn vẹn CSDL | Low | **Pass** | File lưu trong `var/private-reports` mã hóa tên ngẫu nhiên UUID, quan hệ FK toàn vẹn. |

---

## 3. Kết quả kiểm thử hồi quy Increment 1 (49 Test Cases)

Kiểm thử hồi quy nhằm xác minh toàn bộ các chức năng đã xây dựng ở Increment 1 không bị lỗi, không bị ảnh hưởng (Zero Regression) sau khi triển khai Increment 2.

| TC-ID | Nhóm chức năng | Kết quả | Mã lỗi (nếu có) | Đánh giá tính hồi quy |
| :--- | :--- | :---: | :---: | :--- |
| `TC-FR1-01` $\rightarrow$ `TC-FR1-11` | Xác thực & Phân quyền (11 TCs) | **11/11 Pass** | — | **Không hồi quy** (Hoạt động ổn định 100%) |
| `TC-FR2-01` | Đăng ký thực tập (Tạo & Nộp) | **Pass** | — | **Không hồi quy** |
| `TC-FR2-02` | Đăng ký thiếu trường bắt buộc | **Pass** | — | **Không hồi quy** |
| `TC-FR2-03` | Ràng buộc định dạng email/SĐT liên hệ | **Fail** | `BUG-INC1-04` | Lỗi logic cũ từ Inc 1, giữ nguyên trạng |
| `TC-FR2-04` | Ngày bắt đầu > Ngày kết thúc | **Pass** | — | **Không hồi quy** |
| `TC-FR2-05` | Giới hạn độ dài trường 255/256 ký tự | **Pass** | — | **Không hồi quy** |
| `TC-FR2-06` | Chặn trùng lặp hồ sơ trong cùng đợt | **Pass** | — | **Không hồi quy** |
| `TC-FR2-07` | Sửa hồ sơ khi đang `SUBMITTED` | **Fail** | `BUG-INC1-02` | Lỗi logic cũ từ Inc 1, giữ nguyên trạng |
| `TC-FR2-08` | Chặn sửa hồ sơ đã `APPROVED` | **Pass** | — | **Không hồi quy** |
| `TC-FR2-09` | Bảo mật IDOR giữa các sinh viên | **Pass** | — | **Không hồi quy** |
| `TC-FR2-10` | Tính bền vững dữ liệu sau đăng nhập lại | **Pass** | — | **Không hồi quy** |
| `TC-FR2-11` | Chống tấn công XSS trong trường dữ liệu | **Pass** | — | **Không hồi quy** |
| `TC-FR2-12` | Chặn Cán bộ gọi lệnh tạo hồ sơ sinh viên | **Pass** | — | **Không hồi quy** |
| `TC-FR2-13` | Hỗ trợ tiếng Việt UTF-8 có dấu | **Pass** | — | **Không hồi quy** |
| `TC-FR3-01` | Xem danh sách hồ sơ `SUBMITTED` | **Pass** | — | **Không hồi quy** |
| `TC-FR3-02` | Xem chi tiết thông tin hồ sơ | **Pass** | — | **Không hồi quy** |
| `TC-FR3-03` | Cán bộ duyệt hồ sơ & gán GVHD | **Pass** | — | **Không hồi quy** |
| `TC-FR3-04` | Cán bộ từ chối hồ sơ kèm lý do | **Pass** | — | **Không hồi quy** |
| `TC-FR3-05` | Chặn từ chối hồ sơ khi để trống lý do | **Pass** | — | **Không hồi quy** |
| `TC-FR3-06` | Chặn phê duyệt lặp lại hồ sơ đã duyệt | **Pass** | — | **Không hồi quy** |
| `TC-FR3-07` | Giảng viên & Doanh nghiệp không được duyệt | **Pass** | — | **Không hồi quy** |
| `TC-FR3-08` | Kiểm soát thao tác duyệt đồng thời | **Pass** | — | **Không hồi quy** |
| `TC-FR3-09` | Sửa hồ sơ sau khi bị `REJECTED` | **Fail** | `BUG-INC1-02` | Lỗi logic cũ từ Inc 1, giữ nguyên trạng |
| `TC-FR3-10` | Ghi nhận lịch sử duyệt `status_histories` | **Pass** | — | **Không hồi quy** |
| `TC-FR3-11` | Tìm kiếm theo tên sinh viên | **Fail** | `BUG-INC1-03` | Lỗi logic cũ từ Inc 1, giữ nguyên trạng |
| `TC-FR4-01` $\rightarrow$ `TC-FR4-10` | Báo cáo tiến độ & Nhận xét (10 TCs) | **10/10 Pass** | — | **Không hồi quy** (Hoạt động ổn định 100%) |
| `TC-E2E-01` | Kịch bản tích hợp E2E Increment 1 | **Pass** | — | **Không hồi quy** |
| `TC-NFR-01` $\rightarrow$ `TC-NFR-03` | Phi chức năng Increment 1 (3 TCs) | **3/3 Pass** | — | **Không hồi quy** |

---

## 4. Thống kê kết quả kiểm thử & Đánh giá Tiêu chí kết thúc

### 4.1. Bảng tổng hợp số liệu kiểm thử toàn hệ thống

| Phân loại kiểm thử | Tổng TC | Đạt (Pass) | Thất bại (Fail) | Tỷ lệ Đạt (%) |
| :--- | :---: | :---: | :---: | :---: |
| **1. Kiểm thử Hồi quy Increment 1 (Regression Suite)** | **49** | **45** | **4** | **91.8%** |
| - Mức High (Cao) | 26 | 26 | 0 | 100.0% |
| - Mức Medium (Trung bình) | 15 | 11 | 4 | 73.3% |
| - Mức Low (Thấp) | 8 | 8 | 0 | 100.0% |
| **2. Kiểm thử Chức năng mới Increment 2 (New Features Suite)** | **40** | **40** | **0** | **100.0%** |
| - Mức High (Cao) | 27 | 27 | 0 | 100.0% |
| - Mức Medium (Trung bình) | 11 | 11 | 0 | 100.0% |
| - Mức Low (Thấp) | 2 | 2 | 0 | 100.0% |
| **TỔNG CỘNG TOÀN BỘ HỆ THỐNG (A54)** | **89** | **85** | **4** | **95.5%** |

### 4.2. Đánh giá theo Tiêu chí kết thúc kiểm thử (Exit Criteria)
- [x] **Không phát sinh bất kỳ lỗi hồi quy mới nào (Zero New Regression):**  
  Toàn bộ 45 test cases đã ĐẠT ở đợt kiểm thử A45 tiếp tục ĐẠT 100% trong đợt chạy này. 4 ca thất bại hoàn toàn trùng khớp với 3 khiếm khuyết nghiệp vụ cũ đã ghi nhận trong tài liệu thiết kế (`BUG-INC1-02`, `BUG-INC1-03`, `BUG-INC1-04`), không có thêm bất kỳ lỗi phát sinh nào do việc tích hợp Increment 2.
- [x] **Tỷ lệ Đạt của chức năng mới Increment 2 đạt 100%:**  
  Tất cả 40/40 test cases của Increment 2 đều vượt qua thành công, vượt xa yêu cầu nghiệm thu $\ge 90\%$.
- [x] **100% Test Case mức độ ưu tiên High đều ĐẠT:**  
  Tổng cộng **53/53 test cases High** (26 của Inc 1 + 27 của Inc 2) đều đạt kết quả Pass.
- [x] **Tính toàn vẹn và an toàn của hệ thống:**  
  Các luồng phân quyền đa vai trò, tải file bảo mật qua Private Storage, băm mật khẩu `scrypt`, liên kết khóa ngoại và tính điểm tự động theo công thức hoạt động chính xác tuyệt đối.

---

## 5. Kết luận & Đề xuất hoàn thiện
1. **Kết luận nghiệm thu:**  
   Giai đoạn Increment 2 và kiểm thử hồi quy Increment 1 (Task A54) đã **hoàn thành xuất sắc**, đủ điều kiện nghiệm thu kỹ thuật và đóng gói bàn giao cho môn học CO3011.
2. **Khuyến nghị cho đợt bảo trì tiếp theo:**
   - Bổ sung trường `contactEmail` và `contactPhone` trong DTO đăng ký thực tập để hoàn thiện `BUG-INC1-04`.
   - Nâng cấp câu lệnh tìm kiếm hồ sơ ở Backend để tìm kiếm thêm trên trường `student.fullName` (`BUG-INC1-03`).
   - Cân nhắc hỗ trợ tính năng cho phép sinh viên chỉnh sửa hồ sơ khi bị từ chối (`REJECTED`) để nộp lại xét duyệt mà không cần tạo hồ sơ mới (`BUG-INC1-02`).
