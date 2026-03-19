import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authService.login(credentials);
            console.log('Login response:', res);

            // Backend: { success, message, data: { token, id, name, email, salary } }
            const userData = res.data;

            if (!userData || !userData.token) {
                setError('Login failed — invalid response from server.');
                return;
            }

            login(userData.token, userData);
            navigate('/');
        } catch (err) {
            console.error('Login error:', err?.response?.data || err.message);
            setError(err?.response?.data?.message ||
                'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0d6efd 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0d6efd, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px', margin: '0 auto 12px'
                    }}>💰</div>
                    <h2 style={{
                        color: '#fff', fontWeight: '800',
                        fontSize: '1.5rem', margin: 0
                    }}>
                        ExpenseAI
                    </h2>
                    <p style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '12px', margin: '4px 0 0'
                    }}>
                        Smart Finance Manager
                    </p>
                </div>

                {/* Card */}
                <div style={{
                    backgroundColor: '#fff', borderRadius: '16px',
                    padding: '28px 24px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    <h3 style={{
                        fontSize: '1.1rem', fontWeight: '800',
                        color: '#0f172a', marginBottom: '2px'
                    }}>
                        Welcome back 👋
                    </h3>
                    <p style={{
                        fontSize: '12px', color: '#94a3b8',
                        marginBottom: '20px'
                    }}>
                        Sign in to manage your finances
                    </p>

                    {/* Error Alert */}
                    {error && (
                        <div style={{
                            padding: '8px 12px', borderRadius: '8px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626', fontSize: '12px',
                            marginBottom: '16px',
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: '14px' }}>
                            <label style={{
                                fontSize: '12px', fontWeight: '600',
                                color: '#374151', display: 'block',
                                marginBottom: '5px'
                            }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="name@example.com"
                                value={credentials.email}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '9px 12px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '13px', outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border 0.15s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#0d6efd'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                fontSize: '12px', fontWeight: '600',
                                color: '#374151', display: 'block',
                                marginBottom: '5px'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                required
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={handleChange}
                                style={{
                                    width: '100%', padding: '9px 12px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '13px', outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border 0.15s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#0d6efd'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', padding: '10px',
                                borderRadius: '8px', border: 'none',
                                backgroundColor: loading ? '#93c5fd' : '#0d6efd',
                                color: '#fff', fontSize: '13px',
                                fontWeight: '700',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '6px'
                            }}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"
                                        role="status"></span>
                                    Signing in...
                                </>
                            ) : (
                                <>Sign In →</>
                            )}
                        </button>
                    </form>

                    <p style={{
                        textAlign: 'center', fontSize: '12px',
                        color: '#64748b', marginTop: '16px', marginBottom: 0
                    }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{
                            color: '#0d6efd', fontWeight: '700',
                            textDecoration: 'none'
                        }}>
                            Create Account
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p style={{
                    textAlign: 'center', fontSize: '11px',
                    color: 'rgba(255,255,255,0.3)', marginTop: '16px'
                }}>
                    🔒 Your data is secure and encrypted
                </p>
            </div>
        </div>
    );
};

export default Login;