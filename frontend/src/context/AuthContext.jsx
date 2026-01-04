import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const fetchUserProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
        } catch (err) {
            console.error('Erro ao buscar perfil:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                    setLoading(false);
                } else {
                    // Start with decoded data so UI responds immediately
                    setUser(decoded);
                    // Then fetch full profile for roles/metadata
                    fetchUserProfile();
                }
            } catch (err) {
                logout();
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials) => {
        // ✅ Se já recebeu token e user (QR Code), não faz pedido!
        if (credentials.token && credentials.user) {
            localStorage.setItem('token', credentials.token);
            setUser(credentials.user);
            return credentials.user;
        }

        // ✅ Se não, faz login normal (username/password)
        const response = await api.post('/auth/login', credentials);
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        setUser(userData);
        return userData;
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
