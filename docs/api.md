# API guide cho frontend

Tài liệu này mô tả API đã có trong source hiện tại. Các endpoint nghiệp vụ chưa có implementation không được coi là đã hỗ trợ.

## Chạy và mở Swagger

Từ repository root:

```bash
npm --prefix backend run start:dev
```

Mở:

- Swagger UI: `http://localhost:3000/api/docs`
- API base URL: `http://localhost:3000/api`
- Health check: `GET http://localhost:3000/api/health`

Ứng dụng đọc cấu hình từ `backend/.env`. Không đưa file này hoặc bất kỳ secret nào vào frontend, Git hay ví dụ API.

## Xác thực

### Đăng nhập

`POST /auth/login` là endpoint public. Không có public registration.

Request:

```json
{
  "email": "student@example.test",
  "password": "not-a-real-password"
}
```

Ràng buộc:

- `email`: bắt buộc, định dạng email.
- `password`: bắt buộc, tối thiểu 8 ký tự.

Response `200`:

```json
{
  "accessToken": "example.access.token",
  "refreshToken": "example.refresh.token",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "user": {
    "id": "user-uuid",
    "email": "student@example.test",
    "role": "STUDENT"
  }
}
```

Token trong ví dụ là placeholder, không phải token thật.

### Gọi endpoint cần xác thực

Gửi access token trong header:

```http
Authorization: Bearer example.access.token
```

Swagger UI dùng nút `Authorize` và scheme `bearer`. Các role hiện tại là `STUDENT`, `OFFICER`, `SUPERVISOR`, `ENTERPRISE_REP`.

### Refresh

`POST /auth/refresh` là endpoint public về mặt HTTP nhưng yêu cầu refresh token hợp lệ trong body:

```json
{
  "refreshToken": "example.refresh.token"
}
```

Response `200` trả cặp token mới. Refresh token cũ bị thu hồi. Lỗi `401` xảy ra khi token thiếu, sai, hết hạn hoặc đã bị thu hồi.

### Logout

`POST /auth/logout` yêu cầu Bearer access token và trả `200`:

```json
{ "success": true }
```

Logout thu hồi refresh session của tài khoản hiện tại.

### Tài khoản hiện tại

`GET /auth/me` yêu cầu Bearer token và trả `200`:

```json
{
  "id": "user-uuid",
  "email": "student@example.test",
  "role": "STUDENT"
}
```

## Chuẩn lỗi

Ứng dụng đang dùng lỗi HTTP mặc định của NestJS, không phải một error envelope tùy biến. Frontend nên xử lý tối thiểu:

```json
{
  "statusCode": 400,
  "message": "Registration is closed",
  "error": "Bad Request"
}
```

Với lỗi validation, `message` có thể là mảng các lỗi. Các mã thực tế hiện dùng:

- `400`: body không hợp lệ, workflow không hợp lệ, registration đóng, thiếu lý do hoặc dữ liệu trùng.
- `401`: thiếu/sai/hết hạn Bearer token, credential sai, refresh token không hợp lệ.
- `403`: sai role hoặc không có quyền ownership/assignment.
- `404`: period/profile không tồn tại.

## Endpoint đã triển khai

| Method | Path                               | Quyền                       | Mô tả                                               | Phân trang/lọc                                                               |
| ------ | ---------------------------------- | --------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/health`                          | Public                      | Kiểm tra API                                        | Không áp dụng                                                                |
| POST   | `/auth/login`                      | Public                      | Đăng nhập                                           | Không áp dụng                                                                |
| POST   | `/auth/refresh`                    | Public + refresh token body | Rotation refresh token                              | Không áp dụng                                                                |
| POST   | `/auth/logout`                     | Bearer token                | Thu hồi session                                     | Không áp dụng                                                                |
| GET    | `/auth/me`                         | Bearer token                | Lấy tài khoản hiện tại                              | Không áp dụng                                                                |
| GET    | `/internships/periods`             | `STUDENT`, `OFFICER`        | Liệt kê đợt thực tập                                | Hiện trả toàn bộ, sắp xếp `startDate DESC`; chưa có pagination/search/filter |
| POST   | `/internships/profiles`            | `STUDENT`                   | Tạo hồ sơ `DRAFT`                                   | Không áp dụng                                                                |
| GET    | `/internships/profiles/:id`        | Bearer token                | Lấy hồ sơ theo id, có kiểm tra ownership/assignment | Không áp dụng                                                                |
| POST   | `/internships/profiles/:id/submit` | `STUDENT`                   | Chuyển `DRAFT` sang `SUBMITTED`                     | Không áp dụng                                                                |
| PATCH  | `/internships/profiles/:id/review` | `OFFICER`                   | Approve/reject/request revision                     | Không áp dụng                                                                |

### `GET /internships/periods`

Response `200` là mảng các period. Endpoint chưa nhận query parameter; không gửi `page`, `limit`, `search` hoặc filter vì chúng chưa được implementation.

### `POST /internships/profiles`

Request `application/json`:

```json
{
  "periodId": "period-uuid",
  "title": "Backend internship project",
  "description": "Build an internship management API."
}
```

Ràng buộc:

- `periodId`: bắt buộc, UUID.
- `title`: bắt buộc, chuỗi từ 1 đến 255 ký tự.
- `description`: tùy chọn, chuỗi.
- Chỉ tạo được trong thời gian registration của period.
- Mỗi student chỉ có một profile trong một period.

Response `201` trả profile vừa tạo ở trạng thái `DRAFT`.

### `GET /internships/profiles/:id`

- `id`: path parameter, profile UUID trong implementation hiện tại không có decorator UUID validation; service sẽ trả `404` nếu không tìm thấy.
- STUDENT chỉ xem profile của mình.
- SUPERVISOR chỉ xem profile được phân công.
- Các role khác qua guard có thể gọi endpoint và được policy service hiện tại xử lý.

Response `200` là profile kèm period, enterprise và supervisor nếu có.

### `POST /internships/profiles/:id/submit`

Không có request body. Profile phải ở `DRAFT`; service tạo `StatusHistory` trong cùng transaction. Response `201` trả profile đã chuyển sang `SUBMITTED`.

### `PATCH /internships/profiles/:id/review`

Request:

```json
{
  "status": "NEEDS_REVISION",
  "reason": "Please attach the missing approval document."
}
```

`status` được implementation chấp nhận trong workflow review là `APPROVED`, `REJECTED` hoặc `NEEDS_REVISION`. `reason` bắt buộc khi `REJECTED` hoặc `NEEDS_REVISION`, tùy chọn khi `APPROVED`. Response `200` trả profile đã chuyển trạng thái.

## Upload/download và API chưa triển khai

Hiện chưa có endpoint upload/download report, nên chưa có `multipart/form-data`, MIME allowlist, giới hạn 20 MB hoặc response file để frontend sử dụng. Không tự tích hợp các endpoint này dựa trên entity/migration.

Các nhóm API sau cũng mới là phần dự kiến trong thiết kế, chưa được đưa vào bảng endpoint đã triển khai:

- CRUD danh mục, tạo period và phân công supervisor.
- Progress và comments.
- Upload/download/version report.
- Evaluation forms, scoring, finalize và publish result.
- Notifications, system logs/audit và seed API.

Khi các API này được code, phải cập nhật controller decorators và tài liệu này trong cùng thay đổi.
