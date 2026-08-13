# Netflix — Kế hoạch cải thiện dự án

> Tài liệu sống để theo dõi hiện trạng, rủi ro và tiến độ cải thiện dự án.
>
> Cập nhật lần đầu: 2026-07-27

## 1. Mục tiêu

- Ổn định các tính năng hiện có trước khi mở rộng.
- Xử lý lỗi bảo mật, phân quyền và tính đúng đắn của API theo mức độ ưu tiên.
- Chuẩn hóa validation, error handling và cấu trúc code.
- Bổ sung kiểm thử để mỗi thay đổi sau này có thể được xác minh tự động.
- Hoàn thiện dần các nhóm tính năng đã thiết kế trong `FEATURES.md`.
- Giữ mỗi giai đoạn đủ nhỏ để có thể triển khai, kiểm thử và commit độc lập.

## 2. Hiện trạng

### Đã có

- Frontend React, TypeScript, Vite, Tailwind CSS, Zustand và i18next.
- Backend Express, TypeScript, Prisma và PostgreSQL.
- Đăng ký bằng OTP email.
- Đăng nhập email/password và Google OAuth.
- Access token, refresh token và refresh-token rotation.
- Hồ sơ cá nhân và đổi mật khẩu.
- Phân quyền `USER` và `ADMIN`.
- CRUD phim, thể loại, diễn viên, season và episode.
- Upload ảnh/video qua Cloudinary.
- Giao diện trang chủ, danh sách phim, chi tiết phim, video player và quản lý phim.
- Docker Compose, Nginx và GitHub Actions.

### Đã thiết kế trong database nhưng chưa hoàn thiện API/UI

- Gói cước, subscription và thanh toán.
- Watchlist.
- Lịch sử và tiến độ xem.
- Bình luận và đánh giá.
- Thông báo.
- Quản lý người dùng và thống kê dành cho admin.

## 3. Những điểm cần lưu ý

### P0 — Bảo mật và tính đúng đắn

- [x] Sắp xếp lại route diễn viên trong `movie.routes.ts`.
  - `GET /movies/:id` hiện đứng trước `GET /movies/actors/search`.
  - Express có thể hiểu `actors` là giá trị của `:id`, khiến route tìm diễn viên không chạy.
- [x] Chặn user thường xem phim chưa phát hành bằng ID.
  - API danh sách đã lọc `isPublished`, nhưng API chi tiết hiện chưa áp dụng cùng quy tắc.
- [x] Kiểm tra trạng thái `isBlocked` khi access token, refresh token và Google OAuth.
  - Tài khoản bị khóa không được tiếp tục tạo phiên mới.
- [x] Thu hồi toàn bộ refresh token sau khi đổi mật khẩu hoặc phát hiện tài khoản bị khóa.
- [ ] Không lưu refresh token dạng thô trong database.
  - Chuyển sang lưu hash của token để giảm thiệt hại khi database bị lộ.
- [ ] Rà soát cookie production.
  - Xác định chính xác `secure`, `sameSite`, domain và reverse-proxy configuration.
- [x] Bổ sung rate limit phù hợp cho login, gửi OTP, xác minh OTP và refresh token.
- [x] Không để ứng dụng production chạy với JWT secret mặc định.
  - Validate biến môi trường và dừng server sớm nếu thiếu secret bắt buộc.
- [ ] Rà soát upload: MIME type, dung lượng, loại tài nguyên, quyền admin và cleanup file lỗi.

### P1 — Độ ổn định của backend

- [ ] Áp dụng Zod cho params, query và body của API.
- [ ] Chuẩn hóa lỗi bằng lớp `AppError` và error middleware tập trung.
- [ ] Loại bỏ các khối `try/catch` lặp lại bằng async handler.
- [ ] Validate `page`, `limit`, `duration`, số season/episode và enum `ContentType`.
- [ ] Giới hạn `limit` tối đa để tránh truy vấn quá lớn.
- [ ] Chuẩn hóa response pagination.
- [ ] Xử lý đầy đủ lỗi Prisma như `P2002`, `P2003` và `P2025`.
- [ ] Dùng transaction cho các thao tác thay thế quan hệ:
  - Gán lại genres của phim.
  - Gán lại actors của phim.
  - Các thao tác nhiều bước liên quan season/episode.
- [ ] Kiểm tra episode thực sự thuộc season và season thực sự thuộc movie trên nested route.
- [ ] Thêm database index cho các trường thường tìm/lọc/sắp xếp.
- [ ] Đồng bộ thời hạn refresh token trong JWT, cookie và database từ một cấu hình duy nhất.
- [ ] Bổ sung graceful shutdown cho HTTP server, Prisma và Redis.
- [ ] Chuẩn hóa logging và không ghi secret/token vào log.

### P1 — Auth và frontend

- [ ] Khởi tạo trạng thái đăng nhập an toàn khi tải lại trang.
  - Xác minh phiên bằng `/auth/me` hoặc refresh thay vì chỉ tin dữ liệu persist.
- [ ] Ngăn nhiều request `401` cùng lúc tạo nhiều lần refresh token.
  - Dùng một refresh promise/queue chung trong Axios interceptor.
- [ ] Redirect về `/login` rõ ràng khi refresh thất bại.
- [ ] Rà soát việc persist access token trong localStorage.
  - Ngắn hạn: tăng cường phòng chống XSS.
  - Dài hạn: cân nhắc giữ access token trong memory và khôi phục bằng refresh cookie.
- [ ] Không hiển thị form đổi mật khẩu cho tài khoản chỉ dùng OAuth, hoặc cung cấp luồng đặt mật khẩu.
- [ ] Chuẩn hóa loading, empty state và error state trên các trang.
- [ ] Thêm error boundary và trang 404 thực sự.
- [ ] Hoàn thiện accessibility cho form, modal, menu và video player.
- [ ] Thay các chuỗi hard-code bằng khóa i18n.
- [ ] Kiểm tra encoding tiếng Việt nhất quán ở source, terminal và tài liệu.

### P1 — Chất lượng và kiểm thử

- [x] Bổ sung ESLint cho backend và bảo đảm script `npm run lint` chạy được.
- [ ] Thêm formatter thống nhất cho client và server.
- [ ] Thêm unit test cho auth, JWT, OTP và các service quan trọng.
- [ ] Thêm integration test cho API với database test.
- [ ] Các case tối thiểu:
  - Đăng ký và xác minh OTP.
  - Login đúng/sai và tài khoản bị khóa.
  - Refresh rotation và reuse token cũ.
  - Phân quyền admin.
  - User không xem được phim chưa publish.
  - CRUD movie/genre/season/episode.
- [ ] Thêm test frontend cho auth store, interceptor và protected routes.
- [ ] Thêm smoke E2E cho login → duyệt phim → xem chi tiết.
- [ ] Cập nhật CI để chạy test, kiểm tra Prisma schema và migration.

### P2 — DevOps và tài liệu

- [ ] Đồng bộ port trong README với Vite (`5173`).
- [ ] Cập nhật bảng API endpoint theo implementation thực tế.
- [ ] Tách cấu hình Docker development và production rõ ràng.
- [ ] Không hard-code database credential trong cấu hình production.
- [ ] Thêm health check cho server, Redis và client.
- [ ] Bảo đảm server chỉ sẵn sàng sau khi database migration hoàn tất.
- [ ] Xác định chiến lược chạy Prisma migration khi deploy.
- [ ] Thêm `.dockerignore` đầy đủ và tối ưu Docker layer/cache.
- [ ] Rà soát Swagger để không phụ thuộc vào file sinh ra bị lỗi thời.
- [ ] Bổ sung hướng dẫn seed admin và dữ liệu mẫu.
- [ ] Ghi rõ các biến môi trường bắt buộc, tùy chọn và ví dụ an toàn.

## 4. Lộ trình thực hiện

### Giai đoạn 0 — Baseline và bảo vệ thay đổi hiện có

- [x] Ghi nhận trạng thái build/lint hiện tại của client và server.
- [x] Phân biệt lỗi có sẵn với lỗi phát sinh từ thay đổi mới.
- [x] Kiểm tra Prisma schema và khả năng generate client.
- [x] Lập danh sách endpoint hiện tại từ routes/Swagger.
- [x] Không ghi đè hoặc xóa các thay đổi chưa commit của người dùng.

**Điều kiện hoàn tất:** Có baseline tái lập được và biết chính xác những kiểm tra nào đang pass/fail.

### Giai đoạn 1 — Vá lỗi P0

- [x] Sửa thứ tự/static path của actor routes.
- [x] Áp dụng quyền xem phim unpublished cho API chi tiết.
- [x] Chặn tài khoản bị khóa trong mọi luồng tạo/refresh phiên.
- [x] Validate environment secrets khi khởi động.
- [x] Bổ sung rate limit cho các endpoint auth nhạy cảm.
- [ ] Thêm test hồi quy cho từng lỗi trên.

**Điều kiện hoàn tất:** Các lỗ hổng đã nêu có test chứng minh và client/server vẫn build thành công.

### Giai đoạn 2 — Chuẩn hóa API

- [ ] Tạo schema Zod theo từng resource.
- [ ] Tạo validation middleware dùng chung.
- [ ] Tạo `AppError`, async handler và error response thống nhất.
- [ ] Chuẩn hóa pagination/filter.
- [ ] Bổ sung transaction và ownership validation cho nested resources.
- [ ] Cập nhật Swagger/API docs.

**Điều kiện hoàn tất:** Controller gọn, input không hợp lệ trả lỗi `4xx` nhất quán và các API chính có integration test.

### Giai đoạn 3 — Củng cố auth frontend

- [ ] Tạo bootstrap auth flow.
- [ ] Chống refresh race condition.
- [ ] Chuẩn hóa logout và redirect khi hết phiên.
- [ ] Cải thiện OAuth/password UX.
- [ ] Bổ sung test cho store, interceptor và protected routes.

**Điều kiện hoàn tất:** Reload trang, token hết hạn và nhiều request đồng thời đều hoạt động ổn định.

### Giai đoạn 4 — Hoàn thiện trải nghiệm xem phim

- [ ] API lưu và lấy `WatchProgress`.
- [ ] Tự lưu tiến độ định kỳ và khi rời video.
- [ ] Resume playback.
- [ ] Watch history.
- [ ] Watchlist.
- [ ] UI “Tiếp tục xem” và “Danh sách của tôi”.

**Điều kiện hoàn tất:** Người dùng có thể dừng, quay lại xem tiếp và quản lý danh sách cá nhân.

### Giai đoạn 5 — Subscription và thanh toán

- [ ] Chốt nhà cung cấp thanh toán và yêu cầu nghiệp vụ.
- [ ] API quản lý plan.
- [ ] Checkout và webhook có idempotency.
- [ ] Kích hoạt/gia hạn/hết hạn subscription.
- [ ] Middleware kiểm tra subscription khi phát nội dung.
- [ ] Lịch sử thanh toán và UI gói cước.

**Điều kiện hoàn tất:** Trạng thái thanh toán được xác nhận từ server/webhook, không dựa vào dữ liệu client.

### Giai đoạn 6 — Tương tác và thông báo

- [ ] Comment/reply và soft delete.
- [ ] Rating với constraint từ 1 đến 5.
- [ ] Notification list/read state.
- [ ] Chống spam và phân trang.
- [ ] UI tương ứng.

**Điều kiện hoàn tất:** Có kiểm soát quyền, validation và moderation cơ bản.

### Giai đoạn 7 — Admin và thống kê

- [ ] Quản lý user, khóa/mở khóa và phân quyền.
- [ ] Quản lý plan/subscription.
- [ ] Dashboard tổng quan.
- [ ] Thống kê user, lượt xem, phim phổ biến và doanh thu.
- [ ] Audit log cho hành động quản trị quan trọng.

**Điều kiện hoàn tất:** Các thao tác admin nhạy cảm được phân quyền, validate và ghi audit.

### Giai đoạn 8 — Production readiness

- [ ] Hoàn thiện test suite và quality gate trong CI.
- [ ] Migration/backup/restore procedure.
- [ ] Logging, monitoring và alerting.
- [ ] Security headers, CSP, CORS và proxy trust.
- [ ] Kiểm tra hiệu năng truy vấn và frontend bundle.
- [ ] Kiểm tra backup, rollback và quy trình deploy.

**Điều kiện hoàn tất:** Có checklist deploy, quan sát được lỗi production và có phương án rollback/khôi phục dữ liệu.

## 5. Nguyên tắc thực hiện

- Mỗi thay đổi giải quyết một nhóm vấn đề nhỏ, có thể review độc lập.
- Ưu tiên security và correctness trước tính năng mới.
- Bug fix phải có test hồi quy khi khả thi.
- Không thay đổi schema production nếu chưa có migration và kế hoạch rollback.
- Không đưa secret, token thật hoặc credential vào Git.
- Không phá vỡ API cũ nếu chưa cập nhật đồng thời client và tài liệu.
- Sau mỗi giai đoạn:
  - Chạy lint, type-check, test và build liên quan.
  - Cập nhật checklist trong file này.
  - Ghi lại quyết định kỹ thuật quan trọng.

## 6. Nhật ký quyết định

| Ngày | Quyết định | Lý do |
|---|---|---|
| 2026-07-27 | Ưu tiên baseline và các lỗi P0 trước tính năng mới | Repo đang có nhiều thay đổi chưa commit và một số rủi ro auth/authorization cần được khóa lại trước khi mở rộng |
| 2026-07-27 | Bắt buộc đăng ký qua OTP | Endpoint đăng ký trực tiếp cho phép bỏ qua bước xác minh email |
| 2026-07-27 | Kiểm tra user trong database ở middleware auth | Việc khóa tài khoản hoặc đổi role cần có hiệu lực ngay, không chờ access token hết hạn |

## 7. Baseline gần nhất

Kết quả sau đợt ổn định P0 ngày 2026-07-27:

- Client lint: pass, không còn warning.
- Client production build: pass.
- Server lint: pass.
- Server TypeScript build và Swagger generation: pass.
- Prisma schema validation: pass.
- Prisma Client generation: pass.
- Cảnh báo còn lại:
  - Frontend bundle chính khoảng 915 kB trước gzip; cần code splitting ở giai đoạn tối ưu.
  - Prisma cảnh báo cấu hình `package.json#prisma` sẽ bị loại bỏ ở Prisma 7.
  - Chưa có test hồi quy tự động; đây vẫn là điều kiện còn thiếu để hoàn tất Giai đoạn 1.

## 8. Công việc đề xuất tiếp theo

Bắt đầu bằng **Giai đoạn 0**, sau đó thực hiện **Giai đoạn 1** theo từng nhóm nhỏ:

1. Chạy baseline client/server và ghi lại kết quả.
2. Sửa actor route và quyền xem phim unpublished.
3. Thêm test hồi quy.
4. Củng cố luồng tài khoản bị khóa và cấu hình secret.
5. Chạy lại toàn bộ quality checks rồi cập nhật tài liệu này.
