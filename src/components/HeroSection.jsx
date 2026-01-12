import React from 'react';
import { ShoppingBag, ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useStore } from '../context/StoreContext';
import { formatTime } from '../utils/orderHelpers';

const Hero = () => {
    const { storeStatus } = useStore();

    return (
        <section style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            paddingTop: '100px',
            paddingBottom: '50px'
        }}>
            {/* Background Decorative Elements */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '500px',
                height: '500px',
                background: 'var(--primary)',
                filter: 'blur(150px)',
                opacity: '0.15',
                borderRadius: '50%',
                zIndex: -1
            }} />

            <div className="container hero-flex" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '40px',
                alignItems: 'center',
                textAlign: 'center'
            }}>
                <style>
                    {`
                        @media (min-width: 768px) {
                            .hero-content { text-align: left !important; }
                            .hero-flex { flex-direction: row !important; gap: 50px !important; }
                            .hero-badge { left: -20px !important; bottom: 30px !important; }
                            .hero-btns { justify-content: flex-start !important; }
                        }
                        @media (max-width: 767px) {
                            .hero-badge { left: 50% !important; bottom: -20px !important; transform: translateX(-50%); width: max-content; }
                            .hero-btns { justify-content: center !important; }
                        }
                    `}
                </style>
                <div className="animate-fade-in hero-content" style={{ width: '100%', maxWidth: '600px' }}>
                    <span style={{
                        background: 'rgba(46, 204, 113, 0.1)',
                        color: 'var(--primary)',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        marginBottom: '20px',
                        display: 'inline-block'
                    }}>
                        Welcome to Cafe V2
                    </span>
                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                        lineHeight: '1.1',
                        marginBottom: '25px',
                        fontWeight: '800'
                    }}>
                        Delicious Food for <br />
                        <span style={{ color: 'var(--primary)' }}>Every Mood</span>
                    </h1>
                    <p style={{
                        fontSize: '1.2rem',
                        color: 'var(--text-light)',
                        marginBottom: '40px',
                        maxWidth: '500px'
                    }}>
                        Experience the perfect blend of taste and innovation. Order your favorite snacks and meals online with just a click.
                    </p>

                    <div className="hero-btns" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '10px' }}>
                        <Link to="/menu" className="btn-primary">
                            <ShoppingBag size={20} />
                            Order Now
                        </Link>
                        <Link to="/menu" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: '600',
                            padding: '12px 24px'
                        }}>
                            <div style={{
                                width: '45px',
                                height: '45px',
                                borderRadius: '50%',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}>
                                <Play size={18} fill="currentColor" />
                            </div>
                            See Menu
                        </Link>
                    </div>
                </div>

                <div className="animate-fade-in" style={{ position: 'relative', animationDelay: '0.2s' }}>
                    <div className="glass-card" style={{ padding: '15px', position: 'relative', zIndex: 1 }}>
                        <img
                            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000"
                            alt="Delicious Food"
                            style={{
                                width: '100%',
                                borderRadius: '12px',
                                display: 'block',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                            }}
                        />
                    </div>
                    {/* Floating badge */}
                    <div className="glass-card hero-badge" style={{
                        position: 'absolute',
                        padding: '12px 20px',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            background: storeStatus.isOpen ? '#2ecc71' : '#e74c3c',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%'
                        }}></div>
                        <div>
                            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                {storeStatus.isOpen ? 'Open Now' : 'Closed Now'}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                {storeStatus.isOpen
                                    ? `${formatTime(storeStatus.openTime) || '10 AM'} - ${formatTime(storeStatus.closeTime) || '10 PM'}`
                                    : 'Will open tomorrow'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
