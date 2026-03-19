import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch { return null; }
    });
    const [token, setToken] = useState(localStorage.getItem('token'));

    const login = (newToken, userData) => {
        const actualToken = newToken || userData?.token;
        const actualUser = userData;
        setToken(actualToken);
        setUser(actualUser);
        localStorage.setItem('token', actualToken);
        localStorage.setItem('user', JSON.stringify(actualUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const isAuthenticated = () => !!token;

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);