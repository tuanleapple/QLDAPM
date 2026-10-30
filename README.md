# Hệ thống quản lý thực tập sinh viên — Backend

Backend REST API cho hệ thống quản lý thực tập sinh viên. Frontend chưa được khởi tạo trong task hiện tại.

## Backend

Backend nằm trong [`backend/`](backend/) và dùng NestJS + TypeScript + TypeORM + PostgreSQL.

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

```bash
cp backend/.env.example backend/.env
```

Điều chỉnh các biến trong `backend/.env` nếu cần. File `.env` không được commit.

Ở `development` và `test`, auth secret có giá trị mặc định local-only. Ở `production`, bắt buộc phải cấu hình secret riêng đủ dài. Không dùng secret production trong tài liệu hoặc frontend.

## Chạy PostgreSQL

```bash
docker compose --env-file backend/.env up -d postgres
```

PostgreSQL dùng named volume `internship_postgres_data` để dữ liệu được giữ lại khi container dừng.

## Chạy migration thủ công

```bash
npm --prefix backend run migration:run
```

Migration tạo schema nghiệp vụ PostgreSQL. Migration không tự chạy khi app khởi động; chỉ chạy thủ công trên database đã xác định. Không bật `synchronize: true` hoặc `migrationsRun: true`.

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

Tài liệu hướng dẫn frontend và bảng endpoint nằm tại [`docs/api.md`](docs/api.md). Các nhóm API đã có gồm health, authentication và workflow hồ sơ thực tập. Upload/download báo cáo, đánh giá, tính điểm, notification và audit chưa hoàn tất.

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
├── backend/                # NestJS API, TypeORM, migrations, tests
├── docs/                   # Thiết kế và kế hoạch triển khai
├── docker-compose.yml      # PostgreSQL development service
├── .gitignore
└── README.md
```

Thiết kế backend và các giả định nghiệp vụ nằm trong [`docs/backend-design.md`](docs/backend-design.md). Kế hoạch chuyển cấu trúc và triển khai nằm trong [`docs/implementation-plan.md`](docs/implementation-plan.md).
