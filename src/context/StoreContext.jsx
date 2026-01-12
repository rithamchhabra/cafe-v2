import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { isStoreOpen } from '../utils/orderHelpers';

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        isOpen: true, // This is the manual toggle from Admin
        message: '',
        openTime: '10:00',
        closeTime: '22:00'
    });
    const [loading, setLoading] = useState(true);
    const [isActuallyOpen, setIsActuallyOpen] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSettings(prev => ({ ...prev, ...data }));

                // Immediate check after data load
                const openStatus = data.isOpen !== false && isStoreOpen(data.openTime || '10:00', data.closeTime || '22:00');
                setIsActuallyOpen(openStatus);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching store status:", error);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Effect to update status every minute
    useEffect(() => {
        const timer = setInterval(() => {
            const openStatus = settings.isOpen !== false && isStoreOpen(settings.openTime, settings.closeTime);
            if (openStatus !== isActuallyOpen) {
                setIsActuallyOpen(openStatus);
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(timer);
    }, [settings, isActuallyOpen]);

    const storeStatus = {
        ...settings,
        isOpen: isActuallyOpen,
        isManualOpen: settings.isOpen // Keep reference to manual toggle
    };

    return (
        <StoreContext.Provider value={{ storeStatus, loading }}>
            {children}
        </StoreContext.Provider>
    );
};
