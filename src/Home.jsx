import React from 'react';
import Hero from './components/HeroSection';
import { useCart } from './context/CartContext';
import { ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
    const { cartCount } = useCart();

    return (
        <div className="animate-fade-in">
            <Hero />

            {/* Featured Section */}
            <section className="container" style={{ padding: '40px 20px' }}>
                <div className="glass-card" style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #27ae60 100%)',
                    color: 'white'
                }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Hungry? Let's fix that.</h2>
                    <p style={{ marginBottom: '30px', opacity: 0.9 }}>Browse our catalog and choose from our delicious variety of food items.</p>
                    <Link to="/menu" className="btn-primary" style={{ background: 'white', color: 'var(--primary)' }}>
                        Exlpore Full Menu
                    </Link>
                </div>
            </section>

            {/* Floating Cart Button for Mobile */}
            {cartCount > 0 && (
                <Link to="/cart" style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    background: 'var(--primary)',
                    color: 'white',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(46, 204, 113, 0.4)',
                    zIndex: 999
                }}>
                    <ShoppingBag size={24} />
                    <span style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: 'white',
                        color: 'var(--primary)',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {cartCount}
                    </span>
                </Link>
            )}
        </div>
    );
};

export default Home;
