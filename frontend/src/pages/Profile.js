import React, { useState } from 'react';
import { Row, Col, Card, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
    const { user, login } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: user?.name || '',
        salary: user?.salary || ''
    });
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getAvatarColor = (name) => {
        const colors = ['#0d6efd', '#7c3aed', '#059669', '#dc2626', '#d97706'];
        return colors[(name?.charCodeAt(0) || 0) % colors.length];
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(''); setSuccess('');
        try {
            const res = await api.put('/profile', {
                name: form.name,
                salary: parseFloat(form.salary)
            });
            const updated = res.data.data;
            login(localStorage.getItem('token'), { ...user, ...updated });
            setSuccess('Profile updated successfully!');
            setEditMode(false);
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwError('New passwords do not match.'); return;
        }
        setPwLoading(true);
        setPwError(''); setPwSuccess('');
        try {
            await api.put('/profile/password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword
            });
            setPwSuccess('Password changed successfully!');
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwError(err?.response?.data?.message || 'Failed to change password.');
        } finally {
            setPwLoading(false);
        }
    };

    const stats = [
        { label: 'Monthly Salary', value: `₹${parseFloat(user?.salary || 0).toLocaleString('en-IN')}`, color: '#16a34a', icon: '💰' },
        { label: 'Currency',       value: 'INR (₹)',    color: '#0d6efd', icon: '🏦' },
        { label: 'Status',         value: 'Active ✓',   color: '#059669', icon: '✅' },
        { label: 'Member Since',   value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A', color: '#8b5cf6', icon: '📅' },
    ];

    return (
        <div style={{ fontSize: '13px' }}>

            {/* Header */}
            <div style={{ marginBottom: '14px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>My Profile</h2>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Manage your account details</p>
            </div>

            <Row className="g-3">
                {/* Left — Avatar + Stats */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '12px' }}>
                        <Card.Body style={{ padding: '24px 16px' }}>
                            {/* Avatar */}
                            <div style={{
                                width: '70px', height: '70px', borderRadius: '50%',
                                backgroundColor: getAvatarColor(user?.name),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: '800', fontSize: '24px',
                                margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                {getInitials(user?.name)}
                            </div>
                            <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                                {user?.name}
                            </h4>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '16px' }}>{user?.email}</p>

                            {/* Stats */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {stats.map((s, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '7px 10px', borderRadius: '8px', backgroundColor: '#f8fafc',
                                        border: '1px solid #f1f5f9'
                                    }}>
                                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                                            {s.icon} {s.label}
                                        </span>
                                        <span style={{ fontSize: '11.5px', fontWeight: '700', color: s.color }}>
                                            {s.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Right — Edit Forms */}
                <Col md={8}>
                    {/* Profile Details */}
                    <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                        <Card.Body style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                    <i className="bi bi-person-circle me-2 text-primary"></i>Account Details
                                </span>
                                <button
                                    onClick={() => { setEditMode(!editMode); setError(''); setSuccess(''); }}
                                    style={{
                                        padding: '3px 12px', borderRadius: '20px', fontSize: '11px',
                                        border: '1px solid #e2e8f0', backgroundColor: editMode ? '#f1f5f9' : 'white',
                                        color: '#64748b', cursor: 'pointer', fontWeight: '600'
                                    }}>
                                    {editMode ? '✕ Cancel' : '✏️ Edit'}
                                </button>
                            </div>

                            {success && (
                                <Alert variant="success" className="py-2 mb-2" style={{ fontSize: '12px' }}>
                                    <i className="bi bi-check-circle me-1"></i>{success}
                                </Alert>
                            )}
                            {error && (
                                <Alert variant="danger" className="py-2 mb-2" style={{ fontSize: '12px' }}>
                                    <i className="bi bi-exclamation-triangle me-1"></i>{error}
                                </Alert>
                            )}

                            {!editMode ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {[
                                        { label: 'Full Name', value: user?.name },
                                        { label: 'Email Address', value: user?.email },
                                        { label: 'Monthly Salary', value: `₹${parseFloat(user?.salary || 0).toLocaleString('en-IN')}` },
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            padding: '8px 10px', borderRadius: '8px', backgroundColor: '#f8fafc',
                                            border: '1px solid #f1f5f9'
                                        }}>
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>{item.label}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Form onSubmit={handleUpdateProfile}>
                                    <div style={{ marginBottom: '8px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                            Full Name
                                        </label>
                                        <input type="text" required className="form-control form-control-sm"
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            style={{ fontSize: '12px' }} />
                                    </div>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                            Monthly Salary (₹)
                                        </label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text" style={{ fontSize: '12px' }}>₹</span>
                                            <input type="number" required className="form-control"
                                                value={form.salary}
                                                onChange={e => setForm({ ...form, salary: e.target.value })}
                                                style={{ fontSize: '12px' }} />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading}
                                        style={{
                                            padding: '5px 18px', borderRadius: '20px', border: 'none',
                                            backgroundColor: '#0d6efd', color: '#fff',
                                            fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                            opacity: loading ? 0.7 : 1
                                        }}>
                                        {loading ? (
                                            <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Saving...</>
                                        ) : (
                                            <><i className="bi bi-check-circle me-1"></i>Save Changes</>
                                        )}
                                    </button>
                                </Form>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Change Password */}
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                        <Card.Body style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                                <i className="bi bi-shield-lock me-2 text-primary"></i>Change Password
                            </div>

                            {pwSuccess && (
                                <Alert variant="success" className="py-2 mb-2" style={{ fontSize: '12px' }}>
                                    <i className="bi bi-check-circle me-1"></i>{pwSuccess}
                                </Alert>
                            )}
                            {pwError && (
                                <Alert variant="danger" className="py-2 mb-2" style={{ fontSize: '12px' }}>
                                    <i className="bi bi-exclamation-triangle me-1"></i>{pwError}
                                </Alert>
                            )}

                            <Form onSubmit={handleChangePassword}>
                                <Row className="g-2 mb-2">
                                    <Col md={12}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                            Current Password
                                        </label>
                                        <input type="password" required className="form-control form-control-sm"
                                            placeholder="Enter current password"
                                            value={pwForm.currentPassword}
                                            onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                                            style={{ fontSize: '12px' }} />
                                    </Col>
                                    <Col md={6}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                            New Password
                                        </label>
                                        <input type="password" required className="form-control form-control-sm"
                                            placeholder="New password"
                                            value={pwForm.newPassword}
                                            onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                            style={{ fontSize: '12px' }} />
                                    </Col>
                                    <Col md={6}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                            Confirm Password
                                        </label>
                                        <input type="password" required className="form-control form-control-sm"
                                            placeholder="Confirm new password"
                                            value={pwForm.confirmPassword}
                                            onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                            style={{ fontSize: '12px' }} />
                                    </Col>
                                </Row>

                                {pwForm.newPassword && pwForm.confirmPassword && (
                                    <div style={{
                                        padding: '5px 10px', borderRadius: '6px', marginBottom: '8px', fontSize: '11px',
                                        backgroundColor: pwForm.newPassword === pwForm.confirmPassword ? '#dcfce7' : '#fef2f2',
                                        color: pwForm.newPassword === pwForm.confirmPassword ? '#16a34a' : '#dc2626'
                                    }}>
                                        {pwForm.newPassword === pwForm.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                                    </div>
                                )}

                                <button type="submit" disabled={pwLoading}
                                    style={{
                                        padding: '5px 18px', borderRadius: '20px', border: 'none',
                                        backgroundColor: '#7c3aed', color: '#fff',
                                        fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                                        opacity: pwLoading ? 0.7 : 1
                                    }}>
                                    {pwLoading ? (
                                        <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Updating...</>
                                    ) : (
                                        <><i className="bi bi-shield-check me-1"></i>Change Password</>
                                    )}
                                </button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Profile;