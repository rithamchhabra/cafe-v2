import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) return null; // Or a loading spinner

    if (!currentUser) {
        return <Navigate to="/admin" />;
    }

    return children;
};

export default ProtectedRoute;
