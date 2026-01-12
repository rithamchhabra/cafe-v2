import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <Router>
            <div className="App">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Routes>

              <footer style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-light)',
                fontSize: '0.9rem',
                borderTop: '1px solid var(--glass-border)',
                marginTop: '50px'
              }}>
                <p>&copy; {new Date().getFullYear()} Cafe V2. All rights reserved.</p>
                <p style={{ marginTop: '10px', fontSize: '0.8rem', opacity: 0.8 }}>
                  Powered by <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>MARKETINGNITI</span>
                </p>
              </footer>
            </div>
          </Router>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
