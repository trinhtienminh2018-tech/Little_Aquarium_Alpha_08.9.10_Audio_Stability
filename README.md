# Little Aquarium 2.0 — Alpha 08.9.10: Stability & Consistency Patch

Phiên bản phát triển trên nền **Alpha 08.9.10** (Alpha 08.9.5 chỉ là báo cáo kiểm toán).

## Thay đổi
- Loại bỏ slider san hô trùng `coral-motion-strength`, giữ `coral-motion-control` và `coral-motion-out`; sử dụng giá trị đã lưu trong `world.coralMotion`.
- Đồng bộ thông tin phiên bản trong package, trang HTML, README.
- Bổ sung smoke/regression tests tĩnh và kiểm tra `SceneTransition` (không chỉnh sửa logic chuyển cảnh).
- Không thay đổi thời tiết, sấm sét, Miu, cá, asset, FPS.

## Chạy
- `npm run dev` → http://localhost:3000
- `npm test` → kiểm tra hồi quy có thể chạy trên Node.js
- `npm run build` → build phân phối

## Kiểm tra thủ công cần thiết
1. Kéo slider **Chuyển động san hô**; tải lại trang để xác nhận đã lưu, và chỉ có một slider san hô.
2. Tắt đồng bộ giờ thực, nhấn Sáng → Chiều → Tối → Sáng, cả từng lần và liên tục; xác nhận không chớp trắng.
3. Lặp lại khi trời giông, chuyển tab rồi quay lại; đảm bảo cảnh và ánh sáng đúng trạng thái.
4. Kiểm tra nút chỉnh cá, Miu, LED và âm thanh không bị ảnh hưởng.

Lưu ý: Kiểm tra tự động không thể thay thế kiểm thử hình ảnh trong Chrome hoặc trên Windows.
