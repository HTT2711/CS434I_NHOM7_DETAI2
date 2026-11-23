import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BrandLogo from '../../components/common/BrandLogo';
import { menuApi } from '../../services/menu.api';
import { reservationApi } from '../../services/reservation.api';
import {
  ChefHat,
  Receipt,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Phone,
  MapPin,
  Clock,
  LogIn,
  Utensils,
  ChevronRight,
  Calendar,
  X,
  Users,
  CheckCircle2,
} from 'lucide-react';

const STAFF_LINKS = [
  { to: '/thu-ngan', label: 'Thu ngân', desc: 'Sơ đồ bàn, thanh toán, in hóa đơn', icon: Receipt },
  { to: '/bep', label: 'Nhân viên bếp', desc: 'Màn hình KDS điều phối chế biến', icon: ChefHat },
  { to: '/admin', label: 'Quản trị viên', desc: 'Thống kê & báo cáo, thực đơn, nhân viên', icon: ShieldCheck },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Modal đặt bàn trước cho khách hàng
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerPhone: '',
    partySize: 2,
    reservationTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16),
    note: '',
  });

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingForm.customerName.trim() || !bookingForm.customerPhone.trim() || !bookingForm.reservationTime) {
      alert('Vui lòng điền đầy đủ họ tên, số điện thoại và thời gian đặt bàn');
      return;
    }
    setBookingLoading(true);
    try {
      await reservationApi.create({
        customerName: bookingForm.customerName.trim(),
        customerPhone: bookingForm.customerPhone.trim(),
        partySize: Number(bookingForm.partySize) || 2,
        reservationTime: bookingForm.reservationTime,
        note: bookingForm.note.trim(),
      });
      setBookingSuccess(true);
    } catch (err) {
      alert(err.message || 'Lỗi khi đặt bàn. Vui lòng thử lại!');
    } finally {
      setBookingLoading(false);
    }
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingSuccess(false);
    setBookingForm({
      customerName: '',
      customerPhone: '',
      partySize: 2,
      reservationTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16),
      note: '',
    });
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await menuApi.getItems({ isSelling: true });
        if (res.data && res.data.length > 0) {
          setFeaturedItems(res.data.slice(0, 4));
        }
      } catch (err) {
        console.error('Lỗi tải món từ database:', err);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-white text-navy-900 flex flex-col font-sans">
      {/* 1. Top Navbar (Ảnh 3) */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size="md" showTagline={true} />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBookingModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 transition shadow-sm cursor-pointer"
          >
            <Calendar size={14} />
            <span>Đặt bàn trước</span>
          </button>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-navy-900 border border-stone-300 hover:bg-stone-50 transition"
          >
            <LogIn size={14} />
            <span>Đăng nhập</span>
          </Link>
        </div>
      </header>

      {/* 2. Hero Section (Ảnh 3) */}
      <section className="relative bg-navy-900 text-white overflow-hidden">
        {/* Background dark restaurant ambiance image */}
        <div className="absolute inset-0 z-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600"
            alt="Tasty House Ambiance"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 lg:py-28 text-center flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-wider font-display uppercase text-white drop-shadow-md">
            TASTY HOUSE
          </h1>

          <p className="mt-3 text-stone-200 text-sm sm:text-base font-medium max-w-xl">
            A Taste to Remember · Gìn giữ hương vị Việt, kể bằng ngôn ngữ mới
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setShowBookingModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#dfc9a5] hover:bg-[#d4b98e] text-navy-900 font-extrabold text-sm shadow transition cursor-pointer"
            >
              <Calendar size={16} />
              <span>Đặt bàn ngay</span>
            </button>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-navy-900 font-bold text-sm shadow hover:bg-stone-100 transition"
            >
              <LogIn size={15} />
              <span>Đăng nhập nhân viên</span>
            </Link>

            <a
              href="#mon-ngon"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-white font-semibold text-sm hover:underline transition"
            >
              <span>Khám phá món ngon</span>
              <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* Featured Banner Image Overlap (Ảnh 3) */}
      <section className="max-w-5xl mx-auto px-6 -mt-8 relative z-20">
        <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-white">
          <img
            src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1200"
            alt="Cơm tấm sườn bì chả"
            className="w-full h-52 sm:h-72 object-cover"
          />
        </div>
      </section>

      {/* 3. Món ngon tuyển chọn (Ảnh 3) */}
      <section id="mon-ngon" className="max-w-5xl mx-auto px-6 py-16 w-full">
        <div className="space-y-2 mb-8">
          <h2 className="text-3xl font-extrabold text-navy-900 font-display">
            Món ngon tuyển chọn
          </h2>
          <p className="text-sm text-stone-500 font-medium">Hương vị đặc trưng</p>

          <div className="pt-2">
            <button
              onClick={() => navigate('/order?token=TB01')}
              className="px-5 py-2 rounded-full bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs tracking-wide transition shadow-sm"
            >
              Xem thực đơn
            </button>
          </div>
        </div>

        {/* Grid Dishes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="h-44 overflow-hidden relative">
                <img
                  src={item.imageUrl || item.src}
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-500"
                />
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-navy-900 text-base">{item.name}</h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description || item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="font-extrabold text-navy-900 text-sm">
                    {item.price?.toLocaleString('vi-VN')}đ
                  </span>
                  <Link
                    to="/order?token=TB01"
                    className="text-xs font-bold text-navy-900 hover:underline flex items-center gap-1"
                  >
                    <span>Gọi món</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Hình ảnh Cà phê phin & Gỏi cuốn (Ảnh 4) */}
      <section className="max-w-5xl mx-auto px-6 py-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="rounded-2xl overflow-hidden shadow-sm h-64 border border-stone-200">
            <img
              src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800"
              alt="Cà phê phin truyền thống"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm h-64 border border-stone-200">
            <img
              src="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800"
              alt="Gỏi cuốn tôm thịt"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 5. Câu chuyện của chúng tôi (Ảnh 4) */}
      <section className="max-w-5xl mx-auto px-6 py-16 w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-navy-900 font-display">
            Câu chuyện của chúng tôi
          </h2>
          <p className="text-sm text-stone-500 font-medium mt-1">
            Gìn giữ hương vị Việt, kể bằng ngôn ngữ mới.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-2xl border border-stone-200 bg-white shadow-sm leading-relaxed text-sm text-stone-600">
            Từ những nguyên liệu bản địa tươi ngon, đội ngũ bếp nâng niu từng hương vị quen thuộc và làm mới chúng bằng kỹ thuật hiện đại. Mỗi món ăn là một câu chuyện về vùng đất, con người và lòng hiếu khách Việt Nam.
          </div>

          <div className="p-8 rounded-2xl border border-stone-200 bg-white shadow-sm leading-relaxed text-sm text-stone-600">
            Không gian riêng tư, ánh sáng ấm áp cùng sự chăm chút trong từng chi tiết, phù hợp cho bữa tối thân mật, gặp gỡ đối tác hay những dịp kỷ niệm đặc biệt. Chỉ cần quét mã QR trên bàn để xem thực đơn, gọi món và gọi phục vụ — nhanh chóng, tiện lợi.
          </div>
        </div>
      </section>

      {/* 6. Footer (Ảnh 4) */}
      <footer className="bg-navy-900 text-stone-300 mt-auto pt-16 pb-12 px-6 lg:px-12 border-t border-navy-800">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <BrandLogo size="md" lightText={true} />
            <p className="text-xs text-stone-400">
              A Taste to Remember · EST 2026
            </p>
            <p className="text-xs text-stone-500 leading-relaxed">
              Hệ thống đặt món và quản lý nhà hàng thông minh qua mã QR.
            </p>
          </div>

          {/* Col 2: Khám phá */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Khám phá</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <a href="#mon-ngon" className="hover:text-gold transition">
                  Món ngon tuyển chọn
                </a>
              </li>
              <li>
                <Link to="/ban/1" className="hover:text-gold transition">
                  Gọi món tại bàn
                </Link>
              </li>
              <li>
                <Link to="/thu-ngan/dat-ban" className="hover:text-gold transition">
                  Đặt bàn trước
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Nhân viên */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Nhân viên</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <Link to="/thu-ngan" className="hover:text-gold transition">
                  Thu ngân (Sơ đồ bàn)
                </Link>
              </li>
              <li>
                <Link to="/bep" className="hover:text-gold transition">
                  Nhân viên bếp (KDS)
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-gold transition">
                  Quản trị viên (Báo cáo)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Liên hệ */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Liên hệ</h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-gold" />
                <span>120 Nguyễn Văn Linh, Q. Hải Châu, TP. Đà Nẵng</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-gold" />
                <span>Hotline: 0905 123 456</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-gold" />
                <span>08:00 - 22:30 hàng ngày</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-12 pt-6 border-t border-navy-800 text-center text-xs text-stone-500">
          © 2026 Tasty House POS. Bản quyền thuộc về Nhà hàng Ẩm thực Tasty House.
        </div>
      </footer>

      {/* 7. Modal Đặt Bàn Trước dành cho Khách Hàng (Dữ liệu thật lưu thẳng vào DB) */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-navy-900 text-gold flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-navy-900 font-display">
                    Đặt bàn tại Tasty House
                  </h3>
                  <p className="text-[11px] text-stone-500">Giữ chỗ trước · Không gian sang trọng</p>
                </div>
              </div>
              <button
                onClick={closeBookingModal}
                className="p-1.5 text-stone-400 hover:text-navy-900 hover:bg-stone-100 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="font-extrabold text-lg text-navy-900 font-display">
                  Đặt bàn thành công!
                </h4>
                <p className="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
                  Cảm ơn <b>{bookingForm.customerName}</b>! Nhà hàng Tasty House đã nhận được lịch hẹn lúc{' '}
                  <b>{new Date(bookingForm.reservationTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</b> cho{' '}
                  <b>{bookingForm.partySize} khách</b>.
                </p>
                <p className="text-[11px] text-stone-400">
                  Nhân viên sẽ liên hệ số <b>{bookingForm.customerPhone}</b> để xác nhận và chuẩn bị bàn chu đáo nhất.
                </p>
                <div className="pt-4">
                  <button
                    onClick={closeBookingModal}
                    className="px-6 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="py-4 space-y-3.5 text-sm">
                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1.5">
                    Họ và tên của quý khách <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ và tên"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 placeholder:text-slate-400 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-stone-700 font-semibold mb-1.5">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Nhập số điện thoại"
                      value={bookingForm.customerPhone}
                      onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                      className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 placeholder:text-slate-400 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-stone-700 font-semibold mb-1.5">
                      Số lượng khách <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        required
                        value={bookingForm.partySize}
                        onChange={(e) => setBookingForm({ ...bookingForm, partySize: e.target.value })}
                        className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 focus:outline-none pr-8"
                      />
                      <Users size={15} className="absolute right-2.5 top-2.5 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1.5">
                    Thời gian đến dùng bữa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={bookingForm.reservationTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, reservationTime: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-700 font-semibold mb-1.5">
                    Ghi chú đặc biệt (tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Nhập yêu cầu thêm (ghế trẻ em, bàn gần cửa sổ...)"
                    value={bookingForm.note}
                    onChange={(e) => setBookingForm({ ...bookingForm, note: e.target.value })}
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-sm text-navy-900 placeholder:text-slate-400 focus:border-navy-900 focus:ring-2 focus:ring-navy-900/10 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeBookingModal}
                    className="px-4 py-2 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="px-5 py-2 bg-navy-900 text-white rounded-xl font-bold hover:bg-navy-800 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Calendar size={14} />
                    <span>{bookingLoading ? 'Đang gửi...' : 'Xác nhận đặt bàn'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
