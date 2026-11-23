const crypto = require('crypto');
const prisma = require('../../config/db');
const { getIO } = require('../../config/socket');

const generateRandomToken = () => {
  return crypto.randomBytes(6).toString('hex'); // 12 characters random hex string
};

const getAllTables = async () => {
  return await prisma.table.findMany({
    where: { isDeleted: false },
    orderBy: { tableNumber: 'asc' },
    include: {
      orders: {
        where: {
          status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
        },
        include: {
          items: {
            include: { menuItem: true },
          },
        },
      },
    },
  });
};

const getTableById = async (idOrNumber) => {
  const num = Number(idOrNumber);
  if (!isNaN(num)) {
    // 1. Try finding by primary key id
    let table = await prisma.table.findFirst({
      where: { id: num, isDeleted: false },
      include: {
        orders: {
          where: {
            status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
          },
          include: {
            items: { include: { menuItem: true } },
          },
        },
      },
    });
    if (table) return table;

    // 2. If not found by primary key, match by table number (e.g. "Bàn 1", "Bàn 01") or token
    table = await prisma.table.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { tableNumber: `Bàn ${num}` },
          { tableNumber: `Bàn ${num.toString().padStart(2, '0')}` },
          { token: `TB${num.toString().padStart(2, '0')}` },
          { token: String(idOrNumber) },
        ],
      },
      include: {
        orders: {
          where: {
            status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
          },
          include: {
            items: { include: { menuItem: true } },
          },
        },
      },
    });
    if (table) return table;
  }

  // 3. Fallback search by string tableNumber or token
  return await prisma.table.findFirst({
    where: {
      isDeleted: false,
      OR: [
        { tableNumber: String(idOrNumber) },
        { token: String(idOrNumber) },
      ],
    },
    include: {
      orders: {
        where: {
          status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
        },
        include: {
          items: { include: { menuItem: true } },
        },
      },
    },
  });
};

const getTableByToken = async (token) => {
  if (!token) return null;
  const trimmed = String(token).trim();
  const num = Number(trimmed.replace(/\D/g, ''));
  const orConditions = [
    { token: trimmed },
    { token: trimmed.toUpperCase() },
    { token: trimmed.toLowerCase() },
  ];
  if (!isNaN(num) && num > 0) {
    orConditions.push({ token: `TB${String(num).padStart(2, '0')}` });
    orConditions.push({ tableNumber: `Bàn ${num}` });
    orConditions.push({ id: num });
  }
  return await prisma.table.findFirst({
    where: {
      isDeleted: false,
      OR: orConditions,
    },
    include: {
      orders: {
        where: {
          status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
        },
        include: {
          items: { include: { menuItem: true } },
        },
      },
    },
  });
};

const createTable = async (data) => {
  const existing = await prisma.table.findFirst({
    where: { tableNumber: data.tableNumber, isDeleted: false },
  });
  if (existing) {
    throw new Error('Tên bàn đã tồn tại, vui lòng nhập tên khác');
  }

  const token = data.token || generateRandomToken();
  return await prisma.table.create({
    data: {
      tableNumber: data.tableNumber,
      area: data.area || 'Khu A - Tầng 1',
      capacity: Number(data.capacity) || 4,
      token,
      status: data.status || 'AVAILABLE',
      isDeleted: false,
    },
  });
};

const updateTable = async (id, data) => {
  return await prisma.table.update({
    where: { id: Number(id) },
    data: {
      tableNumber: data.tableNumber,
      area: data.area,
      capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
      status: data.status,
    },
  });
};

const regenerateTableQr = async (id, userId) => {
  const table = await prisma.table.findUnique({
    where: { id: Number(id) },
  });
  if (!table) throw new Error('Bàn không tồn tại');

  const newToken = generateRandomToken();
  const updated = await prisma.table.update({
    where: { id: Number(id) },
    data: { token: newToken },
  });

  await prisma.auditLog.create({
    data: {
      userId: userId ? Number(userId) : null,
      action: 'REGENERATE_QR',
      entityType: 'TABLE',
      entityId: String(id),
      detail: JSON.stringify({ oldToken: table.token, newToken }),
    },
  });

  const io = getIO();
  if (io) {
    io.emit('table_status_updated', updated);
    io.emit('table-status-updated', updated);
  }

  return updated;
};

const updateTableStatus = async (id, status) => {
  const updated = await prisma.table.update({
    where: { id: Number(id) },
    data: { status },
  });

  const io = getIO();
  if (io) {
    io.emit('table_status_updated', updated);
    io.emit('table-status-updated', updated);
  }

  return updated;
};

const deleteTable = async (id) => {
  const table = await prisma.table.findUnique({
    where: { id: Number(id) },
    include: {
      orders: {
        where: { status: { in: ['PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] } },
      },
    },
  });

  if (!table) throw new Error('Bàn không tồn tại');

  if (table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT' || table.orders.length > 0) {
    throw new Error('Không thể xóa bàn đang có khách hoặc đang chờ thanh toán!');
  }

  // Soft delete per US05
  return await prisma.table.update({
    where: { id: Number(id) },
    data: {
      isDeleted: true,
      tableNumber: `${table.tableNumber}__deleted_${Date.now()}`,
    },
  });
};

module.exports = {
  getAllTables,
  getTableById,
  getTableByToken,
  createTable,
  updateTable,
  updateTableStatus,
  regenerateTableQr,
  deleteTable,
};

