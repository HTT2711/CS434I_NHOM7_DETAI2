import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
