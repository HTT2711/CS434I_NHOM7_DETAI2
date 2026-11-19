const orderService = require('./order.service');
const { sendSuccess, sendError } = require('../../utils/response.util');

const createOrder = async (req, res) => {
  try {
    const { tableId, items, note } = req.body;
    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return sendError(res, 'Vui lòng cung cấp thông tin bàn và danh sách món', 400);
    }
    const createdById = req.user ? req.user.id : null;
    const order = await orderService.createOrder({ tableId, items, note, createdById });
    return sendSuccess(res, order, 'Đặt món thành công', 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await orderService.getOrders(req.query);
    return sendSuccess(res, orders, 'Lấy danh sách đơn hàng thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) return sendError(res, 'Không tìm thấy đơn hàng', 404);
    return sendSuccess(res, order, 'Lấy chi tiết đơn hàng thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return sendError(res, 'Vui lòng cung cấp trạng thái mới', 400);
    const order = await orderService.updateOrderStatus(req.params.id, status);
    return sendSuccess(res, order, 'Cập nhật trạng thái đơn hàng thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const updateOrderItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return sendError(res, 'Vui lòng cung cấp trạng thái món', 400);
    const item = await orderService.updateOrderItemStatus(req.params.itemId, status);
    return sendSuccess(res, item, 'Cập nhật trạng thái món thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderItemStatus,
};
