const tableService = require('./table.service');
const { sendSuccess, sendError } = require('../../utils/response.util');

const getAllTables = async (req, res) => {
  try {
    const tables = await tableService.getAllTables();
    return sendSuccess(res, tables, 'Lấy danh sách bàn thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const getTableById = async (req, res) => {
  try {
    const table = await tableService.getTableById(req.params.id);
    if (!table) return sendError(res, 'Không tìm thấy bàn', 404);
    return sendSuccess(res, table, 'Lấy thông tin bàn thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const getTableByToken = async (req, res) => {
  try {
    const table = await tableService.getTableByToken(req.params.token);
    if (!table) return sendError(res, 'Mã QR bàn không hợp lệ hoặc không tồn tại', 404);
    return sendSuccess(res, table, 'Xác thực bàn thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const createTable = async (req, res) => {
  try {
    const table = await tableService.createTable(req.body);
    return sendSuccess(res, table, 'Tạo bàn mới thành công', 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const updateTable = async (req, res) => {
  try {
    const table = await tableService.updateTable(req.params.id, req.body);
    return sendSuccess(res, table, 'Cập nhật thông tin bàn thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const table = await tableService.updateTableStatus(req.params.id, status);
    return sendSuccess(res, table, 'Cập nhật trạng thái bàn thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const deleteTable = async (req, res) => {
  try {
    await tableService.deleteTable(req.params.id);
    return sendSuccess(res, null, 'Xóa bàn thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const regenerateQr = async (req, res) => {
  try {
    const table = await tableService.regenerateTableQr(req.params.id, req.user?.id);
    return sendSuccess(res, table, 'Tạo lại mã QR thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

module.exports = {
  getAllTables,
  getTableById,
  getTableByToken,
  createTable,
  updateTable,
  updateStatus,
  regenerateQr,
  deleteTable,
};
