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
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: Number(it.menuItemId) },
    });
    if (!menuItem) {
      throw new Error(`Món ăn với ID ${it.menuItemId} không tồn tại`);
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
    io.to('staff-room').emit('new_order', order);
    io.to('staff-room').emit('order-created', order);
    io.to(`table-${tableId}`).emit('new_order', order);
    io.to(`table-${tableId}`).emit('order-created', order);
    io.emit('table_status_updated', { id: Number(tableId), status: 'OCCUPIED' });
    io.emit('table-status-updated', { id: Number(tableId), status: 'OCCUPIED' });
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
  if (filters.activeOnly === 'true') {
    where.status = { in: ['PENDING', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] };
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
    io.to('staff-room').emit('order-status-updated', order);
    io.to(`table-${order.tableId}`).emit('order-status-updated', order);
  }

  return order;
};

const updateOrderItemStatus = async (orderItemId, status) => {
  const updatedItem = await prisma.orderDetail.update({
    where: { id: Number(orderItemId) },
    data: { status },
    include: {
      menuItem: true,
      order: {
        include: { table: true, items: true },
      },
    },
  });

  // Check if all items in order are READY
  const allReady = updatedItem.order.items.every((it) => it.id === updatedItem.id ? status === 'READY' : it.status === 'READY');
  if (allReady && updatedItem.order.status !== 'READY') {
    await prisma.order.update({
      where: { id: updatedItem.orderId },
      data: { status: 'READY' },
    });
  }

  const io = getIO();
  if (io) {
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
};
