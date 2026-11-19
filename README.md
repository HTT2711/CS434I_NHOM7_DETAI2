# 🍽️ ĐỀ TÀI 2: HỆ THỐNG ĐẶT MÓN & QUẢN LÝ NHÀ HÀNG TASTY HOUSE (QR CODE)

**ĐẠI HỌC DUY TÂN — KHOA CÔNG NGHỆ PHẦN MỀM — TRƯỜNG TRÍ TUỆ NHÂN TẠO & THÔNG TIN (SDA)**  
**Môn học & Lớp:** CS 434 - Công cụ & Phương pháp Thiết kế - Quản lý Phần mềm (Lớp CS 434 I, HK1 2026–2027)  
**Giảng viên hướng dẫn:** ThS. Nguyễn Trung Thuận  
**Phụ trách biên soạn:** Huỳnh Thế Tần (Product Owner — Vision & Backlog) • Thương (Business Analyst — NFR & Đặc tả Use Case)  
**Quy trình áp dụng:** Scrum — 2 Sprint phát triển (Tổng 16 User Stories | 76 Story Points)  
**Nền tảng công nghệ:** ReactJS, TailwindCSS, Recharts, qrcode.react, jspdf, html2canvas, socket.io-client | Node.js, Express, Prisma ORM, Socket.io, JWT | MySQL (7 bảng)

---

## 🎯 1. Tầm nhìn sản phẩm (Product Vision)
Tasty House là hệ thống đặt món bằng mã QR và quản lý vận hành nhà hàng trực tuyến theo thời gian thực dành cho các nhà hàng quy mô vừa và nhỏ:
- **Thực khách**: Quét mã QR tại bàn (`/order?tableId=X`) để xem thực đơn, lọc món, ghi chú và đặt món trực tiếp trên trình duyệt điện thoại mà không cần cài app hay đăng nhập.
- **Màn hình Bếp (KDS)**: Nhận đơn tức thời (< 2 giây qua Socket.io) kèm âm thanh thông báo; cập nhật tiến độ chế biến từng món (*Chờ chế biến → Đang nấu → Hoàn thành*) và bật/tắt tình trạng tồn kho trong ngày (*Còn hàng / Tạm hết món*).
- **Thu ngân (Cashier)**: Theo dõi sơ đồ bàn realtime (*Trống, Có khách, Chờ thanh toán*), thực hiện gộp bàn, tách bill và thanh toán xuất hóa đơn PDF.
- **Quản trị viên (Admin)**: Quản lý nhân viên, danh mục, thực đơn (*Đang bán / Ngừng bán*), sơ đồ bàn, tự động sinh và tải mã QR định dạng PNG, xem biểu đồ doanh thu và món bán chạy.

---

## 📋 2. Product Backlog (16 User Stories & 76 Story Points)

### 2.1. Sprint 1 — Nền tảng MVP (8 User Stories | 34 SP)
| ID | Vai trò | User Story | Tiêu chí nghiệm thu (Acceptance Criteria) | SP |
|---|---|---|---|---|
| **US01** | Nhân viên | Đăng nhập hệ thống | Xác thực bằng Username & mật khẩu bcrypt, cấp JWT. Sai thông tin báo lỗi rõ ràng. Tự động điều hướng theo vai trò (Admin, Cashier, Kitchen, Waiter). | 5 |
| **US02** | Admin | Quản lý tài khoản nhân viên | Xem danh sách nhân viên kèm vai trò và trạng thái. Thêm tài khoản mới kiểm tra trùng username. Khóa tài khoản (`isActive = false`) chặn đăng nhập. | 3 |
| **US03** | Admin | Quản lý danh mục món ăn | CRUD đầy đủ danh mục (Khai vị, Món chính, Tráng miệng, Đồ uống...). Cảnh báo / chặn xóa danh mục đang chứa món. | 3 |
| **US04** | Admin | Quản lý thực đơn & trạng thái kinh doanh | Thêm, sửa, xóa món ăn. Bật/tắt trạng thái kinh doanh (Đang bán / Ngừng bán); món "Ngừng bán" tự động ẩn khỏi giao diện khách. | 5 |
| **US05** | Admin | Quản lý sơ đồ bàn | Tạo bàn mới với tên/số bàn duy nhất và sức chứa. Hiển thị trạng thái bàn (Trống, Có khách, Chờ thanh toán) trực quan theo màu sắc. | 3 |
| **US06** | Admin | Tự động sinh mã QR cho từng bàn | Mỗi bàn tự động tạo 1 mã QR trỏ tới URL bàn (VD: `/order?tableId=5`). Cho phép tải ảnh mã QR định dạng PNG rõ nét. | 3 |
| **US07** | Khách hàng | Quét mã QR xem menu trên điện thoại | Mở URL từ QR hiển thị số bàn, không cần đăng nhập. Giao diện Mobile-first; chỉ hiển thị món Đang bán; món Bếp đánh dấu "Tạm hết món" bị làm mờ và khóa nút chọn. | 5 |
| **US08** | Khách hàng | Thêm giỏ hàng, ghi chú và đặt món | Tăng/giảm số lượng, xóa món, tự động tính tiền. Cho phép nhập ghi chú riêng cho từng món. Gửi đơn đặt món lưu vào Orders & OrderDetails. | 7 |

### 2.2. Sprint 2 — Nghiệp vụ Realtime, Thu ngân & Báo cáo (8 User Stories | 42 SP)
| ID | Vai trò | User Story | Tiêu chí nghiệm thu (Acceptance Criteria) | SP |
|---|---|---|---|---|
| **US09** | Bếp | Tiếp nhận đơn tức thời trên KDS | Đẩy đơn mới lên KDS qua Socket.io (< 2s) không tải lại trang. Hiển thị số bàn, thời gian đặt, danh sách món, số lượng, ghi chú. Có âm thanh/hiệu ứng thông báo. | 8 |
| **US10** | Bếp | Cập nhật tiến độ chế biến món | Thao tác 1 chạm chuyển trạng thái: *Chờ chế biến → Đang nấu → Hoàn thành*. Lưu CSDL và đồng bộ realtime về Khách hàng và Thu ngân. | 5 |
| **US11** | Bếp | Cập nhật nhanh tồn kho (Còn hàng / Tạm hết món) | Bếp gạt nhanh trạng thái Còn hàng / Tạm hết món. Lưu ngay vào MenuItems và đồng bộ realtime qua Socket.io lên menu khách. | 3 |
| **US12** | Thu ngân | Theo dõi sơ đồ bàn realtime & xem chi tiết đơn | Bàn tự đổi Trống → Có khách khi có đơn. Bấm vào bàn hiển thị chi tiết các món đã gọi, trạng thái chế biến và tổng tiền tạm tính. | 5 |
| **US13** | Thu ngân | Gộp nhiều bàn thành một hóa đơn | Chọn bàn nguồn và bàn đích (đều đang Có khách). Toàn bộ OrderDetails gom về bàn đích, giải phóng bàn nguồn về Trống bằng Prisma $transaction. | 5 |
| **US14** | Thu ngân | Tách một số món sang bill khác (Tách bill) | Chọn món và số lượng cần tách. Tạo đơn mới chứa món đã tách, đơn gốc trừ số lượng và tính lại tiền bằng Prisma $transaction. | 5 |
| **US15** | Thu ngân | Xác nhận thanh toán & Xuất hóa đơn PDF | Chọn phương thức thanh toán (Tiền mặt / Chuyển khoản / QR Pay), lưu Invoices. Xuất file PDF (jspdf + html2canvas) đầy đủ thông tin. Bàn đặt lại Trống. | 5 |
| **US16** | Admin | Thống kê doanh thu & Top món bán chạy | Lọc theo ngày/tháng. Hiển thị thẻ tổng quan, vẽ biểu đồ đường/cột doanh thu và bảng Top món bán chạy bằng thư viện Recharts. | 6 |

---

## 🏗️ 3. Cơ sở dữ liệu (MySQL — 7 bảng)
1. **`users`**: Quản lý tài khoản Admin, Thu ngân, Bếp, Phục vụ kèm cờ kích hoạt `isActive`.
2. **`tables`**: Quản lý số bàn, sức chứa, token định danh QR và trạng thái bàn (`AVAILABLE`, `OCCUPIED`, `WAITING_PAYMENT`, `RESERVED`).
3. **`categories`**: Danh mục phân loại món ăn (Khai vị, Món chính, Tráng miệng, Đồ uống...).
4. **`menu_items`**: Món ăn với giá bán, hình ảnh, cờ `isSelling` (Admin quản lý kinh doanh) và `isAvailable` (Bếp quản lý tồn kho trong ngày).
5. **`orders`**: Quản lý đơn gọi món theo bàn và trạng thái (`PENDING`, `CONFIRMED`, `COOKING`, `READY`, `SERVED`, `COMPLETED`, `CANCELLED`).
6. **`order_details`**: Chi tiết từng món trong đơn, số lượng, đơn giá, ghi chú và tiến độ chế biến.
7. **`invoices`**: Hóa đơn thanh toán, tiền chiết khấu, phương thức thanh toán và thời gian thu tiền.

---

## 🚀 4. Hướng dẫn cài đặt & Khởi chạy

### 4.1. Khởi chạy nhanh từ thư mục gốc
```bash
# 1. Khởi chạy Backend Server (Port 5000)
npm run dev:backend

# 2. Khởi chạy Frontend SPA (Port 5173)
npm run dev:frontend

# 3. Chạy toàn bộ 13 bài kiểm thử Jest Backend
npm run test:backend

# 4. Kiểm tra biên dịch Frontend Production
npm run build:frontend
```

### 4.2. Tài khoản thử nghiệm mặc định (Mật khẩu: `123456`)
- **Quản trị viên**: `admin` / `123456`
- **Thu ngân**: `cashier` / `123456`
- **Đầu bếp**: `kitchen` / `123456`
- **Phục vụ**: `waiter` / `123456`
