import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '', salary: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            const res = await authService.register({
                name: form.name,
                email: form.email,
                password: form.password,
                salary: parseFloat(form.salary) || 0
            });

            console.log('Register response:', res);

            // Backend: { success, message, data: { token, id, name, email, salary } }
            const userData = res.data;

            if (!userData || !userData.token) {
                setError('Registration failed — invalid response.');
                return;
            }

            login(userData.token, userData);
            navigate('/');
        } catch (err) {
            console.error('Register error:', err?.response?.data || err.message);
            setError(err?.response?.data?.message ||
                'Registration failed. Please try again.');
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
            <div style={{ width: '100%', maxWidth: '420px' }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
                        Create Account 🚀
                    </h3>
                    <p style={{
                        fontSize: '12px', color: '#94a3b8',
                        marginBottom: '20px'
                    }}>
                        Start managing your finances smarter
                    </p>

                    {/* Error */}
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
                        {/* Full Name */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{
                                fontSize: '12px', fontWeight: '600',
                                color: '#374151', display: 'block', marginBottom: '4px'
                            }}>
                                Full Name
                            </label>
                            <input type="text" name="name" required
                                placeholder="John Doe"
                                value={form.name} onChange={handleChange}
                                style={{
                                    width: '100%', padding: '9px 12px',
                                    borderRadius: '8px', border: '1.5px solid #e2e8f0',
                                    fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                                }}
                                onFocus={e => e.target.style.borderColor = '#0d6efd'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* Email */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{
                                fontSize: '12px', fontWeight: '600',
                                color: '#374151', display: 'block', marginBottom: '4px'
                            }}>
                                Email Address
                            </label>
                            <input type="email" name="email" required
                                placeholder="name@example.com"
                                value={form.email} onChange={handleChange}
                                style={{
                                    width: '100%', padding: '9px 12px',
                                    borderRadius: '8px', border: '1.5px solid #e2e8f0',
                                    fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                                }}
                                onFocus={e => e.target.style.borderColor = '#0d6efd'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* Salary */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{
                                fontSize: '12px', fontWeight: '600',
                                color: '#374151', display: 'block', marginBottom: '4px'
                            }}>
                                Monthly Salary (₹)
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{
                                    padding: '9px 10px', backgroundColor: '#f8fafc',
                                    border: '1.5px solid #e2e8f0', borderRight: 'none',
                                    borderRadius: '8px 0 0 8px', fontSize: '13px', color: '#64748b'
                                }}>₹</span>
                                <input type="number" name="salary" required min="0"
                                    placeholder="50000"
                                    value={form.salary} onChange={handleChange}
                                    style={{
                                        flex: 1, padding: '9px 12px',
                                        borderRadius: '0 8px 8px 0',
                                        border: '1.5px solid #e2e8f0',
                                        fontSize: '13px', outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#0d6efd'}
                                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{
                                fontSize: '12px', fontWeight: '600',
                                color: '#374151', display: 'block', marginBottom: '4px'
                            }}>
                                Password
                            </label>
                            <input type="password" name="password" required
                                placeholder="Min. 6 characters"
                                value={form.password} onChange={handleChange}
                                style={{
                                    width: '100%', padding: '9px 12px',
                                    borderRadius: '8px', border: '1.5px solid #e2e8f0',
                                    fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                                }}
                                onFocus={e => e.target.style.borderColor = '#0d6efd'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                fontSize: '12px', fontWeight: '600',
                                color: '#374151', display: 'block', marginBottom: '4px'
                            }}>
                                Confirm Password
                            </label>
                            <input type="password" name="confirmPassword" required
                                placeholder="Repeat password"
                                value={form.confirmPassword} onChange={handleChange}
                                style={{
                                    width: '100%', padding: '9px 12px',
                                    borderRadius: '8px',
                                    border: `1.5px solid ${form.confirmPassword && form.password !== form.confirmPassword ? '#ef4444' : '#e2e8f0'}`,
                                    fontSize: '13px', outline: 'none', boxSizing: 'border-box'
                                }}
                                onFocus={e => e.target.style.borderColor = '#0d6efd'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                            {form.confirmPassword && form.password !== form.confirmPassword && (
                                <p style={{ fontSize: '11px', color: '#ef4444', margin: '3px 0 0' }}>
                                    Passwords do not match
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '10px',
                                borderRadius: '8px', border: 'none',
                                backgroundColor: loading ? '#93c5fd' : '#0d6efd',
                                color: '#fff', fontSize: '13px', fontWeight: '700',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '6px'
                            }}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"
                                        role="status"></span>
                                    Creating account...
                                </>
                            ) : 'Create Account →'}
                        </button>
                    </form>

                    <p style={{
                        textAlign: 'center', fontSize: '12px',
                        color: '#64748b', marginTop: '16px', marginBottom: 0
                    }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{
                            color: '#0d6efd', fontWeight: '700',
                            textDecoration: 'none'
                        }}>
                            Sign In
                        </Link>
                    </p>
                </div>

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

export default Register;