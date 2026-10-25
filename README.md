# 🌿 Cozy Aquarium — A Little World That Lives With You

> **Author / Tác giả**: [trinhtienminh2018-tech](https://github.com/trinhtienminh2018-tech)  
> **Version / Phiên bản**: `2.0.0-alpha.8.9.13` (*Multilingual i18n & Audio Stability Patch*)  
> **A cozy, breathing little world that lives with you** — An ambient virtual living space featuring a lifelike aquarium, lazy cat Miu, realtime day/night cycle, dynamic weather, and calming soundscapes. Ready as a **Live Desktop Wallpaper (Lively Wallpaper)**!  
> **Một góc bình yên ấm cúng sống cùng nhịp thở của bạn** — Mô phỏng căn phòng thư giãn với bể cá thủy sinh sống động, chú mèo Miu lười biếng, chu kỳ thời gian thực, thời tiết biến đổi và âm thanh thiên nhiên êm dịu.

---

![Cozy Aquarium Preview](bg.jpg)

---

## 🌐 Bản địa hóa & Đa ngôn ngữ (Bilingual i18n Support)

* **Tiếng Việt & English**: Tích hợp bộ chuyển đổi ngôn ngữ mượt mà ngay trong bảng **Cài đặt (Settings)** và menu tùy biến **Lively Wallpaper**.
* **Bản địa hóa toàn diện**: Dịch toàn bộ giao diện, tên các loài cá/sinh vật đáy, tooltip, thông báo trạng thái, đồng hồ và hộp thoại.
* **Tự động lưu & Phản ứng tức thì**: Tự ghi nhớ ngôn ngữ ưu tiên (`aquarium2.language`) và áp dụng tự động cho các phần tử sinh ra động bằng `MutationObserver`.

---

## ✨ Điểm nổi bật & Tính năng chính (Key Features)

### 🐠 1. Hệ sinh thái bể cá sống động (Living Aquarium Ecosystem)
* **5 loài cá bơi theo đàn**: Neon Tetra, Guppy, Betta, Angelfish... với thuật toán boids mô phỏng chuyển động uốn lượn tự nhiên theo trục xương sống (*spine-driven swimming*).
* **Sinh vật tầng đáy độc lập**: Cua bò ngang, tôm búng lùi, ốc từ tốn bò trên cát và biết tìm chỗ ẩn nấp quanh các rạn san hô.
* **Tương tác thả mồi**: Nhấp chuột vào mặt nước để rắc thức ăn — cá sẽ bơi đến tranh mồi.
* **Vật lý dòng chảy tuần hoàn**: Dòng nước tuần hoàn cuốn hạt thức ăn, bọt khí và bụi nước trôi theo quy luật thủy lưu chân thực.
* **Cây thủy sinh & San hô tách lớp**: Chuyển động đung đưa nhịp nhàng theo dòng nước, có slider tùy chỉnh độ mạnh chuyển động.
* **Hiệu ứng khúc xạ nước**: Ánh sáng khúc xạ đáy bể (*caustics*), các nguồn sục khí oxy tinh tế và các hạt bụi nước phát sáng lơ lửng.

### ☀️🌙 2. Chu kỳ thời gian thực & Ánh sáng động (Realtime Day/Night Cycle)
* **Đồng bộ thời gian thực**: Tự động chuyển đổi mượt mà giữa Sáng sớm, Ban ngày, Hoàng hôn và Buổi tối theo đồng hồ máy tính (hoặc chọn thủ công theo ý thích).
* **Ánh sáng tự nhiên qua cửa sổ**: Ánh nắng ban ngày, sắc cam ấm áp lúc chiều tà và ánh trăng xanh dịu đêm muộn xuyên qua khung cửa sổ đổ bóng vào phòng.
* **Đèn bàn học & Đèn LED bể cá**: Bật/tắt công tắc hoặc nhấp trực tiếp vào chiếc đèn/thanh LED; tùy chỉnh độ sáng mượt mà.
* **Chuyển cảnh nguyên tử (Atomic Scene Transition)**: Tự động nạp trước (*preload*) toàn bộ ảnh nền và ánh sáng trước khi chuyển đổi, triệt tiêu hoàn toàn hiện tượng chớp nháy trắng (*white flash/pop-in*).

### 🌧️⚡ 3. Hệ thống thời tiết & Tương tác cửa sổ (Dynamic Weather)
* **3 chế độ thời tiết**: Quang đãng, Có gió và Mưa giông.
* **Mưa giông chân thực**: 
  * Giọt nước mưa đọng và chảy dài trên mặt kính cửa sổ.
  * Gió thổi làm lay động cành lá bên ngoài.
  * Chớp giật lóe sáng toàn bộ căn phòng kèm tiếng sấm rền xa xa ngẫu nhiên.
* **Đóng / Mở cửa sổ**: 
  * Nhấp vào cửa sổ để mở hoặc đóng với âm thanh then gỗ tự nhiên.
  * Khi mở cửa, tiếng gió và mưa ngoài trời sẽ tràn vào phòng rõ rệt hơn.

### 🐱 4. Chú mèo Miu ấm áp (Interactive Miu Life)
* Miu lười biếng nằm ngủ trên bàn cạnh bể cá, có nhịp sinh học tự nhiên theo thời gian trong ngày.
* Tự động cựa mình, đổi tư thế ngủ, vươn vai (*stretch*) và vẫy đuôi.
* **Tương tác vuốt ve**: Nhấp chuột vào Miu để vuốt ve, chú mèo sẽ cất tiếng ngáy gừ gừ (*purr*) nũng nịu.

### 🎵 5. Dàn âm thanh Ambient đa kênh thư giãn (Cozy Soundscape)
* Trộn âm thanh nhiều tầng: tiếng lọc nước sủi bọt, chim hót ríu rít, gió thổi, mưa rơi ngoài hiên, tiếng sấm đì đùng xa xăm.
* Nhạc nền tuyển chọn: Các bản lofi êm dịu (thay đổi theo sáng/chiều/tối) và giai điệu piano thư thái.
* **Độ ổn định âm thanh chuyên sâu**:
  * Chống gọi trùng lặp `play()` khi track đang nạp (pending).
  * Bắt lỗi `AbortError` êm ái khi người dùng bật/tắt nhanh, không spam thông báo lỗi kỹ thuật.
  * Xử lý tối ưu chính sách tự động phát nhạc (*Autoplay policy*) của trình duyệt.

### 🖥️ 6. Sẵn sàng làm Hình nền động Desktop (Live Wallpaper Ready)
* Tích hợp sẵn định dạng của **[Lively Wallpaper](https://rocksdanister.github.io/lively/)** (`LivelyInfo.json`, `LivelyProperties.json`).
* Menu tùy biến trực tiếp trên Desktop: chỉnh Zoom/Full, mức FPS, số lượng cá, bật/tắt âm thanh, chọn ngôn ngữ (Tiếng Việt / English).
* **Chế độ thư giãn (Ambient Mode)**: Tự động ẩn thanh điều khiển sau khi khởi động, thanh công cụ sẽ trượt lên mượt mà khi rê chuột xuống mép dưới màn hình.
* Tương tác nhấp chuột ngay trên Desktop (cho cá ăn, vuốt mèo).

### ⚡ 7. Tối ưu hóa hiệu năng (Adaptive Render Budget)
* Nhiều mức chất lượng hiển thị: **Tự động**, **Mượt (60 FPS)**, **Cân bằng (30 FPS)**, **Tiết kiệm (20 FPS)**.
* Tự động nhận diện khi chuyển tab hoặc cửa sổ bị che khuất để tạm dừng/giảm tải render, bảo vệ pin laptop và giảm tối đa mức chiếm dụng CPU/GPU.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Frontend**: Pure Vanilla JavaScript (ES Modules), HTML5 Canvas, CSS3 Custom Properties (Biến HSL, Glassmorphism, Vignette).
* **Đồ họa**: 2.5D Layered Illustration (Độ phân giải chuẩn 1536×1024, tự co giãn theo tỷ lệ màn hình).
* **Đa ngôn ngữ**: Hệ thống dịch thuật nội bộ gọn nhẹ (`i18n.js`) phối hợp cùng `MutationObserver`.
* **Audio**: Web Audio API & HTMLAudioElement đa luồng.
* **Backend Dev**: Node.js HTTP Server siêu nhẹ (hỗ trợ streaming, tự động nhận diện MIME type).
* **Testing**: Node.js Native Test Runner (`node:test`) kiểm thử hồi quy DOM, Audio, i18n và Scene Transition.

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án (Installation & Setup)

### Yêu cầu hệ thống
* **Node.js**: Phiên bản 18 trở lên.

### 1. Chạy trên trình duyệt Web (Dev / Local)
```bash
# Clone repository
git clone https://github.com/trinhtienminh2018-tech/Little_Aquarium_Alpha_08.9.10_Audio_Stability.git
cd Little_Aquarium_Alpha_08.9.10_Audio_Stability

# Khởi động máy chủ dev cục bộ
npm run dev
```
Mở trình duyệt và truy cập: **`http://localhost:3000`**

### 2. Kiểm thử tự động (Test Suite)
```bash
npm test
```
*Chạy 9 kịch bản kiểm thử tĩnh và kiểm thử hồi quy đa ngôn ngữ/âm thanh/chuyển cảnh.*

### 3. Đóng gói phân phối (Build)
```bash
npm run build
```
*Toàn bộ tài nguyên hoàn chỉnh sẽ được đồng bộ và tạo ra trong thư mục `dist/`.*

---

## 🖼️ Hướng dẫn cài làm Hình nền Desktop (Lively Wallpaper)

1. Tải và cài đặt **Lively Wallpaper** (miễn phí trên [Microsoft Store](https://apps.microsoft.com/detail/9ntm2qc6qws7) hoặc [GitHub](https://github.com/rocksdanister/lively)).
2. Sử dụng tệp đóng gói sẵn **`Cozy_Aquarium_Wallpaper.zip`** có trong thư mục gốc của repository:
   * Mở Lively Wallpaper, kéo và thả trực tiếp tệp `Cozy_Aquarium_Wallpaper.zip` vào cửa sổ ứng dụng.
   * *(Hoặc nhấn **Add Wallpaper (+)** ➔ **Browse** ➔ Trỏ tới tệp `dist/index.html`).*
3. Nhấn **OK** để áp dụng. Nhấp chuột phải vào hình nền trong Lively để tùy biến ngôn ngữ, thời tiết, FPS, số cá và âm thanh!

---

## 🎮 Thao tác điều khiển nhanh (Controls & Shortcuts)

| Thao tác / Action | Tác dụng / Effect |
| :--- | :--- |
| **Nhấp vào nước / Click on water** | Rắc thức ăn cho cá / Feed the fish |
| **Nhấp vào Miu / Click on Miu** | Vuốt ve mèo (kèm tiếng ngáy gừ gừ) / Pet cat (purr) |
| **Nhấp vào cửa sổ / Click on window** | Mở hoặc đóng cửa sổ ngoài trời / Toggle window |
| **Nhấp đèn bàn / LED / Click lamps** | Bật hoặc tắt nhanh hệ thống chiếu sáng / Toggle lights |
| **Nhấp vào tranh / Click wall photo** | Mở xem ảnh kỷ niệm Hồ Gươm / View framed photo |
| **Phím Esc / Esc key** | Đóng Cài đặt / Bật tắt chế độ Thư giãn (Ambient) |

---

## 📄 Giấy phép (License)

Dự án phát hành dưới giấy phép mã nguồn mở [MIT License](LICENSE).  
Copyright (c) 2026 [trinhtienminh2018-tech](https://github.com/trinhtienminh2018-tech).
Mọi đóng góp, ý tưởng mở rộng và phản hồi luôn được chào đón nồng nhiệt! 🌸
