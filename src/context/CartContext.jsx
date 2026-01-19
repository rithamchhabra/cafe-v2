import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cafe_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error("Error reading from localStorage:", error);
            return [];
        }
    });



    // Ensure state updates triggered by cart changes
    useEffect(() => {
        try {
            localStorage.setItem('cafe_cart', JSON.stringify(cart));
        } catch (error) {
            console.error("Error saving to localStorage:", error);
        }
    }, [cart]);

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id);
            const price = parseFloat(product.price) || 0;

            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: (parseInt(item.quantity) || 0) + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, price: price, quantity: 1 }];
        });
    };

    const removeFromCart = (id) => {
        setCart((prev) => prev.filter((item) => String(item.id) !== String(id)));
    };

    const updateQuantity = (id, delta) => {
        setCart((prevCart) => {
            return prevCart.map(item => {
                if (item.id === id) {
                    const currentQty = parseInt(item.quantity) || 0;
                    const newQty = Math.max(0, currentQty + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const clearCart = () => setCart([]);

    const [cartTotal, setCartTotal] = useState(0);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        const newTotal = cart.reduce((total, item) => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 0;
            return total + (price * qty);
        }, 0);
        setCartTotal(newTotal);

        const newCount = cart.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
        setCartCount(newCount);
    }, [cart]);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
