# 🍽️ HỆ THỐNG ĐẶT MÓN & QUẢN LÝ NHÀ HÀNG TASTY HOUSE (QR CODE & REALTIME POS)

<div align="center">

![Tasty House POS](https://img.shields.io/badge/Project-Tasty%20House%20POS-0b1329?style=for-the-badge&logo=restaurant&logoColor=dfc9a5)
![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%205-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![NodeJS](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/Database-MySQL%208.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

**ĐỒ ÁN MÔN HỌC: CÔNG CỤ & PHƯƠNG PHÁP THIẾT KẾ - QUẢN LÝ PHẦN MỀM (CS 434 I)**  
**ĐẠI HỌC DUY TÂN — KHOA CÔNG NGHỆ PHẦN MỀM (SDA) — HK1 2026–2027**  
*Giảng viên hướng dẫn: ThS. Nguyễn Trung Thuận*

</div>

---

## 📖 1. Giới thiệu tổng quan (Overview)

**Tasty House POS** là hệ thống giải pháp phần mềm toàn diện hỗ trợ đặt món qua mã QR tại bàn và quản lý vận hành nhà hàng trực tuyến theo thời gian thực (Realtime F&B Point-of-Sale System).

Hệ thống giải quyết triệt để các bài toán thường gặp ở các nhà hàng ẩm thực vừa và nhỏ:
- **Tối ưu trải nghiệm thực khách**: Quét mã QR tại bàn gọi món không cần cài app; đặt bàn trước trực tuyến trên website; gọi thêm món nhiều đợt và theo dõi tiến độ nấu nướng trực tiếp trên di động.
- **Vận hành thời gian thực giữa Bếp & Thu ngân**: Bếp (KDS) tiếp nhận đơn trong < 2 giây qua Socket.io kèm chuông âm thanh; chuyển trạng thái nấu 4 bước và gạt tồn kho tức thì.
- **Thu ngân chuyên nghiệp & Quản lý tài chính chuẩn xác**: Hỗ trợ gộp bàn, tách bill theo món, áp dụng mã voucher khuyến mãi thực tế (`TASTY10`, `WELCOME20`, `VIP50K`), tính thuế VAT và xuất hóa đơn PDF sắc nét.
- **Báo cáo kinh doanh đa chiều**: Trực quan hóa doanh thu theo ngày/tháng/năm và top món bán chạy bằng thư viện biểu đồ Recharts.

---

## 🌟 2. Các phân hệ chức năng chính (Core Modules)

### 📱 2.1. Phân hệ Khách hàng (Customer Mobile & Web)
- **Đặt bàn trước trực tuyến (`/`)**: Khách đặt giữ chỗ online trên trang chủ (Họ tên, SĐT, số khách, giờ đến, ghi chú). Dữ liệu lưu vào CSDL và đồng bộ đến Thu ngân/Lễ tân.
- **Xem thực đơn qua mã QR (`/order?token=TBxx`)**: Quét mã định danh riêng cho từng bàn; tự động tải thực đơn theo danh mục kèm hình ảnh và giá bán.
- **Giỏ hàng & Đặt món nhiều đợt**: Drawer trượt mượt mà; hỗ trợ tăng/giảm số lượng, ghi chú riêng từng món (ít cay, không đá...) và ghi chú chung.
- **Theo dõi tiến độ chế biến realtime**: Theo dõi món qua 4 trạng thái: *Chờ chế biến → Đang nấu → Nấu xong → Đã lên món*.
- **Gọi phục vụ tại bàn**: Gửi yêu cầu nhanh (Thêm đá, chén đũa, gọi tính tiền) trực tiếp đến quầy Thu ngân.

### 🍳 2.2. Màn hình Nhà bếp (Kitchen Display System - KDS) (`/bep` hoặc `/kds`)
- **Tiếp nhận đơn tức thời**: Hiển thị đơn mới trong < 2s kèm âm thanh cảnh báo sinh động.
- **Quy trình 3 cột tiến độ**: Đơn mới (`PENDING`) ➔ Đang chế biến (`COOKING`) ➔ Đã hoàn thành (`READY` / `SERVED`).
- **Thao tác 1 chạm**: Nút chuyển trạng thái cho từng món hoặc nút "Bắt đầu tất cả" cho toàn phiếu.
- **Quản lý tồn kho trong ca**: Tab "Tình trạng món" cho phép đầu bếp gạt nhanh trạng thái Còn hàng / Tạm hết món (`isAvailable`), lập tức làm mờ món trên menu khách.

### 💰 2.3. Quầy Thu ngân (Cashier Dashboard) (`/thu-ngan` hoặc `/cashier`)
- **Sơ đồ bàn trực quan theo màu**: Trống (Xanh lá), Có khách (Xanh dương), Chờ thanh toán (Cam), Đã đặt (Tím).
- **Xác nhận đơn đầu**: Tiếp nhận và phê duyệt đơn đầu tiên của bàn để chống đặt khống từ xa.
- **Gộp bàn (Merge Tables)**: Chuyển toàn bộ đơn từ bàn nguồn sang bàn đích bằng transaction, tự động cập nhật số bàn trên KDS Bếp.
- **Tách bill (Split Bill)**: Tách các món đã nấu xong sang hóa đơn riêng để khách trả riêng. Bàn vẫn giữ trạng thái Có khách cho đến khi toàn bộ các bill được thanh toán.
- **Áp dụng Mã Khuyến Mãi (Voucher)**: Nhập mã voucher thực tế từ CSDL, tự động kiểm tra điều kiện đơn tối thiểu và giới hạn giảm giá tối đa.
- **Thanh toán & Xuất hóa đơn PDF**: Hỗ trợ Tiền mặt, Chuyển khoản, VietQR; xuất file hóa đơn chuẩn nhà hàng qua `jspdf` & `html2canvas`.

### 📊 2.4. Phân hệ Quản trị (Admin Portal) (`/admin`)
- **Báo cáo & Thống kê (`/admin/dashboard`)**: Biểu đồ doanh thu Recharts theo ngày/tháng/năm, thẻ KPI tài chính và Top 5 món bán chạy nhất.
- **Quản lý Thực đơn & Danh mục (`/admin/menu`)**: CRUD danh mục, món ăn, giá tiền, ảnh minh họa và cờ kinh doanh `isSelling`.
- **Quản lý Bàn & Sinh mã QR (`/admin/tables`)**: Khởi tạo bàn, tự động sinh mã QR nanoid, tải ảnh mã QR dạng PNG sắc nét để in dán tại bàn.
- **Quản lý Đặt bàn (`/admin/dat-ban`)**: Tiếp nhận danh sách khách đặt bàn, duyệt, gán bàn và check-in.
- **Quản lý Khuyến mãi (`/admin/khuyen-mai`)**: Thiết lập các chương trình voucher chiết khấu theo % hoặc số tiền cố định.
- **Quản lý Nhân sự (`/admin/users`)**: Phân quyền nhân viên (Admin, Cashier, Kitchen, Waiter), khóa/mở khóa tài khoản.

---

## 🛠️ 3. Ngăn xếp công nghệ (Technology Stack)

| Tầng kiến trúc | Công nghệ sử dụng | Mục đích triển khai |
|---|---|---|
| **Frontend Framework** | **React 18** (Vite 5) | Xây dựng Single Page Application (SPA) tốc độ cao, giao diện Mobile-first. |
| **Styling & Icons** | **Tailwind CSS v3** & **Lucide React** | Hệ thống UI hiện đại, chuẩn Responsive trên Mobile, Tablet và Desktop. |
| **Realtime Client** | **Socket.io-client** | Nhận và phát sự kiện đơn hàng, gọi phục vụ, đổi trạng thái món tức thời. |
| **Biểu đồ & Xuất PDF** | **Recharts**, **jsPDF**, **html2canvas** | Vẽ biểu đồ trực quan hóa dữ liệu và xuất phiếu in hóa đơn chuẩn PDF. |
| **Backend Runtime** | **Node.js** & **Express** | Xây dựng hệ thống RESTful API chuẩn mực và WebSocket Gateway. |
| **Database & ORM** | **MySQL 8.0** & **Prisma ORM** | Hệ CSDL quan hệ tin cậy; thao tác dữ liệu an toàn qua `$transaction`. |
| **Bảo mật & Mã hóa** | **JWT (JSON Web Token)** & **bcryptjs** | Xác thực người dùng, bảo vệ API, mã hóa mật khẩu một chiều an toàn. |
| **Mã định danh QR** | **nanoid** & **qrcode.react** | Sinh token bàn ngẫu nhiên, bảo mật chống đoán mò ID bàn. |

---

## 🗄️ 4. Cơ sở dữ liệu (MySQL — 12 Bảng CSDL)

```
users ───────────┐
                 ├── orders ────────── order_details ────────── menu_items ──── categories
tables ──────────┘   │
  │                  ├── invoices
  │
  ├── reservations
  ├── support_requests
  ├── promotions
  ├── settings
  └── audit_logs
```

1. **`users`**: Quản lý tài khoản Admin, Thu ngân, Đầu bếp, Phục vụ kèm cờ kích hoạt `isActive`.
2. **`tables`**: Quản lý số bàn, khu vực, sức chứa, token QR bảo mật và trạng thái (`AVAILABLE`, `OCCUPIED`, `WAITING_PAYMENT`).
3. **`categories`**: Phân loại danh mục thực đơn (Khai vị, Món chính, Đồ uống, Tráng miệng...).
4. **`menu_items`**: Món ăn với giá bán, ảnh, cờ `isSelling` (Admin quản lý bán) và `isAvailable` (Bếp quản lý tồn kho).
5. **`orders`**: Quản lý đơn gọi món theo bàn và vòng đời (`PENDING`, `CONFIRMED`, `COOKING`, `READY`, `SERVED`, `COMPLETED`, `CANCELLED`).
6. **`order_details`**: Chi tiết từng món trong đơn, đơn giá, ghi chú và tiến độ chế biến 4 bước.
7. **`invoices`**: Hóa đơn thanh toán, tiền chiết khấu voucher, thuế VAT, phương thức thanh toán và thời gian thu tiền.
8. **`promotions`**: Mã khuyến mãi (`code`, `type`, `value`, `minOrder`, `maxDiscount`, `usageLimit`, `usedCount`, `active`).
9. **`reservations`**: Phiếu đặt bàn trước của khách (`customerName`, `customerPhone`, `partySize`, `reservationTime`, `status`).
10. **`support_requests`**: Danh sách yêu cầu phục vụ tại bàn từ khách hàng gửi về thu ngân.
11. **`settings`**: Bảng cấu hình tham số hệ thống (`vat_rate`, `discount_limit`).
12. **`audit_logs`**: Nhật ký lưu vết toàn bộ các hành động nhạy cảm trong hệ thống.

---

## 🚀 5. Hướng dẫn cài đặt & Khởi chạy (Quick Start)

### 5.1. Yêu cầu môi trường
- Cài đặt **Node.js** (v18.x trở lên)
- Cài đặt **MySQL Server** (Cổng mặc định `3306`)

### 5.2. Cấu hình môi trường (`backend/.env`)
```env
PORT=5050
DATABASE_URL="mysql://root:subin2004@localhost:3306/qr_restaurant_db"
JWT_SECRET="tasty_house_super_secret_jwt_key_2026"
CLIENT_URL="http://localhost:5173"
```

### 5.3. Khởi chạy dự án
```bash
# 1. Cài đặt toàn bộ thư viện cần thiết
npm install
npm run install:all

# 2. Khởi chạy toàn bộ hệ thống (Backend + Frontend)
npm run dev

# Hoặc khởi chạy riêng biệt:
npm run dev:backend   # Backend chạy tại http://localhost:5050
npm run dev:frontend  # Frontend chạy tại http://localhost:5173
```
> **Mẹo trên Windows**: Bạn có thể click đúp chuột vào file **`start.bat`** tại thư mục gốc để tự động khởi động toàn bộ hệ thống!

---

## 🔑 6. Tài khoản kiểm thử mặc định (Mật khẩu: `123456`)

| Vai trò | Tên đăng nhập | Mật khẩu | Quyền hạn & Chức năng truy cập |
|---|---|---|---|
| **Quản trị viên (Admin)** | `admin` | `123456` | Toàn quyền: Thống kê doanh thu, Quản lý món, Bàn/QR, Nhân viên, Đặt bàn, Khuyến mãi. |
| **Thu ngân (Cashier)** | `cashier` | `123456` | Sơ đồ bàn, xác nhận đơn, gộp bàn, tách bill, áp voucher, in bill PDF, quản lý đặt bàn. |
| **Đầu bếp (Kitchen)** | `kitchen` | `123456` | Màn hình KDS 3 cột, cập nhật tiến độ nấu 4 bước, bật/tắt tồn kho món trong ca. |
| **Phục vụ (Waiter)** | `waiter` | `123456` | Hỗ trợ xem sơ đồ bàn và tiếp nhận yêu cầu từ khách. |

### 🎟️ Mã Khuyến Mãi (Voucher) có sẵn trong CSDL
- **`TASTY10`**: Giảm 10% tổng hóa đơn (Tối đa 50.000đ, Đơn tối thiểu 100.000đ).
- **`WELCOME20`**: Giảm 20% cho khách hàng mới (Tối đa 100.000đ, Đơn tối thiểu 200.000đ).
- **`VIP50K`**: Giảm trực tiếp 50.000đ vào hóa đơn (Đơn tối thiểu 300.000đ).
- **`COMBOFAMILY`**: Giảm 15% cho bàn đi theo nhóm/gia đình (Tối đa 150.000đ, Đơn tối thiểu 400.000đ).

---

## 📁 7. Cấu trúc thư mục dự án (Project Structure)

```
tasty-house/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Định nghĩa 12 mô hình CSDL MySQL
│   ├── src/
│   │   ├── config/               # Cấu hình Prisma, JWT, Socket.io
│   │   ├── middlewares/          # JWT Auth, Phân quyền RBAC, Error Handling
│   │   ├── modules/              # Các Module nghiệp vụ phân lớp:
│   │   │   ├── auth/             # Đăng nhập, xác thực nhân viên
│   │   │   ├── categories/       # Quản lý danh mục món
│   │   │   ├── menu/             # Quản lý thực đơn & tồn kho
│   │   │   ├── orders/           # Đặt món, cập nhật tiến độ KDS
│   │   │   ├── invoices/         # Gộp bàn, tách bill, áp voucher, xuất bill
│   │   │   ├── tables/           # Quản lý bàn & sinh token QR
│   │   │   ├── reservations/     # Nghiệp vụ đặt bàn trước
│   │   │   ├── promotions/       # Nghiệp vụ voucher khuyến mãi
│   │   │   └── users/            # Quản lý tài khoản nhân sự
│   │   ├── server.js             # Entrypoint khởi tạo Express & Socket.io Server
│   │   └── sockets/              # Socket Gateway xử lý thông báo thời gian thực
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, Modals (Đặt bàn, Tách bill, Áp mã...)
│   │   ├── context/              # SocketContext, AuthContext quản lý state toàn cục
│   │   ├── pages/                # Màn hình SPA:
│   │   │   ├── HomePage.jsx      # Trang chủ + Modal đặt bàn trước
│   │   │   ├── LoginPage.jsx     # Đăng nhập phân quyền
│   │   │   ├── TableOrderPage.jsx# Gọi món tại bàn Mobile-first
│   │   │   ├── KdsPage.jsx       # Bếp KDS Realtime 3 cột & Tồn kho
│   │   │   ├── CashierDashboard.jsx # Thu ngân: Sơ đồ bàn, Tách bill, Áp voucher
│   │   │   ├── ReservationManagement.jsx # Quản lý phiếu đặt bàn
│   │   │   ├── PromotionManagement.jsx   # Quản trị mã khuyến mãi
│   │   │   ├── Dashboard.jsx     # Báo cáo doanh thu & Top món Recharts
│   │   │   ├── MenuManagement.jsx# Quản trị thực đơn món ăn
│   │   │   ├── TableManagement.jsx# Quản trị bàn & Tải ảnh QR PNG
│   │   │   └── UserManagement.jsx# Quản trị tài khoản nhân viên
│   │   └── services/             # Axios API client & WebSocket listeners
│   └── package.json
├── doc.md                        # Tài liệu phân tích & đặc tả chi tiết 22 User Stories
├── README.md                     # Tài liệu hướng dẫn cài đặt & tổng quan dự án
└── start.bat                     # Tệp batch khởi chạy nhanh trên Windows
```

---

<div align="center">
<b>© 2026 Tasty House POS Team — Trường Công nghệ Thông tin & Trí tuệ Nhân tạo (SDA), Đại học Duy Tân</b>
</div>
#   C S 4 3 4 I _ N H O M 7 _ D E T A I 2  
 