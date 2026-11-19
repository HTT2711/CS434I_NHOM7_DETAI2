const authService = require('./auth.service');
const { sendSuccess, sendError } = require('../../utils/response.util');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return sendError(res, 'Vui lòng nhập tài khoản và mật khẩu', 400);
    }
    const result = await authService.login(username, password);
    return sendSuccess(res, result, 'Đăng nhập thành công');
  } catch (error) {
    return sendError(res, error.message, 401);
  }
};

const register = async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;
    if (!username || !password || !fullName) {
      return sendError(res, 'Vui lòng điền đầy đủ thông tin', 400);
    }
    const result = await authService.register({ username, password, fullName, role });
    return sendSuccess(res, result, 'Tạo tài khoản thành công', 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    return sendSuccess(res, users, 'Lấy danh sách người dùng thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await authService.updateUser(req.params.id, req.body);
    return sendSuccess(res, user, 'Cập nhật tài khoản thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const user = await authService.toggleUserActive(req.params.id);
    return sendSuccess(res, user, 'Cập nhật trạng thái kích hoạt thành công');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return sendSuccess(res, user, 'Lấy thông tin người dùng thành công');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  login,
  register,
  getAllUsers,
  updateUser,
  toggleUserActive,
  getMe,
};
