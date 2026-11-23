const settingsService = require('./settings.service');

const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getSettings();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const data = await settingsService.updateSettings(req.body, req.user?.id);
    res.json({
      success: true,
      message: 'Cập nhật cấu hình thành công',
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
