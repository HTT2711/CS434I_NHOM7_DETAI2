let ioInstance = null;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Customer joins a room for their table
    socket.on('join-table', (tableId) => {
      socket.join(`table-${tableId}`);
      console.log(`[Socket] ${socket.id} joined room table-${tableId}`);
    });

    // Staff/Kitchen/Cashier joins staff room
    socket.on('join-staff', () => {
      socket.join('staff-room');
      console.log(`[Socket] ${socket.id} joined staff-room`);
    });

    // Customer calls waiter
    socket.on('call-waiter', (data) => {
      ioInstance.to('staff-room').emit('waiter-called', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  return ioInstance;
};

module.exports = {
  initSocket,
  getIO,
};
