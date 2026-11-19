const invoiceService = require('./invoice.service');
const { sendSuccess, sendError } = require('../../utils/response.util');

const createInvoice = async (req, res) => {
  try {
    const { orderId, discount, paymentMethod } = req.body;
    if (!orderId) {
      return sendError(res, 'Vui lòng cung cấp mã đơn hàng cần thanh toán', 400);
    }
    const cashierId = req.user ? req.user.id : null;
    const invoice = await invoiceService.createInvoice({
      orderId,
      cashierId,
      discount,
      paymentMethod,
    });
    return sendSuccess(res, invoice, 'Thanh toán và tạo hóa đơn thành công', 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const mergeTables = async (req, res) => {
  try {
    const { sourceTableId, targetTableId } = req.body;
    if (!sourceTableId || !targetTableId) {
      return sendError(res, 'Vui lòng cung cấp bàn nguồn và bàn đích', 400);
    }
    const result = await invoiceService.mergeTables({ sourceTableId, targetTableId });
    return sendSuccess(res, result, 'Gộp bàn thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const splitBill = async (req, res) => {
  try {
    const { orderId, itemsToSplit } = req.body;
    if (!orderId || !itemsToSplit) {
      return sendError(res, 'Vui lòng cung cấp thông tin đơn và danh sách món cần tách', 400);
    }
    const result = await invoiceService.splitBill({ orderId, itemsToSplit });
    return sendSuccess(res, result, 'Tách hóa đơn thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await invoiceService.getInvoices(req.query);
    return sendSuccess(res, invoices, 'Lấy danh sách hóa đơn thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) return sendError(res, 'Không tìm thấy hóa đơn', 404);
    return sendSuccess(res, invoice, 'Lấy chi tiết hóa đơn thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const getInvoiceByOrderId = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceByOrderId(req.params.orderId);
    if (!invoice) return sendError(res, 'Không tìm thấy hóa đơn cho đơn hàng này', 404);
    return sendSuccess(res, invoice, 'Lấy chi tiết hóa đơn thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  createInvoice,
  mergeTables,
  splitBill,
  getInvoices,
  getInvoiceById,
  getInvoiceByOrderId,
};
