require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(` Tasty House POS Server running on port ${PORT} `);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

// Giữ tiến trình server chạy ngầm ổn định, không bị tắt khi stdin đóng
if (process.stdin.resume) {
  process.stdin.resume();
}
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
