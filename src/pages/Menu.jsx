import React, { useState, useEffect } from 'react';
import { Plus, Minus, Info, Leaf, Loader2, Search, ChevronLeft, ChevronRight, Play, Image as ImageIcon, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useStore } from '../context/StoreContext';
import { getOptimizedImageUrl } from '../utils/imageHelpers';

// Media Viewer Component for multi-image/video support
const MediaViewer = ({ media, fallbackImage, itemName }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isError, setIsError] = useState(false);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Normalize media list
    const mediaList = media && media.length > 0 ? media : (fallbackImage ? [{ url: fallbackImage, type: 'image' }] : []);

    if (mediaList.length === 0 || isError) {
        return (
            <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={48} color="var(--text-light)" style={{ opacity: 0.3 }} />
            </div>
        );
    }

    const currentMedia = mediaList[currentIndex];

    const nextMedia = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % mediaList.length);
    };

    const prevMedia = (e) => {
        if (e) e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
    };

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            setCurrentIndex((prev) => (prev + 1) % mediaList.length);
        } else if (isRightSwipe) {
            setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
        }

        setTouchStart(null);
        setTouchEnd(null);
    };
    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {currentMedia.type === 'image' ? (
                <img
                    src={getOptimizedImageUrl(currentMedia.url, 600)}
                    alt={`${itemName} ${currentIndex + 1}`}
                    onError={() => setIsError(true)}
                    loading="lazy"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'all 0.3s ease',
                        objectPosition: `center ${currentMedia.yPos || 50}%`
                    }}
                    className="media-fix"
                />
            ) : (
                <video
                    src={currentMedia.url}
                    autoPlay
                    muted={currentMedia.muted !== false}
                    loop
                    playsInline
                    onError={() => setIsError(true)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    className="media-fix"
                />
            )}

            {mediaList.length > 1 && (
                <>
                    <button
                        onClick={prevMedia}
                        style={{ position: 'absolute', left: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={nextMedia}
                        style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                    >
                        <ChevronRight size={16} />
                    </button>
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', zIndex: 10 }}>
                        {mediaList.map((_, i) => (
                            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentIndex ? 'var(--primary)' : 'rgba(255,255,255,0.8)' }}></div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const MenuSkeleton = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '10px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card" style={{ padding: '15px', height: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="skeleton" style={{ height: '220px', borderRadius: '12px', background: 'rgba(0,0,0,0.05)' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ height: '20px', width: '60%', background: 'rgba(0,0,0,0.05)' }}></div>
                    <div className="skeleton" style={{ height: '20px', width: '20%', background: 'rgba(0,0,0,0.05)' }}></div>
                </div>
                <div className="skeleton" style={{ height: '40px', background: 'rgba(0,0,0,0.05)' }}></div>
                <div className="skeleton" style={{ height: '45px', marginTop: 'auto', borderRadius: '30px', background: 'rgba(0,0,0,0.05)' }}></div>
            </div>
        ))}
    </div>
);

const Menu = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [menuItems, setMenuItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const { cart, addToCart, updateQuantity, removeFromCart, cartCount, cartTotal } = useCart();
    const { storeStatus } = useStore();

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'menu'), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMenuItems(items);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching menu:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const categories = ['All', ...new Set(menuItems.map(item => item.category))];

    const filteredItems = menuItems.filter(item => {
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getItemQuantity = (id) => {
        const item = cart.find(i => i.id === id);
        return item ? item.quantity : 0;
    };

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <div className="skeleton" style={{ height: '40px', width: '250px', margin: '0 auto 15px', background: 'rgba(0,0,0,0.05)' }}></div>
                    <div className="skeleton" style={{ height: '20px', width: '200px', margin: '0 auto', background: 'rgba(0,0,0,0.05)' }}></div>
                </div>
                <MenuSkeleton />
            </div>
        );
    }

    return (
        <div style={{ paddingTop: '120px', paddingBottom: '80px' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '15px' }}>Our Delicious <span style={{ color: 'var(--primary)' }}>Menu</span></h2>
                    <p style={{ color: 'var(--text-light)', maxWidth: '600px', margin: '0 auto' }}>Explore our range of fresh snacks, heavy meals, and refreshing drinks.</p>
                </div>

                {/* Store Closed Banner */}
                {!storeStatus.isOpen && (
                    <div className="glass-card" style={{
                        background: 'rgba(231, 76, 60, 0.1)',
                        border: '1px solid #e74c3c',
                        padding: '15px',
                        borderRadius: '12px',
                        marginBottom: '30px',
                        textAlign: 'center',
                        color: '#e74c3c'
                    }}>
                        <p style={{ fontWeight: 'bold' }}>{storeStatus.message || "We are currently closed. You can browse the menu but cannot place orders right now."}</p>
                    </div>
                )}

                {/* Search Bar */}
                <div style={{
                    maxWidth: '500px',
                    margin: '0 auto 30px',
                    position: 'relative'
                }}>
                    <Search
                        size={20}
                        style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
                    />
                    <input
                        type="text"
                        placeholder="Search for dishes, snacks or drinks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '15px 15px 15px 50px',
                            borderRadius: '30px',
                            border: '1px solid var(--glass-border)',
                            background: 'white',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                    />
                </div>

                {/* Categories */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '30px',
                    flexWrap: 'wrap',
                    padding: '0 10px'
                }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className="glass-card"
                            style={{
                                padding: '10px 25px',
                                fontWeight: '600',
                                border: activeCategory === cat ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                background: activeCategory === cat ? 'white' : 'var(--glass)',
                                color: activeCategory === cat ? 'var(--primary)' : 'var(--text)',
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <style>
                    {`
                        .menu-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                            gap: 20px;
                            padding: 0 10px;
                            justify-content: center;
                        }
                        @media (max-width: 768px) {
                            .menu-grid {
                                grid-template-columns: repeat(2, 1fr);
                                gap: 10px;
                                padding: 0 5px;
                            }
                            .menu-item-card {
                                padding: 10px !important;
                            }
                            .menu-item-image {
                                height: 140px !important;
                            }
                            .menu-item-title {
                                fontSize: 1rem !important;
                            }
                            .menu-item-price {
                                fontSize: 1rem !important;
                            }
                            .menu-item-desc {
                                fontSize: 0.8rem !important;
                                display: -webkit-box;
                                -webkit-line-clamp: 2;
                                -webkit-box-orient: vertical;
                                overflow: hidden;
                                margin-bottom: 10px !important;
                            }
                        }
                    `}
                </style>

                {/* Menu Grid */}
                <div className="menu-grid">
                    {filteredItems.map(item => (
                        <div key={item.id} className="glass-card animate-fade-in menu-item-card" style={{
                            padding: '15px',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.3s ease'
                        }}>
                            <div className="menu-item-image" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', height: '220px', marginBottom: '15px' }}>
                                <MediaViewer media={item.media} fallbackImage={item.image} itemName={item.name} />
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    background: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                    zIndex: 5
                                }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: item.isVeg ? '#2ecc71' : '#e74c3c'
                                    }}></div>
                                    {item.isVeg ? 'VEG' : 'NON-VEG'}
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '5px' }}>
                                    <h3 className="menu-item-title" style={{ fontSize: '1.2rem', fontWeight: '700' }}>{item.name}</h3>
                                    <span className="menu-item-price" style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.2rem' }}>₹{item.price}</span>
                                </div>
                                <p className="menu-item-desc" style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '20px' }}>{item.description}</p>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                {getItemQuantity(item.id) > 0 ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '20px',
                                        background: 'var(--bg)',
                                        padding: '8px',
                                        borderRadius: '30px',
                                        opacity: storeStatus.isOpen ? 1 : 0.6
                                    }}>
                                        <button
                                            onClick={() => {
                                                if (getItemQuantity(item.id) <= 1) {
                                                    removeFromCart(item.id);
                                                } else {
                                                    updateQuantity(item.id, -1);
                                                }
                                            }}
                                            style={{ color: 'var(--primary)' }}
                                            disabled={!storeStatus.isOpen}
                                        >
                                            <Minus size={20} />
                                        </button>
                                        <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{getItemQuantity(item.id)}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            style={{ color: 'var(--primary)' }}
                                            disabled={!storeStatus.isOpen}
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => addToCart({ ...item, price: parseFloat(item.price) || 0 })}
                                        className="btn-primary"
                                        style={{
                                            width: '100%',
                                            justifyContent: 'center',
                                            opacity: storeStatus.isOpen ? 1 : 0.6,
                                            cursor: storeStatus.isOpen ? 'pointer' : 'not-allowed'
                                        }}
                                        disabled={!storeStatus.isOpen}
                                    >
                                        {storeStatus.isOpen ? 'Add to Cart' : 'Closed'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Floating Cart Button */}
                {cartCount > 0 && (
                    <Link
                        to="/cart"
                        style={{
                            position: 'fixed',
                            bottom: '30px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '12px 25px',
                            borderRadius: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 25px rgba(230, 126, 34, 0.4)',
                            zIndex: 1000,
                            textDecoration: 'none',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        }}
                        className="floating-cart-btn"
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                    >
                        <div style={{ position: 'relative' }}>
                            <ShoppingBag size={24} />
                            <span style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: 'white',
                                color: 'var(--primary)',
                                fontSize: '0.7rem',
                                fontWeight: '900',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid var(--primary)'
                            }}>
                                {cartCount}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.9 }}>View Cart</span>
                            <span style={{ fontSize: '1rem', fontWeight: '800' }}>₹{cartTotal}</span>
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default Menu;
