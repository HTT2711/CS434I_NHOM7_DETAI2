require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Tasty House POS Server running on port ${PORT} `);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
