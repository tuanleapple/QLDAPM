# Hệ thống quản lý thực tập sinh viên — Backend

Backend REST API cho hệ thống quản lý thực tập sinh viên. Frontend chưa được khởi tạo trong task hiện tại.

## Backend

Backend nằm trong [`backend/`](backend/) và dùng NestJS + TypeScript + TypeORM + PostgreSQL.

Đọc code để trình bày: [luồng Controller → Service → Repository và ví dụ gửi hồ sơ/tính điểm](docs/code-walkthrough.md).

## Yêu cầu

- Node.js 20+
- npm 9+
- Docker Desktop hoặc Docker Engine (để chạy PostgreSQL local)

Repository đã khóa phiên bản khuyến nghị bằng `.nvmrc`:

```bash
nvm install
nvm use
node -v  # Node 20.x
```

Nếu dùng Node 16 hoặc thấp hơn, hãy nâng cấp trước khi cài dependency.

## Cài đặt dependencies

```bash
cd backend
npm install
```

## Cấu hình môi trường

Các lệnh từ phần này chạy tại repository root (`source/`). Nếu đang ở `source/backend/`, chạy `cd ..` trước.

```bash
cp -n backend/.env.example backend/.env
```

Điều chỉnh các biến trong `backend/.env` nếu cần. File `.env` không được commit.

`backend/.env.example` liệt kê các biến cần thiết. Không commit `.env`; không đưa secret vào frontend.

## Chạy PostgreSQL

```bash
docker compose --env-file backend/.env up -d postgres
```

Nếu đang đứng trong `backend/`, dùng `docker compose -f ../docker-compose.yml --env-file .env up -d postgres` để tránh đường dẫn `backend/backend/.env`.

PostgreSQL dùng named volume `internship_postgres_data` để dữ liệu được giữ lại khi container dừng.

## Chạy migration thủ công

```bash
npm --prefix backend run migration:run
```

Migration tạo schema nghiệp vụ PostgreSQL. Migration không tự chạy khi app khởi động; chỉ chạy thủ công trên database đã xác định. Không bật `synchronize: true` hoặc `migrationsRun: true`.

Nếu báo bảng không tồn tại dù `InitialSchema` đã được ghi nhận, làm theo [hướng dẫn kiểm tra database/schema](docs/testing-api.md#troubleshooting-migration-history-and-missing-tables). Không xóa lịch sử migration để ép chạy lại trên database có dữ liệu.

Để nạp bộ dữ liệu demo phục vụ kiểm thử API, sau khi migration thành công hãy chạy `npm --prefix backend run seed`. Seed chỉ chấp nhận database local/test có tên kết thúc bằng `_dev`, `_development` hoặc `_test`; xem [`docs/testing-api.md`](docs/testing-api.md) trước khi chạy. Seed không tự chạy khi ứng dụng khởi động.

## Chạy backend

```bash
npm --prefix backend run start:dev
```

Backend mặc định lắng nghe tại port `3000` (`PORT` có thể thay đổi).

- Health check: http://localhost:3000/api/health
- Swagger: http://localhost:3000/api/docs
- API base URL: `http://localhost:3000/api`

URL gốc `http://localhost:3000/` không có route nên trả `404 Cannot GET /`; hãy dùng các URL có prefix `/api` ở trên.

## API hiện có

Team frontend đọc [hướng dẫn màn hình → API](docs/frontend-integration.md) trước: có nguồn dropdown/ID, dữ liệu hiển thị, nút bấm, quyền, trạng thái và luồng tích hợp theo thứ tự.

Tài liệu hướng dẫn frontend và bảng endpoint nằm tại [`docs/api.md`](docs/api.md). Hướng dẫn tạo database thử nghiệm, seed an toàn và request qua Swagger nằm tại [`docs/testing-api.md`](docs/testing-api.md). API bao gồm health/authentication, tài khoản, danh mục và hồ sơ, tiến độ/nhận xét, báo cáo riêng tư, đánh giá/kết quả, thông báo và CSV export.

Tệp báo cáo được lưu riêng tư theo `REPORT_STORAGE_DIR` (mặc định `backend/var/private-reports/`), không được phục vụ như static assets. Dữ liệu file không được commit.

Source chạy API nằm trong `backend/src/`. Seed và fixture nằm riêng trong `backend/tools/`; unit test nằm trong `backend/test/unit/`. Không có script kiểm tra API hàng loạt hoặc báo cáo kiểm thử sinh tự động trong source.

## Kiểm tra chất lượng

```bash
npm --prefix backend run lint:check
npm --prefix backend run format:check
npm --prefix backend exec tsc -- --noEmit
npm --prefix backend run build
npm --prefix backend test
```

## Cấu trúc chính

```text
source/
├── backend/
│   ├── src/                # Logic API, cấu hình runtime, entity, migration
│   ├── test/unit/          # Kiểm thử nghiệp vụ
│   └── tools/              # Seed và fixture local/test
├── docs/                   # Thiết kế và kế hoạch triển khai
├── docker-compose.yml      # PostgreSQL development service
├── .gitignore
└── README.md
```

Thiết kế và đặc tả triển khai hiện tại nằm trong [`docs/backend-design.md`](docs/backend-design.md) và [`docs/backend-requirements.md`](docs/backend-requirements.md). API contract nằm trong [`docs/api.md`](docs/api.md).
