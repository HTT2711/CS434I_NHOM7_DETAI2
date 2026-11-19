const prisma = require('../../config/db');

const getDashboardStats = async () => {
  const totalInvoices = await prisma.invoice.aggregate({
    _sum: { finalAmount: true },
    _count: { id: true },
  });

  const totalRevenue = totalInvoices._sum.finalAmount || 0;
  const totalCompletedOrders = totalInvoices._count.id;

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
    activeOrdersCount,
    totalTables,
    availableTables,
    occupiedTables,
  };
};

const getRevenueChart = async () => {
  // Aggregate recent invoices
  const invoices = await prisma.invoice.findMany({
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
