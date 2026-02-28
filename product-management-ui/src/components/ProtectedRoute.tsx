import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    const role = authService.getRole();

    if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Redirect to the user's own dashboard
        return <Navigate to={authService.getRolePath()} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
