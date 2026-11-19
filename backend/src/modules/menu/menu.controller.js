const menuService = require('./menu.service');
const { sendSuccess, sendError } = require('../../utils/response.util');

const getCategories = async (req, res) => {
  try {
    const forCustomer = req.query.forCustomer === 'true';
    const categories = await menuService.getCategories(forCustomer);
    return sendSuccess(res, categories, 'Lấy danh mục thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const createCategory = async (req, res) => {
  try {
    const category = await menuService.createCategory(req.body);
    return sendSuccess(res, category, 'Tạo danh mục thành công', 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await menuService.updateCategory(req.params.id, req.body);
    return sendSuccess(res, category, 'Cập nhật danh mục thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const deleteCategory = async (req, res) => {
  try {
    await menuService.deleteCategory(req.params.id);
    return sendSuccess(res, null, 'Xóa danh mục thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const getAllMenuItems = async (req, res) => {
  try {
    const items = await menuService.getAllMenuItems(req.query);
    return sendSuccess(res, items, 'Lấy thực đơn thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const item = await menuService.getMenuItemById(req.params.id);
    if (!item) return sendError(res, 'Không tìm thấy món ăn', 404);
    return sendSuccess(res, item, 'Lấy thông tin món thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const createMenuItem = async (req, res) => {
  try {
    const item = await menuService.createMenuItem(req.body);
    return sendSuccess(res, item, 'Thêm món ăn thành công', 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const item = await menuService.updateMenuItem(req.params.id, req.body);
    return sendSuccess(res, item, 'Cập nhật món ăn thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const toggleSelling = async (req, res) => {
  try {
    const item = await menuService.toggleSelling(req.params.id);
    return sendSuccess(res, item, 'Cập nhật trạng thái kinh doanh thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const toggleStock = async (req, res) => {
  try {
    const item = await menuService.toggleStock(req.params.id);
    return sendSuccess(res, item, 'Cập nhật tình trạng còn/hết hàng thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    await menuService.deleteMenuItem(req.params.id);
    return sendSuccess(res, null, 'Xóa món ăn thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleSelling,
  toggleStock,
  deleteMenuItem,
};
