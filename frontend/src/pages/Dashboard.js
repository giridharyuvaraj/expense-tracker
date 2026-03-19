import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend,
    AreaChart, Area
} from 'recharts';
import analyticsService from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                backgroundColor: '#fff', border: '1px solid #e2e8f0',
                borderRadius: '8px', padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px'
            }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#0f172a' }}>{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ margin: '2px 0', color: p.color }}>
                        ₹{(p.value || 0).toLocaleString('en-IN')}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState({
        salary: 0, totalEMI: 0, totalExpenses: 0, savings: 0
    });
    const [monthlyData, setMonthlyData] = useState([]);
    const [insights, setInsights] = useState([]);
    const [loans, setLoans] = useState([]);
    const [lending, setLending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [breakdownRes, comparisonRes, insightsRes, loansRes, lendingRes] =
                    await Promise.allSettled([
                        analyticsService.getBreakdown(),
                        analyticsService.getComparison(),
                        analyticsService.getInsights(),
                        api.get('/loans'),
                        api.get('/lending'),
                    ]);

                if (breakdownRes.status === 'fulfilled')
                    setSummary(breakdownRes.value.data.data || {});
                if (comparisonRes.status === 'fulfilled')
                    setMonthlyData(comparisonRes.value.data.data || []);
                if (insightsRes.status === 'fulfilled')
                    setInsights(insightsRes.value.data.data || []);
                if (loansRes.status === 'fulfilled')
                    setLoans(loansRes.value.data.data || []);
                if (lendingRes.status === 'fulfilled')
                    setLending(lendingRes.value.data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Derived values
    const salary = summary.salary || 0;
    const totalEMI = summary.totalEMI || 0;
    const totalExpenses = summary.totalExpenses || 0;
    const savings = summary.savings || 0;
    const savingsRate = salary > 0 ? ((savings / salary) * 100).toFixed(0) : 0;
    const expenseRate = salary > 0 ? ((totalExpenses / salary) * 100).toFixed(0) : 0;
    const emiRate = salary > 0 ? ((totalEMI / salary) * 100).toFixed(0) : 0;

    const pieData = [
        { name: 'Expenses', value: totalExpenses, color: '#f97316' },
        { name: 'EMIs',     value: totalEMI,      color: '#8b5cf6' },
        { name: 'Savings',  value: Math.max(0, savings), color: '#22c55e' },
    ].filter(d => d.value > 0);

    const formattedMonthly = monthlyData.map(d => ({
        ...d,
        name: MONTHS[(d.month || 1) - 1]
    }));

    const activeLoans = loans.filter(l => l.status === 'ACTIVE');
    const pendingLending = lending.filter(l => l.status !== 'CLEARED');

    const summaryCards = [
        {
            label: 'Monthly Salary',
            value: `₹${salary.toLocaleString('en-IN')}`,
            icon: '💰', color: '#0d6efd', bg: '#eff6ff',
            sub: 'Your income',
            badge: null
        },
        {
            label: 'Total Expenses',
            value: `₹${totalExpenses.toLocaleString('en-IN')}`,
            icon: '🧾', color: '#f97316', bg: '#fff7ed',
            sub: `${expenseRate}% of salary`,
            badge: expenseRate > 70 ? 'High' : null,
            badgeColor: '#ef4444'
        },
        {
            label: 'Total EMIs',
            value: `₹${totalEMI.toLocaleString('en-IN')}`,
            icon: '🏦', color: '#8b5cf6', bg: '#f5f3ff',
            sub: `${emiRate}% of salary`,
            badge: activeLoans.length > 0 ? `${activeLoans.length} loans` : null,
            badgeColor: '#8b5cf6'
        },
        {
            label: 'Net Savings',
            value: `₹${Math.max(0, savings).toLocaleString('en-IN')}`,
            icon: '📈', color: '#16a34a', bg: '#dcfce7',
            sub: `${savingsRate}% savings rate`,
            badge: savingsRate >= 20 ? '✓ Healthy' : savings < 0 ? 'Deficit' : null,
            badgeColor: savingsRate >= 20 ? '#16a34a' : '#ef4444'
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary spinner-border-sm mb-2" role="status"></div>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontSize: '13px' }}>

            {/* Welcome Bar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '16px'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                        Good {new Date().getHours() < 12 ? 'Morning' :
                              new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},
                        {' '}{user?.name?.split(' ')[0] || 'there'} 👋
                    </h2>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                        {new Date().toLocaleDateString('en-IN', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        })}
                    </p>
                </div>
                {savings < 0 && (
                    <div style={{
                        padding: '6px 12px', borderRadius: '8px',
                        backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                        fontSize: '11px', color: '#dc2626', fontWeight: '600'
                    }}>
                        ⚠️ You are in a spending deficit this month
                    </div>
                )}
            </div>

            {/* Summary Cards */}
            <Row className="g-2 mb-3">
                {summaryCards.map((card, i) => (
                    <Col xs={6} md={3} key={i}>
                        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                            <Card.Body style={{ padding: '12px 14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '9px',
                                        backgroundColor: card.bg, fontSize: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {card.icon}
                                    </div>
                                    {card.badge && (
                                        <span style={{
                                            fontSize: '9px', fontWeight: '700',
                                            padding: '2px 6px', borderRadius: '20px',
                                            backgroundColor: card.badgeColor + '15',
                                            color: card.badgeColor
                                        }}>
                                            {card.badge}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {card.label}
                                </div>
                                <div style={{ fontSize: '1.15rem', fontWeight: '800', color: card.color, lineHeight: 1.2, margin: '3px 0' }}>
                                    {card.value}
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                    {card.sub}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Salary Utilization Bar */}
            <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '10px' }}>
                <Card.Body style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                            Salary Utilization
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            ₹{salary.toLocaleString('en-IN')} total
                        </span>
                    </div>
                    <div style={{ display: 'flex', height: '10px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
                        {totalExpenses > 0 && (
                            <div style={{
                                width: `${Math.min(100, (totalExpenses / salary) * 100)}%`,
                                backgroundColor: '#f97316', transition: 'width 0.5s'
                            }} title={`Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`} />
                        )}
                        {totalEMI > 0 && (
                            <div style={{
                                width: `${Math.min(100, (totalEMI / salary) * 100)}%`,
                                backgroundColor: '#8b5cf6', transition: 'width 0.5s'
                            }} title={`EMIs: ₹${totalEMI.toLocaleString('en-IN')}`} />
                        )}
                        {savings > 0 && (
                            <div style={{
                                width: `${Math.min(100, (savings / salary) * 100)}%`,
                                backgroundColor: '#22c55e', transition: 'width 0.5s'
                            }} title={`Savings: ₹${savings.toLocaleString('en-IN')}`} />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        {[
                            { label: 'Expenses', color: '#f97316', val: totalExpenses, pct: expenseRate },
                            { label: 'EMIs',     color: '#8b5cf6', val: totalEMI,      pct: emiRate },
                            { label: 'Savings',  color: '#22c55e', val: Math.max(0, savings), pct: savingsRate },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                                <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                                    {item.label}: <strong>₹{item.val.toLocaleString('en-IN')}</strong> ({item.pct}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </Card.Body>
            </Card>

            {/* Charts Row */}
            <Row className="g-2 mb-3">
                {/* Spending Trend */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                    <i className="bi bi-graph-up me-2 text-primary"></i>
                                    Spending Trends (Last 6 Months)
                                </span>
                            </div>
                            {formattedMonthly.length === 0 ? (
                                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>No data yet</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={formattedMonthly} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#0d6efd" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="total" stroke="#0d6efd" strokeWidth={2}
                                            fill="url(#colorTotal)" dot={{ fill: '#0d6efd', r: 3 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Salary Pie */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                <i className="bi bi-pie-chart me-2 text-primary"></i>
                                Salary Allocation
                            </span>
                            {pieData.length === 0 ? (
                                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>No data yet</p>
                                </div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <PieChart>
                                            <Pie data={pieData} innerRadius={45} outerRadius={65}
                                                paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                                                {pieData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {pieData.map(item => (
                                            <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                                                    <span style={{ fontSize: '11px', color: '#64748b' }}>{item.name}</span>
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                                                    ₹{item.value.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Bottom Row */}
            <Row className="g-2">
                {/* Active Loans */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                    <i className="bi bi-bank me-2" style={{ color: '#8b5cf6' }}></i>
                                    Active Loans
                                </span>
                                <span style={{
                                    fontSize: '10px', padding: '1px 8px', borderRadius: '20px',
                                    backgroundColor: '#f5f3ff', color: '#8b5cf6', fontWeight: '700'
                                }}>
                                    {activeLoans.length} active
                                </span>
                            </div>
                            {activeLoans.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎉</div>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>No active loans!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {activeLoans.slice(0, 3).map(loan => {
                                        const pct = loan.totalAmount > 0
                                            ? Math.min(100, ((loan.totalAmount - loan.outstandingBalance) / loan.totalAmount) * 100)
                                            : 0;
                                        return (
                                            <div key={loan.id} style={{
                                                padding: '8px 10px', borderRadius: '8px',
                                                backgroundColor: '#fafafa', border: '1px solid #f1f5f9'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
                                                        {loan.title}
                                                    </span>
                                                    <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: '700' }}>
                                                        ₹{(loan.emiAmount || 0).toLocaleString('en-IN')}/mo
                                                    </span>
                                                </div>
                                                <div style={{ height: '4px', borderRadius: '4px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', width: `${pct}%`,
                                                        backgroundColor: '#8b5cf6', borderRadius: '4px',
                                                        transition: 'width 0.5s'
                                                    }} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{pct.toFixed(0)}% paid</span>
                                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                                        ₹{(loan.outstandingBalance || 0).toLocaleString('en-IN')} left
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {activeLoans.length > 3 && (
                                        <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                                            +{activeLoans.length - 3} more loans
                                        </p>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Insights */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                    <i className="bi bi-lightbulb me-2" style={{ color: '#eab308' }}></i>
                                    Smart Insights
                                </span>
                            </div>
                            {insights.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>💡</div>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                                        Add more expenses to see insights
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {insights.slice(0, 4).map((insight, i) => (
                                        <div key={i} style={{
                                            display: 'flex', gap: '8px', alignItems: 'flex-start',
                                            padding: '7px 9px', borderRadius: '8px',
                                            backgroundColor: i % 2 === 0 ? '#fffbeb' : '#f0f9ff',
                                            border: `1px solid ${i % 2 === 0 ? '#fef3c7' : '#e0f2fe'}`
                                        }}>
                                            <span style={{ fontSize: '13px' }}>{i % 2 === 0 ? '📊' : '💡'}</span>
                                            <span style={{ fontSize: '11px', color: '#374151', lineHeight: 1.4 }}>
                                                {insight}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Pending Lending */}
                <Col md={4}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                    <i className="bi bi-person-lines-fill me-2" style={{ color: '#dc2626' }}></i>
                                    Pending Collections
                                </span>
                                {pendingLending.length > 0 && (
                                    <span style={{
                                        fontSize: '10px', padding: '1px 8px', borderRadius: '20px',
                                        backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '700'
                                    }}>
                                        {pendingLending.length} pending
                                    </span>
                                )}
                            </div>
                            {pendingLending.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>✅</div>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>All collections done!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                                    {pendingLending.slice(0, 4).map(record => {
                                        const days = Math.ceil(
                                            (new Date(record.dueDate) - new Date()) / (1000 * 60 * 60 * 24)
                                        );
                                        const pending = (record.amount || 0) - (record.amountReceived || 0);
                                        const isOverdue = days < 0;
                                        const isDueSoon = days >= 0 && days <= 7;
                                        return (
                                            <div key={record.id} style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center', padding: '7px 9px',
                                                borderRadius: '8px', backgroundColor: '#fafafa',
                                                border: `1px solid ${isOverdue ? '#fecaca' : '#f1f5f9'}`
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{
                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                        backgroundColor: '#dc2626',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: '#fff', fontSize: '11px', fontWeight: '700'
                                                    }}>
                                                        {record.personName?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
                                                            {record.personName}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '10px',
                                                            color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#94a3b8'
                                                        }}>
                                                            {isOverdue ? `${Math.abs(days)}d overdue` :
                                                                days === 0 ? 'Due today' :
                                                                    `${days}d left`}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '12px', fontWeight: '700',
                                                    color: '#dc2626'
                                                }}>
                                                    ₹{pending.toLocaleString('en-IN')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {pendingLending.length > 4 && (
                                        <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                                            +{pendingLending.length - 4} more
                                        </p>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;