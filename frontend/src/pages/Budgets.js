import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Modal, Form, Alert } from 'react-bootstrap';
import budgetService from '../services/budgetService';
import api from '../services/api';

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

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [addLoading, setAddLoading] = useState(false);
    const [error, setError] = useState('');
    const [newBudget, setNewBudget] = useState({
        category: 'Food',
        monthlyLimit: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    const categories = Object.keys(categoryConfig);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [budgetRes, expenseRes] = await Promise.allSettled([
                budgetService.getBudgets(),
                api.get('/expenses?page=0&size=100')
            ]);
            if (budgetRes.status === 'fulfilled')
                setBudgets(budgetRes.value.data.data || []);
            if (expenseRes.status === 'fulfilled')
                setExpenses(expenseRes.value.data.data?.content || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const getSpentForCategory = (category) => {
        const now = new Date();
        return expenses
            .filter(e => {
                const d = new Date(e.expenseDate);
                return e.category === category &&
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear();
            })
            .reduce((s, e) => s + (e.amount || 0), 0);
    };

    const handleSetBudget = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        setError('');
        try {
            await budgetService.setBudget({
                ...newBudget,
                monthlyLimit: parseFloat(newBudget.monthlyLimit)
            });
            setShowModal(false);
            setNewBudget({
                category: 'Food', monthlyLimit: '',
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            });
            fetchData();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to set budget.');
        } finally {
            setAddLoading(false);
        }
    };

    const deleteBudget = async (id) => {
        if (!window.confirm('Delete this budget?')) return;
        try {
            await budgetService.deleteBudget(id);
            fetchData();
        } catch { alert('Delete failed'); }
    };

    const getProgressColor = (pct) => {
        if (pct >= 100) return '#dc2626';
        if (pct >= 80) return '#f97316';
        if (pct >= 60) return '#eab308';
        return '#16a34a';
    };

    const totalBudget = budgets.reduce((s, b) => s + (b.monthlyLimit || 0), 0);
    const totalSpent = budgets.reduce((s, b) => s + getSpentForCategory(b.category), 0);
    const overBudgetCount = budgets.filter(b => {
        const spent = getSpentForCategory(b.category);
        return spent >= b.monthlyLimit;
    }).length;

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div className="text-center">
                <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Loading budgets...</p>
            </div>
        </div>
    );

    return (
        <div style={{ fontSize: '13px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                        Budget Monitor
                    </h2>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                        {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} style={{
                    padding: '6px 16px', borderRadius: '20px', border: 'none',
                    backgroundColor: '#0d6efd', color: '#fff', fontSize: '12px',
                    fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                    <i className="bi bi-plus-lg"></i> Set Budget
                </button>
            </div>

            {/* Summary */}
            <Row className="g-2 mb-3">
                {[
                    { label: 'Total Budget',   val: `₹${totalBudget.toLocaleString('en-IN')}`,  color: '#0d6efd', icon: '🎯' },
                    { label: 'Total Spent',    val: `₹${totalSpent.toLocaleString('en-IN')}`,   color: '#f97316', icon: '💸' },
                    { label: 'Remaining',      val: `₹${Math.max(0, totalBudget - totalSpent).toLocaleString('en-IN')}`, color: '#16a34a', icon: '💰' },
                    { label: 'Over Budget',    val: `${overBudgetCount} categories`,             color: overBudgetCount > 0 ? '#dc2626' : '#16a34a', icon: overBudgetCount > 0 ? '⚠️' : '✅' },
                ].map((s, i) => (
                    <Col xs={6} md={3} key={i}>
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                            <Card.Body style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>{s.label}</span>
                                    <span style={{ fontSize: '16px' }}>{s.icon}</span>
                                </div>
                                <div style={{ fontWeight: '800', fontSize: '1rem', color: s.color }}>{s.val}</div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Overall Progress */}
            {budgets.length > 0 && totalBudget > 0 && (
                <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '10px' }}>
                    <Card.Body style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>Overall Budget Usage</span>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: getProgressColor((totalSpent / totalBudget) * 100) }}>
                                {((totalSpent / totalBudget) * 100).toFixed(0)}%
                            </span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '8px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%`,
                                backgroundColor: getProgressColor((totalSpent / totalBudget) * 100),
                                borderRadius: '8px', transition: 'width 0.5s'
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>₹{totalSpent.toLocaleString('en-IN')} spent</span>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>₹{totalBudget.toLocaleString('en-IN')} total</span>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Budget Cards */}
            {budgets.length === 0 ? (
                <Card className="border-0 shadow-sm text-center" style={{ borderRadius: '10px', padding: '30px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎯</div>
                    <p style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>No budgets set yet</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
                        Set monthly limits for each spending category
                    </p>
                    <button onClick={() => setShowModal(true)} style={{
                        padding: '5px 16px', borderRadius: '20px', border: 'none',
                        backgroundColor: '#0d6efd', color: '#fff', fontSize: '12px',
                        fontWeight: '600', cursor: 'pointer'
                    }}>+ Set First Budget</button>
                </Card>
            ) : (
                <Row className="g-2">
                    {budgets.map((budget, i) => {
                        const cfg = categoryConfig[budget.category] || categoryConfig.Others;
                        const spent = getSpentForCategory(budget.category);
                        const pct = budget.monthlyLimit > 0 ? Math.min(100, (spent / budget.monthlyLimit) * 100) : 0;
                        const remaining = Math.max(0, budget.monthlyLimit - spent);
                        const isOver = spent >= budget.monthlyLimit;
                        const isWarn = pct >= 80 && !isOver;

                        return (
                            <Col md={4} key={i}>
                                <Card className="border-0 shadow-sm h-100"
                                    style={{
                                        borderRadius: '10px',
                                        borderTop: `3px solid ${isOver ? '#dc2626' : isWarn ? '#f97316' : cfg.color}`
                                    }}>
                                    <Card.Body style={{ padding: '12px 14px' }}>

                                        {/* Top */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                    backgroundColor: cfg.bg, fontSize: '16px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {cfg.icon}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                                                        {budget.category}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                                        Limit: ₹{(budget.monthlyLimit || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {isOver && (
                                                    <span style={{
                                                        fontSize: '9px', padding: '2px 6px', borderRadius: '20px',
                                                        backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '700'
                                                    }}>Over!</span>
                                                )}
                                                {isWarn && !isOver && (
                                                    <span style={{
                                                        fontSize: '9px', padding: '2px 6px', borderRadius: '20px',
                                                        backgroundColor: '#fff7ed', color: '#f97316', fontWeight: '700'
                                                    }}>⚠ High</span>
                                                )}
                                                <button onClick={() => deleteBudget(budget.id)}
                                                    style={{
                                                        background: 'none', border: 'none',
                                                        color: '#94a3b8', cursor: 'pointer',
                                                        padding: '0', fontSize: '12px'
                                                    }}>
                                                    <i className="bi bi-x-circle"></i>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Amounts */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Spent</div>
                                                <div style={{ fontWeight: '800', fontSize: '13px', color: isOver ? '#dc2626' : '#0f172a' }}>
                                                    ₹{spent.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Remaining</div>
                                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#16a34a' }}>
                                                    ₹{remaining.toLocaleString('en-IN')}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Used</div>
                                                <div style={{ fontWeight: '800', fontSize: '13px', color: getProgressColor(pct) }}>
                                                    {pct.toFixed(0)}%
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div style={{ height: '6px', borderRadius: '6px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', width: `${pct}%`,
                                                backgroundColor: getProgressColor(pct),
                                                borderRadius: '6px', transition: 'width 0.5s'
                                            }} />
                                        </div>
                                        {isOver && (
                                            <div style={{
                                                marginTop: '6px', padding: '4px 8px', borderRadius: '6px',
                                                backgroundColor: '#fef2f2', fontSize: '10px', color: '#dc2626', fontWeight: '600'
                                            }}>
                                                ⚠️ Over by ₹{(spent - budget.monthlyLimit).toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Set Budget Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); setError(''); }} centered>
                <Modal.Header closeButton style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <Modal.Title style={{ fontSize: '14px', fontWeight: '700' }}>
                        <i className="bi bi-sliders me-2 text-primary"></i>Set Category Budget
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSetBudget}>
                    <Modal.Body style={{ padding: '12px 16px' }}>
                        {error && (
                            <Alert variant="danger" className="py-2 mb-2" style={{ fontSize: '12px' }}>
                                <i className="bi bi-exclamation-triangle me-1"></i>{error}
                            </Alert>
                        )}

                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                                Category
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {categories.map(cat => {
                                    const cfg = categoryConfig[cat];
                                    const isSelected = newBudget.category === cat;
                                    return (
                                        <div key={cat}
                                            onClick={() => setNewBudget({ ...newBudget, category: cat })}
                                            style={{
                                                width: '62px', padding: '6px 4px', textAlign: 'center',
                                                borderRadius: '8px', cursor: 'pointer',
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

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                Monthly Limit (₹) <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div className="input-group input-group-sm">
                                <span className="input-group-text" style={{ fontSize: '12px' }}>₹</span>
                                <input type="number" required min="1" className="form-control"
                                    placeholder="5000"
                                    value={newBudget.monthlyLimit}
                                    onChange={e => setNewBudget({ ...newBudget, monthlyLimit: e.target.value })}
                                    style={{ fontSize: '13px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                                {[1000, 2000, 5000, 10000].map(amt => (
                                    <button key={amt} type="button"
                                        onClick={() => setNewBudget({ ...newBudget, monthlyLimit: amt.toString() })}
                                        style={{
                                            padding: '2px 10px', borderRadius: '20px', fontSize: '11px',
                                            border: '1px solid #e2e8f0', backgroundColor: 'white',
                                            color: '#64748b', cursor: 'pointer'
                                        }}>
                                        ₹{amt.toLocaleString('en-IN')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9' }}>
                        <button type="button"
                            onClick={() => { setShowModal(false); setError(''); }}
                            style={{
                                padding: '5px 16px', borderRadius: '20px',
                                border: '1px solid #e2e8f0', backgroundColor: 'white',
                                color: '#64748b', fontSize: '12px', cursor: 'pointer'
                            }}>Cancel</button>
                        <button type="submit" disabled={addLoading}
                            style={{
                                padding: '5px 18px', borderRadius: '20px', border: 'none',
                                backgroundColor: '#0d6efd', color: '#fff',
                                fontSize: '12px', fontWeight: '600',
                                cursor: addLoading ? 'not-allowed' : 'pointer',
                                opacity: addLoading ? 0.7 : 1
                            }}>
                            {addLoading ? (
                                <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Saving...</>
                            ) : (
                                <><i className="bi bi-check-circle me-1"></i>Save Budget</>
                            )}
                        </button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Budgets;