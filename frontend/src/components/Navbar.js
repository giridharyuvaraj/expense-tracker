import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const pageTitles = {
    '/':              { title: 'Dashboard',     subtitle: 'Overview of your finances',        icon: 'bi-speedometer2',      color: '#0d6efd' },
    '/expenses':      { title: 'Expenses',      subtitle: 'Track your daily spending',         icon: 'bi-cash-coin',         color: '#f97316' },
    '/loans':         { title: 'Loans',         subtitle: 'Manage your loans & EMIs',          icon: 'bi-bank',              color: '#8b5cf6' },
    '/budgets':       { title: 'Budgets',       subtitle: 'Set and monitor spending limits',    icon: 'bi-sliders',           color: '#059669' },
    '/analytics':     { title: 'Analytics',     subtitle: 'Insights into your finances',        icon: 'bi-graph-up-arrow',    color: '#0891b2' },
    '/savings':       { title: 'Savings Goals', subtitle: 'Track your savings progress',        icon: 'bi-piggy-bank',        color: '#16a34a' },
    '/lending':       { title: 'Lending',       subtitle: 'Track money lent to others',         icon: 'bi-person-lines-fill', color: '#dc2626' },
    '/chatbot':       { title: 'AI Advisor',    subtitle: 'Get smart financial advice',         icon: 'bi-robot',             color: '#7c3aed' },
    '/profile':       { title: 'Profile',       subtitle: 'Manage your account settings',       icon: 'bi-person-circle',     color: '#0d6efd' },
    '/notifications': { title: 'Notifications', subtitle: 'Your alerts and reminders',          icon: 'bi-bell',              color: '#f97316' },
};

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllRead, fetchNotifications } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    const page = pageTitles[location.pathname] || pageTitles['/'];

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 992);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target))
                setShowNotifications(false);
            if (profileRef.current && !profileRef.current.contains(e.target))
                setShowProfile(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    useEffect(() => {
        if (showNotifications) fetchNotifications();
    }, [showNotifications]);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getAvatarColor = (name) => {
        const colors = ['#0d6efd', '#7c3aed', '#059669', '#dc2626', '#d97706'];
        return colors[(name?.charCodeAt(0) || 0) % colors.length];
    };

    const getNotifIcon = (type) => {
        const icons = {
            BUDGET_ALERT: { icon: 'bi-exclamation-triangle-fill', color: '#f97316' },
            LOAN_DUE:     { icon: 'bi-bank',                      color: '#8b5cf6' },
            REMINDER:     { icon: 'bi-clock-fill',                color: '#0891b2' },
            SUGGESTION:   { icon: 'bi-lightbulb-fill',            color: '#eab308' },
        };
        return icons[type] || { icon: 'bi-bell-fill', color: '#0d6efd' };
    };

    const getTimeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        if (hrs < 24) return `${hrs}h ago`;
        return `${days}d ago`;
    };

    const recentNotifs = notifications?.slice(0, 5) || [];

    return (
        <div style={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 16px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            gap: '8px'
        }}>

            {/* Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>

                {/* Hamburger — visible on tablet/mobile */}
                {isMobile && (
                    <button
                        onClick={onMenuClick}
                        style={{
                            width: '34px', height: '34px', flexShrink: 0,
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}>
                        <i className="bi bi-list" style={{ fontSize: '18px', color: '#64748b' }}></i>
                    </button>
                )}

                {/* Page icon + title */}
                <div style={{
                    width: '32px', height: '32px', flexShrink: 0,
                    borderRadius: '8px',
                    backgroundColor: page.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: page.color, fontSize: '15px'
                }}>
                    <i className={`bi ${page.icon}`}></i>
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{
                        fontWeight: '700', fontSize: isMobile ? '13px' : '15px',
                        color: '#0f172a', lineHeight: 1.2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                        {page.title}
                    </div>
                    {!isMobile && (
                        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1 }}>
                            {page.subtitle}
                        </div>
                    )}
                </div>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>

                {/* Date pill — hidden on mobile */}
                {!isMobile && (
                    <div style={{
                        padding: '4px 10px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '20px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px', color: '#64748b',
                        display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        <i className="bi bi-calendar3" style={{ color: '#0d6efd' }}></i>
                        {new Date().toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                        })}
                    </div>
                )}

                {/* Notification Bell */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowProfile(false);
                        }}
                        style={{
                            width: '34px', height: '34px',
                            borderRadius: '9px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', position: 'relative'
                        }}>
                        <i className="bi bi-bell" style={{ fontSize: '14px', color: '#64748b' }}></i>
                        {unreadCount > 0 && (
                            <div style={{
                                position: 'absolute', top: '3px', right: '3px',
                                width: '15px', height: '15px', borderRadius: '50%',
                                backgroundColor: '#ef4444', color: '#fff',
                                fontSize: '8px', fontWeight: '700',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid #fff'
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div style={{
                            position: 'fixed',
                            right: isMobile ? '8px' : '16px',
                            top: '60px',
                            width: isMobile ? 'calc(100vw - 16px)' : '340px',
                            backgroundColor: '#fff',
                            borderRadius: '14px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            border: '1px solid #e2e8f0',
                            zIndex: 1000, overflow: 'hidden'
                        }}>
                            <div style={{
                                padding: '12px 14px',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                                        Notifications
                                    </span>
                                    {unreadCount > 0 && (
                                        <span style={{
                                            marginLeft: '8px', backgroundColor: '#ef4444',
                                            color: '#fff', fontSize: '10px', fontWeight: '700',
                                            padding: '1px 6px', borderRadius: '10px'
                                        }}>
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button onClick={markAllRead} style={{
                                        background: 'none', border: 'none',
                                        color: '#0d6efd', fontSize: '11px',
                                        fontWeight: '600', cursor: 'pointer'
                                    }}>
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                                {recentNotifs.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>🔔</div>
                                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                                            No notifications yet
                                        </div>
                                    </div>
                                ) : recentNotifs.map(notif => {
                                    const { icon, color } = getNotifIcon(notif.type);
                                    return (
                                        <div key={notif.id} onClick={() => markAsRead(notif.id)}
                                            style={{
                                                padding: '10px 14px',
                                                display: 'flex', gap: '10px',
                                                backgroundColor: notif.read ? '#fff' : '#f8faff',
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: 'pointer'
                                            }}>
                                            <div style={{
                                                width: '30px', height: '30px', flexShrink: 0,
                                                borderRadius: '8px',
                                                backgroundColor: color + '15',
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'center',
                                                color, fontSize: '13px'
                                            }}>
                                                <i className={`bi ${icon}`}></i>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{
                                                    fontWeight: notif.read ? '500' : '700',
                                                    fontSize: '12px', color: '#0f172a',
                                                    marginBottom: '1px'
                                                }}>
                                                    {notif.title}
                                                </div>
                                                <div style={{
                                                    fontSize: '11px', color: '#64748b',
                                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {notif.message}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                                    {getTimeAgo(notif.createdAt)}
                                                </div>
                                            </div>
                                            {!notif.read && (
                                                <div style={{
                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                    backgroundColor: '#0d6efd', flexShrink: 0,
                                                    marginTop: '4px'
                                                }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {/* <div style={{ padding: '8px 14px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                                <button onClick={() => { navigate('/notifications'); setShowNotifications(false); }}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: '#0d6efd', fontSize: '12px',
                                        fontWeight: '600', cursor: 'pointer'
                                    }}>
                                    View all →
                                </button>
                            </div> */}
                        </div>
                    )}
                </div>

                {/* Profile Button */}
                <div ref={profileRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                        style={{
                            display: 'flex', alignItems: 'center',
                            gap: isMobile ? '0' : '7px',
                            padding: isMobile ? '3px' : '3px 8px 3px 3px',
                            borderRadius: '30px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#fff',
                            cursor: 'pointer'
                        }}>
                        <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            backgroundColor: getAvatarColor(user?.name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: '700', fontSize: '11px', flexShrink: 0
                        }}>
                            {getInitials(user?.name)}
                        </div>
                        {!isMobile && (
                            <>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{
                                        fontSize: '12px', fontWeight: '700',
                                        color: '#0f172a', lineHeight: 1.2
                                    }}>
                                        {user?.name || 'User'}
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1 }}>
                                        {user?.email?.split('@')[0] || ''}
                                    </div>
                                </div>
                                <i className="bi bi-chevron-down" style={{
                                    fontSize: '10px', color: '#94a3b8',
                                    transform: showProfile ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform 0.2s'
                                }}></i>
                            </>
                        )}
                    </button>

                    {/* Profile Dropdown */}
                    {showProfile && (
                        <div style={{
                            position: 'fixed',
                            right: isMobile ? '8px' : '16px',
                            top: '60px',
                            width: isMobile ? 'calc(100vw - 16px)' : '220px',
                            backgroundColor: '#fff',
                            borderRadius: '14px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                            border: '1px solid #e2e8f0',
                            zIndex: 1000, overflow: 'hidden'
                        }}>
                            {/* User info */}
                            <div style={{
                                padding: '12px 14px',
                                borderBottom: '1px solid #f1f5f9',
                                backgroundColor: '#f8fafc'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        backgroundColor: getAvatarColor(user?.name),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fff', fontWeight: '700', fontSize: '13px'
                                    }}>
                                        {getInitials(user?.name)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                                            {user?.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>
                                {user?.salary && (
                                    <div style={{
                                        marginTop: '8px', padding: '5px 8px',
                                        backgroundColor: '#dcfce7', borderRadius: '7px',
                                        display: 'flex', justifyContent: 'space-between'
                                    }}>
                                        <span style={{ fontSize: '11px', color: '#166534' }}>Salary</span>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>
                                            ₹{parseFloat(user.salary).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Menu items */}
                            <div style={{ padding: '5px' }}>
                                {[
                                    { icon: 'bi-person-circle', label: 'My Profile',   path: '/profile',   color: '#0d6efd' },
                                    { icon: 'bi-bell',          label: 'Notifications',path: '/notifications', color: '#f97316' },
                                    { icon: 'bi-graph-up',      label: 'Analytics',    path: '/analytics', color: '#0891b2' },
                                    { icon: 'bi-robot',         label: 'AI Advisor',   path: '/chatbot',   color: '#7c3aed' },
                                ].map(item => (
                                    <div key={item.path}
                                        onClick={() => { navigate(item.path); setShowProfile(false); }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '9px',
                                            padding: '8px 9px', borderRadius: '7px', cursor: 'pointer'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <div style={{
                                            width: '26px', height: '26px', borderRadius: '7px',
                                            backgroundColor: item.color + '15',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: item.color, fontSize: '12px'
                                        }}>
                                            <i className={`bi ${item.icon}`}></i>
                                        </div>
                                        <span style={{ fontSize: '12.5px', color: '#334155' }}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Logout */}
                            <div style={{ padding: '5px', borderTop: '1px solid #f1f5f9' }}>
                                <div onClick={() => { logout(); setShowProfile(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '9px',
                                        padding: '8px 9px', borderRadius: '7px', cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <div style={{
                                        width: '26px', height: '26px', borderRadius: '7px',
                                        backgroundColor: '#fef2f2',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#ef4444', fontSize: '12px'
                                    }}>
                                        <i className="bi bi-box-arrow-right"></i>
                                    </div>
                                    <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#ef4444' }}>
                                        Sign Out
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;