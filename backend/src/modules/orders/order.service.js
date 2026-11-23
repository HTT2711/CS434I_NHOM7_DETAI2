const prisma = require('../../config/db');
const { getIO } = require('../../config/socket');

const createOrder = async ({ tableId, items, note, createdById }) => {
  if (!items || items.length === 0) {
    throw new Error('Đơn hàng phải có ít nhất một món');
  }

  const table = await prisma.table.findUnique({
    where: { id: Number(tableId) },
  });
  if (!table) {
    throw new Error('Bàn không tồn tại');
  }

  // Calculate prices and verify availability (US07, UC03)
  let totalAmount = 0;
  const orderDetailsData = [];

  for (const it of items) {
    let menuItem = null;
    if (it.menuItemId) {
      menuItem = await prisma.menuItem.findUnique({
        where: { id: Number(it.menuItemId) },
      });
    }

    // Fallback: nếu cart lưu ID từ trước khi reset CSDL, đối chiếu theo tên món
    if (!menuItem && it.name) {
      menuItem = await prisma.menuItem.findFirst({
        where: { name: it.name, isDeleted: false },
      });
    }

    if (!menuItem) {
      throw new Error(`Món "${it.name || it.menuItemId}" hiện không tồn tại trong thực đơn. Vui lòng bỏ món ra khỏi giỏ.`);
    }
    if (!menuItem.isSelling) {
      throw new Error(`Món "${menuItem.name}" hiện đã ngừng kinh doanh, vui lòng chọn món khác`);
    }
    if (!menuItem.isAvailable) {
      throw new Error(`Món "${menuItem.name}" vừa tạm hết nguyên liệu, vui lòng chọn món khác`);
    }

    const qty = Number(it.quantity) || 1;
    const subtotal = menuItem.price * qty;
    totalAmount += subtotal;

    orderDetailsData.push({
      menuItemId: menuItem.id,
      quantity: qty,
      price: menuItem.price,
      note: it.note || '',
      status: 'PENDING',
    });
  }

  // Generate unique order number: ORD-YYYYMMDD-XXXX-RAND
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await prisma.order.count();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `ORD-${todayStr}-${String(countToday + 1).padStart(4, '0')}-${rand}`;

  // Use transaction to create Order and update Table status
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        tableId: Number(tableId),
        totalAmount,
        note,
        createdById: createdById ? Number(createdById) : null,
        status: 'PENDING',
        items: {
          create: orderDetailsData,
        },
      },
      include: {
        table: true,
        items: {
          include: { menuItem: true },
        },
        createdBy: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });

    await tx.table.update({
      where: { id: Number(tableId) },
      data: { status: 'OCCUPIED' },
    });

    return newOrder;
  });

  // Emit socket event to staff room and table room
  const io = getIO();
  if (io) {
    io.emit('new_order', order);
    io.emit('order-created', order);
    io.emit('table_status_updated', { id: Number(tableId), status: 'OCCUPIED' });
    io.emit('table-status-updated', { id: Number(tableId), status: 'OCCUPIED' });
    io.to('staff-room').emit('new_order', order);
    io.to('staff-room').emit('order-created', order);
    io.to(`table-${tableId}`).emit('new_order', order);
    io.to(`table-${tableId}`).emit('order-created', order);
  }

  return order;
};

const getOrders = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.tableId) {
    where.tableId = Number(filters.tableId);
  }
  if (filters.activeOnly === 'true' || filters.activeOnly === true) {
    where.status = { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] };
  }

  return await prisma.order.findMany({
    where,
    include: {
      table: true,
      items: {
        include: { menuItem: true },
      },
      createdBy: {
        select: { id: true, fullName: true },
      },
      invoice: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getOrderById = async (id) => {
  return await prisma.order.findUnique({
    where: { id: Number(id) },
    include: {
      table: true,
      items: {
        include: { menuItem: true },
      },
      createdBy: {
        select: { id: true, fullName: true },
      },
      invoice: true,
    },
  });
};

const updateOrderStatus = async (id, status) => {
  const order = await prisma.order.update({
    where: { id: Number(id) },
    data: { status },
    include: {
      table: true,
      items: { include: { menuItem: true } },
    },
  });

  const io = getIO();
  if (io) {
    io.emit('order-status-updated', order);
    io.emit('order_status_updated', order);
    io.to('staff-room').emit('order-status-updated', order);
    io.to(`table-${order.tableId}`).emit('order-status-updated', order);
  }

  return order;
};

const calculateOrderStatusFromItems = (items, currentStatus) => {
  if (currentStatus === 'COMPLETED') return 'COMPLETED';
  const activeItems = (items || []).filter((it) => it.status !== 'CANCELLED');
  if (activeItems.length === 0) return 'CANCELLED';

  const allServed = activeItems.every((it) => it.status === 'SERVED');
  if (allServed) return 'SERVED';

  const allReadyOrServed = activeItems.every((it) => it.status === 'READY' || it.status === 'SERVED');
  if (allReadyOrServed) return 'READY';

  const hasCookingOrReady = activeItems.some((it) => ['COOKING', 'READY', 'SERVED'].includes(it.status));
  if (hasCookingOrReady) return 'COOKING';

  return currentStatus === 'AWAITING_CONFIRMATION'
    ? 'AWAITING_CONFIRMATION'
    : currentStatus === 'CONFIRMED'
    ? 'CONFIRMED'
    : 'PENDING';
};

const updateOrderItemStatus = async (orderItemId, status) => {
  const updatedItem = await prisma.orderDetail.update({
    where: { id: Number(orderItemId) },
    data: { status },
    include: {
      menuItem: true,
      order: {
        include: { table: true, items: { include: { menuItem: true } } },
      },
    },
  });

  // Calculate new order status dynamically based on all items
  const newOrderStatus = calculateOrderStatusFromItems(updatedItem.order.items, updatedItem.order.status);
  let finalOrder = updatedItem.order;

  if (newOrderStatus !== updatedItem.order.status && updatedItem.order.status !== 'COMPLETED') {
    finalOrder = await prisma.order.update({
      where: { id: updatedItem.orderId },
      data: { status: newOrderStatus },
      include: { table: true, items: { include: { menuItem: true } } },
    });
    updatedItem.order = finalOrder;
  }

  const io = getIO();
  if (io) {
    io.emit('order_item_updated', updatedItem);
    io.emit('order-item-status-updated', updatedItem);
    io.to('staff-room').emit('order_item_updated', updatedItem);
    io.to('staff-room').emit('order-item-status-updated', updatedItem);
    io.to(`table-${updatedItem.order.tableId}`).emit('order_item_updated', updatedItem);
    io.to(`table-${updatedItem.order.tableId}`).emit('order-item-status-updated', updatedItem);

    io.emit('order-status-updated', finalOrder);
    io.emit('order_updated', finalOrder);
    io.to('staff-room').emit('order-status-updated', finalOrder);
    io.to('staff-room').emit('order_updated', finalOrder);
    io.to(`table-${finalOrder.tableId}`).emit('order-status-updated', finalOrder);
    io.to(`table-${finalOrder.tableId}`).emit('order_updated', finalOrder);
  }

  return updatedItem;
};

const confirmOrder = async (orderId, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: { table: true, items: { include: { menuItem: true } } },
  });
  if (!order) throw new Error('Đơn hàng không tồn tại');

  const updatedOrder = await prisma.$transaction(async (tx) => {
    const ord = await tx.order.update({
      where: { id: Number(orderId) },
      data: { status: 'CONFIRMED' },
      include: { table: true, items: { include: { menuItem: true } } },
    });

    await tx.table.update({
      where: { id: ord.tableId },
      data: { status: 'OCCUPIED' },
    });

    await tx.auditLog.create({
      data: {
        userId: userId ? Number(userId) : null,
        action: 'CONFIRM_ORDER',
        entityType: 'ORDER',
        entityId: String(orderId),
        detail: JSON.stringify({ orderNumber: ord.orderNumber, tableId: ord.tableId }),
      },
    });

    return ord;
  });

  const io = getIO();
  if (io) {
    io.emit('new_order', updatedOrder);
    io.emit('order-confirmed', updatedOrder);
    io.emit('order-status-updated', updatedOrder);
    io.emit('table_status_updated', { id: updatedOrder.tableId, status: 'OCCUPIED' });
    io.emit('table-status-updated', { id: updatedOrder.tableId, status: 'OCCUPIED' });
    io.to('staff-room').emit('new_order', updatedOrder);
    io.to('staff-room').emit('order-confirmed', updatedOrder);
    io.to(`table-${updatedOrder.tableId}`).emit('order-confirmed', updatedOrder);
  }

  return updatedOrder;
};

const cancelOrder = async (orderId, reason, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: { table: true, items: true },
  });
  if (!order) throw new Error('Đơn hàng không tồn tại');

  const updatedOrder = await prisma.$transaction(async (tx) => {
    await tx.orderDetail.updateMany({
      where: { orderId: Number(orderId) },
      data: { status: 'CANCELLED', cancelReason: reason || 'Đơn bị hủy' },
    });

    const ord = await tx.order.update({
      where: { id: Number(orderId) },
      data: { status: 'CANCELLED', note: reason ? `Lý do hủy: ${reason}` : order.note },
      include: { table: true, items: { include: { menuItem: true } } },
    });

    const activeOrders = await tx.order.findMany({
      where: {
        tableId: ord.tableId,
        id: { not: ord.id },
        status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
      },
    });

    if (activeOrders.length === 0) {
      await tx.table.update({
        where: { id: ord.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: userId ? Number(userId) : null,
        action: 'CANCEL_ORDER',
        entityType: 'ORDER',
        entityId: String(orderId),
        detail: JSON.stringify({ reason }),
      },
    });

    return ord;
  });

  const io = getIO();
  if (io) {
    io.emit('order-status-updated', updatedOrder);
    io.emit('order-cancelled', updatedOrder);
    io.emit('table_status_updated', { id: updatedOrder.tableId, status: 'AVAILABLE' });
    io.emit('table-status-updated', { id: updatedOrder.tableId, status: 'AVAILABLE' });
    io.to('staff-room').emit('order-status-updated', updatedOrder);
    io.to(`table-${updatedOrder.tableId}`).emit('order-status-updated', updatedOrder);
  }

  return updatedOrder;
};

const cancelOrderItem = async (orderItemId, { reason, isCustomer, userId }) => {
  const item = await prisma.orderDetail.findUnique({
    where: { id: Number(orderItemId) },
    include: { order: { include: { items: true } } },
  });
  if (!item) throw new Error('Món không tồn tại');

  if (isCustomer && item.status !== 'PENDING') {
    throw new Error('Khách hàng chỉ có thể hủy món khi Bếp chưa nhận nấu');
  }

  if (item.status === 'SERVED') {
    throw new Error('Không thể hủy món đã phục vụ lên bàn');
  }

  const updatedItem = await prisma.$transaction(async (tx) => {
    const updated = await tx.orderDetail.update({
      where: { id: Number(orderItemId) },
      data: {
        status: 'CANCELLED',
        cancelReason: reason || 'Món bị hủy',
        cancelledByCustomer: !!isCustomer,
      },
      include: {
        menuItem: true,
        order: {
          include: { table: true, items: { include: { menuItem: true } } },
        },
      },
    });

    const validItems = updated.order.items.filter((it) => it.status !== 'CANCELLED');
    const newTotal = validItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    const newOrderStatus = calculateOrderStatusFromItems(updated.order.items, updated.order.status);

    await tx.order.update({
      where: { id: updated.orderId },
      data: {
        totalAmount: newTotal,
        status: newOrderStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: userId ? Number(userId) : null,
        action: 'CANCEL_ORDER_ITEM',
        entityType: 'ORDER_DETAIL',
        entityId: String(orderItemId),
        detail: JSON.stringify({ reason, isCustomer }),
      },
    });

    return updated;
  });

  const io = getIO();
  if (io) {
    io.emit('order_item_updated', updatedItem);
    io.emit('order-item-status-updated', updatedItem);
    io.to('staff-room').emit('order_item_updated', updatedItem);
    io.to('staff-room').emit('order-item-status-updated', updatedItem);
    io.to(`table-${updatedItem.order.tableId}`).emit('order_item_updated', updatedItem);
    io.to(`table-${updatedItem.order.tableId}`).emit('order-item-status-updated', updatedItem);
  }

  return updatedItem;
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderItemStatus,
  confirmOrder,
  cancelOrder,
  cancelOrderItem,
};
