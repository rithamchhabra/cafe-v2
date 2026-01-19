import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { isStoreOpen } from '../utils/orderHelpers';

const StoreContext = createContext({
    storeStatus: {
        isOpen: false,
        message: "",
        openTime: "09:00",
        closeTime: "22:00"
    },
    loading: true
});

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
    // Default safe values
    const [settings, setSettings] = useState({
        isOpen: true, // Manual toggle override
        message: '',
        openTime: '10:00',
        closeTime: '22:00'
    });

    const [loading, setLoading] = useState(true);
    // Calculated status based on current time AND manual toggle
    const [isActuallyOpen, setIsActuallyOpen] = useState(false);

    // 1. Listen to Firestore changes
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // console.log("Store Settings Parsed:", data); // Debug log
                setSettings(prev => ({
                    ...prev,
                    ...data
                }));
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching store settings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 2. Periodically check time to update 'isActuallyOpen'
    useEffect(() => {
        const checkStatus = () => {
            // Store is open ONLY if:
            // 1. Manual toggle (isOpen) is TRUE
            // 2. Current time is within openTime and closeTime
            // Note: If isOpen is false (manually closed), it overrides the schedule.

            const scheduleOpen = isStoreOpen(settings.openTime, settings.closeTime);
            const finalStatus = settings.isOpen !== false && scheduleOpen;

            setIsActuallyOpen(finalStatus);
        };

        // Run immediately when settings change
        checkStatus();

        // Run every 10 seconds to keep UI fresh
        const timer = setInterval(checkStatus, 10000);

        return () => clearInterval(timer);
    }, [settings]);

    const storeStatus = {
        ...settings,
        isOpen: isActuallyOpen,       // The calculated "real" status (used for UI badges)
        scheduleOpen: isStoreOpen(settings.openTime, settings.closeTime), // Just the schedule status
        isManualOpen: settings.isOpen // The manual toggle switch status
    };

    return (
        <StoreContext.Provider value={{ storeStatus, loading }}>
            {children}
        </StoreContext.Provider>
    );
};
