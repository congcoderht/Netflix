# Netflix Fullstack Application

> Fullstack web application with React + Express + PostgreSQL

## Tech Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Frontend       | Vite + React + TypeScript + TailwindCSS v4 |
| Backend        | Node.js + Express + TypeScript          |
| Database       | PostgreSQL 16                           |
| ORM            | Prisma                                  |
| Containerization | Docker + Docker Compose              |
| CI/CD          | GitHub Actions                          |

## Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Local Development (without Docker)

```bash
# 1. Clone and install
git clone <repo-url>
cd Netflix

# 2. Setup environment
cp .env.example server/.env

# 3. Start frontend
cd client
npm install
npm run dev      # → http://localhost:3000

# 4. Start backend (new terminal)
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev      # → http://localhost:5000
```

### Docker Development

```bash
# Start all services with hot-reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:5000
# Database → localhost:5432
```

### Docker Production

```bash
docker compose up --build -d

# Client → http://localhost
# API    → http://localhost:5000
```

## Project Structure & File Guide

Đây là cấu trúc thư mục chi tiết của dự án, giải thích vai trò của từng file và khi nào bạn nên sửa code trong đó.

### Frontend (`client/`)

```
client/
├── public/                 # File tĩnh (favicon, hình ảnh không cần xử lý qua bundler)
├── src/
│   ├── components/         # Gồm các component tái sử dụng (Button, Input, Card). Sửa khi làm UI dùng chung.
│   ├── hooks/              # Custom React hooks (useAuth, useFetch). Sửa khi cần logic React dùng lại.
│   ├── pages/              # Gồm các màn hình chính (HomePage, LoginPage). Sửa khi làm layout/màn hình mới.
│   ├── services/           # Chứa code gọi API fetch/axios. Lấy data từ Backend. (vd: api.ts).
│   ├── types/              # Chứa định nghĩa kiểu TypeScript interface (User, Movie). Sửa khi format data Backend đổi.
│   ├── utils/              # Chứa hàm tiện ích thuần tuý (formatDate, calculateSum).
│   ├── App.tsx             # Component gốc chứa React Router và layout tổng. Sửa khi thêm đường dẫn trang (Route).
│   ├── main.tsx            # Điểm vào chính của FE, render App vào DOM DOM. Thường rất ít sửa.
│   └── index.css           # Cấu hình TailwindCSS v4. Sửa khi muốn thêm font hoặc CSS toàn cục.
├── .dockerignore           # Chặn các file rác khi build Docker Client. Ít khi sửa.
├── Dockerfile              # Cấu hình build Docker cho Frontend (Node + Nginx). Sửa khi cần cài thêm tool vào container.
├── nginx.conf              # Cấu hình Nginx phục vụ FE. Sửa khi có lỗi về đường dẫn route (404) hoặc proxy.
├── package.json            # Thư viện npm của frontend (React, Vite). Sửa khi muốn cài mới thư viện.
├── tsconfig.json           # Cấu hình TypeScript gốc. Ít sửa.
├── tsconfig.app.json       # Cấu hình TS chính của app, alias `@/*` -> `src/*` nằm đây.
└── vite.config.ts          # Cấu hình Vite. Sửa khi cần thêm proxy gọi API port mới (như /api -> localhost:5000).
```

### Backend (`server/`)

```
server/
├── prisma/
│   └── schema.prisma       # Định nghĩa bảng Database SQL (User, Movie). Sửa khi muốn thêm CSDL/Cột mới.
├── src/
│   ├── config/
│   │   └── index.ts        # Đọc môi trường từ .env (PORT, DB_URL). Thêm config vào đây để TS map đúng kiểu.
│   ├── controllers/        # Xử lý logic từng API. (vd: req.body -> lưu DB -> res.json). Làm việc ở đây nhiều nhất!
│   ├── middlewares/        # Logic chặn/lọc request (vd: verifyToken, error.middleware). Sửa khi làm xác thực.
│   ├── routes/             # Định nghĩa URL (vd: `router.get('/health', ...)`). Thêm mới khi có API mới.
│   ├── services/           # Viết code logic siêu phức tạp, tách ra để Controller gọn hơn (tuỳ chọn).
│   ├── types/              # TS interface của Backend (req/res custom types).
│   ├── utils/              # Hàm dùng chung Backend (hashPassword, sendEmail).
│   └── index.ts            # Entry gốc Express (Start server, setup cors, mount routes). Sửa khi thêm nhóm API mới.
├── .dockerignore           # Chặn rác khi build Docker.
├── .env                    # Biến môi trường local (password, port...). Sửa tuỳ máy của Dev (Không bao giờ push git).
├── Dockerfile              # Công thức build Backend production. Sửa khi thư viện lỗi cần C++ build tools (vd: bcrypt).
├── package.json            # Package BE (Express, Prisma). Sửa lúc `npm install`.
└── tsconfig.json           # Cấu hình TS Backend + Alias paths. Ít khi chỉnh sửa.
```

### Thư mục gốc dự án (Root)

```
Netflix/
├── .github/workflows/
│   └── ci.yml              # Kịch bản CI tự động, chạy khi có Push Code (test npm run build BE/FE). 
├── docker-compose.yml      # Cấu trúc chạy Production bằng Docker. Sửa khi muốn thêm Redis/MinIO.
├── docker-compose.dev.yml  # Docker cho Dev có Hot-Reload gắn code từ ngoài vào.
├── .env.example            # Mẫu file .env dùng chung cho mọi người copy. Nhớ sửa cái này khi thêm biến vào .env.
├── .gitignore              # Khoá không cho file cá nhân nhảy lên Git.
└── README.md               # File thông tin chung dự án.
```

## API Endpoints

| Method | Endpoint       | Description  |
| ------ | -------------- | ------------ |
| GET    | /api/health    | Health check |
| GET    | /api-docs      | Auto-Generated Swagger Docs (swagger-autogen) |

## Scripts

### Client
| Script        | Description              |
| ------------- | ------------------------ |
| `npm run dev` | Start dev server (3000)  |
| `npm run build` | Build for production   |

### Server
| Script                  | Description                    |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Start dev server with hot-reload |
| `npm run build`         | Compile TypeScript             |
| `npm run prisma:generate` | Generate Prisma client      |
| `npm run prisma:migrate`  | Run database migrations     |
| `npm run prisma:studio`   | Open Prisma Studio          |
