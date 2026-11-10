# THƯ MỤC KIỂM THỬ HỆ THỐNG - INCREMENT 1 (TASK A45)
**Hệ thống Quản lý Thực tập Sinh viên (SIMS)**

Thư mục này chứa toàn bộ mã nguồn kiểm thử tự động, dữ liệu mẫu chuẩn (Seeder theo Mục 1.7) và báo cáo kiểm nghiệm chi tiết cho giai đoạn **Increment 1 (Task A45)**.

---

## 1. Cấu trúc thư mục

```text
test/
├── run-a45-tests.js                 # Script kiểm thử tự động toàn diện 49 test cases & seed dữ liệu CSDL
├── BAO_CAO_KIEM_THU_A45_INCREMENT1.md # Báo cáo kiểm thử chi tiết Task A45 (System & Acceptance Test)
└── README.md                        # Hướng dẫn chạy kiểm thử và danh mục tài khoản thử nghiệm
```

---

## 2. Hướng dẫn chạy kiểm thử tự động

### 2.1. Yêu cầu tiên quyết
Trước khi chạy kiểm thử, đảm bảo cả 3 dịch vụ của hệ thống đang hoạt động:
1. **PostgreSQL 16**: Container `internship-management-postgres` trên Docker đang chạy tại `localhost:5432`.
2. **Backend API (NestJS)**: Chạy tại `http://localhost:3000/api`.
   ```bash
   cd backend
   node dist/main.js
   ```
3. **Frontend Web (Next.js)**: Chạy tại `http://localhost:3001`.
   ```bash
   cd frontend
   npm run dev
   ```

### 2.2. Lệnh thực thi kịch bản kiểm thử
Từ thư mục gốc của dự án (`QLDAPM`):

```bash
node test/run-a45-tests.js
```

Script sẽ tự động:
1. Kết nối PostgreSQL để reset và nạp bộ dữ liệu mẫu chuẩn (5 sinh viên, 2 cán bộ, 2 giảng viên, 2 doanh nghiệp, 1 đợt thực tập đang mở).
2. Kiểm tra tính sẵn sàng của Backend (`/api/health`) và Frontend (`/login`).
3. Chạy toàn bộ 49 test cases bao gồm xác thực (FR1), đăng ký hồ sơ (FR2), phê duyệt (FR3), cập nhật tiến độ (FR4), kiểm thử tích hợp đầu cuối (E2E) và phi chức năng (NFR: hiệu năng, bảo mật, UX responsive).
4. Xuất kết quả tổng hợp chi tiết trực tiếp ra màn hình console.

---

## 3. Danh mục tài khoản kiểm thử chuẩn (Mục 1.7)

Tất cả các tài khoản sử dụng mật khẩu chung: **`Password123!`**

### 3.1. Hai Actor chính của hệ thống
| Vai trò | Mã TK | Email đăng nhập | Tên người dùng / Đơn vị | Trạng thái ban đầu trong CSDL |
| :--- | :--- | :--- | :--- | :--- |
| **Sinh viên** | `SV01` | `sv01@hcmut.edu.vn` | Nguyễn Minh Trần (`2210001`) | Đã nộp hồ sơ tại FPT Software, trạng thái **Đã duyệt (`APPROVED`)**, có 3 tuần báo cáo tiến độ |
| **Sinh viên** | `SV02` | `sv02@hcmut.edu.vn` | Nguyễn Thị Trinh (`2210002`) | Đã nộp hồ sơ tại FPT Software, trạng thái **Chờ duyệt (`SUBMITTED`)** |
| **Sinh viên** | `SV03` | `sv03@hcmut.edu.vn` | Phạm Thị Hương (`2210003`) | Đã nộp hồ sơ tại VNG Corp, trạng thái **Đã duyệt (`APPROVED`)** |
| **Sinh viên** | `SV04` | `sv04@hcmut.edu.vn` | Nguyễn Minh Trí (`2210004`) | Đã nộp hồ sơ, trạng thái **Bị từ chối (`REJECTED`)** kèm lý do mẫu |
| **Sinh viên** | `SV05` | `sv05@hcmut.edu.vn` | Lê Hoàng Nam (`2210005`) | Chưa đăng ký hồ sơ (dành riêng để test luồng nộp mới) |
| **Cán bộ quản lý** | `CB01` | `cb01@hcmut.edu.vn` | Cán bộ Quản lý 01 | Có đầy đủ quyền duyệt, từ chối, phân công GVHD, xuất CSV hồ sơ |
| **Cán bộ quản lý** | `CB02` | `cb02@hcmut.edu.vn` | Cán bộ Quản lý 02 | Phục vụ kiểm thử concurrency xử lý đồng thời (`TC-FR3-08`) |

### 3.2. Hai Actor phụ (Tham gia đánh giá / nhận xét)
| Vai trò | Mã TK | Email đăng nhập | Tên người dùng / Đơn vị | Trách nhiệm trong Increment 1 |
| :--- | :--- | :--- | :--- | :--- |
| **Giảng viên** | `GV01` | `gv01@hcmut.edu.vn` | TS. Nguyễn Văn Giảng | Nhận phân công hướng dẫn `SV01`, xem nhật ký và gửi nhận xét tiến độ |
| **Giảng viên** | `GV02` | `gv02@hcmut.edu.vn` | PGS.TS. Trần Thị Hướng | Nhận phân công hướng dẫn `SV03`, theo dõi sinh viên được giao |
| **Doanh nghiệp** | `DV01` | `dv01@fpt.com` | Đại diện FPT Software | Tiếp nhận sinh viên thực tập (`DV01`), tham gia đánh giá kết quả |
| **Doanh nghiệp** | `DV02` | `dv02@vng.com.vn` | Đại diện VNG Corporation | Tiếp nhận sinh viên thực tập (`DV02`), tham gia đánh giá kết quả |

---

## 4. Tóm tắt kết quả kiểm thử sau khi cập nhật mã nguồn (Commit `bb474aa`)

- **Tổng số Test Cases**: **49**
- **Đạt (Passed)**: **45 / 49 (91.8%)**
- **Không đạt (Failed)**: **4 / 49 (8.2%)**
- **Độ bao phủ các mức độ ưu tiên**:
  - **Priority High**: **26 / 26 ĐẠT (100%)**
  - **Priority Low**: **8 / 8 ĐẠT (100%)**
  - **Priority Medium**: **11 / 15 ĐẠT (73.3%)**
- **Tình trạng lỗi tích hợp Frontend - Backend (`BUG-INC1-01`)**:
  - **ĐÃ KHẮC PHỤC HOÀN TOÀN**: Toàn bộ luồng đăng nhập, nộp đơn, xét duyệt, cập nhật tiến độ, nhận xét của giảng viên và middleware bảo vệ route đã hoạt động trơn tru với dữ liệu thật từ Backend.
- **Các lỗi logic Backend còn tồn tại (Đang xử lý ở Increment tiếp theo)**:
  1. `TC-FR2-03` (`BUG-INC1-04`): `CreateProfileDto` thiếu validate định dạng `contactEmail` và `contactPhone`.
  2. `TC-FR2-07` (`BUG-INC1-02`): Hệ thống chặn sinh viên sửa thông tin khi hồ sơ đang ở trạng thái `SUBMITTED`.
  3. `TC-FR3-09` (`BUG-INC1-02`): Khi hồ sơ bị `REJECTED`, sinh viên không chỉnh sửa được bản nháp cũ và bị ràng buộc Unique Constraint cản trở tạo hồ sơ mới.
  4. `TC-FR3-11` (`BUG-INC1-03`): Bộ lọc tìm kiếm hồ sơ của Cán bộ chưa hỗ trợ tìm theo Họ tên sinh viên hoặc MSSV.

Chi tiết từng test case, nguyên nhân lỗi và ảnh chụp kiểm thử vui lòng xem tại:
👉 [**Báo cáo kiểm thử chi tiết Task A45 (`BAO_CAO_KIEM_THU_A45_INCREMENT1.md`)**](./BAO_CAO_KIEM_THU_A45_INCREMENT1.md)
