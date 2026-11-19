const prisma = require('../../config/db');
const { getIO } = require('../../config/socket');

const getAllTables = async () => {
  return await prisma.table.findMany({
    orderBy: { tableNumber: 'asc' },
    include: {
      orders: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
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

const getTableById = async (id) => {
  return await prisma.table.findUnique({
    where: { id: Number(id) },
    include: {
      orders: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] },
        },
        include: {
          items: { include: { menuItem: true } },
        },
      },
    },
  });
};

const getTableByToken = async (token) => {
  return await prisma.table.findUnique({
    where: { token },
  });
};

const createTable = async (data) => {
  const existing = await prisma.table.findUnique({ where: { tableNumber: data.tableNumber } });
  if (existing) {
    throw new Error('Tên bàn đã tồn tại, vui lòng nhập tên khác');
  }

  const token = data.token || `TB-${Date.now()}`;
  return await prisma.table.create({
    data: {
      tableNumber: data.tableNumber,
      capacity: Number(data.capacity) || 4,
      token,
      status: data.status || 'AVAILABLE',
    },
  });
};

const updateTable = async (id, data) => {
  return await prisma.table.update({
    where: { id: Number(id) },
    data: {
      tableNumber: data.tableNumber,
      capacity: data.capacity !== undefined ? Number(data.capacity) : undefined,
      status: data.status,
    },
  });
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
        where: { status: { in: ['PENDING', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] } },
      },
    },
  });

  if (!table) throw new Error('Bàn không tồn tại');

  if (table.status === 'OCCUPIED' || table.status === 'WAITING_PAYMENT' || table.orders.length > 0) {
    throw new Error('Không thể xóa bàn đang có khách hoặc đang chờ thanh toán!');
  }

  return await prisma.table.delete({
    where: { id: Number(id) },
  });
};

module.exports = {
  getAllTables,
  getTableById,
  getTableByToken,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
};
