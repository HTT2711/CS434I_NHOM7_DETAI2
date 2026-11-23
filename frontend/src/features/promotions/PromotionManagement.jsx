import React, { useState, useEffect } from 'react';
import { promotionApi } from '../../services/promotion.api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    discountType: 'PERCENT', // 'PERCENT' | 'FIXED'
    discountValue: 10,
    maxDiscount: 50000,
    minOrderAmount: 200000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    usageLimit: 500,
    isActive: true,
  });

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await promotionApi.getAll();
      setPromotions(res.data || []);
    } catch (err) {
      console.error('Lỗi tải khuyến mãi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Stats calculation directly from DB
  const totalPrograms = promotions.length;
  const activeCount = promotions.filter((p) => p.active !== false && p.isActive !== false).length;
  const totalUsed = promotions.reduce((s, p) => s + (p.usedCount || 0), 0);
  const upcomingCount = promotions.filter((p) => p.startDate && new Date(p.startDate) > new Date()).length;

  const handleToggleActive = async (promo) => {
    try {
      const currentActive = promo.active !== false && promo.isActive !== false;
      const nextActive = !currentActive;
      await promotionApi.update(promo.id, { active: nextActive, isActive: nextActive });
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, active: nextActive, isActive: nextActive } : p))
      );
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái khuyến mãi');
    }
  };

  const handleDeletePromo = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương trình khuyến mãi này?')) return;
    try {
      await promotionApi.delete(id);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa khuyến mãi');
    }
  };

  const openModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      const isFixed = promo.type === 'amount' || promo.discountType === 'FIXED';
      setFormData({
        code: promo.code,
        name: promo.name,
        discountType: isFixed ? 'FIXED' : 'PERCENT',
        discountValue: promo.value ?? promo.discountValue ?? 10,
        maxDiscount: promo.maxDiscount || 0,
        minOrderAmount: promo.minOrder ?? promo.minOrderAmount ?? 0,
        startDate: promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : '',
        usageLimit: promo.usageLimit || 0,
        isActive: promo.active !== false && promo.isActive !== false,
      });
    } else {
      setEditingPromo(null);
      setFormData({
        code: '',
        name: '',
        discountType: 'PERCENT',
        discountValue: 10,
        maxDiscount: 50000,
        minOrderAmount: 200000,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        usageLimit: 500,
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    try {
      const isFixed = formData.discountType === 'FIXED';
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        type: isFixed ? 'amount' : 'percent',
        value: Number(formData.discountValue),
        discountValue: Number(formData.discountValue),
        maxDiscount: Number(formData.maxDiscount) || 0,
        minOrder: Number(formData.minOrderAmount) || 0,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        usageLimit: Number(formData.usageLimit) || 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        active: formData.isActive,
        isActive: formData.isActive,
      };
      if (editingPromo) {
        await promotionApi.update(editingPromo.id, payload);
      } else {
        await promotionApi.create(payload);
      }
      setShowModal(false);
      fetchPromotions();
    } catch (err) {
      alert(err.message || 'Lỗi lưu khuyến mãi');
    }
  };

  const formatDiscountText = (p) => {
    const isFixed = p.type === 'amount' || p.discountType === 'FIXED';
    const val = p.value ?? p.discountValue ?? 0;
    if (isFixed) {
      return `${val.toLocaleString('vi-VN')}đ`;
    }
    const maxVal = p.maxDiscount || 0;
    const maxText = maxVal > 0 ? ` (tối đa ${maxVal.toLocaleString('vi-VN')}đ)` : '';
    return `${val}%${maxText}`;
  };

  const formatConditionText = (p) => {
    const min = p.minOrder ?? p.minOrderAmount ?? 0;
    return min > 0 ? `Đơn từ ${min.toLocaleString('vi-VN')}đ` : 'Không giới hạn';
  };

  const formatDateRange = (p) => {
    const start = p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '';
    const end = p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '';
    return start && end ? `${start} đến ${end}` : (end ? `Đến ${end}` : 'Vô thời hạn');
  };

  const getStatusBadge = (p) => {
    const isActive = p.active !== false && p.isActive !== false;
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
          Tạm ngưng
        </span>
      );
    }
    if (p.startDate && new Date(p.startDate) > new Date()) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Sắp diễn ra
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        Đang áp dụng
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-900">
      {/* 1. Header (Ảnh 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
            Khuyến mãi
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Thêm ưu đãi, thêm lý do để khách quay lại.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          style={{ backgroundColor: '#0b1329', color: '#ffffff' }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition shadow-xs self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>Tạo khuyến mãi</span>
        </button>
      </div>

      {/* 2. 4 Stat Cards (Ảnh 6: Đang chạy, Tổng lượt dùng, Tổng chương trình, Sắp diễn ra) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-500">Đang chạy</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display mt-2">
            {activeCount}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-500">Tổng lượt dùng</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display mt-2">
            {totalUsed}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-500">Tổng chương trình</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display mt-2">
            {totalPrograms}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="text-xs font-bold text-stone-500">Sắp diễn ra</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display mt-2">
            {upcomingCount}
          </div>
        </div>
      </div>

      {/* 3. Table (Ảnh 6) */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-600 font-bold bg-stone-50/70">
                <th className="py-3.5 px-4 font-bold">Mã / Chương trình</th>
                <th className="py-3.5 px-4 font-bold">Mức giảm</th>
                <th className="py-3.5 px-4 font-bold">Điều kiện</th>
                <th className="py-3.5 px-4 font-bold">Thời gian</th>
                <th className="py-3.5 px-4 font-bold">Lượt dùng</th>
                <th className="py-3.5 px-4 font-bold">Trạng thái</th>
                <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Chưa có chương trình khuyến mãi nào.
                  </td>
                </tr>
              ) : (
                promotions.map((p) => {
                  const used = p.usedCount || 0;
                  const limit = p.usageLimit || 500;
                  const pct = Math.min(Math.round((used / limit) * 100), 100);
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/60 transition">
                      {/* Mã / Chương trình */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-navy-900">{p.code}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5">{p.name}</div>
                      </td>

                      {/* Mức giảm */}
                      <td className="py-3.5 px-4 font-bold text-navy-900">
                        {formatDiscountText(p)}
                      </td>

                      {/* Điều kiện */}
                      <td className="py-3.5 px-4 text-stone-600 font-medium">
                        {formatConditionText(p)}
                      </td>

                      {/* Thời gian */}
                      <td className="py-3.5 px-4 text-stone-600 font-medium whitespace-nowrap">
                        {formatDateRange(p)}
                      </td>

                      {/* Lượt dùng */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-stone-600 font-medium">
                          {limit === 0 ? '0/∞ Không giới hạn' : `${used}/${limit}`}
                        </div>
                        {limit > 0 && (
                          <div className="w-24 bg-stone-100 h-1.5 rounded-full mt-1 overflow-hidden">
                            <div style={{ width: `${pct}%` }} className="h-full bg-navy-900 rounded-full" />
                          </div>
                        )}
                      </td>

                      {/* Trạng thái + toggle */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          {getStatusBadge(p)}
                          <div>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(p)}
                              className={`w-7 h-4 flex items-center rounded-full p-0.5 transition ${
                                (p.active !== false && p.isActive !== false) ? 'bg-navy-900' : 'bg-stone-300'
                              }`}
                            >
                              <div
                                className={`bg-white w-3 h-3 rounded-full shadow-md transform transition ${
                                  (p.active !== false && p.isActive !== false) ? 'translate-x-3' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openModal(p)}
                            className="px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeletePromo(p.id)}
                            className="px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal Tạo / Sửa Khuyến Mãi */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-base text-navy-900 font-display">
                {editingPromo ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-stone-400 hover:text-navy-900">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="py-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mã khuyến mãi *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="VD: GIAM20K"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Loại giảm *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="PERCENT">Giảm theo %</option>
                    <option value="FIXED">Giảm số tiền cố định</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên chương trình *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Giảm giá khai trương mùa thu"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {formData.discountType === 'PERCENT' ? 'Mức giảm (%)' : 'Số tiền giảm (đ)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
                {formData.discountType === 'PERCENT' && (
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Giảm tối đa (đ)</label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Đơn tối thiểu (đ)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Số lượt dùng tối đa</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 text-white rounded-xl font-bold hover:bg-navy-800"
                >
                  {editingPromo ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionManagement;
