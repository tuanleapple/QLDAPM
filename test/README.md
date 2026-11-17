# THƯ MỤC KIỂM THỬ HỆ THỐNG — INCREMENT 1, 2 & TỔNG RÀ SOÁT INCREMENT 3
**Hệ thống Quản lý Thực tập Sinh viên (SIMS) — Môn học CO3011**

Thư mục này chứa bộ đặc tả Test Cases (`A36`, `A37`), script kiểm thử tự động tích hợp & hồi quy (`A45`, `A54`), cùng các báo cáo kết quả kiểm thử chi tiết và tổng rà soát toàn hệ thống (Increment 1, 2 và 3).

---

## 1. Cấu trúc thư mục

```text
test/
├── TEST_CASES_A36_INCREMENT1.md                           # Đặc tả 49 Test Cases Increment 1 (Task A36)
├── TEST_CASES_A37_INCREMENT2.md                           # Đặc tả 40 Test Cases Increment 2 (Task A37)
├── run-a45-tests.js                                       # Script tự động seed DB & chạy 49 TCs Increment 1 (Task A45)
├── run-a54-tests.js                                       # Script tự động seed DB & chạy 89 TCs Inc 2 + Hồi quy Inc 1 (Task A54)
├── BAO_CAO_KIEM_THU_A45_INCREMENT1.md                     # Báo cáo kết quả kiểm thử Increment 1 (Task A45)
├── BAO_CAO_KIEM_THU_A54_INCREMENT2_HOI_QUY.md             # Báo cáo kết quả kiểm thử Increment 2 & Hồi quy Inc 1 (Task A54)
├── BAO_CAO_TONG_HOP_KIEM_TRA_HE_THONG_INC1_INC2_INC3.md   # Báo cáo tổng rà soát toàn hệ thống (Inc 1, 2, 3 @ commit bd9534e)
└── README.md                                              # Tài liệu hướng dẫn chạy kiểm thử & danh mục tài khoản mẫu
```

---

## 2. Hướng dẫn chạy kiểm thử tự động

### 2.1. Yêu cầu tiên quyết
Trước khi chạy kịch bản kiểm thử hệ thống, đảm bảo đủ 3 dịch vụ sau đang hoạt động:

1. **PostgreSQL 16**: Container `internship-management-postgres` chạy qua Docker tại `localhost:5432` (đã chạy đầy đủ 3 bản migration trong `backend/src/database/migrations/`):
   ```bash
   docker compose --env-file backend/.env up -d postgres
   ```
2. **Backend API (NestJS)**: Chạy tại `http://localhost:3000/api`:
   ```bash
   cd backend
   node ./run-nest.js build
   node dist/main.js
   ```
3. **Frontend Web (Next.js)**: Chạy tại `http://localhost:3001`:
   ```bash
   cd frontend
   npm run dev
   ```
   > *(Ngoài ra, bản production build `next build` hiện đang lỗi ở cả Turbopack và Webpack trên nhánh `bd9534e` — xem chi tiết lỗi `BUG-CRIT-03` trong báo cáo tổng hợp — nên cần dùng `dev` server khi chạy kiểm thử).*

### 2.2. Lệnh thực thi kịch bản kiểm thử
Từ thư mục gốc của dự án (`QLDAPM`):

- **Chạy kiểm thử đầy đủ Increment 2 & Hồi quy Increment 1 (89 Test Cases — Khuyến nghị):**
  ```bash
  node test/run-a54-tests.js
  ```
- **Chạy riêng bộ kiểm thử Increment 1 (49 Test Cases):**
  ```bash
  node test/run-a45-tests.js
  ```
- **Chạy Unit Tests Backend (9 suites, 35 tests):**
  ```bash
  cd backend
  node -e "process.argv=['node','jest','--config','./jest.config.js','--runInBand']; require(require.resolve('jest/bin/jest',{paths:[process.cwd(),'..']}));"
  ```

Mỗi script `run-a45-tests.js` / `run-a54-tests.js` sẽ tự động:
1. Kiểm tra file & route Frontend đang chạy tại `http://localhost:3001`.
2. Kết nối PostgreSQL để reset (`TRUNCATE ... CASCADE`) và nạp bộ dữ liệu mẫu chuẩn (5 sinh viên, 2 cán bộ, 2 giảng viên, 2 doanh nghiệp, 1 đợt thực tập đang mở và 7 tiêu chí Rubric trong `run-a54-tests.js`).
3. Thực thi toàn bộ các kịch bản kiểm thử REST API, upload/download file báo cáo, phân quyền RBAC/IDOR, tính điểm tổng kết và hiệu năng.

> **Lưu ý quan trọng sau khi chạy `test/run-a54-tests.js`:** Test case `TC-SEC2-06` ở cuối script sẽ đổi mật khẩu của tài khoản `sv05@hcmut.edu.vn` từ `Password123!` sang **`NewStrongPassword2026!`**. Nếu cần đăng nhập lại `sv05` bằng mật khẩu mặc định, hãy chạy lại seed hoặc cập nhật lại hash mật khẩu trong CSDL.

---

## 3. Danh mục tài khoản kiểm thử chuẩn

Tất cả các tài khoản khởi tạo sử dụng mật khẩu chung: **`Password123!`** *(lưu ý ngoại lệ của `SV05` sau khi chạy `TC-SEC2-06` trong `run-a54-tests.js`)*.

### 3.1. Hai Actor chính của hệ thống
| Vai trò | Mã TK | Email đăng nhập | Tên người dùng / Đơn vị | Trạng thái & dữ liệu khởi tạo |
| :--- | :--- | :--- | :--- | :--- |
| **Sinh viên** | `SV01` | `sv01@hcmut.edu.vn` | Nguyễn Minh Trần (`2210001`) | Hồ sơ tại FPT Software (`APPROVED`), do `GV01` hướng dẫn, có 3 tuần báo cáo tiến độ; trong `run-a54-tests.js` nộp báo cáo v1/v2, được chấm điểm & công bố kết quả |
| **Sinh viên** | `SV02` | `sv02@hcmut.edu.vn` | Nguyễn Thị Trinh (`2210002`) | Hồ sơ tại FPT Software, trạng thái **Chờ duyệt (`SUBMITTED`)**, dùng test duyệt & kiểm soát truy cập chéo (IDOR) |
| **Sinh viên** | `SV03` | `sv03@hcmut.edu.vn` | Phạm Thị Hương (`2210003`) | Hồ sơ tại VNG Corp (`APPROVED`), do `GV02` hướng dẫn |
| **Sinh viên** | `SV04` | `sv04@hcmut.edu.vn` | Nguyễn Minh Trí (`2210004`) | Hồ sơ bị **Từ chối (`REJECTED`)** kèm lý do mẫu |
| **Sinh viên** | `SV05` | `sv05@hcmut.edu.vn` | Lê Hoàng Nam (`2210005`) | Dùng test luồng nộp mới & đổi mật khẩu (`TC-SEC2-06`) |
| **Cán bộ quản lý** | `CB01` | `cb01@hcmut.edu.vn` | Cán bộ Quản lý 01 | Duyệt hồ sơ, phân công GVHD, quản lý tiêu chí Rubric, điều chỉnh/chốt/công bố điểm, xuất CSV |
| **Cán bộ quản lý** | `CB02` | `cb02@hcmut.edu.vn` | Cán bộ Quản lý 02 | Kiểm thử xử lý đồng thời (`TC-FR3-08`) |

### 3.2. Hai Actor phụ (Theo dõi tiến độ & Đánh giá)
| Vai trò | Mã TK | Email đăng nhập | Tên người dùng / Đơn vị | Trách nhiệm trong Increment 1 & Increment 2 |
| :--- | :--- | :--- | :--- | :--- |
| **Giảng viên** | `GV01` | `gv01@hcmut.edu.vn` | TS. Nguyễn Văn Giảng | Hướng dẫn `SV01`, xem/nhận xét tiến độ, tải báo cáo & chấm điểm Rubric (`PROCESS` + `REPORT`) |
| **Giảng viên** | `GV02` | `gv02@hcmut.edu.vn` | PGS.TS. Trần Thị Hướng | Hướng dẫn `SV03`, theo dõi sinh viên được phân công |
| **Doanh nghiệp** | `DV01` | `dv01@fpt.com` | Đại diện FPT Software | Theo dõi sinh viên tại đơn vị (`DV01`) & chấm điểm Rubric tiêu chí Doanh nghiệp |
| **Doanh nghiệp** | `DV02` | `dv02@vng.com.vn` | Đại diện VNG Corporation | Theo dõi sinh viên tại đơn vị (`DV02`) & kiểm thử cô lập dữ liệu giữa các doanh nghiệp |

---

## 4. Tóm tắt kết quả kiểm thử gần nhất (Commit `bd9534e`, 18/11/2026)

- **Backend Unit Tests (Jest `--runInBand`):** **35 / 35 PASS** (9/9 test suites).
- **Kiểm thử tự động `run-a54-tests.js` (89 Test Cases):** **85 / 89 PASS (95.5%)**:
  - **Increment 2 (API & Private Storage):** **40 / 40 PASS (100%)** (`27/27` High, `11/11` Medium, `2/2` Low).
  - **Hồi quy Increment 1:** **45 / 49 PASS (91.8%)** — 4 ca thất bại khớp 3 vấn đề tồn đọng từ Inc 1: `TC-FR2-03` (`BUG-INC1-04`), `TC-FR2-07` & `TC-FR3-09` (`BUG-INC1-02`), `TC-FR3-11` (`BUG-INC1-03`).
- **Tổng rà soát toàn hệ thống (Increment 1, 2 & 3):**
  - **Increment 1 (~85%):** Luồng chính hoạt động ổn định; còn lỗi nghiệp vụ `BR1` khi bị `REJECTED`, thiếu giao diện quản trị tài khoản/đợt/doanh nghiệp của Cán bộ, và trang `/change-password` vẫn là mock tĩnh.
  - **Increment 2 (~80% — Backend 100%, Frontend còn blocker):** Đã có thêm giao diện Doanh nghiệp (`/enterprise/*`), **nhưng Frontend còn lỗi nghiêm trọng** gọi sai endpoint tải báo cáo (`/reports/:id/content` trả `404` thay vì `/reports/:id/download`), `middleware.ts` thiếu bảo vệ `/enterprise/:path*`, `next build` thất bại ở cả Turbopack lẫn `--webpack`, lệch nhãn trọng số (`30%/20%/50%` so với `40%/30%/30%`) và lệch tên field JSON (`reportDeadlineAt`, `activePeriod`, `student.email`, `statusHistory[0].reason`).
  - **Increment 3 (~15% — Chưa hoàn thành):** Chưa có phân tích tác động & cài đặt **Change Event của Giảng viên** (`A57`, `A58`, `CP8`, `A59`), chưa triển khai tùy chọn **Nhập Excel/CSV (`FR8` – `A60`)**, và `README.md` gốc chưa cập nhật hướng dẫn chạy Frontend.

### Tài liệu báo cáo chi tiết
- [Báo cáo kiểm thử Increment 2 & Hồi quy Increment 1 (`BAO_CAO_KIEM_THU_A54_INCREMENT2_HOI_QUY.md`)](./BAO_CAO_KIEM_THU_A54_INCREMENT2_HOI_QUY.md)
- [Báo cáo kiểm thử Increment 1 (`BAO_CAO_KIEM_THU_A45_INCREMENT1.md`)](./BAO_CAO_KIEM_THU_A45_INCREMENT1.md)
