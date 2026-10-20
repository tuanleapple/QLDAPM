# Hệ thống quản lý thực tập sinh viên — Backend

Bộ khung backend NestJS + TypeScript, sử dụng PostgreSQL và TypeORM. Nghiệp vụ, entity, endpoint và phân quyền sẽ được bổ sung sau khi có đặc tả.

## Yêu cầu

- Node.js 18+ (khuyến nghị Node.js LTS)
- npm 9+
- Docker Desktop hoặc Docker Engine (để chạy PostgreSQL local)

## Cài đặt dependencies

```bash
npm install
```

## Cấu hình môi trường

```bash
cp .env.example .env
```

Điều chỉnh các biến trong `.env` nếu cần. File `.env` không được commit.

## Chạy PostgreSQL

```bash
docker compose up -d postgres
```

PostgreSQL dùng named volume `internship_postgres_data` để dữ liệu được giữ lại khi container dừng.

## Chạy migration

```bash
npm run migration:run
```

Hiện migration khởi tạo là migration rỗng có chủ đích; chưa có bảng nghiệp vụ vì chưa có đặc tả dữ liệu. Không bật `synchronize: true`.

## Chạy backend

```bash
npm run start:dev
```

- Health check: http://localhost:3000/api/health
- Swagger: http://localhost:3000/api/docs

## Kiểm tra chất lượng

```bash
npm run lint:check
npm run format:check
npx tsc --noEmit
npm run build
```

## Cấu trúc chính

```text
src/
├── config/                 # ConfigModule và kiểm tra biến môi trường
├── database/               # DataSource và migrations TypeORM
├── health/                 # GET /api/health
├── modules/
│   ├── auth/               # Module rỗng
│   ├── users/              # Module rỗng
│   ├── internships/        # Module rỗng
│   ├── progress/           # Module rỗng
│   ├── reports/            # Module rỗng
│   └── evaluations/        # Module rỗng
└── app.module.ts
```

Các module nghiệp vụ sẽ theo phân tầng `Controller → Service → Repository`, dùng DTO cho input và Entity cho ánh xạ bảng khi nghiệp vụ được đặc tả.
