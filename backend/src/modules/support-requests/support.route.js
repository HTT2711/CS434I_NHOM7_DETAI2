const express = require('express');
const router = express.Router();
const prisma = require('../../config/db');
const { getIO } = require('../../config/socket');
const { sendSuccess, sendError } = require('../../utils/response.util');

// Lấy danh sách yêu cầu hỗ trợ (chưa xử lý hoặc tất cả) kèm thông tin tên bàn
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    const requests = await prisma.supportRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Lấy thông tin tableNumber tương ứng với tableId
    const tableIds = [...new Set(requests.map((r) => r.tableId))];
    const tables = await prisma.table.findMany({
      where: { id: { in: tableIds } },
      select: { id: true, tableNumber: true, area: true },
    });
    const tableMap = new Map(tables.map((t) => [t.id, t]));

    const requestsWithTable = requests.map((r) => {
      const table = tableMap.get(r.tableId);
      return {
        ...r,
        tableNumber: table ? table.tableNumber : `Bàn ${r.tableId}`,
        table: table || null,
      };
    });

    return sendSuccess(res, requestsWithTable, 'Lấy danh sách yêu cầu hỗ trợ thành công');
  } catch (error) {
    next(error);
  }
});

// Khách tại bàn gửi yêu cầu hỗ trợ
router.post('/', async (req, res, next) => {
  try {
    const { tableId } = req.body;
    const reason = req.body.reason || req.body.message || req.body.type;
    if (!tableId || !reason) {
      return sendError(res, 'Vui lòng cung cấp số bàn và lý do hỗ trợ', 400);
    }

    const table = await prisma.table.findUnique({
      where: { id: parseInt(tableId, 10) },
    });

    const newRequest = await prisma.supportRequest.create({
      data: {
        tableId: parseInt(tableId, 10),
        reason,
        status: 'cho_xu_ly',
      },
    });

    // Nếu khách yêu cầu thanh toán, tự động chuyển trạng thái bàn sang WAITING_PAYMENT (Chờ thanh toán)
    if (reason && reason.toLowerCase().includes('thanh to')) {
      await prisma.table.update({
        where: { id: parseInt(tableId, 10) },
        data: { status: 'WAITING_PAYMENT' },
      });
    }

    const payload = {
      ...newRequest,
      tableNumber: table ? table.tableNumber : `Bàn ${tableId}`,
      table: table ? { id: table.id, tableNumber: table.tableNumber, area: table.area } : null,
    };

    // Emit Socket.IO cho Thu ngân & Admin
    try {
      const io = getIO();
      if (reason && reason.toLowerCase().includes('thanh to')) {
        io.emit('table_status_updated', { tableId: parseInt(tableId, 10), status: 'WAITING_PAYMENT' });
      }
      io.emit('support_request_created', payload);
      io.emit('call-waiter', {
        id: newRequest.id,
        tableId: table ? table.id : parseInt(tableId, 10),
        tableNumber: table ? table.tableNumber : `Bàn ${tableId}`,
        reason,
        time: new Date().toLocaleTimeString('vi-VN'),
      });
    } catch (e) {
      console.warn('Socket emit error:', e.message);
    }

    return sendSuccess(res, payload, 'Đã gửi yêu cầu hỗ trợ đến thu ngân', 201);
  } catch (error) {
    next(error);
  }
});

// Cập nhật trạng thái yêu cầu (da_xu_ly, da_huy)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.supportRequest.update({
      where: { id: parseInt(id, 10) },
      data: { status },
    });

    const table = await prisma.table.findUnique({
      where: { id: updated.tableId },
      select: { id: true, tableNumber: true, area: true },
    });

    const payload = {
      ...updated,
      tableNumber: table ? table.tableNumber : `Bàn ${updated.tableId}`,
      table: table || null,
    };

    try {
      const io = getIO();
      io.emit('support_request_updated', payload);
    } catch (e) {
      console.warn('Socket emit error:', e.message);
    }

    return sendSuccess(res, payload, 'Cập nhật trạng thái yêu cầu thành công');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
