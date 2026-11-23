# ĐẶC TẢ TEST CASES INCREMENT 3 — CHANGE EVENT & ỔN ĐỊNH HỆ THỐNG (`CP8`, `CP3`)

**Phạm vi Increment 3:**
1. **Change Event của Giảng viên (`CP8`):** Dời deadline lên sớm hơn 1 tuần (cập nhật kế hoạch/baseline & kiểm tra các luồng deadline trong hệ thống).
2. **Tinh chỉnh & Ổn định hệ thống (`A61`, `CP3`):** Xác nhận các lỗi Critical / Major đã phát hiện ở Inc 1 & Inc 2 được khắc phục hoàn toàn.
3. **Tính năng tùy chọn (`FR8` — Nhập Excel/CSV):** Chỉ kiểm thử nếu nhóm kịp triển khai; nếu cắt giảm theo MoSCoW (`Could`), ghi nhận vào *Deferred Scope* tại `CP3`.

> Bộ test này **bổ sung** cho 89 Test Cases hồi quy tại `test/increment2/run-a54-tests.js` (trong đó cần cập nhật kỳ vọng `TC-FR2-07` theo `FR2.4` và sửa `TC-FR3-11` tìm theo đúng tên SV / MSSV).

---

## 1. Test Cases cho Change Event (Dời deadline sớm hơn 1 tuần)

| Mã TC | Mức độ | Mô tả kịch bản | Điều kiện & Dữ liệu đầu vào | Kết quả mong đợi |
| :--- | :---: | :--- | :--- | :--- |
| **`TC-CE-01`** | High | Cập nhật `reportDeadline` / `registrationCloseAt` của đợt thực tập theo mốc mới (sớm hơn 1 tuần) | Cán bộ (`CB01`) cập nhật đợt thực tập qua API/UI với mốc `reportDeadline` mới. | Hệ thống lưu đúng mốc thời gian mới; `GET /api/internships/periods` trả về đúng `reportDeadline` mới. |
| **`TC-CE-02`** | High | Sinh viên xem đúng hạn nộp báo cáo mới trên UI | `SV01` đăng nhập và mở `/student/submit-report`. | Hiển thị đúng ngày giờ `reportDeadline` mới (không bị trống *"Không có hạn chót cụ thể"*). |
| **`TC-CE-03`** | High | Đánh dấu nộp muộn (`isLate = true`) khi nộp sau deadline mới | `SV01` nộp báo cáo sau thời điểm `reportDeadline` vừa dời sớm 1 tuần. | Báo cáo vẫn lưu thành công (nếu cho phép nộp muộn) và gắn cờ `isLate = true` trên API & UI. |

---

## 2. Test Cases Xác nhận Fix Bug & Ổn định (`CP3`)

| Mã TC | Mức độ | Liên kết lỗi | Mô tả kiểm thử | Kết quả mong đợi |
| :--- | :---: | :--- | :--- | :--- |
| **`TC-INC3-01`** | Critical | `BUG-CRIT-01` | SV (`SV01`) ở `/student/submit-report` và GVHD (`GV01`) ở `/supervisor/evaluate/[id]` bấm tải báo cáo PDF/DOCX. | Gọi đúng `GET /api/reports/:id/download`, trả `200 OK` và tải được file đúng nội dung. |
| **`TC-INC3-02`** | Critical | `BUG-CRIT-02` | Truy cập `/enterprise/dashboard` và `/change-password` khi chưa đăng nhập (không có cookie/token). | Middleware chặn và redirect `307` về `/login`. |
| **`TC-INC3-03`** | Critical | `BUG-CRIT-03` | Chạy `npm run build` trong `frontend/`. | Build production thành công (`exit code 0`), khởi chạy được `next start`. |
| **`TC-INC3-04`** | Major | `BUG-MAJ-01` | Người dùng vào `/change-password`, nhập mật khẩu mới `< 12` ký tự rồi nhập `>= 12` ký tự và submit. | Validate tối thiểu 12 ký tự; gọi `POST /api/auth/change-password` thành công và đăng nhập lại bằng mật khẩu mới. |
| **`TC-INC3-05`** | Major | `BUG-MAJ-02` | Kiểm tra hiển thị trên `/student/dashboard` và `/admin/result`. | Hiện đúng badge đợt (`period`), hiển thị `lastStatusReason` khi `REJECTED`/`NEEDS_REVISION`, và nhãn trọng số khớp `40% / 30% / 30%`. |
| **`TC-INC3-06`** | Major | `BUG-MAJ-03`, `BUG-INC1-03` | 1) `SV04` có hồ sơ `REJECTED` thực hiện đăng ký lại trong cùng đợt mở (`BR1`).<br>2) `CB01` tìm kiếm theo đúng họ tên SV (`"Nguyễn Minh Trần"`) và MSSV (`"2210001"`). | 1) Tạo hồ sơ mới thành công (`201 Created`).<br>2) Kết quả tìm kiếm trả về đúng hồ sơ sinh viên tương ứng (`total >= 1`). |
| **`TC-INC3-07`** | Minor | `BUG-MIN-06` | `SV01` upload file có tên tiếng Việt có dấu (vd: `kiến trúc phần mềm.pdf`). | Tên file gốc hiển thị trên UI/API giữ nguyên UTF-8 tiếng Việt, không lỗi font. |
| **`TC-INC3-08`** | Critical | `CP3` | Chạy E2E luồng 5 bước (Đăng ký $\rightarrow$ Duyệt & phân công $\rightarrow$ Tiến độ $\rightarrow$ Nộp & tải báo cáo $\rightarrow$ Đánh giá, chốt & công bố) trên Web UI **2 lần liên tiếp**. | Cả 2 lần chạy thông suốt, không phát sinh lỗi 4xx/5xx ngoài ý muốn hay gãy giao diện. |

---

## 3. Test Cases Tính năng Tùy chọn `FR8` (Chỉ chạy nếu triển khai)

| Mã TC | Mức độ | Mô tả | Kết quả mong đợi |
| :--- | :---: | :--- | :--- |
| **`TC-FR8-01`** | Could | Cán bộ import danh sách tài khoản/doanh nghiệp từ file CSV/Excel hợp lệ. | Tạo/cập nhật bản ghi thành công, trả về thống kê số dòng thành công/lỗi. |
| **`TC-FR8-02`** | Could | Cán bộ import file có dòng sai định dạng email/trùng mã. | Báo lỗi chi tiết theo từng dòng sai, không làm hỏng dữ liệu hợp lệ hoặc rollback rõ ràng theo thiết kế. |
