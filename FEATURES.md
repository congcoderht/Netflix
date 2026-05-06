# Netflix Clone — Danh sách chức năng theo Role

## Role

| Role | Mô tả |
|---|---|
| `Guest` | Chưa đăng nhập |
| `User` | Đã đăng nhập, có gói subscription |
| `Admin` | Quản trị viên hệ thống |

---

## Guest (Chưa đăng nhập)

| Chức năng | Mô tả |
|---|---|
| Xem trang landing | Trang giới thiệu, banner, gói cước |
| Đăng ký tài khoản | Email + password |
| Đăng nhập | Email + password, nhận JWT |
| Xem danh sách gói | Basic, Standard, Premium |

---

## User (Đã đăng nhập)

### Auth
| Chức năng | Mô tả |
|---|---|
| Đăng xuất | Xóa token |
| Refresh token | Làm mới access token |
| Đổi mật khẩu | Nhập mật khẩu cũ + mới |
| Cập nhật hồ sơ | Tên, avatar |

### Subscription (Gói cước)
| Chức năng | Mô tả |
|---|---|
| Xem các gói | Basic / Standard / Premium |
| Mua gói | Thanh toán để kích hoạt subscription |
| Xem gói hiện tại | Tên gói, ngày hết hạn |
| Gia hạn gói | Thanh toán tiếp để gia hạn |
| Lịch sử thanh toán | Danh sách các lần đã thanh toán |

### Xem phim (yêu cầu có gói đang hoạt động)
| Chức năng | Mô tả |
|---|---|
| Trang chủ | Hero banner + các hàng phim theo thể loại |
| Duyệt phim | Lọc theo thể loại, loại (phim lẻ / phim bộ) |
| Tìm kiếm | Tìm theo tên phim |
| Xem chi tiết phim | Thông tin, trailer, danh sách tập (nếu là series) |
| Xem phim lẻ | Play video trực tiếp |
| Xem phim bộ | Chọn Season → chọn Episode → play |
| Tiếp tục xem | Resume từ thời điểm đã dừng |

### Cá nhân
| Chức năng | Mô tả |
|---|---|
| Thêm vào watchlist | Lưu phim muốn xem sau |
| Xóa khỏi watchlist | Bỏ phim khỏi danh sách |
| Xem watchlist | Danh sách phim đã lưu |
| Lịch sử xem | Các phim / tập đã xem |
| Xóa lịch sử | Xóa 1 mục hoặc toàn bộ lịch sử |

---

## Admin (Quản trị viên)

### Quản lý phim
| Chức năng | Mô tả |
|---|---|
| Xem danh sách phim | Có phân trang, tìm kiếm, lọc |
| Thêm phim | Tên, mô tả, thumbnail, loại, thể loại |
| Sửa phim | Cập nhật thông tin phim |
| Xóa phim | Xóa phim (và các season/episode liên quan) |

### Quản lý Season & Episode (phim bộ)
| Chức năng | Mô tả |
|---|---|
| Thêm Season | Thêm phần mới cho series |
| Sửa / Xóa Season | Cập nhật hoặc xóa phần |
| Thêm Episode | Thêm tập vào season, upload video |
| Sửa / Xóa Episode | Cập nhật hoặc xóa tập |

### Quản lý thể loại
| Chức năng | Mô tả |
|---|---|
| Xem danh sách thể loại | Action, Drama, Horror... |
| Thêm thể loại | Tạo thể loại mới |
| Sửa / Xóa thể loại | Cập nhật hoặc xóa |
| Gán thể loại cho phim | Một phim có thể nhiều thể loại |

### Quản lý gói cước
| Chức năng | Mô tả |
|---|---|
| Xem danh sách gói | Basic, Standard, Premium |
| Thêm / Sửa gói | Tên, giá, mô tả, giới hạn |
| Kích hoạt / Vô hiệu gói | Ẩn gói không còn bán |

### Quản lý người dùng
| Chức năng | Mô tả |
|---|---|
| Xem danh sách user | Có phân trang, tìm kiếm |
| Xem chi tiết user | Thông tin, gói đang dùng, lịch sử thanh toán |
| Khóa / Mở khóa tài khoản | Vô hiệu hóa user vi phạm |
| Phân quyền | Nâng user lên Admin |

### Thống kê
| Chức năng | Mô tả |
|---|---|
| Tổng số user | Bao nhiêu tài khoản đã đăng ký |
| Doanh thu | Theo ngày / tháng / năm |
| Phim được xem nhiều nhất | Top phim phổ biến |
| User mới | Số đăng ký theo thời gian |

---

## Thứ tự xây dựng đề xuất

```
Phase 1 — Nền tảng
  1. Auth (đăng ký, đăng nhập, JWT, refresh token)
  2. Movie API (CRUD phim, season, episode, thể loại)

Phase 2 — Frontend cơ bản
  3. Trang đăng nhập / đăng ký
  4. Trang chủ, duyệt phim, chi tiết phim
  5. Video player + tiếp tục xem

Phase 3 — Tính năng người dùng
  6. Watchlist, lịch sử xem
  7. Hồ sơ cá nhân

Phase 4 — Thanh toán
  8. Gói subscription
  9. Thanh toán, lịch sử thanh toán

Phase 5 — Admin
  10. Dashboard quản trị
  11. Thống kê
```
