const express = require('express');
const router = express.Router();
const prisma = require('../../config/db');
const { sendSuccess, sendError } = require('../../utils/response.util');

// Lấy danh sách khuyến mãi
router.get('/', async (req, res, next) => {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, promotions, 'Lấy danh sách khuyến mãi thành công');
  } catch (error) {
    next(error);
  }
});

// Kiểm tra mã khuyến mãi
router.get('/check/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const promo = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.active) {
      return sendError(res, 'Mã khuyến mãi không tồn tại hoặc đã hết hiệu lực', 404);
    }

    const now = new Date();
    if (promo.startDate && new Date(promo.startDate) > now) {
      return sendError(res, 'Mã khuyến mãi chưa đến thời gian áp dụng', 400);
    }

    if (promo.endDate && new Date(promo.endDate) < now) {
      return sendError(res, 'Mã khuyến mãi đã hết hạn sử dụng', 400);
    }

    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return sendError(res, 'Mã khuyến mãi đã hết lượt sử dụng', 400);
    }

    return sendSuccess(res, promo, 'Mã khuyến mãi hợp lệ');
  } catch (error) {
    next(error);
  }
});

// Tạo mã khuyến mãi mới
router.post('/', async (req, res, next) => {
  try {
    const { code, name, type, value, discountValue, maxDiscount, minOrder, minOrderAmount, usageLimit, startDate, endDate } = req.body;
    const finalValue = value !== undefined ? value : discountValue;
    if (!code || !name || finalValue === undefined) {
      return sendError(res, 'Vui lòng nhập đủ mã, tên, giá trị và ngày kết thúc', 400);
    }

    const existing = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existing) {
      return sendError(res, 'Mã khuyến mãi đã tồn tại', 400);
    }

    const finalEndDate = endDate ? new Date(endDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const promo = await prisma.promotion.create({
      data: {
        code: code.toUpperCase(),
        name,
        type: type || 'percent',
        value: parseFloat(finalValue),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : 0,
        minOrder: (minOrder !== undefined ? minOrder : minOrderAmount) ? parseFloat(minOrder || minOrderAmount) : 0,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: finalEndDate,
        active: req.body.active !== undefined ? req.body.active : (req.body.isActive !== undefined ? req.body.isActive : true),
      },
    });

    return sendSuccess(res, promo, 'Tạo mã khuyến mãi thành công', 201);
  } catch (error) {
    next(error);
  }
});

// Cập nhật khuyến mãi
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.type) data.type = req.body.type;
    if (req.body.value !== undefined) data.value = parseFloat(req.body.value);
    if (req.body.discountValue !== undefined) data.value = parseFloat(req.body.discountValue);
    if (req.body.active !== undefined) data.active = req.body.active;
    if (req.body.isActive !== undefined) data.active = req.body.isActive;
    if (req.body.startDate) data.startDate = new Date(req.body.startDate);
    if (req.body.endDate) data.endDate = new Date(req.body.endDate);
    if (req.body.minOrder !== undefined) data.minOrder = parseFloat(req.body.minOrder);
    if (req.body.minOrderAmount !== undefined) data.minOrder = parseFloat(req.body.minOrderAmount);
    if (req.body.maxDiscount !== undefined) data.maxDiscount = parseFloat(req.body.maxDiscount);
    if (req.body.usageLimit !== undefined) data.usageLimit = parseInt(req.body.usageLimit, 10);

    const updated = await prisma.promotion.update({
      where: { id: parseInt(id, 10) },
      data,
    });
    return sendSuccess(res, updated, 'Cập nhật khuyến mãi thành công');
  } catch (error) {
    next(error);
  }
});

// Xóa mã khuyến mãi
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.promotion.delete({
      where: { id: parseInt(id, 10) },
    });
    return sendSuccess(res, null, 'Đã xóa mã khuyến mãi');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
