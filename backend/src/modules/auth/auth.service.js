const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (username, password) => {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error('Tài khoản hoặc mật khẩu không chính xác');
  }

  if (user.isActive === false) {
    throw new Error('Tài khoản đã bị vô hiệu hóa');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Tài khoản hoặc mật khẩu không chính xác');
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'cs434_nhom_7',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    },
  };
};

const register = async ({ username, password, fullName, role }) => {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    throw new Error('Tên đăng nhập đã tồn tại');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      fullName,
      role: role || 'WAITER',
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return user;
};

const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { id: 'asc' },
  });
};

const updateUser = async (id, { fullName, role, isActive }) => {
  return await prisma.user.update({
    where: { id: Number(id) },
    data: {
      fullName,
      role,
      isActive,
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });
};

const toggleUserActive = async (id) => {
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) throw new Error('Không tìm thấy tài khoản người dùng');

  return await prisma.user.update({
    where: { id: Number(id) },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
    },
  });
};

const getProfile = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
};

module.exports = {
  login,
  register,
  getAllUsers,
  updateUser,
  toggleUserActive,
  getProfile,
};
