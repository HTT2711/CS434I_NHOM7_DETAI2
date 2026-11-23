const prisma = require('../../config/db');

const DEFAULT_SETTINGS = {
  vatRate: '8',
  discountLimitPercent: '10',
};

const getSettings = async () => {
  const allSettings = await prisma.setting.findMany();
  const settingsMap = { ...DEFAULT_SETTINGS };

  for (const item of allSettings) {
    settingsMap[item.key] = item.value;
  }

  return {
    vatRate: Number(settingsMap.vatRate) || 8,
    discountLimitPercent: Number(settingsMap.discountLimitPercent) || 10,
  };
};

const updateSettings = async (data, userId) => {
  const result = {};

  if (data.vatRate !== undefined) {
    const vatRate = Math.min(100, Math.max(0, Number(data.vatRate) || 0));
    await prisma.setting.upsert({
      where: { key: 'vatRate' },
      update: { value: String(vatRate) },
      create: { key: 'vatRate', value: String(vatRate) },
    });
    result.vatRate = vatRate;
  }

  if (data.discountLimitPercent !== undefined) {
    const discountLimit = Math.min(100, Math.max(0, Number(data.discountLimitPercent) || 0));
    await prisma.setting.upsert({
      where: { key: 'discountLimitPercent' },
      update: { value: String(discountLimit) },
      create: { key: 'discountLimitPercent', value: String(discountLimit) },
    });
    result.discountLimitPercent = discountLimit;
  }

  // Record audit log
  await prisma.auditLog.create({
    data: {
      userId: userId ? Number(userId) : null,
      action: 'UPDATE_SETTINGS',
      entityType: 'SETTINGS',
      detail: JSON.stringify(result),
    },
  });

  return await getSettings();
};

module.exports = {
  getSettings,
  updateSettings,
};
