# EngStart — Web Học Tiếng Anh Cho Người Mất Gốc (Có Đăng Nhập Gmail & Tự Lưu Mây)

## Hướng dẫn bật Đăng nhập bằng Google (Gmail) miễn phí trong 3 phút

### Bước 1: Tạo bảng lưu tiến độ trên Supabase
1. Đăng ký/đăng nhập miễn phí tại [Supabase](https://supabase.com) → bấm **New project**.
2. Vào mục **SQL Editor** (cột trái) → **New Query** → dán toàn bộ nội dung tệp `supabase_schema.sql` → bấm **Run**.
3. Vào **Project Settings → API**, sao chép **Project URL** và **anon public key**.

### Bước 2: Bật đăng nhập Google (Gmail)
1. Trong Supabase, vào **Authentication → Providers → Google**, bật công tắc **Enable Sign in with Google** và sao chép dòng **Callback URL** (dạng `https://xxxx.supabase.co/auth/v1/callback`).
2. Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → tạo dự án mới → **OAuth consent screen** (chọn External, điền tên app `EngStart`) → **Credentials → Create Credentials → OAuth client ID → Web application**.
3. Ở mục **Authorized redirect URIs**, dán **Callback URL** của Supabase vào → bấm **Create**, rồi sao chép **Client ID** và **Client Secret** dán ngược lại vào Supabase → bấm **Save**.
4. Trong Supabase, vào **Authentication → URL Configuration**:
   - **Site URL:** dán link web Vercel của bạn (ví dụ `https://engstart-web.vercel.app`).
   - **Redirect URLs:** thêm `https://engstart-web.vercel.app/**`.

### Bước 3: Điền 2 dòng key vào `js/config.js`
1. Mở tệp `engstart-web/js/config.js`, dán `SUPABASE_URL` và `SUPABASE_ANON_KEY` vào.
2. Tải thư mục `engstart-web` bản mới lên lại GitHub — Vercel sẽ tự động cập nhật trong ~15 giây!
