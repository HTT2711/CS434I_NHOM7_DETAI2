const prisma = require('../../config/db');
const { getIO } = require('../../config/socket');

const createInvoice = async ({ orderId, cashierId, discount = 0, vatRate = 8, paymentMethod = 'CASH', voucherCode = null }) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: { table: true, items: { include: { menuItem: true } } },
  });

  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }

  // Check if invoice already exists
  const existingInvoice = await prisma.invoice.findUnique({
    where: { orderId: Number(orderId) },
  });
  if (existingInvoice) {
    throw new Error('Đơn hàng này đã được thanh toán và tạo hóa đơn');
  }

  const subtotal = order.totalAmount;
  const numDiscount = Number(discount) || 0;
  const numVatRate = vatRate !== undefined ? Number(vatRate) : 8;
  const taxableAmount = Math.max(0, subtotal - numDiscount);
  const vatAmount = Math.round(taxableAmount * (numVatRate / 100));
  const finalAmount = taxableAmount + vatAmount;

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await prisma.invoice.count();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-${todayStr}-${String(countToday + 1).padStart(4, '0')}-${rand}`;

  // Execute in Prisma Transaction (NFR04, UC05)
  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark order as COMPLETED
    await tx.order.update({
      where: { id: Number(orderId) },
      data: { status: 'COMPLETED' },
    });

    // 2. Create invoice
    const newInvoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        orderId: Number(orderId),
        cashierId: cashierId ? Number(cashierId) : null,
        totalAmount: subtotal,
        discount: numDiscount,
        vatRate: numVatRate,
        vatAmount: vatAmount,
        finalAmount,
        paymentMethod,
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
      include: {
        order: {
          include: {
            table: true,
            items: { include: { menuItem: true } },
          },
        },
        cashier: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });

    // 3. Mark table as AVAILABLE only if no remaining active orders (e.g. after split bill)
    const remainingActiveCount = await tx.order.count({
      where: {
        tableId: order.tableId,
        id: { not: Number(orderId) },
        status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
      },
    });

    const newTableStatus = remainingActiveCount > 0 ? 'OCCUPIED' : 'AVAILABLE';

    await tx.table.update({
      where: { id: order.tableId },
      data: { status: newTableStatus },
    });

    // 4. Update promotion usedCount if voucherCode provided
    if (voucherCode) {
      await tx.promotion.updateMany({
        where: { code: String(voucherCode).trim().toUpperCase() },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 5. Record audit log
    await tx.auditLog.create({
      data: {
        userId: cashierId ? Number(cashierId) : null,
        action: 'CHECKOUT_INVOICE',
        entityType: 'INVOICE',
        entityId: String(newInvoice.id),
        detail: JSON.stringify({
          invoiceNumber,
          orderId,
          subtotal,
          discount: numDiscount,
          voucherCode,
          vatAmount,
          finalAmount,
          paymentMethod,
        }),
      },
    });

    return { newInvoice, newTableStatus };
  });

  const invoice = result.newInvoice;
  const newTableStatus = result.newTableStatus;

  const io = getIO();
  if (io) {
    io.emit('invoice-created', invoice);
    io.emit('order-completed', invoice);
    io.emit('table_status_updated', { id: order.tableId, status: newTableStatus });
    io.emit('table-status-updated', { id: order.tableId, status: newTableStatus });
    io.to('staff-room').emit('invoice-created', invoice);
    io.to(`table-${order.tableId}`).emit('order-completed', invoice);
  }

  return invoice;
};

// Gộp bàn (US13, UC05)
const mergeTables = async ({ sourceTableId, targetTableId }) => {
  if (Number(sourceTableId) === Number(targetTableId)) {
    throw new Error('Bàn nguồn và bàn đích không được trùng nhau');
  }

  return await prisma.$transaction(async (tx) => {
    // Find active order of source table
    const sourceOrder = await tx.order.findFirst({
      where: {
        tableId: Number(sourceTableId),
        status: { in: ['PENDING', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
      },
      include: { items: true },
    });

    if (!sourceOrder || sourceOrder.items.length === 0) {
      throw new Error('Bàn nguồn không có đơn hàng đang hoạt động để gộp');
    }

    // Find or create active order for target table
    let targetOrder = await tx.order.findFirst({
      where: {
        tableId: Number(targetTableId),
        status: { in: ['PENDING', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
      },
      include: { items: true },
    });

    if (!targetOrder) {
      throw new Error('Bàn đích không có đơn hàng đang phục vụ để gộp');
    }

    // Move all items from source order to target order
    for (const item of sourceOrder.items) {
      await tx.orderDetail.update({
        where: { id: item.id },
        data: { orderId: targetOrder.id },
      });
    }

    // Recalculate target order total
    const updatedTargetItems = await tx.orderDetail.findMany({
      where: { orderId: targetOrder.id },
    });
    const newTotal = updatedTargetItems.reduce((acc, it) => acc + it.price * it.quantity, 0);

    await tx.order.update({
      where: { id: targetOrder.id },
      data: {
        totalAmount: newTotal,
        note: `${targetOrder.note ? targetOrder.note + ' | ' : ''}Gộp từ bàn ID ${sourceTableId}`,
      },
    });

    // Delete or cancel source order and free source table
    await tx.order.delete({
      where: { id: sourceOrder.id },
    });

    await tx.table.update({
      where: { id: Number(sourceTableId) },
      data: { status: 'AVAILABLE' },
    });

    const io = getIO();
    if (io) {
      io.emit('table_status_updated', { id: Number(sourceTableId), status: 'AVAILABLE' });
      io.emit('table-status-updated', { id: Number(sourceTableId), status: 'AVAILABLE' });
      io.emit('order-status-updated', { id: targetOrder.id });
      io.to('staff-room').emit('order-status-updated', { id: targetOrder.id });
    }

    return {
      message: 'Gộp bàn thành công',
      targetOrderId: targetOrder.id,
    };
  });
};

// Tách hóa đơn (US14, UC05)
const splitBill = async ({ orderId, itemsToSplit }) => {
  if (!itemsToSplit || !Array.isArray(itemsToSplit) || itemsToSplit.length === 0) {
    throw new Error('Vui lòng chọn ít nhất một món cần tách');
  }

  return await prisma.$transaction(async (tx) => {
    const originalOrder = await tx.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: { include: { menuItem: true } } },
    });

    if (!originalOrder) {
      throw new Error('Không tìm thấy đơn hàng gốc');
    }

    // Generate order number for split order
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await tx.order.count();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newOrderNumber = `ORD-${todayStr}-${String(countToday + 1).padStart(4, '0')}-SPLIT-${rand}`;

    const newOrderItemsData = [];

    for (const splitReq of itemsToSplit) {
      const origItem = originalOrder.items.find((it) => it.id === Number(splitReq.orderDetailId));
      if (!origItem) continue;

      const splitQty = Math.min(origItem.quantity, Number(splitReq.quantity) || 1);
      if (splitQty <= 0) continue;

      newOrderItemsData.push({
        menuItemId: origItem.menuItemId,
        quantity: splitQty,
        price: origItem.price,
        note: `${origItem.note || ''} (Tách bill)`,
        status: origItem.status,
      });

      const remainingQty = origItem.quantity - splitQty;
      if (remainingQty <= 0) {
        await tx.orderDetail.delete({ where: { id: origItem.id } });
      } else {
        await tx.orderDetail.update({
          where: { id: origItem.id },
          data: { quantity: remainingQty },
        });
      }
    }

    if (newOrderItemsData.length === 0) {
      throw new Error('Không có món hợp lệ để tách bill');
    }

    const splitTotalAmount = newOrderItemsData.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    // Create new split order on the same table
    const splitOrder = await tx.order.create({
      data: {
        orderNumber: newOrderNumber,
        tableId: originalOrder.tableId,
        totalAmount: splitTotalAmount,
        note: `Tách từ ${originalOrder.orderNumber}`,
        status: originalOrder.status,
        items: {
          create: newOrderItemsData,
        },
      },
      include: {
        table: true,
        items: { include: { menuItem: true } },
      },
    });

    // Update original order's total amount
    const remainingItems = await tx.orderDetail.findMany({
      where: { orderId: originalOrder.id },
    });
    const remainingTotal = remainingItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    await tx.order.update({
      where: { id: originalOrder.id },
      data: { totalAmount: remainingTotal },
    });

    const io = getIO();
    if (io) {
      io.emit('new_order', splitOrder);
      io.emit('order-created', splitOrder);
      io.to('staff-room').emit('new_order', splitOrder);
      io.to('staff-room').emit('order-created', splitOrder);
    }

    return {
      originalOrderId: originalOrder.id,
      splitOrder,
    };
  });
};

const getInvoices = async (filters = {}) => {
  const where = {};
  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }
  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  return await prisma.invoice.findMany({
    where,
    include: {
      order: {
        include: {
          table: true,
          items: { include: { menuItem: true } },
        },
      },
      cashier: {
        select: { id: true, fullName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getInvoiceById = async (id) => {
  return await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: {
      order: {
        include: {
          table: true,
          items: { include: { menuItem: true } },
        },
      },
      cashier: {
        select: { id: true, fullName: true },
      },
    },
  });
};

const getInvoiceByOrderId = async (orderId) => {
  return await prisma.invoice.findUnique({
    where: { orderId: Number(orderId) },
    include: {
      order: {
        include: {
          table: true,
          items: { include: { menuItem: true } },
        },
      },
      cashier: {
        select: { id: true, fullName: true },
      },
    },
  });
};

module.exports = {
  createInvoice,
  mergeTables,
  splitBill,
  getInvoices,
  getInvoiceById,
  getInvoiceByOrderId,
};
