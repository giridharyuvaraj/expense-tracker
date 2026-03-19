import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Loans from './pages/Loans';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import Savings from './pages/Savings';
import Lending from './pages/Lending';
import Chatbot from './pages/Chatbot';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

const AppLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed', inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 200,
                        display: 'none'
                    }}
                    className="mobile-overlay"
                />
            )}

            {/* Sidebar */}
            <div
                className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}
                style={{ flexShrink: 0 }}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main content */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0
            }}>
                <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 20px',
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={
                isAuthenticated() ? <Navigate to="/" replace /> : <Login />
            } />
            <Route path="/register" element={
                isAuthenticated() ? <Navigate to="/" replace /> : <Register />
            } />
            <Route path="/" element={
                <PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>
            } />
            <Route path="/expenses" element={
                <PrivateRoute><AppLayout><Expenses /></AppLayout></PrivateRoute>
            } />
            <Route path="/loans" element={
                <PrivateRoute><AppLayout><Loans /></AppLayout></PrivateRoute>
            } />
            <Route path="/budgets" element={
                <PrivateRoute><AppLayout><Budgets /></AppLayout></PrivateRoute>
            } />
            <Route path="/analytics" element={
                <PrivateRoute><AppLayout><Analytics /></AppLayout></PrivateRoute>
            } />
            <Route path="/savings" element={
                <PrivateRoute><AppLayout><Savings /></AppLayout></PrivateRoute>
            } />
            <Route path="/lending" element={
                <PrivateRoute><AppLayout><Lending /></AppLayout></PrivateRoute>
            } />
            <Route path="/chatbot" element={
                <PrivateRoute><AppLayout><Chatbot /></AppLayout></PrivateRoute>
            } />
            <Route path="/profile" element={
                <PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>
            } />
        </Routes>
    );
};

const App = () => (
    <Router>
        <AuthProvider>
            <NotificationProvider>
                <AppRoutes />
            </NotificationProvider>
        </AuthProvider>
    </Router>
);

export default App;