import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import expenseService from '../services/expenseService';

const categoryConfig = {
    Food:          { icon: '🍔', color: '#f97316', bg: '#fff7ed' },
    Transport:     { icon: '🚗', color: '#0ea5e9', bg: '#f0f9ff' },
    Rent:          { icon: '🏠', color: '#8b5cf6', bg: '#f5f3ff' },
    Utilities:     { icon: '⚡', color: '#eab308', bg: '#fefce8' },
    Entertainment: { icon: '🎬', color: '#ec4899', bg: '#fdf2f8' },
    Health:        { icon: '❤️', color: '#ef4444', bg: '#fef2f2' },
    Shopping:      { icon: '🛍️', color: '#06b6d4', bg: '#ecfeff' },
    Others:        { icon: '📦', color: '#6b7280', bg: '#f9fafb' },
};

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [activeTab, setActiveTab] = useState('ALL');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [error, setError] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'Food',
        description: '',
        necessary: true,
        expenseDate: new Date().toISOString().slice(0, 16)
    });

    const categories = Object.keys(categoryConfig);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await expenseService.getAllExpenses(page, 10);
            setExpenses(res.data.data.content || []);
            setTotalPages(res.data.data.totalPages || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExpenses(); }, [page]);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        setError('');
        try {
            await expenseService.addExpense({
                ...newExpense,
                amount: parseFloat(newExpense.amount)
            });
            setShowModal(false);
            setNewExpense({
                amount: '', category: 'Food', description: '',
                necessary: true, expenseDate: new Date().toISOString().slice(0, 16)
            });
            fetchExpenses();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to add expense.');
        } finally {
            setAddLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await expenseService.deleteExpense(id);
            fetchExpenses();
        } catch (err) { alert('Delete failed'); }
    };

    const filteredExpenses = expenses.filter(exp => {
        const catMatch = activeCategory === 'ALL' || exp.category === activeCategory;
        const tabMatch = activeTab === 'ALL' ||
            (activeTab === 'NECESSARY' && exp.necessary) ||
            (activeTab === 'LUXURY' && !exp.necessary);
        return catMatch && tabMatch;
    });

    const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const necessaryTotal = expenses.filter(e => e.necessary).reduce((s, e) => s + (e.amount || 0), 0);
    const luxuryTotal = expenses.filter(e => !e.necessary).reduce((s, e) => s + (e.amount || 0), 0);

    const categoryTotals = categories.reduce((acc, cat) => {
        acc[cat] = expenses.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0);
        return acc;
    }, {});

    const topCategories = Object.entries(categoryTotals)
        .filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).slice(0, 4);

    return (
        <div style={{ fontSize: '13px' }}>

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="fw-bold mb-0" style={{ fontSize: '1.1rem' }}>Expense Tracker</h2>
                    <p className="text-muted mb-0" style={{ fontSize: '11px' }}>Track and manage your daily spending</p>
                </div>
                <Button variant="primary" size="sm" className="rounded-pill px-3"
                    onClick={() => setShowModal(true)}>
                    <i className="bi bi-plus-lg me-1"></i>Add Expense
                </Button>
            </div>

            {/* Summary Cards */}
            <Row className="mb-3 g-2">
                <Col md={4}>
                    <Card className="border-0 shadow-sm overflow-hidden">
                        <div style={{
                            background: 'linear-gradient(135deg, #0d6efd, #0dcaf0)',
                            padding: '14px 16px'
                        }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Total</div>
                                    <div style={{ color: '#fff', fontWeight: '800', fontSize: '1.3rem' }}>
                                        ₹{totalAmount.toLocaleString('en-IN')}
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                                        {expenses.length} transactions
                                    </div>
                                </div>
                                <div style={{ fontSize: '28px', opacity: 0.25 }}>💰</div>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Necessary</div>
                                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#16a34a' }}>
                                        ₹{necessaryTotal.toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div style={{ fontSize: '18px' }}>✅</div>
                            </div>
                            <div className="progress" style={{ height: '4px' }}>
                                <div className="progress-bar bg-success" style={{
                                    width: totalAmount > 0 ? `${(necessaryTotal / totalAmount) * 100}%` : '0%'
                                }}></div>
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                {totalAmount > 0 ? `${((necessaryTotal / totalAmount) * 100).toFixed(0)}%` : '0%'} of total
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Luxury</div>
                                    <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#d97706' }}>
                                        ₹{luxuryTotal.toLocaleString('en-IN')}
                                    </div>
                                </div>
                                <div style={{ fontSize: '18px' }}>🛍️</div>
                            </div>
                            <div className="progress" style={{ height: '4px' }}>
                                <div className="progress-bar bg-warning" style={{
                                    width: totalAmount > 0 ? `${(luxuryTotal / totalAmount) * 100}%` : '0%'
                                }}></div>
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                {totalAmount > 0 ? `${((luxuryTotal / totalAmount) * 100).toFixed(0)}%` : '0%'} of total
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Top Categories */}
            {topCategories.length > 0 && (
                <Card className="border-0 shadow-sm mb-3">
                    <Card.Body style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px', color: '#0f172a' }}>
                            <i className="bi bi-bar-chart-fill me-2 text-primary"></i>
                            Top Spending Categories
                        </div>
                        <Row className="g-2">
                            {topCategories.map(([cat, amt]) => {
                                const cfg = categoryConfig[cat] || categoryConfig.Others;
                                const pct = totalAmount > 0 ? ((amt / totalAmount) * 100).toFixed(0) : 0;
                                return (
                                    <Col xs={6} md={3} key={cat}>
                                        <div
                                            onClick={() => setActiveCategory(activeCategory === cat ? 'ALL' : cat)}
                                            style={{
                                                backgroundColor: cfg.bg,
                                                border: activeCategory === cat ? `2px solid ${cfg.color}` : '2px solid transparent',
                                                borderRadius: '10px',
                                                padding: '10px 12px',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                transition: 'all 0.15s'
                                            }}>
                                            <span style={{ fontSize: '22px' }}>{cfg.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: '700', fontSize: '11.5px', color: cfg.color }}>{cat}</div>
                                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>₹{amt.toLocaleString('en-IN')}</div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{pct}% of total</div>
                                            </div>
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Filter Row */}
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <div className="d-flex gap-1">
                    {[
                        { key: 'ALL', label: 'All' },
                        { key: 'NECESSARY', label: '✅ Necessary' },
                        { key: 'LUXURY', label: '🛍️ Luxury' }
                    ].map(tab => (
                        <button key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                fontSize: '11.5px', padding: '3px 12px',
                                borderRadius: '20px', border: 'none', cursor: 'pointer',
                                fontWeight: '600',
                                backgroundColor: activeTab === tab.key ? '#0d6efd' : '#f1f5f9',
                                color: activeTab === tab.key ? '#fff' : '#64748b',
                                transition: 'all 0.15s'
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="d-flex gap-1 flex-wrap">
                    <button
                        onClick={() => setActiveCategory('ALL')}
                        style={{
                            fontSize: '11px', padding: '3px 10px',
                            borderRadius: '20px', cursor: 'pointer',
                            fontWeight: '600', border: '1.5px solid',
                            borderColor: activeCategory === 'ALL' ? '#0f172a' : '#e2e8f0',
                            backgroundColor: activeCategory === 'ALL' ? '#0f172a' : 'white',
                            color: activeCategory === 'ALL' ? '#fff' : '#64748b'
                        }}>
                        All
                    </button>
                    {categories.map(cat => {
                        const cfg = categoryConfig[cat];
                        const isActive = activeCategory === cat;
                        return (
                            <button key={cat}
                                onClick={() => setActiveCategory(isActive ? 'ALL' : cat)}
                                style={{
                                    fontSize: '11px', padding: '3px 10px',
                                    borderRadius: '20px', cursor: 'pointer',
                                    fontWeight: '600', border: `1.5px solid ${cfg.color}`,
                                    backgroundColor: isActive ? cfg.color : 'white',
                                    color: isActive ? '#fff' : cfg.color,
                                    transition: 'all 0.15s'
                                }}>
                                {cfg.icon} {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Table */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                            <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Loading...</p>
                        </div>
                    ) : filteredExpenses.length === 0 ? (
                        <div className="text-center py-4">
                            <div style={{ fontSize: '36px' }} className="mb-2">📭</div>
                            <p className="text-muted mb-2" style={{ fontSize: '12px' }}>
                                {activeCategory !== 'ALL' || activeTab !== 'ALL'
                                    ? 'No results for current filters.'
                                    : 'No expenses yet. Add your first one!'}
                            </p>
                            {activeCategory === 'ALL' && activeTab === 'ALL' && (
                                <Button variant="primary" size="sm" className="rounded-pill"
                                    onClick={() => setShowModal(true)}>
                                    + Add Expense
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0" style={{ fontSize: '12.5px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc' }}>
                                    {['Date', 'Category', 'Description', 'Amount', 'Type', ''].map(h => (
                                        <th key={h} style={{
                                            padding: '8px 12px', border: 'none',
                                            fontSize: '11px', fontWeight: '700',
                                            color: '#64748b', textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(exp => {
                                    const cfg = categoryConfig[exp.category] || categoryConfig.Others;
                                    return (
                                        <tr key={exp.id} style={{ verticalAlign: 'middle' }}>
                                            <td style={{ padding: '8px 12px' }}>
                                                <div style={{ fontWeight: '600', fontSize: '12px' }}>
                                                    {new Date(exp.expenseDate).toLocaleDateString('en-IN')}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                                    {new Date(exp.expenseDate).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    padding: '3px 10px', borderRadius: '20px',
                                                    backgroundColor: cfg.bg, color: cfg.color,
                                                    fontSize: '11.5px', fontWeight: '600'
                                                }}>
                                                    {cfg.icon} {exp.category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 12px', maxWidth: '180px' }}>
                                                <span style={{
                                                    fontSize: '12px', color: '#334155',
                                                    whiteSpace: 'nowrap', overflow: 'hidden',
                                                    textOverflow: 'ellipsis', display: 'block'
                                                }}>
                                                    {exp.description || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                                                    ₹{(exp.amount || 0).toLocaleString('en-IN')}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                {exp.necessary ? (
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '20px',
                                                        backgroundColor: '#dcfce7', color: '#16a34a',
                                                        fontSize: '11px', fontWeight: '600'
                                                    }}>✅ Necessary</span>
                                                ) : (
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '20px',
                                                        backgroundColor: '#fef9c3', color: '#a16207',
                                                        fontSize: '11px', fontWeight: '600'
                                                    }}>🛍️ Luxury</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <button
                                                    onClick={() => handleDelete(exp.id)}
                                                    style={{
                                                        padding: '3px 10px', borderRadius: '20px',
                                                        border: '1px solid #fca5a5',
                                                        backgroundColor: 'white', color: '#ef4444',
                                                        fontSize: '11px', cursor: 'pointer',
                                                        fontWeight: '600', transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.backgroundColor = '#fef2f2';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.backgroundColor = 'white';
                                                    }}>
                                                    <i className="bi bi-trash me-1"></i>Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Card.Footer className="bg-white p-2 d-flex justify-content-between align-items-center">
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Page {page + 1} of {totalPages}
                        </span>
                        <div className="d-flex gap-1">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                                style={{
                                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                                    border: '1px solid #e2e8f0', backgroundColor: 'white',
                                    color: page === 0 ? '#cbd5e1' : '#0d6efd', cursor: page === 0 ? 'not-allowed' : 'pointer'
                                }}>
                                ← Prev
                            </button>
                            {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                                <button key={i} onClick={() => setPage(i)}
                                    style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        border: 'none', fontSize: '11px', fontWeight: '700',
                                        cursor: 'pointer',
                                        backgroundColor: i === page ? '#0d6efd' : '#f1f5f9',
                                        color: i === page ? '#fff' : '#64748b'
                                    }}>
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                disabled={page === totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                style={{
                                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                                    border: '1px solid #e2e8f0', backgroundColor: 'white',
                                    color: page === totalPages - 1 ? '#cbd5e1' : '#0d6efd',
                                    cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer'
                                }}>
                                Next →
                            </button>
                        </div>
                    </Card.Footer>
                )}
            </Card>

            {/* Add Expense Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); setError(''); }} centered size="md">
                <Modal.Header closeButton style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <Modal.Title style={{ fontSize: '14px', fontWeight: '700' }}>
                        <i className="bi bi-plus-circle-fill me-2 text-primary"></i>Add New Expense
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddExpense}>
                    <Modal.Body style={{ padding: '12px 16px' }}>
                        {error && (
                            <Alert variant="danger" className="py-2 mb-2" style={{ fontSize: '12px' }}>
                                <i className="bi bi-exclamation-triangle me-1"></i>{error}
                            </Alert>
                        )}

                        {/* Category Picker */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '6px', display: 'block', color: '#374151' }}>
                                Category
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {categories.map(cat => {
                                    const cfg = categoryConfig[cat];
                                    const isSelected = newExpense.category === cat;
                                    return (
                                        <div key={cat}
                                            onClick={() => setNewExpense({ ...newExpense, category: cat })}
                                            style={{
                                                width: '62px', padding: '6px 4px',
                                                borderRadius: '8px', textAlign: 'center',
                                                cursor: 'pointer',
                                                border: isSelected ? `2px solid ${cfg.color}` : '2px solid #e9ecef',
                                                backgroundColor: isSelected ? cfg.bg : 'white',
                                                transition: 'all 0.15s'
                                            }}>
                                            <div style={{ fontSize: '18px' }}>{cfg.icon}</div>
                                            <div style={{
                                                fontSize: '9px', marginTop: '2px',
                                                color: isSelected ? cfg.color : '#9ca3af',
                                                fontWeight: isSelected ? '700' : '400'
                                            }}>{cat}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <Row className="g-2 mb-2">
                            <Col>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                    Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text" style={{ fontSize: '12px' }}>₹</span>
                                    <input type="number" required min="1" placeholder="500"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        className="form-control"
                                        style={{ fontSize: '13px' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '4px', marginTop: '5px', flexWrap: 'wrap' }}>
                                    {[50, 100, 200, 500, 1000].map(amt => (
                                        <button key={amt} type="button"
                                            onClick={() => setNewExpense({ ...newExpense, amount: amt.toString() })}
                                            style={{
                                                fontSize: '10px', padding: '1px 8px',
                                                borderRadius: '20px', border: '1px solid #e2e8f0',
                                                backgroundColor: 'white', color: '#64748b',
                                                cursor: 'pointer'
                                            }}>
                                            ₹{amt}
                                        </button>
                                    ))}
                                </div>
                            </Col>
                            <Col>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                    Date & Time
                                </label>
                                <input type="datetime-local" className="form-control form-control-sm"
                                    value={newExpense.expenseDate}
                                    onChange={e => setNewExpense({ ...newExpense, expenseDate: e.target.value })}
                                    style={{ fontSize: '12px' }} />
                            </Col>
                        </Row>

                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                Description
                            </label>
                            <textarea rows={2} className="form-control form-control-sm"
                                placeholder="What was this for?"
                                value={newExpense.description}
                                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                style={{ fontSize: '12px', resize: 'none' }} />
                        </div>

                        {/* Necessary Toggle */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { val: true,  emoji: '✅', label: 'Necessary', sub: 'Bills, rent, food', color: '#16a34a', bg: '#dcfce7', border: '#16a34a' },
                                { val: false, emoji: '🛍️', label: 'Luxury',    sub: 'Wants, treats',    color: '#d97706', bg: '#fef9c3', border: '#d97706' }
                            ].map(opt => (
                                <div key={String(opt.val)}
                                    onClick={() => setNewExpense({ ...newExpense, necessary: opt.val })}
                                    style={{
                                        flex: 1, textAlign: 'center', padding: '8px',
                                        borderRadius: '8px', cursor: 'pointer',
                                        border: `2px solid ${newExpense.necessary === opt.val ? opt.border : '#e9ecef'}`,
                                        backgroundColor: newExpense.necessary === opt.val ? opt.bg : 'white',
                                        transition: 'all 0.15s'
                                    }}>
                                    <div style={{ fontSize: '20px' }}>{opt.emoji}</div>
                                    <div style={{
                                        fontSize: '12px', fontWeight: '700',
                                        color: newExpense.necessary === opt.val ? opt.color : '#9ca3af'
                                    }}>{opt.label}</div>
                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>{opt.sub}</div>
                                </div>
                            ))}
                        </div>
                    </Modal.Body>
                    <Modal.Footer style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9' }}>
                        <button type="button"
                            onClick={() => { setShowModal(false); setError(''); }}
                            style={{
                                padding: '5px 16px', borderRadius: '20px',
                                border: '1px solid #e2e8f0', backgroundColor: 'white',
                                color: '#64748b', fontSize: '12px', cursor: 'pointer'
                            }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={addLoading}
                            style={{
                                padding: '5px 18px', borderRadius: '20px',
                                border: 'none', backgroundColor: '#0d6efd',
                                color: '#fff', fontSize: '12px', fontWeight: '600',
                                cursor: addLoading ? 'not-allowed' : 'pointer',
                                opacity: addLoading ? 0.7 : 1
                            }}>
                            {addLoading ? (
                                <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Saving...</>
                            ) : (
                                <><i className="bi bi-check-circle me-1"></i>Save Expense</>
                            )}
                        </button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Expenses;