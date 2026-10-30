# Backend design — Hệ thống quản lý thực tập sinh viên

> Trạng thái: bản thiết kế triển khai theo task backend. ERD PDF được nêu trong task chưa xuất hiện trong thư mục attachment/repository tại thời điểm kiểm tra; các quyết định bên dưới lấy từ yêu cầu task và được đánh dấu là giả định khi chưa có tài liệu được duyệt.

## 1. Phạm vi và nguyên tắc

- Chỉ triển khai backend trong task này.
- Giữ NestJS + TypeScript + TypeORM + PostgreSQL.
- Không chuyển sang Prisma, không bật `synchronize`, không tự chạy migration trên database thật.
- Frontend không được khởi tạo; backend cung cấp REST API và Swagger/OpenAPI.
- Thời gian lưu UTC; dữ liệu lịch nghiệp vụ cần quy định timezone hiển thị ở API contract.
- Không ghi password, refresh token, secret hoặc file path nhạy cảm vào log.

### Quy chuẩn code của nhóm

- Controller chỉ nhận HTTP input, áp dụng guard/validation và gọi Service.
- Service xử lý workflow, ownership, quyền tài nguyên và transaction orchestration.
- Repository là ranh giới duy nhất của truy cập TypeORM trong module nghiệp vụ; query đặc thù phải có tên rõ nghĩa.
- Logic chuyển trạng thái hoặc tính toán phức tạp phải có comment ngắn giải thích invariant được bảo vệ.
- Thay đổi backend làm trên nhánh `feature/*`; chỉ merge qua Pull Request sau review. Nhiệm vụ này không push, tạo PR hoặc merge.
- Tài liệu kỹ thuật duy trì trong `docs/`; không tự upload tài liệu lên Google Drive.

## 2. Vai trò và tài khoản

Mỗi `User` có đúng một vai trò:

- `STUDENT`: quản lý hồ sơ của chính mình, cập nhật tiến độ và nộp báo cáo.
- `OFFICER`: quản lý danh mục, duyệt hồ sơ, phân công, chốt và công bố kết quả.
- `SUPERVISOR`: xem hồ sơ được phân công, nhận xét và chấm hai phiếu thuộc phạm vi GVHD.
- `ENTERPRISE_REP`: xem dữ liệu cần thiết của hồ sơ thuộc doanh nghiệp mình và chấm phiếu doanh nghiệp.

Không mở đăng ký công khai. OFFICER tạo tài khoản. Lệnh bootstrap OFFICER đầu tiên nhận thông tin qua biến môi trường, không hardcode password.

Authentication dự kiến dùng access token ngắn hạn và refresh token có rotation/revocation. Đây là quyết định triển khai theo task, cần ghi rõ trong API contract trước khi client sử dụng.

## 3. Thực thể và quan hệ

Mười tám thực thể nghiệp vụ cần triển khai:

`User`, `Student`, `Officer`, `Supervisor`, `Enterprise_Rep`, `Internship_Period`, `Enterprise`, `Internship_Profile`, `Status_History`, `Progress_Update`, `Comment`, `Report`, `Criteria`, `Evaluation_Form`, `Evaluation_Detail`, `Result`, `Notification`, `System_Log`.

Các quy tắc chính:

- Bảng vai trò dùng `userId` vừa là primary key vừa là foreign key đến `User`.
- Vai trò trong `User` phải nhất quán với bảng thông tin vai trò.
- Email chuẩn hóa và duy nhất; mã sinh viên duy nhất.
- `Internship_Profile` unique theo `(studentId, periodId)`.
- `Report` unique theo `(profileId, version)`.
- `Evaluation_Form` unique theo `(profileId, formType)`.
- `Evaluation_Detail` dùng primary key ghép `(formId, criteriaId)`.
- `Result` unique theo `profileId`.
- Điểm nằm trong `[0, 10]`; trọng số không âm và tổng trọng số của một đợt bằng `1`.
- Ngày bắt đầu không sau ngày kết thúc.
- Không xóa dây chuyền lịch sử hoặc kết quả đã chốt; ưu tiên khóa/hạn chế xóa dữ liệu đã tham chiếu.
- `Criteria` gắn với đợt thực tập và loại phiếu; không sửa tiêu chí/trọng số sau khi đợt đã phát sinh phiếu.

Các cột chính xác, nullable/default/index và `ON DELETE` phải được thể hiện trong entity và migration, không chỉ trong DTO.

## 4. Hồ sơ và trạng thái

Luồng mặc định:

```text
DRAFT → SUBMITTED → NEEDS_REVISION → SUBMITTED
                   ├→ APPROVED
                   └→ REJECTED
```

- Sinh viên chỉ sửa hồ sơ ở `DRAFT` hoặc `NEEDS_REVISION`.
- Khi gửi, kiểm tra hồ sơ nằm trong thời gian đăng ký.
- Từ chối hoặc yêu cầu bổ sung bắt buộc có lý do.
- Chỉ phân công GVHD cho hồ sơ đã duyệt; `supervisorId` có thể NULL trước đó.
- Mọi chuyển trạng thái tạo `Status_History` trong cùng transaction.
- Cần khóa/điều kiện trạng thái để tránh cập nhật đồng thời làm sai workflow.
- Tiến độ và đánh giá chỉ được phép theo trạng thái hồ sơ và quyền của actor.

## 5. Báo cáo, đánh giá và kết quả

### Báo cáo

- Chấp nhận PDF/DOCX, mặc định tối đa 20 MB và cho phép cấu hình.
- Kiểm tra MIME/content phù hợp, không chỉ phần mở rộng.
- Lưu tên server-generated trong thư mục riêng, không public trực tiếp.
- Client không được tự truyền `fileUrl` tùy ý.
- Endpoint tải file kiểm tra quyền như endpoint dữ liệu.
- Upload đồng thời phải cấp version an toàn; nếu lưu metadata thất bại phải dọn file tạm.
- `isLate` được tính từ `submittedAt` và `reportDeadline`.
- Cho phép nộp muộn theo policy, nhưng không nộp thêm sau khi chốt kết quả.
- Phiếu `SUPERVISOR_REPORT` tham chiếu phiên bản báo cáo đã chọn; bản đầu không cho upload phiên bản mới sau khi phiếu đã gửi.

### Phiếu đánh giá

Ba loại phiếu: `ENTERPRISE`, `SUPERVISOR_PROCESS`, `SUPERVISOR_REPORT`.

- Mỗi loại tối đa một phiếu cho một hồ sơ.
- Phiếu nháp được sửa; phiếu đã gửi bị khóa.
- Phiếu doanh nghiệp do đại diện đúng doanh nghiệp chấm.
- Hai phiếu GVHD do supervisor được phân công chấm.
- Chỉ đánh giá hồ sơ đã duyệt; phiếu báo cáo yêu cầu đã có báo cáo.
- Server xác định người chấm từ session, không nhận evaluator tùy ý từ client.
- Kiểm tra tiêu chí đúng đợt/đúng loại, không trùng, đủ tiêu chí và điểm hợp lệ.

### Tính và chốt kết quả

- Điểm thành phần là trung bình cộng tiêu chí của phiếu tương ứng.
- `total = enterpriseScore × weightEnterprise + supervisorProcessScore × weightSupervisorProcess + supervisorReportScore × weightSupervisorReport`.
- Dùng phép tính số thập phân, không làm tròn trung gian; chỉ làm tròn hiển thị đến hai chữ số.
- Chỉ chốt khi đủ ba phiếu đã gửi và hồ sơ ở trạng thái hợp lệ.
- OFFICER kiểm tra, chốt và công bố trong transaction.
- Sinh viên chỉ xem kết quả sau khi công bố.
- Bản đầu không hỗ trợ sửa điểm sau khi chốt.

## 6. API và lỗi

- Giữ global prefix `/api`.
- Swagger mô tả endpoint, DTO, response, lỗi và quyền.
- Dùng validation pipe hiện có, bổ sung DTO và validation nghiệp vụ ở service/transaction layer.
- Chuẩn hóa error envelope, tối thiểu gồm mã lỗi, message, status và request/correlation id nếu triển khai.
- Danh sách có pagination giới hạn kích thước, tìm kiếm/lọc phù hợp.
- Ownership/resource authorization phải chạy ở service/policy layer; role guard riêng không đủ.
- Các API file cũng phải qua cùng authorization policy.

## 7. Migration, seed và test

- Giữ `synchronize: false` và `migrationsRun: false`.
- Tạo migration rõ ràng cho schema; không giả định migration rỗng hiện tại đã được chạy.
- Seed là lệnh riêng cho development, có bốn vai trò và dữ liệu mẫu; không tự chạy khi app start và không ghi đè dữ liệu hiện có.
- Bổ sung `test/jest-e2e.json` nếu giữ script hiện tại.
- Unit/integration/e2e phải bao phủ auth, ownership, workflow, uniqueness, file access, scoring và khóa sau submit/chốt.
- Integration test dùng PostgreSQL riêng, không dùng database production hay database chưa xác định.

## 8. Các điểm cần xác nhận sau khi có ERD chính thức

- Tên cột/kiểu dữ liệu và quan hệ chính xác trong ERD.
- Các trường bắt buộc của hồ sơ, báo cáo và phiếu.
- Tên trạng thái chính thức và quy tắc chuyển trạng thái.
- Quy chế trọng số, làm tròn và công bố điểm.
- Chính sách lưu file và thời hạn báo cáo.
- Cơ chế access/refresh token và thời hạn phiên.

