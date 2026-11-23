const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const os = require('os');

const authRoutes = require('./modules/auth/auth.route');
const tableRoutes = require('./modules/tables/table.route');
const menuRoutes = require('./modules/menu/menu.route');
const orderRoutes = require('./modules/orders/order.route');
const invoiceRoutes = require('./modules/invoices/invoice.route');
const reportRoutes = require('./modules/reports/report.route');
const supportRoutes = require('./modules/support-requests/support.route');
const reservationRoutes = require('./modules/reservations/reservation.route');
const promotionRoutes = require('./modules/promotions/promotion.route');
const settingsRoutes = require('./modules/settings/settings.route');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Tasty House POS API',
    timestamp: new Date().toISOString(),
  });
});

// Module routes
app.use('/api/auth', authRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/support-requests', supportRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/settings', settingsRoutes);

// Endpoint lấy IP Wi-Fi mạng hiện tại tự động
app.get('/api/network-info', (req, res) => {
  const interfaces = os.networkInterfaces();
  let wifiIp = null;
  let fallbackIp = null;

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (/wi-fi|wlan|wireless/i.test(name)) {
          wifiIp = iface.address;
        } else if (!fallbackIp && !/radmin|vethernet|virtual|loopback/i.test(name)) {
          fallbackIp = iface.address;
        }
      }
    }
  }

  const detectedIp = wifiIp || fallbackIp || 'localhost';
  res.json({
    success: true,
    data: {
      ip: detectedIp,
      port: 5173,
      fullAddress: `${detectedIp}:5173`,
    },
  });
});

// Catch-all 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn ${req.originalUrl} không tồn tại`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Lỗi hệ thống máy chủ',
  });
});

module.exports = app;
