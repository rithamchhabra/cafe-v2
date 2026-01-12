import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Coffee } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { cartCount } = useCart();
    const { storeStatus } = useStore();
    const location = useLocation();

    const navLinks = [
        { title: 'Home', path: '/' },
        { title: 'Menu', path: '/menu' },
        { title: 'Cart', path: '/cart' },
    ];

    return (
        <nav className="glass-card" style={{
            position: 'fixed',
            top: '15px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '1000px',
            zIndex: 1000,
            padding: '10px 25px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.4rem', color: 'var(--primary)' }}>
                <Coffee size={28} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>Cafe V2</span>
                    <span style={{
                        fontSize: '0.65rem',
                        color: storeStatus.isOpen ? '#2ecc71' : '#e74c3c',
                        marginTop: '-5px',
                        fontWeight: '800'
                    }}>
                        ● {storeStatus.isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                </div>
            </Link>

            {/* Desktop Menu */}
            <div style={{ display: 'none', gap: '30px' }} className="desktop-menu">
                {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        style={{
                            fontWeight: '500',
                            color: location.pathname === link.path ? 'var(--primary)' : 'var(--text)',
                            position: 'relative',
                            padding: '5px 0'
                        }}
                    >
                        {link.title}
                        {link.path === '/cart' && cartCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-18px',
                                background: 'var(--primary)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link to="/cart" style={{ position: 'relative' }}>
                    <ShoppingCart size={24} />
                    {cartCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            background: 'var(--primary)',
                            color: 'white',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {cartCount}
                        </span>
                    )}
                </Link>

                <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)} style={{ display: 'block' }}>
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="glass-card" style={{
                    position: 'absolute',
                    top: '70px',
                    left: '0',
                    width: '100%',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            style={{
                                fontSize: '1.2rem',
                                fontWeight: '600',
                                color: location.pathname === link.path ? 'var(--primary)' : 'var(--text)'
                            }}
                        >
                            {link.title}
                        </Link>
                    ))}
                </div>
            )}

            <style>{`
        @media (min-width: 768px) {
          .desktop-menu { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
        </nav>
    );
};

export default Navbar;
