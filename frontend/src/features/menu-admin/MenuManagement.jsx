import React, { useState, useEffect } from 'react';
import { menuApi } from '../../services/menu.api';
import { Plus, Trash2, Utensils, Search, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';

const MenuManagement = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    categoryId: '',
    description: '',
    imageUrl: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, itemRes] = await Promise.all([
        menuApi.getCategories(),
        menuApi.getItems(),
      ]);
      if (catRes.success) setCategories(catRes.data);
      if (itemRes.success) setItems(itemRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSelling = async (id) => {
    try {
      await menuApi.toggleSelling(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa món này khỏi thực đơn?')) return;
    try {
      await menuApi.deleteItem(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await menuApi.createCategory({ name: newCatName });
      setNewCatName('');
      setShowCatModal(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await menuApi.deleteCategory(catId);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await menuApi.createItem({
        ...formData,
        categoryId: formData.categoryId || (categories[0] ? categories[0].id : null),
      });
      setShowAddModal(false);
      setFormData({ name: '', price: '', categoryId: '', description: '', imageUrl: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchCat = selectedCategory ? item.categoryId === selectedCategory : true;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản lý Thực đơn (US03 & US04)</h2>
          <p className="text-xs text-slate-500">
            Quản lý danh mục, thông tin món và trạng thái kinh doanh (Đang bán / Ngừng bán)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCatModal(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
          >
            + Danh mục
          </button>
          <button
            onClick={() => {
              if (categories.length > 0) {
                setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
              }
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20"
          >
            <Plus size={16} />
            <span>Thêm món mới</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm món ăn..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 py-1">
              <button
                onClick={() => setSelectedCategory(c.id)}
                className={`text-xs font-semibold whitespace-nowrap ${
                  selectedCategory === c.id ? 'text-orange-600 font-bold' : 'text-slate-600'
                }`}
              >
                {c.name}
              </button>
              <button
                onClick={() => handleDeleteCategory(c.id)}
                className="text-slate-300 hover:text-red-500 text-[10px] ml-1"
                title="Xóa danh mục"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Item List Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase">
                <tr>
                  <th className="p-4">Món ăn</th>
                  <th className="p-4">Danh mục</th>
                  <th className="p-4">Đơn giá</th>
                  <th className="p-4">Kinh doanh (Admin)</th>
                  <th className="p-4">Tồn kho ca (Bếp)</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <Utensils size={18} />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-sm text-slate-800">{item.name}</p>
                          {item.description && (
                            <p className="text-slate-400 line-clamp-1 max-w-xs">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-md font-semibold text-slate-600">
                        {item.category?.name}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-orange-600 text-sm">
                      {item.price.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleSelling(item.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          item.isSelling
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {item.isSelling ? '● Đang bán' : '○ Ngừng bán'}
                      </button>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          item.isAvailable
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.isAvailable ? 'Còn hàng' : 'Tạm hết'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Category */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-3">Thêm danh mục mới</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Tên danh mục (VD: Lẩu & Nướng)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-orange-600 rounded-xl"
                >
                  Tạo danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Thêm món ăn mới</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên món</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Salad cá hồi sốt mè"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Đơn giá (VNĐ)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={1000}
                    placeholder="65000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Danh mục</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Link hình ảnh (URL)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mô tả món</label>
                <textarea
                  rows={2}
                  placeholder="Nguyên liệu, hương vị..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-500/20"
                >
                  Lưu món ăn
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
