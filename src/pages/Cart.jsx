import React, { useState } from 'react';
import { ShoppingBag, Trash2, ArrowLeft, Send, CheckCircle, Minus, Plus, AlertCircle, X, Coffee, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { BUSINESS_DETAILS } from '../data/menuData';
import { formatWhatsAppMessage, generateUPILink, getUPIQRCode } from '../utils/orderHelpers';
import { getOptimizedImageUrl } from '../utils/imageHelpers';

const Cart = () => {
    const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
    const { storeStatus } = useStore();
    const [orderDetails, setOrderDetails] = useState({
        name: '',
        phone: '',
        address: '',
        type: 'delivery',
        tableNumber: ''
    });
    const [isOrdered, setIsOrdered] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [lastOrderDetails, setLastOrderDetails] = useState(null);

    const handleInputChange = (e) => {
        setOrderDetails({ ...orderDetails, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = () => {
        if (!orderDetails.name || !orderDetails.phone) {
            setErrorMessage("Please enter your Name and Phone Number to proceed.");
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        if (orderDetails.type === 'dining' && !orderDetails.tableNumber) {
            setErrorMessage("Please enter your Table Number for Dining.");
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        const waMessage = formatWhatsAppMessage(cart, orderDetails, cartTotal, BUSINESS_DETAILS);
        const waLink = `https://wa.me/${BUSINESS_DETAILS.whatsapp}?text=${waMessage}`;

        setLastOrderDetails({ total: cartTotal });
        window.open(waLink, '_blank');
        setIsOrdered(true);
        clearCart();
    };

    if (isOrdered) {
        return (
            <div className="container" style={{ paddingTop: '150px', textAlign: 'center' }}>
                <div className="glass-card" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
                    <CheckCircle size={80} color="#4cd137" style={{ marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Order Sent!</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>
                        Your order details have been drafted on WhatsApp. Please send the message to confirm properly.
                    </p>

                    {/* QR Code on Success Page */}
                    <div style={{
                        marginTop: '20px',
                        padding: '20px',
                        background: 'rgba(255,255,255,0.5)',
                        borderRadius: '20px',
                        border: '1px solid var(--glass-border)',
                        marginBottom: '30px'
                    }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '15px' }}>Scan to Pay Now</p>
                        <div style={{ width: '180px', height: '180px', margin: '0 auto', background: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src={getUPIQRCode(BUSINESS_DETAILS.upiId, BUSINESS_DETAILS.name, lastOrderDetails?.total || 0)}
                                alt="UPI QR"
                                style={{ width: '160px', height: '160px' }}
                            />
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: '900', marginTop: '15px', color: 'var(--primary)' }}>₹{lastOrderDetails?.total || 0}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <a
                            href={generateUPILink(BUSINESS_DETAILS.upiId, BUSINESS_DETAILS.name, lastOrderDetails?.total || 0)}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                background: '#00b894',
                                border: 'none',
                                textDecoration: 'none'
                            }}
                        >
                            <CreditCard size={20} /> Pay Now (UPI)
                        </a>

                        <Link to="/" className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>Back to Home</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="container" style={{ paddingTop: '150px', textAlign: 'center' }}>
                <div className="glass-card" style={{ padding: '60px' }}>
                    <ShoppingBag size={80} color="var(--text-light)" style={{ marginBottom: '20px', opacity: 0.3 }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Your Cart is Empty</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>Looks like you haven't added anything yet.</p>
                    <Link to="/menu" className="btn-primary">Browse Menu</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px', position: 'relative' }}>

            {/* Error Popup */}
            {errorMessage && (
                <div className="animate-fade-in" style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 2000,
                    width: '90%',
                    maxWidth: '400px'
                }}>
                    <div className="glass-card" style={{
                        padding: '15px 20px',
                        background: 'rgba(231, 76, 60, 0.95)',
                        border: '1px solid #c0392b',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <AlertCircle size={24} color="white" />
                        <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: '500', flex: 1 }}>{errorMessage}</p>
                        <button onClick={() => setErrorMessage('')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '5px' }}>
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', justifyItems: 'center', justifyContent: 'center' }}>

                {/* Cart Items */}
                <div style={{ width: '100%', maxWidth: '600px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '25px' }}>Your <span style={{ color: 'var(--primary)' }}>Selection</span></h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {cart.map(item => (
                            <div key={item.id} className="glass-card" style={{ padding: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                {/* Product Image with fallback */}
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    background: 'rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {item.image || (item.media && item.media.length > 0) ? (
                                        <img
                                            src={getOptimizedImageUrl(item.image || item.media[0]?.url, 200)}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-light); opacity: 0.3;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                                            }}
                                        />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-light)', opacity: 0.3 }}>
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <polyline points="21 15 16 10 5 21"></polyline>
                                        </svg>
                                    )}
                                </div>

                                {/* Product Details */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{
                                        fontWeight: '700',
                                        marginBottom: '5px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>{item.name}</h4>
                                    <p style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold' }}>₹{item.price}</p>
                                </div>

                                {/* Quantity Controls */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: 'var(--bg)',
                                    padding: '8px 12px',
                                    borderRadius: '25px',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (item.quantity <= 1) {
                                                removeFromCart(item.id);
                                            } else {
                                                updateQuantity(item.id, -1);
                                            }
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            background: item.quantity === 1 ? 'rgba(231, 76, 60, 0.1)' : 'white',
                                            border: item.quantity === 1 ? '1px solid #e74c3c' : '1px solid var(--glass-border)',
                                            color: item.quantity === 1 ? '#e74c3c' : 'var(--text)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {item.quantity === 1 ? (
                                            <Trash2 size={14} />
                                        ) : (
                                            <Minus size={14} />
                                        )}
                                    </button>
                                    <span style={{ fontWeight: 'bold', fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            updateQuantity(item.id, 1);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            background: 'var(--primary)',
                                            border: 'none',
                                            color: 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card" style={{ marginTop: '20px', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>Subtotal</span>
                            <span style={{ fontWeight: 'bold' }}>₹{cartTotal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span>Taxes & Charges</span>
                            <span style={{ fontWeight: 'bold' }}>₹0</span>
                        </div>
                        <hr style={{ margin: '15px 0', opacity: 0.1 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem' }}>
                            <span style={{ fontWeight: '800' }}>Total</span>
                            <span style={{ fontWeight: '800', color: 'var(--primary)' }}>₹{cartTotal}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div style={{ width: '100%', maxWidth: '600px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '25px' }}>Order <span style={{ color: 'var(--primary)' }}>Details</span></h2>
                    <div className="glass-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Ex. Rahul Kumar"
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,1)' }}
                                onChange={handleInputChange}
                                value={orderDetails.name}
                                maxLength={50}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Mobile Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Ex. 9876543210"
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,1)' }}
                                onChange={handleInputChange}
                                value={orderDetails.phone}
                                maxLength={10}
                                pattern="[0-9]{10}"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Order Type</label>
                            <select
                                name="type"
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,1)' }}
                                onChange={handleInputChange}
                                value={orderDetails.type}
                            >
                                <option value="delivery">Home Delivery</option>
                                <option value="takeaway">Takeaway</option>
                                <option value="dining">Dining</option>
                            </select>
                        </div>
                        {orderDetails.type === 'dining' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Table Number *</label>
                                <input
                                    type="text"
                                    name="tableNumber"
                                    placeholder="Enter your Table Number"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,1)' }}
                                    onChange={handleInputChange}
                                    value={orderDetails.tableNumber}
                                    required={orderDetails.type === 'dining'}
                                />
                            </div>
                        )}
                        {orderDetails.type === 'delivery' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Delivery Address</label>
                                <textarea
                                    name="address"
                                    placeholder="Street name, House no, Landmark"
                                    rows="3"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,1)', resize: 'none' }}
                                    onChange={handleInputChange}
                                    value={orderDetails.address}
                                    maxLength={200}
                                    required={orderDetails.type === 'delivery'}
                                ></textarea>
                            </div>
                        )}

                        {/* Store Closed Banner */}
                        {!storeStatus.isOpen && (
                            <div className="glass-card" style={{
                                background: 'rgba(231, 76, 60, 0.1)',
                                border: '1px solid #e74c3c',
                                padding: '12px',
                                borderRadius: '10px',
                                marginBottom: '15px',
                                textAlign: 'center',
                                color: '#e74c3c',
                                fontSize: '0.9rem'
                            }}>
                                <p style={{ fontWeight: 'bold' }}>Store is currently closed for orders.</p>
                            </div>
                        )}

                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '15px' }}>
                                By clicking below, you'll be redirected to WhatsApp to send the order details.
                            </p>
                            <button
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    fontSize: '1.2rem',
                                    justifyContent: 'center',
                                    opacity: storeStatus.isOpen ? 1 : 0.6,
                                    cursor: storeStatus.isOpen ? 'pointer' : 'not-allowed'
                                }}
                                onClick={handlePlaceOrder}
                                disabled={!storeStatus.isOpen}
                            >
                                {storeStatus.isOpen ? 'Place Order' : 'Closed'}
                                <Send size={20} />
                            </button>
                        </div>



                        {/* Show QR Code */}
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '10px' }}>scan to pay</p>
                            <div style={{ background: 'white', padding: '15px', display: 'inline-block', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                <img
                                    src={getUPIQRCode(BUSINESS_DETAILS.upiId, BUSINESS_DETAILS.name, cartTotal)}
                                    alt="UPI QR"
                                    style={{ width: '150px', height: '150px' }}
                                />
                                <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '10px', color: '#000' }}>₹{cartTotal}</p>
                            </div>
                            <p style={{ marginTop: '15px', fontSize: '0.9rem', color: 'var(--text)', fontWeight: '600' }}>
                                You can pay by scanning this QR code
                            </p>
                            <a
                                href={generateUPILink(BUSINESS_DETAILS.upiId, BUSINESS_DETAILS.name, cartTotal)}
                                className="btn-primary"
                                style={{
                                    marginTop: '15px',
                                    width: '100%',
                                    justifyContent: 'center',
                                    background: '#00b894',
                                    padding: '12px',
                                    fontSize: '1rem',
                                    textDecoration: 'none'
                                }}
                            >
                                <CreditCard size={18} /> Pay via UPI App
                            </a>
                        </div>

                        {/* How to Order */}
                        <div style={{
                            marginTop: '30px',
                            padding: '20px',
                            background: 'rgba(46, 204, 113, 0.05)',
                            borderRadius: '15px',
                            border: '1px dashed var(--primary)',
                            textAlign: 'left'
                        }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={18} color="var(--primary)" /> How to Order?
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <span style={{ background: 'var(--primary)', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>1</span>
                                    <p style={{ margin: 0 }}>Add items to your cart.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <span style={{ background: 'var(--primary)', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>2</span>
                                    <p style={{ margin: 0 }}>Fill in your details, click <b>"Place Order"</b> and send the message on WhatsApp.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <span style={{ background: 'var(--primary)', color: 'white', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>3</span>
                                    <p style={{ margin: 0 }}>Complete the payment by scanning the <b>QR code</b> shown above.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
