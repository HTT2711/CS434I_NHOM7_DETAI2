const prisma = require('../../config/db');
const { getIO } = require('../../config/socket');

const getCategories = async (forCustomer = false) => {
  return await prisma.category.findMany({
    where: { isDeleted: false },
    include: {
      items: {
        where: forCustomer
          ? { isSelling: true, isDeleted: false }
          : { isDeleted: false },
      },
    },
    orderBy: { id: 'asc' },
  });
};

const createCategory = async (data) => {
  return await prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
      isDeleted: false,
    },
  });
};

const updateCategory = async (id, data) => {
  return await prisma.category.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      description: data.description,
    },
  });
};

const deleteCategory = async (id) => {
  const countItems = await prisma.menuItem.count({
    where: { categoryId: Number(id), isDeleted: false },
  });
  if (countItems > 0) {
    throw new Error(`Vui lòng chuyển hoặc xóa ${countItems} món trong danh mục trước khi xóa danh mục!`);
  }

  return await prisma.category.update({
    where: { id: Number(id) },
    data: { isDeleted: true },
  });
};

const getAllMenuItems = async (filters = {}) => {
  const where = { isDeleted: false };
  if (filters.categoryId) {
    where.categoryId = Number(filters.categoryId);
  }
  // If customer request: only show isSelling = true AND isDeleted = false
  if (filters.forCustomer === 'true' || filters.customer === 'true') {
    where.isSelling = true;
  }
  if (filters.isSelling !== undefined) {
    where.isSelling = filters.isSelling === 'true' || filters.isSelling === true;
  }
  if (filters.isAvailable !== undefined) {
    where.isAvailable = filters.isAvailable === 'true' || filters.isAvailable === true;
  }
  if (filters.search) {
    where.name = { contains: filters.search };
  }

  return await prisma.menuItem.findMany({
    where,
    include: { category: true },
    orderBy: { id: 'desc' },
  });
};

const getMenuItemById = async (id) => {
  return await prisma.menuItem.findUnique({
    where: { id: Number(id) },
    include: { category: true },
  });
};

const createMenuItem = async (data) => {
  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0) {
    throw new Error('Giá món ăn phải lớn hơn 0');
  }

  return await prisma.menuItem.create({
    data: {
      name: data.name,
      description: data.description,
      price,
      imageUrl: data.imageUrl,
      categoryId: Number(data.categoryId),
      isSelling: data.isSelling !== undefined ? Boolean(data.isSelling) : true,
      isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : true,
    },
  });
};

const updateMenuItem = async (id, data) => {
  return await prisma.menuItem.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      description: data.description,
      price: data.price !== undefined ? parseFloat(data.price) : undefined,
      imageUrl: data.imageUrl,
      categoryId: data.categoryId !== undefined ? Number(data.categoryId) : undefined,
      isSelling: data.isSelling !== undefined ? Boolean(data.isSelling) : undefined,
      isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : undefined,
    },
  });
};

// Admin toggles Business status (Đang bán / Ngừng bán)
const toggleSelling = async (id) => {
  const item = await prisma.menuItem.findUnique({ where: { id: Number(id) } });
  if (!item) throw new Error('Không tìm thấy món ăn');

  const updated = await prisma.menuItem.update({
    where: { id: Number(id) },
    data: { isSelling: !item.isSelling },
  });

  const io = getIO();
  if (io) {
    io.emit('menu_item_updated', updated);
    io.emit('menu-updated', updated);
  }

  return updated;
};

// Kitchen toggles Stock status (Còn hàng / Tạm hết món trong ca)
const toggleStock = async (id) => {
  const item = await prisma.menuItem.findUnique({ where: { id: Number(id) } });
  if (!item) throw new Error('Không tìm thấy món ăn');

  const updated = await prisma.menuItem.update({
    where: { id: Number(id) },
    data: { isAvailable: !item.isAvailable },
  });

  const io = getIO();
  if (io) {
    io.emit('menu_item_updated', updated);
    io.emit('menu-updated', updated);
  }

  return updated;
};

const deleteMenuItem = async (id) => {
  return await prisma.menuItem.update({
    where: { id: Number(id) },
    data: { isDeleted: true },
  });
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleSelling,
  toggleStock,
  deleteMenuItem,
};
