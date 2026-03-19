import React, { useState, useEffect } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    BarChart, Bar
} from 'recharts';
import analyticsService from '../services/analyticsService';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CATEGORY_COLORS = {
    Food: '#f97316', Transport: '#0ea5e9', Rent: '#8b5cf6',
    Utilities: '#eab308', Entertainment: '#ec4899',
    Health: '#ef4444', Shopping: '#06b6d4', Others: '#6b7280'
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div style={{
                backgroundColor: '#fff', border: '1px solid #e2e8f0',
                borderRadius: '8px', padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px'
            }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#0f172a' }}>{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ margin: '2px 0', color: p.color || '#0d6efd' }}>
                        ₹{(p.value || 0).toLocaleString('en-IN')}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Analytics = () => {
    const [summary, setSummary] = useState({});
    const [comparison, setComparison] = useState([]);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSlice, setActiveSlice] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            try {
                const now = new Date();
                const [sumRes, compRes, insRes] = await Promise.allSettled([
                    analyticsService.getSummary(now.getMonth() + 1, now.getFullYear()),
                    analyticsService.getComparison(),
                    analyticsService.getInsights()
                ]);
                if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data.data || {});
                if (compRes.status === 'fulfilled') setComparison(compRes.value.data.data || []);
                if (insRes.status === 'fulfilled') setInsights(insRes.value.data.data || []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const pieData = Object.entries(summary)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || '#6b7280' }));

    const totalSpend = pieData.reduce((s, d) => s + d.value, 0);

    const formattedComparison = comparison.map(d => ({
        ...d, name: MONTHS[(d.month || 1) - 1]
    }));

    const barData = pieData.sort((a, b) => b.value - a.value).slice(0, 6);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div className="text-center">
                <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Loading analytics...</p>
            </div>
        </div>
    );

    return (
        <div style={{ fontSize: '13px' }}>

            {/* Header */}
            <div style={{ marginBottom: '14px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                    Financial Analytics
                </h2>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} overview
                </p>
            </div>

            {/* Summary Stats */}
            <Row className="g-2 mb-3">
                {pieData.slice(0, 4).map((item, i) => (
                    <Col xs={6} md={3} key={i}>
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '10px', borderLeft: `3px solid ${item.color}` }}>
                            <Card.Body style={{ padding: '10px 12px' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
                                    {item.name}
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '1rem', color: item.color }}>
                                    ₹{item.value.toLocaleString('en-IN')}
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                    {totalSpend > 0 ? ((item.value / totalSpend) * 100).toFixed(0) : 0}% of total
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Charts Row 1 */}
            <Row className="g-2 mb-3">
                {/* Trend Chart */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
                                <i className="bi bi-graph-up me-2 text-primary"></i>
                                Monthly Expenditure Trend
                            </div>
                            {formattedComparison.length === 0 ? (
                                <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>No data yet</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={formattedComparison} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                                        <defs>
                                            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
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
                                            fill="url(#grad)" dot={{ fill: '#0d6efd', r: 3 }}
                                            activeDot={{ r: 5 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Pie Chart */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                                <i className="bi bi-pie-chart me-2 text-primary"></i>
                                Category Distribution
                            </div>
                            {pieData.length === 0 ? (
                                <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>No data yet</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={140}>
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={40} outerRadius={60}
                                            paddingAngle={3} dataKey="value"
                                            onMouseEnter={(_, i) => setActiveSlice(i)}
                                            onMouseLeave={() => setActiveSlice(null)}>
                                            {pieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color}
                                                    opacity={activeSlice === null || activeSlice === i ? 1 : 0.5} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                                {pieData.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: item.color }} />
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>{item.name}</span>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>
                                            ₹{item.value.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Bar Chart */}
            {barData.length > 0 && (
                <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '10px' }}>
                    <Card.Body style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
                            <i className="bi bi-bar-chart-fill me-2 text-primary"></i>
                            Category Comparison
                        </div>
                        <ResponsiveContainer width="100%" height={140}>
                            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {barData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card.Body>
                </Card>
            )}

            {/* Insights */}
            <Card className="border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                <Card.Body style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
                        <i className="bi bi-lightbulb-fill me-2" style={{ color: '#eab308' }}></i>
                        AI Financial Insights
                    </div>
                    {insights.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <div style={{ fontSize: '28px', marginBottom: '6px' }}>💡</div>
                            <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                                Add more expenses to generate insights
                            </p>
                        </div>
                    ) : (
                        <Row className="g-2">
                            {insights.map((insight, i) => (
                                <Col md={6} key={i}>
                                    <div style={{
                                        display: 'flex', gap: '8px', alignItems: 'flex-start',
                                        padding: '8px 10px', borderRadius: '8px',
                                        backgroundColor: i % 2 === 0 ? '#fffbeb' : '#eff6ff',
                                        border: `1px solid ${i % 2 === 0 ? '#fef3c7' : '#dbeafe'}`
                                    }}>
                                        <span style={{ fontSize: '14px', flexShrink: 0 }}>
                                            {i % 2 === 0 ? '📊' : '💡'}
                                        </span>
                                        <span style={{ fontSize: '11.5px', color: '#374151', lineHeight: 1.4 }}>
                                            {insight}
                                        </span>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default Analytics;