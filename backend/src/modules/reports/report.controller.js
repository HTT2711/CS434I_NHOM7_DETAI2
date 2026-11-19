const reportService = require('./report.service');
const { sendSuccess, sendError } = require('../../utils/response.util');

const getDashboardStats = async (req, res) => {
  try {
    const stats = await reportService.getDashboardStats();
    return sendSuccess(res, stats, 'Lấy thống kê dashboard thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const getRevenueChart = async (req, res) => {
  try {
    const chart = await reportService.getRevenueChart();
    return sendSuccess(res, chart, 'Lấy dữ liệu biểu đồ doanh thu thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const getTopSelling = async (req, res) => {
  try {
    const items = await reportService.getTopSellingItems(req.query.limit || 5);
    return sendSuccess(res, items, 'Lấy danh sách món bán chạy thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getTopSelling,
};
