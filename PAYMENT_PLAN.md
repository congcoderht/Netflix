# Kế hoạch subscription và thanh toán

## Phạm vi hiện tại

- Ba gói Basic, Standard và Premium; khác nhau ở số màn hình xem đồng thời.
- Thanh toán một lần cho 30 ngày, chưa tự động gia hạn.
- Mua lại cùng gói sẽ cộng thêm 30 ngày từ ngày hết hạn hiện tại.
- Đổi sang gói khác sẽ thay thế ngay và bắt đầu thời hạn 30 ngày mới; thời gian cũ không cộng dồn.
- Hai phương thức `MOCK_MOMO` và `MOCK_VNPAY` chỉ dùng trong development/test.
- Không làm profile phụ, phân tầng chất lượng video, tải offline, quảng cáo hoặc DRM.
- Catalog và trailer có thể xem; URL phát nội dung yêu cầu subscription còn hiệu lực.

## Luồng đã triển khai

```text
Chọn plan + phương thức
  -> POST /api/payments/checkout
  -> Backend đọc giá từ database, tạo Payment(PENDING)
  -> Backend tạo URL checkout có token HMAC ràng buộc provider/payment/order/hạn dùng
  -> Trang mock chọn thành công, thất bại hoặc hủy
  -> POST /api/payments/mock/:provider/complete
  -> Adapter tạo callback/IPN và xác minh chữ ký
     MoMo mock: HMAC-SHA256
     VNPAY mock: HMAC-SHA512
  -> Backend đối chiếu owner, provider, order, requestId, amount và hạn dùng
  -> Transaction claim Payment(PENDING), cập nhật SUCCESS và kích hoạt/gia hạn Subscription
  -> Chuyển tới /payment/result; client đọc trạng thái thật từ backend
```

Callback lặp lại không gia hạn hai lần vì chỉ lần đầu đổi được `PENDING -> SUCCESS`. Giá và thời hạn luôn lấy từ snapshot phía server, không tin dữ liệu do client gửi.

## API

- `GET /api/plans`: danh sách gói đang bán.
- `GET /api/subscriptions/me`: subscription hiện tại.
- `POST /api/payments/checkout`: nhận `planId`, `provider`, `idempotencyKey`.
- `POST /api/payments/mock/:provider/complete`: mô phỏng provider callback; yêu cầu đăng nhập và checkout token hợp lệ.
- `GET /api/payments`: lịch sử thanh toán có phân trang.
- `GET /api/payments/:id`: chi tiết giao dịch thuộc user hiện tại.
- `GET /api/payments/order/:orderId`: tra kết quả theo mã đơn.
- `POST /api/playback-sessions`: chỉ tạo khi có subscription và chưa vượt `maxScreens`.

## Quy tắc an toàn

- `PAYMENT_MODE=mock` bị từ chối khi `NODE_ENV=production`.
- Secret chỉ ở backend; không đưa chữ ký hoặc secret vào source frontend.
- Checkout token được so sánh constant-time và hết hạn cùng Payment.
- Thất bại/hủy không kích hoạt gói; `SUCCESS` không quay lại `FAILED`.
- Lịch sử người dùng chỉ hiển thị giao dịch `SUCCESS` và `FAILED`; bản ghi `PENDING` chỉ phục vụ xử lý checkout nội bộ.
- Payment và Subscription được cập nhật trong cùng database transaction.
- URL video không được trả từ catalog cho người chưa có gói.

## Việc nên làm trước khi tích hợp cổng thật

- [ ] Unit test canonical string, chữ ký của cả hai adapter và token checkout.
- [ ] Integration test callback sai chữ ký/sai amount/sai owner/hết hạn.
- [ ] Test hai callback đồng thời chỉ gia hạn một lần.
- [ ] Thêm rate limit cho checkout và callback.
- [ ] Khi có merchant credential, giữ nguyên payment state machine và thay adapter mock bằng adapter provider thật.
- [ ] Với provider thật, callback/IPN phải là server-to-server; Return URL chỉ dùng hiển thị.

## Biến môi trường local

```env
PAYMENT_MODE=mock
MOCK_PAYMENT_SECRET=replace-with-a-long-random-local-secret
MOCK_PAYMENT_URL=http://localhost:5173/mock-payment
PAYMENT_RESULT_URL=http://localhost:5173/payment/result
```
