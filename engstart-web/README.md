# EngStart — Web Học Tiếng Anh Cho Người Mất Gốc (A0–A1)

Dự án web tĩnh gọn nhẹ (HTML/CSS/JS thuần, không cần bước build phức tạp), sẵn sàng đưa lên **Vercel** miễn phí chỉ trong 2 phút.

## Cấu trúc thư mục

```text
engstart-web/
├── index.html               # Giao diện chính của ứng dụng
├── css/
│   └── styles.css           # Hiệu ứng & giao diện bổ sung
├── js/
│   ├── data.js              # Kho 100 từ A0-A1, 6 hội thoại 2 vai, 5 bài ngữ pháp, 16 âm IPA
│   └── app.js               # Logic SRS, Streak, Luyện nói Mic, Hội thoại & Đồng bộ Supabase
├── assets/
│   └── hero-illustration.jpg
├── supabase_schema.sql      # Lệnh tạo bảng lưu tiến độ trên Supabase
├── vercel.json              # Cấu hình deploy chuẩn cho Vercel
└── README.md
```

## Cách xuất bản miễn phí lên Vercel (2 cách)

### Cách 1: Đẩy lên GitHub rồi nối với Vercel (Khuyên dùng)
1. Giải nén thư mục `engstart-web/`.
2. Tạo một repository mới trên [GitHub](https://github.com/new) và tải toàn bộ các tệp bên trong `engstart-web/` lên đó.
3. Đăng nhập [Vercel](https://vercel.com), bấm **Add New... → Project**, chọn repository vừa tạo.
4. Giữ nguyên cấu hình mặc định (**Framework Preset: Other**) rồi bấm **Deploy**.
5. Sau ~20 giây, bạn sẽ nhận được đường link dạng `https://ten-du-an.vercel.app` để gửi cho bạn bè hoặc học viên!

### Cách 2: Deploy trực tiếp bằng Vercel CLI
```bash
npm i -g vercel
cd engstart-web
vercel --prod
```

## Mở rộng từ vựng & Kết nối Supabase
- **Thêm từ vựng/bài học:** Mở tệp `js/data.js` và thêm các dòng `W(...)` vào `TOPICS_DATA` (có thể mở rộng lên 200–500 từ dễ dàng).
- **Đồng bộ đám mây (Supabase):** Tạo dự án miễn phí tại [Supabase](https://supabase.com), dán nội dung tệp `supabase_schema.sql` vào mục **SQL Editor** và bấm **Run**. Sau đó lấy **Project URL** và **Anon Public Key** (trong *Project Settings → API*) nhập vào mục **Tài khoản** trên web.
