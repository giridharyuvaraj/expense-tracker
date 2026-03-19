import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { path: '/',          icon: 'bi-speedometer2',      label: 'Dashboard',  color: '#0d6efd' },
    { path: '/expenses',  icon: 'bi-cash-coin',         label: 'Expenses',   color: '#f97316' },
    { path: '/loans',     icon: 'bi-bank',              label: 'Loans',      color: '#8b5cf6' },
    { path: '/budgets',   icon: 'bi-sliders',           label: 'Budgets',    color: '#059669' },
    { path: '/analytics', icon: 'bi-graph-up-arrow',    label: 'Analytics',  color: '#0891b2' },
    { path: '/savings',   icon: 'bi-piggy-bank',        label: 'Savings',    color: '#16a34a' },
    { path: '/lending',   icon: 'bi-person-lines-fill', label: 'Lending',    color: '#dc2626' },
    { path: '/chatbot',   icon: 'bi-robot',             label: 'AI Advisor', color: '#7c3aed', isAI: true },
];

const Sidebar = ({ onClose }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 992;
            setIsMobile(mobile);
            if (!mobile) setCollapsed(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar on route change on mobile
    useEffect(() => {
        if (isMobile && onClose) onClose();
    }, [location.pathname]);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getAvatarColor = (name) => {
        const colors = ['#0d6efd', '#7c3aed', '#059669', '#dc2626', '#d97706'];
        return colors[(name?.charCodeAt(0) || 0) % colors.length];
    };

    const W = collapsed && !isMobile ? '64px' : '220px';

    return (
        <div style={{
            width: W,
            height: '100vh',
            backgroundColor: '#0f172a',
            transition: 'width 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            overflowX: 'hidden',
            flexShrink: 0
        }}>

            {/* Logo Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
                padding: collapsed && !isMobile ? '12px 0' : '12px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                minHeight: '56px',
                flexShrink: 0
            }}>
                <div style={{
                    width: '30px', height: '30px', flexShrink: 0,
                    background: 'linear-gradient(135deg, #0d6efd, #7c3aed)',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px'
                }}>💰</div>

                {(!collapsed || isMobile) && (
                    <div style={{ marginLeft: '8px', flex: 1 }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '13px', lineHeight: 1.2 }}>
                            ExpenseAI
                        </div>
                        <div style={{ color: '#475569', fontSize: '10px' }}>Smart Finance</div>
                    </div>
                )}

                {/* Desktop collapse / Mobile close */}
                {(!collapsed || isMobile) && (
                    <button
                        onClick={isMobile ? onClose : () => setCollapsed(true)}
                        style={{
                            background: 'none', border: 'none',
                            color: '#475569', cursor: 'pointer',
                            padding: '4px', fontSize: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '6px'
                        }}>
                        <i className={isMobile ? 'bi bi-x-lg' : 'bi bi-layout-sidebar-reverse'}></i>
                    </button>
                )}
            </div>

            {/* Desktop expand when collapsed */}
            {collapsed && !isMobile && (
                <button onClick={() => setCollapsed(false)} style={{
                    background: 'none', border: 'none',
                    color: '#475569', cursor: 'pointer',
                    padding: '8px 0', fontSize: '14px',
                    width: '100%', flexShrink: 0
                }}>
                    <i className="bi bi-layout-sidebar"></i>
                </button>
            )}

            {/* User Info */}
            <div style={{ flexShrink: 0 }}>
                {(!collapsed || isMobile) ? (
                    <div style={{
                        margin: '8px 10px', padding: '10px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                backgroundColor: getAvatarColor(user?.name),
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: '700', fontSize: '12px', flexShrink: 0
                            }}>
                                {getInitials(user?.name)}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{
                                    color: '#fff', fontWeight: '600', fontSize: '12px',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                    {user?.name || 'User'}
                                </div>
                                <div style={{
                                    color: '#64748b', fontSize: '10px',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                    {user?.email || ''}
                                </div>
                            </div>
                        </div>
                        {user?.salary && (
                            <div style={{
                                marginTop: '8px', paddingTop: '8px',
                                borderTop: '1px solid rgba(255,255,255,0.07)',
                                display: 'flex', justifyContent: 'space-between'
                            }}>
                                <span style={{ color: '#64748b', fontSize: '10px' }}>Salary</span>
                                <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '11px' }}>
                                    ₹{parseFloat(user.salary).toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: getAvatarColor(user?.name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: '700', fontSize: '12px'
                        }}>
                            {getInitials(user?.name)}
                        </div>
                    </div>
                )}
            </div>

            {/* Section label */}
            {(!collapsed || isMobile) && (
                <div style={{
                    padding: '6px 14px 4px',
                    color: '#334155', fontSize: '9px',
                    fontWeight: '700', letterSpacing: '1.2px', flexShrink: 0
                }}>
                    MAIN MENU
                </div>
            )}

            {/* Nav Items */}
            <nav style={{
                flex: 1, padding: '0 6px',
                overflowY: 'auto', overflowX: 'hidden',
                scrollbarWidth: 'none', msOverflowStyle: 'none'
            }}>
                <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const showLabel = !collapsed || isMobile;
                    return (
                        <NavLink key={item.path} to={item.path}
                            style={{ textDecoration: 'none', display: 'block' }}>
                            <div
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: !showLabel ? '8px 0' : '7px 8px',
                                    justifyContent: !showLabel ? 'center' : 'flex-start',
                                    borderRadius: '8px', marginBottom: '2px',
                                    backgroundColor: isActive ? item.color + '20' : 'transparent',
                                    border: isActive ? `1px solid ${item.color}40` : '1px solid transparent',
                                    transition: 'all 0.15s', position: 'relative', cursor: 'pointer'
                                }}
                                onMouseEnter={e => {
                                    if (!isActive)
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                }}
                                onMouseLeave={e => {
                                    if (!isActive)
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                }}>

                                {isActive && (
                                    <div style={{
                                        position: 'absolute', left: 0,
                                        top: '20%', width: '3px', height: '60%',
                                        backgroundColor: item.color,
                                        borderRadius: '0 3px 3px 0'
                                    }} />
                                )}

                                <div style={{
                                    width: '28px', height: '28px', flexShrink: 0,
                                    borderRadius: '7px',
                                    backgroundColor: isActive ? item.color + '30' : 'rgba(255,255,255,0.06)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isActive ? item.color : '#64748b',
                                    fontSize: '13px', transition: 'all 0.15s'
                                }}>
                                    <i className={`bi ${item.icon}`}></i>
                                </div>

                                {showLabel && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', flex: 1
                                    }}>
                                        <span style={{
                                            fontSize: '12.5px',
                                            fontWeight: isActive ? '700' : '500',
                                            color: isActive ? '#fff' : '#94a3b8',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {item.label}
                                        </span>
                                        {item.isAI && (
                                            <span style={{
                                                fontSize: '8px', fontWeight: '700',
                                                background: 'linear-gradient(135deg, #7c3aed, #0d6efd)',
                                                color: '#fff', padding: '1px 6px',
                                                borderRadius: '10px'
                                            }}>AI</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div style={{
                padding: '8px 6px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0
            }}>
                <NavLink to="/profile" style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: !collapsed || isMobile ? '7px 8px' : '8px 0',
                            justifyContent: !collapsed || isMobile ? 'flex-start' : 'center',
                            borderRadius: '8px', marginBottom: '2px', cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{
                            width: '28px', height: '28px', flexShrink: 0, borderRadius: '7px',
                            backgroundColor: 'rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#64748b', fontSize: '13px'
                        }}>
                            <i className="bi bi-person-circle"></i>
                        </div>
                        {(!collapsed || isMobile) && (
                            <span style={{ fontSize: '12.5px', fontWeight: '500', color: '#94a3b8' }}>
                                Profile
                            </span>
                        )}
                    </div>
                </NavLink>

                <div onClick={logout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: !collapsed || isMobile ? '7px 8px' : '8px 0',
                        justifyContent: !collapsed || isMobile ? 'flex-start' : 'center',
                        borderRadius: '8px', cursor: 'pointer'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <div style={{
                        width: '28px', height: '28px', flexShrink: 0, borderRadius: '7px',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#ef4444', fontSize: '13px'
                    }}>
                        <i className="bi bi-box-arrow-right"></i>
                    </div>
                    {(!collapsed || isMobile) && (
                        <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#ef4444' }}>
                            Logout
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;