# Thư mục Kiểm thử (Testing & QA) — Hệ thống Quản lý Thực tập Sinh viên (SIMS)

Thư mục `test/` tập hợp toàn bộ tài liệu báo cáo kiểm thử, dữ liệu kiểm thử (Seed Data theo Mục 1.7) và script kiểm thử hệ thống của dự án:

## 1. Cấu trúc thư mục `test/`
- [`BAO_CAO_KIEM_THU_A45_INCREMENT1.md`](./BAO_CAO_KIEM_THU_A45_INCREMENT1.md): Báo cáo kết quả chạy 49 test case của Increment 1 (Task A45), thống kê tỷ lệ đạt theo độ ưu tiên và danh sách báo cáo lỗi (Defect Log `BUG-INC1-01` → `BUG-INC1-04`).
- [`run-a45-tests.js`](./run-a45-tests.js): Script tự động khởi tạo CSDL kiểm thử (nạp các tài khoản chuẩn `SV01`..`SV05`, `CB01`..`CB02`, `GV01`..`GV02`, `DV01`..`DV02`), thực thi toàn bộ kịch bản kiểm thử Increment 1 (`FR1` → `FR4`, `E2E`, `NFR` với 500 bản ghi) và in kết quả đối chiếu.

## 2. Cách chạy bộ kiểm thử & nạp dữ liệu mẫu
Đảm bảo PostgreSQL (`docker compose up -d postgres`) và Backend (`cd backend && node dist/main.js`) đang chạy, sau đó từ thư mục gốc dự án chạy:

```powershell
node test/run-a45-tests.js
```

## 3. Bộ tài khoản kiểm thử chuẩn (Mục 1.7)
Mật khẩu chung cho tất cả tài khoản: **`Password123!`**

| Vai trò | Mã tài khoản | Email đăng nhập | Trạng thái dữ liệu sau khi chạy script |
| :--- | :--- | :--- | :--- |
| **Student** | `SV01` | `sv01@hcmut.edu.vn` | Đã duyệt (`APPROVED`), tại FPT Software (`DV01`), `GV01` hướng dẫn, có 3 tuần tiến độ |
| **Student** | `SV02` | `sv02@hcmut.edu.vn` | Chờ duyệt (`SUBMITTED`), tại FPT Software (`DV01`) |
| **Student** | `SV03` | `sv03@hcmut.edu.vn` | Đã duyệt (`APPROVED`), tại VNG Corp (`DV02`), `GV02` hướng dẫn |
| **Student** | `SV04` | `sv04@hcmut.edu.vn` | Từ chối (`REJECTED`) kèm lý do |
| **Student** | `SV05` | `sv05@hcmut.edu.vn` | Chưa có đăng ký (dùng để test tạo mới) |
| **Officer** | `CB01`, `CB02` | `cb01@hcmut.edu.vn`, `cb02@hcmut.edu.vn` | Cán bộ quản lý xét duyệt đơn, phân công GVHD |
| **Lecturer** | `GV01`, `GV02` | `gv01@hcmut.edu.vn`, `gv02@hcmut.edu.vn` | Giảng viên hướng dẫn (`GV01` → `SV01`, `GV02` → `SV03`) |
| **Host Org** | `DV01`, `DV02` | `dv01@fpt.com`, `dv02@vng.com.vn` | Đơn vị tiếp nhận thực tập |

