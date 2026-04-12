

# Redesign Toàn Bộ Giao Diện - Anime Sakura Theme

## Tổng quan
Thiết kế lại toàn bộ giao diện với theme anime sakura, gradient hồng-tím-xanh ocean, glassmorphism trên nền sáng. Thêm banner anime đẹp, thông tin author ở header, loại bỏ icon AI, nút bấm nổi bật với hiệu ứng chuẩn.

## Bảng màu mới

```text
Primary gradient:  sakura pink (#F472B6) → lavender (#A78BFA)  
Secondary gradient: ocean blue (#38BDF8) → lavender (#A78BFA)  
Accents:           mint (#34D399), peach (#FBBF24)  
Background:        #FFF5F9 (hồng nhạt rất nhẹ)  
Cards:             white với glassmorphism (rgba + blur)  
Sidebar admin:     gradient tím-xanh đậm  
```

## Các file cần thay đổi

### 1. CSS Variables (`src/index.css`)
- Thay toàn bộ color scheme sang sakura/lavender/ocean
- Cập nhật sidebar colors
- Thêm gradient utilities mới cho buttons
- Đảm bảo text luôn đọc rõ ràng, không bị glassmorphism che

### 2. Auth Layout (`src/components/layout/AuthLayout.tsx`)
- Left panel: gradient sakura-lavender-ocean với anime banner từ unsplash/picsum (nhân vật anime sắc nét)
- Brand info: "EduExam" → giữ tên, đổi gradient
- Thêm author info: "Author: Tuấn và Quân" + Facebook + YouTube links

### 3. Login & Register Pages
- Buttons: gradient sakura → lavender, shadow nổi bật, hover scale effect
- Loại bỏ emoji icons (📚 ⚡ 📊) thay bằng text thuần hoặc custom styled dots

### 4. User Layout (`src/components/layout/UserLayout.tsx`)
- Header: glassmorphism background (white/95% + blur)
- Logo gradient: sakura → lavender
- Active nav: gradient sakura-lavender
- Footer: thêm "Author: Tuấn và Quân" + social links
- Avatar: gradient peach-mint

### 5. Admin Layout (`src/components/layout/AdminLayout.tsx`)
- Sidebar: gradient từ tím đậm → ocean đậm
- Active nav items: gradient sakura-lavender
- Logo: cùng style mới

### 6. Dashboard Page (`src/pages/user/DashboardPage.tsx`)
- Banner anime ở đầu trang (hình ảnh anime từ URL)
- Stat cards: glassmorphism + gradient borders (pink/mint/peach)
- Buttons: gradient sakura-lavender nổi bật
- Loại bỏ emoji 👋

### 7. Admin Dashboard (`src/pages/admin/AdminDashboardPage.tsx`)
- Stat cards: glassmorphism + gradient accents sakura/mint/peach/ocean
- Charts: đổi colors sang palette mới

### 8. Subjects Page (`src/pages/user/SubjectsPage.tsx`)
- KI_COLORS: đổi sang palette sakura/lavender/ocean/mint/peach
- Cards: glassmorphism effect

### 9. Subject Detail, Practice, Result Pages
- Cập nhật gradient buttons và accent colors
- Glassmorphism cards

### 10. Admin pages (Users, Exams, Subjects, Orders, Revenue)
- Cập nhật inline gradient styles sang palette mới

## Banner Anime
Sử dụng ảnh anime chất lượng cao từ URL miễn phí (unsplash hoặc các source anime art). Banner sẽ đặt ở:
- Auth layout left panel (full height)
- User dashboard hero section (banner nhỏ)

## Author Info
Hiển thị ở footer và auth layout:
- Author: Tuấn và Quân
- Facebook: https://www.facebook.com/tuanvaquan
- YouTube: https://www.youtube.com/@tuanvaquanfptu

## Nguyên tắc
- Text luôn rõ ràng, không bị blur/opacity che mất
- Glassmorphism chỉ áp dụng cho background card, không cho text containers
- Buttons có shadow + hover scale rõ ràng
- Loại bỏ tất cả emoji/icon có vẻ AI-generated (🚀, emoji trong features list)
- Gradient mượt, không quá sặc sỡ

## Tổng số files cần sửa: ~15 files

