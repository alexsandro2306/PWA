import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { user, isAuthenticated, updateUser } = useAuth();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Apply theme to document
    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Apply user's saved theme on login
    useEffect(() => {
        if (user?.theme && user.theme !== theme) {
            setTheme(user.theme);
        }
    }, [user?.theme]);

    // Toggle theme and sync with backend
    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);

        // Update backend if user is authenticated
        if (isAuthenticated) {
            try {
                await api.patch('/users/me', { theme: newTheme });
                // Update user context
                updateUser({ theme: newTheme });
            } catch (error) {
                console.error('Erro ao atualizar tema no backend:', error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
