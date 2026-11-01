# Hướng dẫn FE: màn hình nào gọi API nào

Tài liệu này dành cho lập trình viên frontend, đối chiếu với controller/service/repository hiện tại. Tên màn hình dưới đây là cách tổ chức đề xuất để tích hợp; repository chưa có source hoặc bộ màn hình FE được xác nhận. Đây không phải xác nhận giao diện đã được triển khai. Các endpoint ghi trong bảng đều đã có backend; dùng Swagger để thử request/response thực tế.

## 1. Đọc và chạy theo thứ tự nào?

1. Dùng [testing-api.md](testing-api.md) để chuẩn bị database local và tài khoản demo.
2. Mở Swagger tại `http://localhost:3000/api/docs` để xem DTO, kiểu dữ liệu, giới hạn và thử request.
3. Dùng tài liệu này để chọn API cho từng màn hình/nút bấm.
4. Xem [api.md](api.md) cho quy tắc API tổng quát và request mẫu; thử trực tiếp bằng Swagger.

Luồng đã từng được kiểm tra bằng 268 request HTTP/database qua 60 endpoint, không phát hiện 5xx trong lượt đó. Đây không phải kiểm thử giao diện FE. Script và báo cáo chi tiết sinh tự động đã được gỡ để repository gọn hơn.

Trong mọi bảng, đường dẫn đã **bỏ tiền tố `/api`**. Ví dụ `GET /internships/profiles` nghĩa là gọi `GET http://localhost:3000/api/internships/profiles`. Không cộng `/api` hai lần.

Mọi endpoint cần `Authorization: Bearer <accessToken>`, ngoại trừ health, login và refresh. Token của người dùng quyết định phạm vi dữ liệu; FE không gửi `studentId` để giả danh sinh viên khác.

| Vai trò | Ý nghĩa | Phạm vi hồ sơ |
|---|---|---|
| `STUDENT` | Sinh viên | Hồ sơ của chính mình |
| `OFFICER` | Cán bộ theo implementation hiện tại | Danh sách hồ sơ và chức năng quản lý được cấp trong các bảng dưới |
| `SUPERVISOR` | Giảng viên hướng dẫn, là một vai trò User | Hồ sơ được phân công |
| `ENTERPRISE_REP` | Đại diện doanh nghiệp | Hồ sơ thuộc doanh nghiệp của tài khoản |

FE dùng vai trò để điều hướng và hiển thị nút. Backend vẫn kiểm tra vai trò, quan hệ và trạng thái khi nhận request. Không tự thêm vai trò `ADMIN` hoặc coi tên màn hình quản trị là một quyền mới.

## 2. Màn hình dùng chung

| Màn hình / thao tác | Gọi API | Đầu vào / hiển thị | Sau khi thành công |
|---|---|---|---|
| Kiểm tra kết nối | `GET /health` | Công khai; `status: "ok"` | Không dùng health để kết luận mọi nghiệp vụ đều hoạt động |
| Đăng nhập | `POST /auth/login` | Body: `email`, `password`; nhận token pair và `user.id/email/role` | Điều hướng theo `user.role` |
| Khôi phục thông tin phiên | `GET /auth/me` | Nhận `id`, `email`, `role`; không có họ tên hoặc hồ sơ chi tiết | Chọn màn hình theo vai trò |
| Access token hết hạn | `POST /auth/refresh` | Body: `refreshToken` | Thay cả access lẫn refresh token; thử lại request ban đầu một lần |
| Đăng xuất | `POST /auth/logout` | Dùng access token; không cần body | Xóa phiên FE, về đăng nhập |
| Đổi mật khẩu | `POST /auth/change-password` | Body: `currentPassword`, `newPassword`; mật khẩu mới 12–128 ký tự | Đăng nhập lại; refresh session đã bị thu hồi |
| Chuông thông báo | `GET /notifications?page=1&limit=20` | `items[].id/title/content/readAt/createdAt`; `readAt=null` là chưa đọc | Thay trang để xem tiếp |
| Đánh dấu đã đọc | `PATCH /notifications/{id}/read` | `id` từ danh sách thông báo của người hiện tại; không cần body | Cập nhật `readAt` từ response |

Refresh thất bại `401` thì xóa phiên và yêu cầu đăng nhập lại. Không refresh khi nhận `403` (sai quyền) hoặc `400` (dữ liệu/workflow sai). Các request đồng thời nên dùng chung một lần refresh vì refresh token chỉ dùng được một lần. Logout thu hồi refresh session; access token cũ có thể còn dùng được tới hết hạn, trừ khi tài khoản bị khóa.

Thông báo hiện chỉ có nội dung và trạng thái đọc; chưa có `profileId`/đường dẫn điều hướng chuẩn trong response. Không suy ra ID từ câu chữ; tải lại dashboard hoặc danh sách hồ sơ để lấy dữ liệu cập nhật. Chưa có API email, WebSocket hoặc số thông báo chưa đọc riêng.

## 3. Màn hình sinh viên

| Màn hình / nút | Gọi API | ID / dữ liệu cần dùng | Kết quả và bước tiếp |
|---|---|---|---|
| Dashboard | `GET /internships/dashboard/student` | Không gửi user ID | Render số hồ sơ, trạng thái, đợt, DN, GVHD, hạn báo cáo, số tiến độ và báo cáo mới nhất |
| Danh sách hồ sơ của tôi | `GET /internships/profiles?page=1&limit=20` | Có thể thêm `status`, `periodId`, `search` | Nhận danh sách đã giới hạn theo token |
| Mở chi tiết hồ sơ | `GET /internships/profiles/{id}` | `id` từ danh sách hoặc `currentProfile.id` trên dashboard | Render quan hệ và `statusHistory` |
| Chọn đợt thực tập | `GET /internships/periods?page=1&limit=20` | Dùng `items[].id` làm value, `name` làm label | Lấy ngày/hạn từ item; phân trang dropdown khi cần |
| Xem chi tiết đợt | `GET /internships/periods/{id}` | ID từ dropdown đợt | Dùng `startDate/endDate/registrationOpenAt/registrationCloseAt/reportDeadline/active` |
| Chọn doanh nghiệp | `GET /internships/enterprises?page=1&limit=20&search=...` | Value `items[].id`, label `items[].name` | Không hardcode ID DN |
| Xem doanh nghiệp | `GET /internships/enterprises/{id}` | ID từ dropdown hoặc hồ sơ | Tên, địa chỉ, điện thoại, website |
| Lưu hồ sơ mới dưới dạng nháp | `POST /internships/profiles` | Body tối thiểu `periodId`; các trường chọn có thể chưa đủ | `201`, lấy `response.id` làm `profileId` cho mọi lần lưu sau |
| Lưu sửa nháp / bổ sung hồ sơ | `PATCH /internships/profiles/{id}` | Các trường đã sửa: `enterpriseId`, `title`, `position`, `internshipStartAt`, `internshipEndAt`, `description` | `200`; cập nhật màn hình từ response |
| Gửi hồ sơ / gửi lại sau bổ sung | `POST /internships/profiles/{id}/submit` | Không cần body; phải lưu dữ liệu hợp lệ trước | `201`, trạng thái thành `SUBMITTED`; tải lại dashboard/danh sách |
| Xóa nháp | `DELETE /internships/profiles/{id}` | Chỉ chủ sở hữu, `DRAFT` và chưa có lịch sử | `204`, không parse JSON; bỏ dòng khỏi danh sách |
| Kết quả của tôi | `GET /evaluations/results/{profileId}` | `profileId` từ hồ sơ | `200` khi đã công bố; `404` có thể do chưa có/chưa công bố, không nhất thiết là lỗi server |

Không có query `openOnly` hoặc `active` cho danh sách đợt. FE có thể trình bày thời gian mở/đóng từ response để giải thích lựa chọn; backend quyết định có được tạo/gửi hồ sơ tại thời điểm request hay không.

Các trường dashboard phải đọc đúng:

| Phần giao diện | Trường response |
|---|---|
| Tổng hồ sơ | `profileCount` |
| Số theo trạng thái | `countsByStatus`; trạng thái vắng mặt có thể hiển thị `0` |
| Hồ sơ mới cập nhật nhất | `currentProfile` hoặc `latestProfile` (hiện là cùng một hồ sơ, không cam kết là đợt đang diễn ra) |
| Tên đợt / DN / GVHD | `period.name`, `enterprise.name`, `supervisor.fullName`; có thể `null` |
| Hạn báo cáo | `reportDeadline`; có thể `null` |
| Số bản cập nhật tiến độ | `progressCount` của hồ sơ mới nhất |
| Báo cáo gần nhất | `latestReport`; có thể `null` |

Không có phần trăm hoàn thành, danh sách nhiệm vụ hoặc mức tiến độ tự tính. Trường `progressCount` là số bản cập nhật, không phải phần trăm.

## 4. Cán bộ: danh sách và duyệt hồ sơ

| Màn hình / thao tác | Gọi API | Đầu vào / nguồn ID | Hành vi cần hiển thị |
|---|---|---|---|
| Dashboard cán bộ | `GET /internships/dashboard/officer?periodId={periodId}` | `periodId` tùy chọn từ danh mục đợt | `accountCount`, `profileCountsByStatus`, `recentProfiles` |
| Danh sách chờ duyệt | `GET /internships/profiles?status=SUBMITTED&page=1&limit=20` | Bộ lọc tùy chọn `periodId`, `search` | Tên SV, tên DN, tên GVHD, tên đợt lấy từ quan hệ trong item |
| Mở hồ sơ | `GET /internships/profiles/{id}` | ID của dòng được chọn | Thông tin đăng ký và lịch sử thay đổi |
| Dropdown phân công GVHD | `GET /internships/supervisors?page=1&limit=20&search=...` | Dùng **`items[].id`**, đây là ID của User vai trò SUPERVISOR | Hiển thị `fullName`, `department`, `email` |
| Duyệt | `PATCH /internships/profiles/{id}/review` | Body: `{ "status": "APPROVED", "supervisorId": "..." }` | Bắt buộc chọn GVHD; cập nhật trạng thái từ response |
| Yêu cầu bổ sung | `PATCH /internships/profiles/{id}/review` | Body: `{ "status": "NEEDS_REVISION", "reason": "..." }` | Bắt buộc lý do; SV được sửa và gửi lại |
| Từ chối | `PATCH /internships/profiles/{id}/review` | Body: `{ "status": "REJECTED", "reason": "..." }` | Bắt buộc lý do; không có API mở lại |
| Đổi GVHD sau duyệt | `PATCH /internships/profiles/{id}/assign-supervisor` | Body: `{ "supervisorId": "..." }` | Chỉ trước khi có tiến độ, báo cáo hoặc phiếu đánh giá |
| Xuất danh sách CSV | `GET /internships/profiles/export.csv?periodId={periodId}&status=SUBMITTED` | Hỗ trợ thêm `search`; không dùng page/limit để cắt file | Nhận binary/text CSV, lưu file; tối đa 10.000 dòng |

`accountCount` trên dashboard là tổng tài khoản toàn hệ thống hiện tại, **không bị giới hạn theo bộ lọc đợt**. `profileCountsByStatus` và `recentProfiles` mới áp dụng `periodId`.

GVHD và đại diện DN dùng cùng `GET /internships/profiles` và `GET /internships/profiles/{id}`. Backend tự lọc phạm vi theo phân công/doanh nghiệp; không cần FE gửi ID tài khoản để lọc. Hai vai trò này không có quyền gọi danh mục đợt/doanh nghiệp độc lập hoặc danh sách GVHD; lấy thông tin `period`/`enterprise` từ hồ sơ được cấp quyền. Nếu thiết kế yêu cầu dropdown toàn bộ đợt cho các vai trò này, đó là phần contract còn cần thống nhất.

## 5. Tiến độ và nhận xét trong chi tiết hồ sơ

| Nút / dữ liệu | Gọi API | Body / quyền |
|---|---|---|
| Danh sách tiến độ | `GET /progress/profiles/{profileId}/updates?page=1&limit=20` | Chủ hồ sơ / GVHD được phân công / DN tương ứng / OFFICER |
| Mở bản tiến độ | `GET /progress/updates/{id}` | `id` lấy từ danh sách tiến độ |
| Thêm tiến độ | `POST /progress/profiles/{profileId}/updates` | Chỉ SV chủ hồ sơ; cần `reportPeriod`, `work`, `outcome`, `difficulties` |
| Sửa tiến độ | `PATCH /progress/updates/{id}` | Chỉ SV tác giả; gửi đủ bốn trường như tạo mới |
| Danh sách nhận xét | `GET /progress/profiles/{profileId}/comments?page=1&limit=20` | Cùng phạm vi đọc hồ sơ |
| Thêm nhận xét | `POST /progress/profiles/{profileId}/comments` | GVHD/DN/OFFICER đúng phạm vi; body `{ "content": "..." }`; SV không được thêm |
| Sửa nhận xét | `PATCH /progress/comments/{id}` | Chỉ tác giả nhận xét; body `{ "content": "..." }` |

Tiến độ/nhận xét chỉ được ghi khi hồ sơ `APPROVED` hoặc `REPORT_SUBMITTED` và kết quả chưa chốt. Không có DELETE. Nhận xét gắn với **hồ sơ**, không có `progressUpdateId` để gắn nhận xét vào từng dòng tiến độ.

## 6. Báo cáo tổng kết

| Nút / dữ liệu | Gọi API | FE phải làm |
|---|---|---|
| Danh sách phiên bản | `GET /reports/profiles/{profileId}/versions?page=1&limit=20` | Hiển thị `version`, `originalName`, `sizeBytes`, `submittedAt`, `isLate` |
| Nộp mới / nộp lại | `POST /reports/profiles/{profileId}` | SV chủ hồ sơ, body `FormData` có field `file`; nhận `201` và metadata phiên bản mới |
| Tải một phiên bản | `GET /reports/{id}/download` | `id` của **báo cáo**, không phải hồ sơ; dùng Bearer rồi nhận Blob/binary |

PDF/DOCX hợp lệ, không rỗng, tối đa **10.485.760 bytes (10 MiB)**. Với `FormData`, để trình duyệt tự đặt `Content-Type` kèm boundary; không tự đặt header multipart thiếu boundary. Response upload không có URL công khai. Download trả `Content-Disposition: attachment` và MIME của file. Đại diện DN chỉ được xem metadata; **không được tải nội dung**.

Upload sau hạn hiện được lưu với `isLate=true`; quá hạn không tự động đồng nghĩa request bị từ chối. Không được nộp thêm phiên bản sau khi phiếu GVHD đã gửi hoặc kết quả đã chốt. Các phiên bản cũ vẫn giữ nguyên.

Đây là báo cáo tổng kết. Chưa có endpoint tài liệu hỗ trợ đăng ký, nên FE không dùng upload báo cáo cho nút đính kèm tài liệu hồ sơ nháp.

## 7. Phiếu đánh giá DN/GVHD

| Bước trên màn hình phiếu | Gọi API | Dữ liệu và quyền |
|---|---|---|
| Chọn hồ sơ để đánh giá | `GET /internships/profiles?page=1&limit=20` | Chọn hồ sơ `APPROVED`/`REPORT_SUBMITTED` trong phạm vi; lấy `profileId`, `periodId` |
| Tải tiêu chí | `GET /evaluations/periods/{periodId}/criteria?formType=ENTERPRISE` hoặc `GET /evaluations/periods/{periodId}/criteria?formType=SUPERVISOR` | Phân trang nếu có nhiều tiêu chí; lấy `items[].id` |
| Danh sách phiếu của hồ sơ | `GET /evaluations/profiles/{profileId}/forms` | **Trả mảng trực tiếp**, không phải `{items: ...}`; DN/GVHD chỉ thấy phiếu của mình, OFFICER đọc cả hai |
| Tạo hoặc lấy phiếu nháp hiện có | `POST /evaluations/profiles/{profileId}/forms/{formType}` | `formType` là `ENTERPRISE` cho DN, `SUPERVISOR` cho GVHD; không cần body; lấy `response.id` làm `formId` |
| Mở một phiếu | `GET /evaluations/forms/{id}` | ID của phiếu; gồm `details` và tiêu chí liên quan |
| Lưu nháp | `PATCH /evaluations/forms/{id}` | Body `details` và tùy chọn `reportId`; thay toàn bộ tập điểm nháp, không phải merge từng dòng |
| Gửi phiếu | `POST /evaluations/forms/{id}/submit` | Body cùng cấu trúc lưu nháp, phải đủ mọi tiêu chí đang hoạt động; nhận `200` |

Các vai trò được chấm là DN/GVHD đúng quan hệ và đúng loại phiếu. OFFICER chỉ đọc phiếu và quản lý kết quả; SV không gọi API phiếu đánh giá.

- Phiếu `ENTERPRISE`: tiêu chí nhóm `ENTERPRISE`; không gửi `reportId`.
- Phiếu `SUPERVISOR`: chia giao diện thành nhóm `PROCESS` và `REPORT` theo `criteria.category`, nhưng chỉ có **một phiếu**; chọn một phiên bản báo cáo từ danh sách versions và gửi `reportId` khi nộp.
- `score` là số từ 0 đến 10, tối đa hai chữ số thập phân; mỗi `criteriaId` chỉ xuất hiện một lần. Tập `details` phải thuộc đúng đợt và loại phiếu.
- Backend tự lấy người chấm từ token; không gửi `evaluatorId`. Sau khi `status=SUBMITTED`, phiếu bị khóa.

Ví dụ body phiếu GVHD (các ID minh họa phải thay bằng ID lấy từ API):

```json
{
  "details": [
    { "criteriaId": "00000000-0000-4000-8000-000000000001", "score": 8 },
    { "criteriaId": "00000000-0000-4000-8000-000000000002", "score": 9, "comment": "Báo cáo rõ ràng" }
  ],
  "reportId": "00000000-0000-4000-8000-000000000003"
}
```

Ví dụ chỉ minh họa cấu trúc; số dòng thực tế phải bằng toàn bộ tiêu chí active của phiếu, có đủ hai nhóm với phiếu GVHD.

## 8. Chấm điểm, chốt và công bố kết quả

| Thao tác | Gọi API | Quyền / dữ liệu |
|---|---|---|
| Xem điểm | `GET /evaluations/results/{profileId}` | OFFICER xem điểm đã tính; SV chủ hồ sơ chỉ thấy sau công bố |
| Điều chỉnh | `PATCH /evaluations/results/{profileId}/adjustment` | OFFICER; body `{ "score": 8.75, "reason": "Lý do điều chỉnh" }` |
| Chốt | `POST /evaluations/results/{profileId}/finalize` | OFFICER; không cần body; cần đủ hai phiếu đã gửi và điểm đã tính |
| Công bố | `POST /evaluations/results/{profileId}/publish` | OFFICER; không cần body; kết quả phải được chốt trước |

Không có nút gọi API “tính điểm” riêng: backend tự tính khi đủ hai phiếu đã gửi. Hiển thị `enterpriseScore`, `supervisorProcessScore`, `supervisorReportScore`, `calculatedTotalScore`, `adjustedTotalScore`, `totalScore`, `isFinalized`, `publishedAt`. Các trường điểm trả về dạng chuỗi thập phân; đổi sang số khi FE cần tính/format.

Điểm mỗi nhóm là trung bình cộng các tiêu chí, không nhân `criteria.weight` ở implementation hiện tại. Tổng dùng trọng số **của đợt** (mặc định 40% DN + 30% quá trình + 30% báo cáo). FE hiển thị điểm backend trả về; không tự thay thế điểm chuẩn bằng một công thức khác.

`adjustments` gồm điểm cũ/mới, lý do, người và thời gian; chỉ OFFICER nhận lịch sử này. `totalScore` là điểm hiệu lực sau điều chỉnh nếu có. Không có API sửa sau chốt, mở lại hoặc xóa kết quả. Chưa có GET danh sách kết quả độc lập: màn hình quản lý dùng danh sách hồ sơ để chọn rồi mở chi tiết kết quả theo `profileId`.

## 9. Cán bộ: tài khoản và danh mục

| Màn hình / nút | Gọi API | Dữ liệu / điều kiện |
|---|---|---|
| Danh sách tài khoản | `GET /users?page=1&limit=20&role=STUDENT&search=...` | Chỉ OFFICER; `role`, `search` tùy chọn; không có query lọc `status` |
| Chi tiết tài khoản | `GET /users/{id}` | ID User từ danh sách; `profile.fullName/studentCode/enterpriseName/...` |
| Tạo tài khoản | `POST /users` | `email`, `password`, `role`, `fullName`; STUDENT cần `studentCode`, ENTERPRISE_REP cần `enterpriseId`; trường khác xem Swagger |
| Sửa tài khoản | `PATCH /users/{id}` | Trường hồ sơ/email được cho phép; không gửi role hoặc password; không có API xóa |
| Khóa / mở khóa | `PATCH /users/{id}/lock`, `PATCH /users/{id}/unlock` | Không cần body; không được khóa tài khoản OFFICER đang thao tác |
| Danh sách / chi tiết đợt | `GET /internships/periods`, `GET /internships/periods/{id}` | Cùng nguồn danh mục ở màn hình đăng ký |
| Thêm đợt | `POST /internships/periods` | `name`, `startDate`, `endDate`, `registrationOpenAt`, `registrationCloseAt`; deadline/trọng số/active xem Swagger |
| Sửa đợt | `PATCH /internships/periods/{id}` | Chỉ gửi trường thay đổi; trọng số không âm và tổng bằng 1 |
| Xóa đợt | `DELETE /internships/periods/{id}` | Chỉ đợt chưa được hồ sơ hoặc tiêu chí tham chiếu |
| Danh sách / chi tiết DN | `GET /internships/enterprises`, `GET /internships/enterprises/{id}` | Cùng nguồn danh mục ở màn hình đăng ký |
| Thêm DN | `POST /internships/enterprises` | `name`; có thể thêm `address`, `phone`, `website` |
| Sửa DN | `PATCH /internships/enterprises/{id}` | Trường thay đổi; trùng tên trả `409` |
| Xóa DN | `DELETE /internships/enterprises/{id}` | Chỉ khi chưa có hồ sơ/đại diện DN tham chiếu |
| Danh sách / chi tiết tiêu chí | `GET /evaluations/periods/{periodId}/criteria`, `GET /evaluations/criteria/{id}` | List chỉ trả tiêu chí active; OFFICER có thể GET chi tiết tiêu chí inactive nếu biết ID |
| Thêm tiêu chí | `POST /evaluations/periods/{periodId}/criteria/{formType}` | `code`, `name`, `category`, `weight`; tùy chọn `active`; chưa được có phiếu trong đợt |
| Sửa tiêu chí | `PATCH /evaluations/criteria/{id}` | Trường thay đổi; bị khóa khi có phiếu trong đợt |
| Xóa tiêu chí | `DELETE /evaluations/criteria/{id}` | Chưa có phiếu/điểm sử dụng; thành công `204` |

Tạo SUPERVISOR qua `POST /users` với `role=SUPERVISOR`, không có hệ tài khoản GVHD riêng. ENTERPRISE_REP chọn DN từ danh mục để lấy `enterpriseId`. Không có API đăng ký công khai/OAuth/OTP, đổi role tài khoản hoặc reset mật khẩu người khác. Nhập mật khẩu tài khoản mới là một phần chức năng quản trị; không đưa mật khẩu demo/production thành hằng số trong code FE.

## 10. Chọn đúng ID và trường hiển thị

| Giá trị cần dùng | Nguồn | Lưu ý |
|---|---|---|
| `userId` | `login.user.id`, `GET /auth/me.id`, tài khoản `items[].id` | User hiện tại lấy từ token/identity, không nhập tay |
| `periodId` | Đợt `items[].id` hoặc hồ sơ `.periodId` | Label `.name` |
| `enterpriseId` | DN `items[].id` hoặc hồ sơ `.enterpriseId` | Label `.name` |
| `supervisorId` khi phân công | Dropdown GVHD **`items[].id`** | Chi tiết hồ sơ lại có `.supervisor.userId`; cả hai cùng chỉ User GVHD |
| `profileId` | Hồ sơ `items[].id`, tạo nháp `.id`, dashboard `.currentProfile.id` | Không nhầm với User/studentId |
| `updateId`, `commentId` | Tiến độ/nhận xét `items[].id` | Dùng cho PATCH tương ứng |
| `reportId` | Upload `.id` hoặc versions `items[].id` | ID từng phiên bản, không dùng `version` làm ID |
| `criteriaId` | Tiêu chí `items[].id` | Không gửi `code` thay cho UUID |
| `formId` | Tạo phiếu `.id` hoặc forms `[i].id` | Forms trả mảng trực tiếp |
| `notificationId` | Thông báo `items[].id` | Chỉ recipient được đánh dấu đọc |

Ví dụ đoạn response chi tiết hồ sơ được FE sử dụng (đã lược bớt trường):

```json
{
  "id": "00000000-0000-4000-8000-000000000010",
  "status": "APPROVED",
  "period": { "id": "00000000-0000-4000-8000-000000000020", "name": "Đợt minh họa" },
  "enterprise": { "id": "00000000-0000-4000-8000-000000000030", "name": "Doanh nghiệp minh họa" },
  "supervisor": { "userId": "00000000-0000-4000-8000-000000000040", "fullName": "GVHD minh họa" },
  "student": { "userId": "00000000-0000-4000-8000-000000000050", "fullName": "Sinh viên minh họa", "studentCode": "SV-DEMO" }
}
```

Render tên trực tiếp từ quan hệ. Không phải gọi từng API để đổi mọi foreign key thành tên; `enterprise`/`supervisor` có thể `null` với hồ sơ chưa đủ thông tin.

## 11. Phân trang, tìm kiếm và xử lý HTTP

Mặc định danh sách có `page=1`, `limit=20`, tối đa `limit=100`. Response chuẩn:

```json
{ "items": [], "total": 0, "page": 1, "limit": 20, "totalPages": 0 }
```

Ngoại lệ: danh sách phiếu đánh giá là mảng; dashboard/detail là object; download/CSV là binary/text. Không có lớp bọc `data` chung. Không dùng cùng một parser `response.data.items` cho mọi endpoint nếu HTTP client chưa tự bọc response.

| Danh sách | Query được hỗ trợ |
|---|---|
| Tài khoản | `page`, `limit`, `role`, `search` (email/họ tên) |
| Đợt / DN / GVHD | `page`, `limit`, `search` |
| Hồ sơ | `page`, `limit`, `periodId`, `status`, `search` (tiêu đề, tên DN, tên GVHD) |
| CSV hồ sơ | `periodId`, `status`, `search` (thêm tìm tên SV); file không phân trang |
| Tiến độ / nhận xét / báo cáo / thông báo | `page`, `limit` |
| Tiêu chí | `page`, `limit`, `formType` |

Đổi bộ lọc thì FE đưa về page 1. Không tự giả định có `sort`, `studentId`, `enterpriseId`, `supervisorId`, `includeInactive` hoặc lọc ngày khi chưa có trong Swagger. Dropdown danh mục cũng có phân trang: không giả định trang đầu chứa toàn bộ dữ liệu.

| Mã HTTP | FE xử lý |
|---|---|
| `200` | Đọc object/list hoặc binary tùy endpoint |
| `201` | Tạo mới hoặc gửi hồ sơ thành công; lấy ID/trạng thái từ response |
| `204` | Xóa thành công; response không có JSON |
| `400` | Hiển thị lỗi validation/nghiệp vụ; `message` có thể là chuỗi hoặc mảng |
| `401` | Thử refresh một lần; thất bại thì đăng nhập lại |
| `403` | Không có quyền theo vai trò/tài nguyên; không refresh lặp |
| `404` | Không tìm thấy hoặc kết quả chưa công bố; xử lý theo màn hình |
| `409` | Xung đột/trùng dữ liệu hoặc hồ sơ vừa đổi trạng thái; tải lại khi phù hợp |
| `413` | File quá 10 MiB; yêu cầu chọn file nhỏ hơn |
| `500` / lỗi mạng | Thông báo chưa thực hiện được; không hiển thị thành công hoặc tự gửi lặp thao tác tạo |

Không chỉ kiểm tra `status === 200`; `201` và `204` cũng là thành công. Với `fetch`, đọc theo `response.ok`, `status`, `Content-Type`; không parse JSON trên `204` hoặc file binary.

## 12. Nút theo trạng thái và các giới hạn cần biết

| Trạng thái hồ sơ | Sinh viên | Cán bộ |
|---|---|---|
| `DRAFT` | Sửa, gửi khi đủ trường và trong hạn; xóa nếu chưa có lịch sử | Xem; chưa duyệt |
| `SUBMITTED` | Xem, không sửa/xóa | Duyệt / từ chối / yêu cầu bổ sung |
| `NEEDS_REVISION` | Sửa rồi gửi lại trong hạn; không xóa | Xem, chờ gửi lại |
| `REJECTED` | Chỉ xem; không gửi lại hoặc tạo hồ sơ thứ hai cùng đợt | Chỉ xem; chưa có API mở lại |
| `APPROVED` | Tiến độ và nộp báo cáo nếu các điều kiện khóa cho phép | Xem, đổi GVHD khi chưa có hoạt động |
| `REPORT_SUBMITTED` | Tiến độ, xem phiên bản, nộp lại nếu chưa bị khóa | Quản lý đánh giá/kết quả theo điều kiện riêng |

API hiện chưa trả `allowedActions`/`canUploadReport`/`canEditProgress`. Chỉ dựa `profile.status` không biết hết điều kiện khóa. Đặc biệt SV không được đọc phiếu đánh giá, và kết quả đã chốt nhưng chưa công bố vẫn trả `404` cho SV. FE không được hiểu `404` này là hồ sơ chắc chắn còn sửa được. Backend kiểm tra lần cuối; nhận `400` thì hiển thị lý do và tải lại dữ liệu. Nếu thiết kế cần ẩn/khóa nút chính xác trước khi bấm, cần thống nhất thêm contract trạng thái thao tác với BE.

Chưa có API duyệt hàng loạt, gửi hàng loạt, xóa lịch sử, danh sách kết quả hàng loạt, đọc audit, nhập Excel, tài liệu hỗ trợ đăng ký hay nhiệm vụ/tiến độ phần trăm. Không trình bày các nút đó như tính năng đã sẵn sàng. Chưa có danh sách tiêu chí inactive để quản trị phục hồi hàng loạt. Các phần này cần chốt nếu xuất hiện trong thiết kế FE.

## 13. Luồng đầu tiên để FE tích hợp

1. SV đăng nhập → `GET /internships/dashboard/student`.
2. SV lấy danh mục đợt/DN → `POST /internships/profiles` → giữ `profileId`.
3. SV lưu thông tin bằng PATCH → POST submit → hiển thị `SUBMITTED`.
4. OFFICER đăng nhập → danh sách hồ sơ `status=SUBMITTED` → mở chi tiết → tải dropdown GVHD → PATCH review APPROVED kèm `supervisorId`.
5. SV tải lại chi tiết/dashboard → thấy tên GVHD → POST tiến độ → POST báo cáo.
6. GVHD/DN đăng nhập → danh sách hồ sơ theo token → tiêu chí theo `periodId` → tạo/lưu/gửi phiếu đúng loại; GVHD chọn `reportId`.
7. OFFICER mở kết quả → tùy chọn điều chỉnh có lý do → finalize → publish.
8. SV tải lại thông báo và `GET /evaluations/results/{profileId}` → thấy điểm công bố.

FE có thể mock khi BE không chạy, nhưng mock phải cùng response và trạng thái; không thay kiểm tra quyền/nghiệp vụ ở backend. URL API FE là cấu hình công khai; không chứa thông tin PostgreSQL, signing secret hoặc mật khẩu demo cố định. CORS backend mặc định cho `http://localhost:3001`; nếu FE chạy origin khác thì cấu hình `CORS_ORIGIN` backend cho đúng origin hoặc dùng development proxy. Không đổi database từ FE.
