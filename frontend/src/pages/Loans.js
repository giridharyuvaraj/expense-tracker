import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Modal, Form, Alert } from 'react-bootstrap';
import loanService from '../services/loanService';

const categoryConfig = {
    Home:      { icon: '🏠', color: '#0d6efd', bg: '#eff6ff' },
    Gold:      { icon: '🥇', color: '#d97706', bg: '#fffbeb' },
    Personal:  { icon: '👤', color: '#8b5cf6', bg: '#f5f3ff' },
    Vehicle:   { icon: '🚗', color: '#0891b2', bg: '#ecfeff' },
    Education: { icon: '🎓', color: '#059669', bg: '#ecfdf5' },
    Others:    { icon: '📋', color: '#64748b', bg: '#f8fafc' },
};

const EMI_CALC = (principal, rate, years) => {
    if (!rate || rate === 0) return principal / (years * 12);
    const r = rate / (12 * 100);
    const n = years * 12;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

const Loans = () => {
    const [loans, setLoans] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAmortModal, setShowAmortModal] = useState(false);
    const [showSimModal, setShowSimModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [amortization, setAmortization] = useState([]);
    const [extraPayment, setExtraPayment] = useState('');
    const [simResult, setSimResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addLoading, setAddLoading] = useState(false);
    const [error, setError] = useState('');
    const [emiPreview, setEmiPreview] = useState(null);
    const [newLoan, setNewLoan] = useState({
        title: '', category: 'Home',
        totalAmount: '', interestRate: '',
        durationYears: '', startDate: ''
    });

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const res = await loanService.getLoans();
            setLoans(res.data.data || []);
            try {
                const sugRes = await loanService.getSuggestions();
                setSuggestions(sugRes.data.data || []);
            } catch (_) {}
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLoans(); }, []);

    useEffect(() => {
        const { totalAmount, interestRate, durationYears } = newLoan;
        if (totalAmount && durationYears) {
            const emi = EMI_CALC(
                parseFloat(totalAmount),
                parseFloat(interestRate || 0),
                parseInt(durationYears)
            );
            const total = emi * parseInt(durationYears) * 12;
            const interest = total - parseFloat(totalAmount);
            setEmiPreview({ emi, total, interest });
        } else {
            setEmiPreview(null);
        }
    }, [newLoan.totalAmount, newLoan.interestRate, newLoan.durationYears]);

    const handleAddLoan = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        setError('');
        try {
            await loanService.addLoan({
                ...newLoan,
                totalAmount: parseFloat(newLoan.totalAmount),
                interestRate: parseFloat(newLoan.interestRate || 0),
                durationYears: parseInt(newLoan.durationYears),
            });
            setShowAddModal(false);
            setNewLoan({ title: '', category: 'Home', totalAmount: '', interestRate: '', durationYears: '', startDate: '' });
            setEmiPreview(null);
            fetchLoans();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to add loan.');
        } finally {
            setAddLoading(false);
        }
    };

    const openAmortization = async (loan) => {
        setSelectedLoan(loan);
        setShowAmortModal(true);
        try {
            const res = await loanService.getAmortization(loan.id);
            setAmortization(res.data.data || []);
        } catch {
            setAmortization([]);
        }
    };

    const openSimulator = (loan) => {
        setSelectedLoan(loan);
        setExtraPayment('');
        setSimResult(null);
        setShowSimModal(true);
    };

    const runSimulation = async () => {
        if (!extraPayment || isNaN(extraPayment)) return;
        try {
            const res = await loanService.simulate(selectedLoan.id, parseFloat(extraPayment));
            setSimResult(res.data.data);
        } catch {
            const balance = selectedLoan.outstandingBalance || 0;
            const rate = (selectedLoan.interestRate || 0) / (12 * 100);
            const emi = selectedLoan.emiAmount || 0;
            const extra = parseFloat(extraPayment);
            let months = 0, interest = 0, bal = balance;
            while (bal > 0 && months < 600) {
                const i = bal * rate;
                const p = Math.min(bal, emi + extra - i);
                interest += i; bal -= p; months++;
            }
            const origMonths = rate > 0
                ? Math.ceil(-Math.log(1 - (balance * rate) / emi) / Math.log(1 + rate))
                : Math.ceil(balance / emi);
            const origInterest = (emi * origMonths) - balance;
            setSimResult({
                newTenureMonths: months,
                monthsSaved: Math.max(0, origMonths - months),
                interestSaved: Math.max(0, origInterest - interest)
            });
        }
    };

    const deleteLoan = async (id) => {
        if (!window.confirm('Delete this loan?')) return;
        try {
            await loanService.deleteLoan(id);
            fetchLoans();
        } catch { alert('Delete failed'); }
    };

    const totalEMI = loans.filter(l => l.status === 'ACTIVE')
        .reduce((s, l) => s + (l.emiAmount || 0), 0);
    const totalBalance = loans.filter(l => l.status === 'ACTIVE')
        .reduce((s, l) => s + (l.outstandingBalance || 0), 0);
    const activeLoans = loans.filter(l => l.status === 'ACTIVE');

    const getSugIcon = (type) => {
        if (type === 'AVALANCHE') return { icon: '🔥', label: 'Avalanche', color: '#ef4444', bg: '#fef2f2' };
        if (type === 'SNOWBALL')  return { icon: '❄️', label: 'Snowball',  color: '#0891b2', bg: '#ecfeff' };
        return                           { icon: '💡', label: 'Tip',       color: '#d97706', bg: '#fffbeb' };
    };

    const formatValue = (val) => {
        const str = val.toString();
        return str.length > 10 ? '0.82rem' : str.length > 7 ? '0.95rem' : '1.1rem';
    };

    const summaryCards = [
        { label: 'Active Loans',      value: activeLoans.length,                          unit: 'loans',  color: '#8b5cf6', icon: '🏦' },
        { label: 'Total Outstanding', value: `₹${totalBalance.toLocaleString('en-IN')}`,  unit: '',       color: '#dc2626', icon: '💳' },
        { label: 'Monthly EMI',       value: `₹${totalEMI.toLocaleString('en-IN')}`,      unit: '/month', color: '#0d6efd', icon: '📅' },
        { label: 'AI Suggestions',    value: suggestions.length,                           unit: 'tips',   color: '#059669', icon: '💡' },
    ];

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div className="text-center">
                <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>Loading loans...</p>
            </div>
        </div>
    );

    return (
        <div style={{ fontSize: '13px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>
                        Loan Management
                    </h2>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                        Track, manage and repay your loans efficiently
                    </p>
                </div>
                <button onClick={() => setShowAddModal(true)} style={{
                    padding: '6px 16px', borderRadius: '20px', border: 'none',
                    backgroundColor: '#0d6efd', color: '#fff', fontSize: '12px',
                    fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                    <i className="bi bi-plus-lg"></i> Add Loan
                </button>
            </div>

            {/* ── Summary Cards — all equal width using xs={3} ── */}
            <Row className="g-2 mb-3">
                {summaryCards.map((s, i) => (
                    <Col xs={3} key={i}>
                        <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '10px' }}>
                            <Card.Body style={{ padding: '10px 12px' }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', marginBottom: '6px'
                                }}>
                                    <span style={{
                                        fontSize: '10px', color: '#94a3b8',
                                        fontWeight: '600', textTransform: 'uppercase',
                                        letterSpacing: '0.4px'
                                    }}>
                                        {s.label}
                                    </span>
                                    <span style={{ fontSize: '16px' }}>{s.icon}</span>
                                </div>
                                <div style={{
                                    fontWeight: '800',
                                    fontSize: formatValue(s.value),
                                    color: s.color,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    lineHeight: 1.2
                                }}>
                                    {s.value}
                                </div>
                                {s.unit && (
                                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                        {s.unit}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row className="g-2">
                {/* ── Loans List ── */}
                <Col lg={8}>
                    {activeLoans.length === 0 ? (
                        <Card className="border-0 shadow-sm text-center"
                            style={{ borderRadius: '10px', padding: '30px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🎉</div>
                            <p style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                                No active loans!
                            </p>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '12px' }}>
                                You are debt-free. Great job!
                            </p>
                            <button onClick={() => setShowAddModal(true)} style={{
                                padding: '5px 16px', borderRadius: '20px', border: 'none',
                                backgroundColor: '#0d6efd', color: '#fff',
                                fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                            }}>
                                + Add a Loan
                            </button>
                        </Card>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {activeLoans.map(loan => {
                                const cfg = categoryConfig[loan.category] || categoryConfig.Others;
                                const paid = (loan.totalAmount || 0) - (loan.outstandingBalance || 0);
                                const pct = loan.totalAmount > 0
                                    ? Math.min(100, (paid / loan.totalAmount) * 100) : 0;
                                const totalInterest = ((loan.emiAmount || 0) *
                                    (loan.durationYears || 0) * 12) - (loan.totalAmount || 0);

                                return (
                                    <Card key={loan.id} className="border-0 shadow-sm"
                                        style={{ borderRadius: '10px', borderLeft: `4px solid ${cfg.color}` }}>
                                        <Card.Body style={{ padding: '12px 14px' }}>

                                            {/* Top Row */}
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'flex-start', marginBottom: '10px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '9px',
                                                        backgroundColor: cfg.bg, fontSize: '18px',
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', flexShrink: 0
                                                    }}>
                                                        {cfg.icon}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                                                            {loan.title}
                                                        </div>
                                                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                                                            {loan.category} • {loan.interestRate}% p.a. • {loan.durationYears} yrs
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <div style={{
                                                        fontWeight: '800', fontSize: '14px', color: cfg.color
                                                    }}>
                                                        ₹{(loan.emiAmount || 0).toLocaleString('en-IN')}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>per month</div>
                                                </div>
                                            </div>

                                            {/* Stats Row */}
                                            <Row className="g-2 mb-2">
                                                {[
                                                    { label: 'Loan Amount',    val: `₹${(loan.totalAmount || 0).toLocaleString('en-IN')}` },
                                                    { label: 'Outstanding',    val: `₹${(loan.outstandingBalance || 0).toLocaleString('en-IN')}`, red: true },
                                                    { label: 'Total Interest', val: `₹${Math.max(0, totalInterest).toLocaleString('en-IN')}` },
                                                ].map((s, i) => (
                                                    <Col xs={4} key={i}>
                                                        <div style={{
                                                            padding: '6px 8px', borderRadius: '7px',
                                                            backgroundColor: '#f8fafc', textAlign: 'center'
                                                        }}>
                                                            <div style={{
                                                                fontSize: '9.5px', color: '#94a3b8',
                                                                fontWeight: '600', textTransform: 'uppercase'
                                                            }}>
                                                                {s.label}
                                                            </div>
                                                            <div style={{
                                                                fontSize: '12px', fontWeight: '700',
                                                                color: s.red ? '#dc2626' : '#0f172a'
                                                            }}>
                                                                {s.val}
                                                            </div>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>

                                            {/* Progress */}
                                            <div style={{ marginBottom: '10px' }}>
                                                <div style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                                                        Repayment Progress
                                                    </span>
                                                    <span style={{
                                                        fontSize: '10px', fontWeight: '700', color: cfg.color
                                                    }}>
                                                        {pct.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div style={{
                                                    height: '6px', borderRadius: '6px',
                                                    backgroundColor: '#f1f5f9', overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%', width: `${pct}%`,
                                                        backgroundColor: cfg.color, borderRadius: '6px',
                                                        transition: 'width 0.5s'
                                                    }} />
                                                </div>
                                                <div style={{
                                                    display: 'flex', justifyContent: 'space-between',
                                                    marginTop: '3px'
                                                }}>
                                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                                        ₹{paid.toLocaleString('en-IN')} paid
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                                        ₹{(loan.outstandingBalance || 0).toLocaleString('en-IN')} remaining
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {[
                                                    { label: '📊 Schedule', action: () => openAmortization(loan), color: '#0d6efd' },
                                                    { label: '⚡ Simulate', action: () => openSimulator(loan),    color: '#059669' },
                                                    { label: '🗑 Delete',   action: () => deleteLoan(loan.id),    color: '#dc2626' },
                                                ].map((btn, i) => (
                                                    <button key={i} onClick={btn.action}
                                                        style={{
                                                            flex: i < 2 ? 1 : 0,
                                                            padding: '4px 8px', borderRadius: '20px',
                                                            cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                                                            border: `1px solid ${btn.color}20`,
                                                            backgroundColor: btn.color + '10',
                                                            color: btn.color, transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = btn.color + '20'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = btn.color + '10'}>
                                                        {btn.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </Col>

                {/* ── AI Suggestions ── */}
                <Col lg={4}>
                    <Card className="border-0 shadow-sm" style={{ borderRadius: '10px' }}>
                        <Card.Body style={{ padding: '12px 14px' }}>
                            <div style={{
                                fontSize: '12px', fontWeight: '700',
                                color: '#0f172a', marginBottom: '10px'
                            }}>
                                <i className="bi bi-lightbulb-fill me-2" style={{ color: '#eab308' }}></i>
                                AI Repayment Suggestions
                            </div>

                            {suggestions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>🤖</div>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px' }}>
                                        No suggestions yet. Add loans to get AI advice.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {suggestions.map((sug, i) => {
                                        const s = getSugIcon(sug.suggestionType);
                                        return (
                                            <div key={i} style={{
                                                padding: '10px 12px', borderRadius: '9px',
                                                backgroundColor: s.bg,
                                                border: `1px solid ${s.color}20`
                                            }}>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center',
                                                    gap: '6px', marginBottom: '5px'
                                                }}>
                                                    <span style={{ fontSize: '14px' }}>{s.icon}</span>
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: '700', color: s.color
                                                    }}>
                                                        {s.label} Strategy
                                                    </span>
                                                </div>
                                                <p style={{
                                                    fontSize: '11.5px', color: '#374151',
                                                    margin: '0 0 5px', lineHeight: 1.5
                                                }}>
                                                    {sug.suggestionText}
                                                </p>
                                                {sug.potentialSavings > 0 && (
                                                    <div style={{
                                                        display: 'inline-flex', alignItems: 'center',
                                                        gap: '4px', padding: '2px 8px', borderRadius: '20px',
                                                        backgroundColor: '#dcfce7', color: '#16a34a',
                                                        fontSize: '10.5px', fontWeight: '700'
                                                    }}>
                                                        💰 Save ₹{(sug.potentialSavings || 0).toLocaleString('en-IN')}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* AI Advisor Prompt */}
                            <div style={{
                                marginTop: '12px', padding: '10px', borderRadius: '9px',
                                backgroundColor: '#ede9fe', border: '1px solid #ddd6fe'
                            }}>
                                <div style={{
                                    fontSize: '11px', fontWeight: '700',
                                    color: '#7c3aed', marginBottom: '4px'
                                }}>
                                    🤖 Want deeper advice?
                                </div>
                                <p style={{ fontSize: '11px', color: '#6d28d9', margin: '0 0 6px' }}>
                                    Ask the AI Advisor chatbot for personalized strategies.
                                </p>
                                <a href="/chatbot" style={{
                                    display: 'inline-block', padding: '3px 12px',
                                    borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                                    backgroundColor: '#7c3aed', color: '#fff', textDecoration: 'none'
                                }}>
                                    Open AI Advisor →
                                </a>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* ── Amortization Modal ── */}
            <Modal show={showAmortModal}
                onHide={() => { setShowAmortModal(false); setAmortization([]); }}
                size="lg" centered>
                <Modal.Header closeButton
                    style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <Modal.Title style={{ fontSize: '14px', fontWeight: '700' }}>
                        📊 Repayment Schedule — {selectedLoan?.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: 0 }}>
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {amortization.length === 0 ? (
                            <div className="text-center py-4">
                                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                            </div>
                        ) : (
                            <Table hover responsive className="mb-0" style={{ fontSize: '12px' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc' }}>
                                    <tr>
                                        {['Month', 'EMI', 'Principal', 'Interest', 'Balance'].map(h => (
                                            <th key={h} style={{
                                                padding: '8px 12px', fontSize: '10px',
                                                fontWeight: '700', color: '#64748b',
                                                textTransform: 'uppercase', border: 'none'
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {amortization.map((row, i) => (
                                        <tr key={i}
                                            style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                            <td style={{ padding: '6px 12px', fontWeight: '600' }}>{row.month}</td>
                                            <td style={{ padding: '6px 12px' }}>
                                                ₹{(row.emiAmount || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '6px 12px', color: '#0d6efd' }}>
                                                ₹{(row.principalPaid || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '6px 12px', color: '#dc2626' }}>
                                                ₹{(row.interestPaid || 0).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '6px 12px', fontWeight: '700' }}>
                                                ₹{(row.balance || 0).toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </div>
                </Modal.Body>
            </Modal>

            {/* ── Extra Payment Simulator Modal ── */}
            <Modal show={showSimModal} onHide={() => setShowSimModal(false)} centered size="sm">
                <Modal.Header closeButton
                    style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <Modal.Title style={{ fontSize: '14px', fontWeight: '700' }}>
                        ⚡ Extra Payment Simulator
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ padding: '14px 16px' }}>
                    {selectedLoan && (
                        <>
                            <div style={{
                                padding: '10px', borderRadius: '9px',
                                backgroundColor: '#f8fafc', marginBottom: '12px', fontSize: '12px'
                            }}>
                                <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                                    {selectedLoan.title}
                                </div>
                                <div style={{ color: '#64748b' }}>
                                    Outstanding: <strong>
                                        ₹{(selectedLoan.outstandingBalance || 0).toLocaleString('en-IN')}
                                    </strong> • EMI: <strong>
                                        ₹{(selectedLoan.emiAmount || 0).toLocaleString('en-IN')}
                                    </strong>
                                </div>
                            </div>

                            <label style={{
                                fontSize: '12px', fontWeight: '600', marginBottom: '5px',
                                display: 'block', color: '#374151'
                            }}>
                                Extra Payment per Month (₹)
                            </label>
                            <div className="input-group input-group-sm mb-2">
                                <span className="input-group-text" style={{ fontSize: '12px' }}>₹</span>
                                <input type="number" min="1" className="form-control"
                                    placeholder="e.g. 2000"
                                    value={extraPayment}
                                    onChange={e => { setExtraPayment(e.target.value); setSimResult(null); }}
                                    style={{ fontSize: '13px' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '5px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                {[500, 1000, 2000, 5000].map(amt => (
                                    <button key={amt}
                                        onClick={() => { setExtraPayment(amt.toString()); setSimResult(null); }}
                                        style={{
                                            padding: '2px 10px', borderRadius: '20px', fontSize: '11px',
                                            border: '1px solid #e2e8f0', backgroundColor: 'white',
                                            color: '#64748b', cursor: 'pointer'
                                        }}>
                                        +₹{amt.toLocaleString('en-IN')}
                                    </button>
                                ))}
                            </div>

                            <button onClick={runSimulation} style={{
                                width: '100%', padding: '7px', borderRadius: '8px',
                                border: 'none', backgroundColor: '#059669',
                                color: '#fff', fontSize: '12px', fontWeight: '700',
                                cursor: 'pointer', marginBottom: '12px'
                            }}>
                                ⚡ Calculate Savings
                            </button>

                            {simResult && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {[
                                        { label: 'New Tenure',     val: `${simResult.newTenureMonths} months`,                        color: '#0d6efd', bg: '#eff6ff' },
                                        { label: 'Months Saved',   val: `${simResult.monthsSaved} months earlier`,                    color: '#059669', bg: '#dcfce7' },
                                        { label: 'Interest Saved', val: `₹${(simResult.interestSaved || 0).toLocaleString('en-IN')}`, color: '#16a34a', bg: '#dcfce7' },
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            padding: '8px 10px', borderRadius: '8px',
                                            backgroundColor: item.bg
                                        }}>
                                            <span style={{ fontSize: '11.5px', color: '#64748b' }}>{item.label}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: item.color }}>
                                                {item.val}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>

            {/* ── Add Loan Modal ── */}
            <Modal show={showAddModal}
                onHide={() => { setShowAddModal(false); setError(''); setEmiPreview(null); }}
                centered>
                <Modal.Header closeButton
                    style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <Modal.Title style={{ fontSize: '14px', fontWeight: '700' }}>
                        <i className="bi bi-bank me-2 text-primary"></i>Add New Loan
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddLoan}>
                    <Modal.Body style={{ padding: '12px 16px' }}>
                        {error && (
                            <Alert variant="danger" className="py-2 mb-2" style={{ fontSize: '12px' }}>
                                <i className="bi bi-exclamation-triangle me-1"></i>{error}
                            </Alert>
                        )}

                        {/* Category Picker */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{
                                fontSize: '12px', fontWeight: '600', color: '#374151',
                                display: 'block', marginBottom: '6px'
                            }}>
                                Loan Type
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {Object.entries(categoryConfig).map(([cat, cfg]) => (
                                    <div key={cat}
                                        onClick={() => setNewLoan({ ...newLoan, category: cat })}
                                        style={{
                                            width: '60px', padding: '6px 4px', textAlign: 'center',
                                            borderRadius: '8px', cursor: 'pointer',
                                            border: newLoan.category === cat
                                                ? `2px solid ${cfg.color}` : '2px solid #e9ecef',
                                            backgroundColor: newLoan.category === cat ? cfg.bg : 'white',
                                            transition: 'all 0.15s'
                                        }}>
                                        <div style={{ fontSize: '18px' }}>{cfg.icon}</div>
                                        <div style={{
                                            fontSize: '9px', marginTop: '2px',
                                            color: newLoan.category === cat ? cfg.color : '#9ca3af',
                                            fontWeight: newLoan.category === cat ? '700' : '400'
                                        }}>{cat}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '8px' }}>
                            <label style={{
                                fontSize: '12px', fontWeight: '600', color: '#374151',
                                display: 'block', marginBottom: '4px'
                            }}>
                                Loan Title <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input type="text" required className="form-control form-control-sm"
                                placeholder="e.g. SBI Home Loan"
                                value={newLoan.title}
                                onChange={e => setNewLoan({ ...newLoan, title: e.target.value })}
                                style={{ fontSize: '12px' }} />
                        </div>

                        <Row className="g-2 mb-2">
                            <Col>
                                <label style={{
                                    fontSize: '12px', fontWeight: '600', color: '#374151',
                                    display: 'block', marginBottom: '4px'
                                }}>
                                    Amount (₹) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text" style={{ fontSize: '12px' }}>₹</span>
                                    <input type="number" required className="form-control"
                                        placeholder="500000"
                                        value={newLoan.totalAmount}
                                        onChange={e => setNewLoan({ ...newLoan, totalAmount: e.target.value })}
                                        style={{ fontSize: '12px' }} />
                                </div>
                            </Col>
                            <Col>
                                <label style={{
                                    fontSize: '12px', fontWeight: '600', color: '#374151',
                                    display: 'block', marginBottom: '4px'
                                }}>
                                    Interest Rate (%)
                                </label>
                                <div className="input-group input-group-sm">
                                    <input type="number" step="0.1" className="form-control"
                                        placeholder="8.5"
                                        value={newLoan.interestRate}
                                        onChange={e => setNewLoan({ ...newLoan, interestRate: e.target.value })}
                                        style={{ fontSize: '12px' }} />
                                    <span className="input-group-text" style={{ fontSize: '12px' }}>%</span>
                                </div>
                            </Col>
                        </Row>

                        <Row className="g-2 mb-2">
                            <Col>
                                <label style={{
                                    fontSize: '12px', fontWeight: '600', color: '#374151',
                                    display: 'block', marginBottom: '4px'
                                }}>
                                    Tenure (Years) <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div className="input-group input-group-sm">
                                    <input type="number" required className="form-control"
                                        placeholder="5"
                                        value={newLoan.durationYears}
                                        onChange={e => setNewLoan({ ...newLoan, durationYears: e.target.value })}
                                        style={{ fontSize: '12px' }} />
                                    <span className="input-group-text" style={{ fontSize: '12px' }}>yrs</span>
                                </div>
                            </Col>
                            <Col>
                                <label style={{
                                    fontSize: '12px', fontWeight: '600', color: '#374151',
                                    display: 'block', marginBottom: '4px'
                                }}>
                                    Start Date <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input type="date" required className="form-control form-control-sm"
                                    value={newLoan.startDate}
                                    onChange={e => setNewLoan({ ...newLoan, startDate: e.target.value })}
                                    style={{ fontSize: '12px' }} />
                            </Col>
                        </Row>

                        {/* EMI Preview */}
                        {emiPreview && (
                            <div style={{
                                padding: '10px 12px', borderRadius: '9px',
                                backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', marginTop: '4px'
                            }}>
                                <div style={{
                                    fontSize: '11px', fontWeight: '700',
                                    color: '#1d4ed8', marginBottom: '6px'
                                }}>
                                    <i className="bi bi-calculator me-1"></i> EMI Preview
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    {[
                                        { label: 'Monthly EMI',    val: `₹${Math.round(emiPreview.emi).toLocaleString('en-IN')}` },
                                        { label: 'Total Interest', val: `₹${Math.max(0, Math.round(emiPreview.interest)).toLocaleString('en-IN')}` },
                                        { label: 'Total Payable',  val: `₹${Math.round(emiPreview.total).toLocaleString('en-IN')}` },
                                    ].map((item, i) => (
                                        <div key={i} style={{ textAlign: 'center' }}>
                                            <div style={{
                                                fontSize: '9.5px', color: '#3b82f6',
                                                fontWeight: '600', textTransform: 'uppercase'
                                            }}>
                                                {item.label}
                                            </div>
                                            <div style={{
                                                fontSize: '12.5px', fontWeight: '800', color: '#1d4ed8'
                                            }}>
                                                {item.val}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer style={{ padding: '8px 16px', borderTop: '1px solid #f1f5f9' }}>
                        <button type="button"
                            onClick={() => { setShowAddModal(false); setError(''); setEmiPreview(null); }}
                            style={{
                                padding: '5px 16px', borderRadius: '20px',
                                border: '1px solid #e2e8f0', backgroundColor: 'white',
                                color: '#64748b', fontSize: '12px', cursor: 'pointer'
                            }}>
                            Cancel
                        </button>
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
                                <><i className="bi bi-bank me-1"></i>Save Loan</>
                            )}
                        </button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Loans;