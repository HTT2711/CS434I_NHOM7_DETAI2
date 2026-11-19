const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./modules/auth/auth.route');
const tableRoutes = require('./modules/tables/table.route');
const menuRoutes = require('./modules/menu/menu.route');
const orderRoutes = require('./modules/orders/order.route');
const invoiceRoutes = require('./modules/invoices/invoice.route');
const reportRoutes = require('./modules/reports/report.route');

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
