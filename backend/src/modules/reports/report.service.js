const prisma = require('../../config/db');

const getDashboardStats = async (period = 'all') => {
  const where = {};
  const now = new Date();

  if (period === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.createdAt = { gte: startOfDay };
  } else if (period === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    where.createdAt = { gte: startOfMonth };
  }

  const totalInvoices = await prisma.invoice.aggregate({
    where,
    _sum: { finalAmount: true },
    _count: { id: true },
  });

  const totalRevenue = totalInvoices._sum.finalAmount || 0;
  const totalCompletedOrders = totalInvoices._count.id;
  const averageOrderValue = totalCompletedOrders > 0 ? Math.round(totalRevenue / totalCompletedOrders) : 0;

  const activeOrdersCount = await prisma.order.count({
    where: { status: { in: ['PENDING', 'CONFIRMED', 'COOKING', 'READY', 'SERVED'] } },
  });

  const totalTables = await prisma.table.count();
  const availableTables = await prisma.table.count({
    where: { status: 'AVAILABLE' },
  });
  const occupiedTables = await prisma.table.count({
    where: { status: 'OCCUPIED' },
  });

  return {
    totalRevenue,
    totalCompletedOrders,
    averageOrderValue,
    activeOrdersCount,
    totalTables,
    availableTables,
    occupiedTables,
  };
};

const getRevenueChart = async (period = 'all') => {
  const where = {};
  const now = new Date();

  if (period === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.createdAt = { gte: startOfDay };
  } else if (period === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    where.createdAt = { gte: startOfMonth };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      finalAmount: true,
      createdAt: true,
    },
    take: 100,
  });

  // Group by date (YYYY-MM-DD)
  const mapDate = {};
  invoices.forEach((inv) => {
    const d = inv.createdAt.toISOString().slice(0, 10);
    mapDate[d] = (mapDate[d] || 0) + inv.finalAmount;
  });

  const chartData = Object.keys(mapDate).map((date) => ({
    date,
    revenue: mapDate[date],
  }));

  return chartData;
};

const getTopSellingItems = async (limit = 5) => {
  const items = await prisma.orderDetail.groupBy({
    by: ['menuItemId'],
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: Number(limit),
  });

  const detailedItems = await Promise.all(
    items.map(async (it) => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: it.menuItemId },
        include: { category: true },
      });
      return {
        ...menuItem,
        soldQuantity: it._sum.quantity,
      };
    })
  );

  return detailedItems;
};

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getTopSellingItems,
};
