const express = require('express');
const router = express.Router();
const prisma = require('../../config/db');
const { sendSuccess, sendError } = require('../../utils/response.util');
const { getIO } = require('../../config/socket');

// Helper gắn thông tin bàn (tableNumber) vào reservation
async function attachTableInfo(reservations) {
  const tables = await prisma.table.findMany({
    select: { id: true, tableNumber: true, area: true, capacity: true },
  });
  const tableMap = new Map(tables.map((t) => [t.id, t]));
  return reservations.map((r) => ({
    ...r,
    table: r.tableId ? tableMap.get(r.tableId) || null : null,
  }));
}

// Lấy danh sách đặt bàn
router.get('/', async (req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { reservationTime: 'asc' },
    });
    const enriched = await attachTableInfo(reservations);
    return sendSuccess(res, enriched, 'Lấy danh sách đặt bàn thành công');
  } catch (error) {
    next(error);
  }
});

// Tạo đặt bàn mới
router.post('/', async (req, res, next) => {
  try {
    const { customerName, customerPhone, partySize, reservationTime, note, tableId } = req.body;
    if (!customerName || !customerPhone || !reservationTime) {
      return sendError(res, 'Vui lòng nhập họ tên, số điện thoại và thời gian đặt bàn', 400);
    }

    const reservation = await prisma.reservation.create({
      data: {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        partySize: partySize ? parseInt(partySize, 10) : 2,
        reservationTime: new Date(reservationTime),
        note: note ? note.trim() : '',
        tableId: tableId ? parseInt(tableId, 10) : null,
        status: 'PENDING',
      },
    });

    const [enriched] = await attachTableInfo([reservation]);

    const io = getIO();
    if (io) {
      io.emit('new_reservation', enriched);
      io.to('staff-room').emit('new_reservation', enriched);
    }

    return sendSuccess(res, enriched, 'Tạo lịch đặt bàn thành công', 201);
  } catch (error) {
    next(error);
  }
});

// Cập nhật trạng thái đặt bàn (CONFIRMED, ARRIVED, CANCELLED)
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, tableId } = req.body;

    const data = {};
    if (status) data.status = status;
    if (tableId !== undefined) data.tableId = tableId ? parseInt(tableId, 10) : null;

    const updated = await prisma.reservation.update({
      where: { id: parseInt(id, 10) },
      data,
    });

    const normStatus = String(status || '').toUpperCase();
    if ((normStatus === 'ARRIVED' || normStatus === 'DA_DEN') && updated.tableId) {
      await prisma.table.update({
        where: { id: updated.tableId },
        data: { status: 'OCCUPIED' },
      });
      const io = getIO();
      if (io) {
        io.emit('table_status_updated', { id: updated.tableId, status: 'OCCUPIED' });
        io.emit('table-status-updated', { id: updated.tableId, status: 'OCCUPIED' });
      }
    }

    const [enriched] = await attachTableInfo([updated]);

    const io = getIO();
    if (io) {
      io.emit('reservation_updated', enriched);
      io.to('staff-room').emit('reservation_updated', enriched);
    }

    return sendSuccess(res, enriched, 'Cập nhật lịch đặt bàn thành công');
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, tableId, customerName, customerPhone, partySize, reservationTime, note } = req.body;

    const data = {};
    if (status) data.status = status;
    if (tableId !== undefined) data.tableId = tableId ? parseInt(tableId, 10) : null;
    if (customerName) data.customerName = customerName;
    if (customerPhone) data.customerPhone = customerPhone;
    if (partySize) data.partySize = parseInt(partySize, 10);
    if (reservationTime) data.reservationTime = new Date(reservationTime);
    if (note !== undefined) data.note = note;

    const updated = await prisma.reservation.update({
      where: { id: parseInt(id, 10) },
      data,
    });

    const normStatus = String(status || '').toUpperCase();
    if ((normStatus === 'ARRIVED' || normStatus === 'DA_DEN') && updated.tableId) {
      await prisma.table.update({
        where: { id: updated.tableId },
        data: { status: 'OCCUPIED' },
      });
      const io = getIO();
      if (io) {
        io.emit('table_status_updated', { id: updated.tableId, status: 'OCCUPIED' });
        io.emit('table-status-updated', { id: updated.tableId, status: 'OCCUPIED' });
      }
    }

    const [enriched] = await attachTableInfo([updated]);

    const io = getIO();
    if (io) {
      io.emit('reservation_updated', enriched);
      io.to('staff-room').emit('reservation_updated', enriched);
    }

    return sendSuccess(res, enriched, 'Cập nhật lịch đặt bàn thành công');
  } catch (error) {
    next(error);
  }
});

// Xóa đặt bàn
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.reservation.delete({
      where: { id: parseInt(id, 10) },
    });
    return sendSuccess(res, null, 'Đã xóa lịch đặt bàn');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
