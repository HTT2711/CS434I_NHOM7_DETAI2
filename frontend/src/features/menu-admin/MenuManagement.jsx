import React, { useState, useEffect } from 'react';
import { menuApi } from '../../services/menu.api';
import { Plus, Edit2, Trash2, Search, ExternalLink, X, Image as ImageIcon } from 'lucide-react';

const MenuManagement = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    imageUrl: '',
  });

  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catNameInput, setCatNameInput] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, itemRes] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getItems(),
      ]);
      if (catRes.success) setCategories(catRes.data || []);
      if (itemRes.success) setItems(itemRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu thực đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCatId !== 'ALL' && item.categoryId !== Number(selectedCatId)) return false;
    if (statusFilter === 'AVAILABLE' && !item.isAvailable) return false;
    if (statusFilter === 'UNAVAILABLE' && item.isAvailable) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      if (!name.includes(q) && !desc.includes(q)) return false;
    }
    return true;
  });

  // Toggle item selling status
  const handleToggleSelling = async (item) => {
    try {
      await menuApi.toggleSelling(item.id);
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isAvailable: !it.isAvailable } : it))
      );
    } catch (err) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái món');
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn?')) return;
    try {
      await menuApi.deleteItem(itemId);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa món');
    }
  };

  // Open item modal for add/edit
  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemFormData({
        name: item.name,
        price: item.price,
        categoryId: item.categoryId || (categories[0]?.id || ''),
        description: item.description || '',
        imageUrl: item.imageUrl || '',
      });
    } else {
      setEditingItem(null);
      setItemFormData({
        name: '',
        price: '',
        categoryId: categories[0]?.id || '',
        description: '',
        imageUrl: '',
      });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemFormData,
        price: Number(itemFormData.price),
        categoryId: Number(itemFormData.categoryId),
      };
      if (editingItem) {
        await menuApi.updateItem(editingItem.id, payload);
      } else {
        await menuApi.createItem(payload);
      }
      setShowItemModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi lưu thông tin món');
    }
  };

  // Category management
  const openCatModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setCatNameInput(cat.name);
    } else {
      setEditingCat(null);
      setCatNameInput('');
    }
    setShowCatModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;
    try {
      if (editingCat) {
        await menuApi.updateCategory(editingCat.id, { name: catNameInput.trim() });
      } else {
        await menuApi.createCategory({ name: catNameInput.trim() });
      }
      setShowCatModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi lưu danh mục');
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Tất cả món trong danh mục này cũng sẽ bị ảnh hưởng.')) return;
    try {
      await menuApi.deleteCategory(catId);
      fetchData();
    } catch (err) {
      alert(err.message || 'Lỗi xóa danh mục');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-stone-900">
      {/* 1. Header (Ảnh 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-display">
            Thực đơn
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Chăm chút từng món ngon, sẵn sàng phục vụ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open('/order?token=TB01', '_blank')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition bg-white"
          >
            <span>Xem thực đơn khách hàng</span>
            <ExternalLink size={13} />
          </button>

          <button
            onClick={() => openItemModal()}
            style={{ backgroundColor: '#0b1329', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 transition shadow-xs"
          >
            <Plus size={14} />
            <span>Thêm món</span>
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Content: Sidebar danh mục + Grid món ăn (Ảnh 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Danh mục */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Danh mục
            </span>
            <button
              onClick={() => openCatModal()}
              className="text-xs text-navy-900 font-bold hover:underline flex items-center gap-0.5"
            >
              <Plus size={12} />
              <span>Thêm</span>
            </button>
          </div>

          <div className="space-y-1">
            {/* Tất cả món */}
            <button
              onClick={() => setSelectedCatId('ALL')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                selectedCatId === 'ALL'
                  ? 'bg-stone-100 text-navy-900'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span>Tất cả món</span>
              <span className="text-stone-400 font-normal">{items.length}</span>
            </button>

            {/* List categories */}
            {categories.map((cat) => {
              const count = items.filter((it) => it.categoryId === cat.id).length;
              const isSelected = selectedCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                    isSelected ? 'bg-stone-100 font-bold text-navy-900' : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <button
                    onClick={() => setSelectedCatId(cat.id)}
                    className="flex-1 text-left truncate mr-2"
                  >
                    <span>{cat.name}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-[11px]">{count}</span>
                    <button
                      onClick={() => openCatModal(cat)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-navy-900 transition"
                      title="Đổi tên"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition"
                      title="Xóa danh mục"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Tìm kiếm & Grid các thẻ món ăn (Ảnh 4) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Tìm tên món ăn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 placeholder-stone-400 focus:ring-1 focus:ring-navy-900 bg-white"
              />
            </div>

            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 bg-white focus:ring-1 focus:ring-navy-900"
            >
              <option value="ALL">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-navy-900 bg-white focus:ring-1 focus:ring-navy-900"
            >
              <option value="ALL">Tất cả tình trạng</option>
              <option value="AVAILABLE">Còn bán</option>
              <option value="UNAVAILABLE">Hết hàng</option>
            </select>
          </div>

          {/* Cards Grid (Ảnh 4) */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-400">
              Không tìm thấy món ăn nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs flex flex-col justify-between hover:border-stone-300 transition"
                >
                  {/* Dish Image */}
                  <div className="h-44 bg-stone-100 overflow-hidden relative">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        {item.category?.name || 'Món ăn'}
                      </div>
                      <h4 className="font-extrabold text-sm text-navy-900 mt-1 line-clamp-1 font-display">
                        {item.name}
                      </h4>
                      <div className="text-sm font-extrabold text-navy-900 mt-1 font-display">
                        {(item.price || 0).toLocaleString('vi-VN')}đ
                      </div>
                      <p className="text-xs text-stone-500 mt-2 line-clamp-2 leading-relaxed font-normal">
                        {item.description || 'Hương vị thơm ngon đậm đà truyền thống chuẩn vị ẩm thực Việt.'}
                      </p>
                    </div>

                    {/* Bottom Status & Actions (Ảnh 4) */}
                    <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                      {/* Còn bán toggle */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-600">Còn bán</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSelling(item)}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition ${
                            item.isAvailable ? 'bg-navy-900' : 'bg-stone-300'
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                              item.isAvailable ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Sửa / Xóa */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openItemModal(item)}
                          className="px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          Sửa món
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Modal Thêm / Sửa Món */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-base text-navy-900 font-display">
                {editingItem ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1 text-stone-400 hover:text-navy-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên món ăn *</label>
                <input
                  type="text"
                  required
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  placeholder="Ví dụ: Phở bò tái nạm"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-navy-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Đơn giá (VNĐ) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={itemFormData.price}
                  onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
                  placeholder="Ví dụ: 65000"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-navy-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Danh mục món *</label>
                <select
                  required
                  value={itemFormData.categoryId}
                  onChange={(e) => setItemFormData({ ...itemFormData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-navy-900 text-xs bg-white"
                >
                  <option value="">Chọn danh mục...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Đường dẫn hình ảnh (URL)</label>
                <input
                  type="url"
                  value={itemFormData.imageUrl}
                  onChange={(e) => setItemFormData({ ...itemFormData, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-navy-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Mô tả món ăn</label>
                <textarea
                  rows={2}
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  placeholder="Mô tả nguyên liệu, hương vị..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-navy-900 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 text-white rounded-xl font-bold hover:bg-navy-800"
                >
                  {editingItem ? 'Lưu thay đổi' : 'Tạo món mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Thêm / Sửa Danh Mục */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-base text-navy-900 font-display">
                {editingCat ? 'Đổi tên danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button
                onClick={() => setShowCatModal(false)}
                className="p-1 text-stone-400 hover:text-navy-900 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tên danh mục *</label>
                <input
                  type="text"
                  required
                  value={catNameInput}
                  onChange={(e) => setCatNameInput(e.target.value)}
                  placeholder="Ví dụ: Lẩu đặc biệt"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-1 focus:ring-navy-900 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy-900 text-white rounded-xl font-bold hover:bg-navy-800"
                >
                  Lưu danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
