import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [], children }) => {
    const { user, loading, isAuthenticated } = useAuth();

    // While AuthContext is initializing or fetching profile, show loader
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader"></div>
                <p>A carregar acesso...</p>
                <style>{`
                    .loading-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 80vh;
                        gap: 1rem;
                        color: var(--text-secondary);
                    }
                    .loader {
                        width: 40px;
                        height: 40px;
                        border: 3px solid var(--border-color);
                        border-top-color: var(--accent-primary);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }

    // [New Check] Unvalidated Trainers
    if (user?.role === 'trainer' && !user.isValidated && window.location.pathname !== '/pending-approval') {
        return <Navigate to="/pending-approval" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        // If user is authenticated but doesn't have the role, 
        // they shouldn't be here. Redirect to home where dashboard logic lives.
        return <Navigate to="/" replace />;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
