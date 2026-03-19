import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Modal, Form, Badge, Alert, ProgressBar } from 'react-bootstrap';
import api from '../services/api';

const Lending = () => {
    const [lending, setLending] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showPartialModal, setShowPartialModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [partialAmount, setPartialAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('ALL');
    const [newRecord, setNewRecord] = useState({
        personName: '',
        amount: '',
        lendingDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        status: 'PENDING',
        amountReceived: 0
    });

    const fetchLending = async () => {
        try {
            const res = await api.get('/lending');
            setLending(res.data.data || []);
        } catch (err) {
            console.error('Fetch lending error:', err);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => { fetchLending(); }, []);

    const handleAddRecord = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const payload = {
            personName: newRecord.personName,
            amount: parseFloat(newRecord.amount),
            lendingDate: newRecord.lendingDate,
            dueDate: newRecord.dueDate,
            notes: newRecord.notes || '',
            status: 'PENDING',
            amountReceived: 0
        };
        try {
            await api.post('/lending', payload);
            setShowModal(false);
            setNewRecord({
                personName: '',
                amount: '',
                lendingDate: new Date().toISOString().split('T')[0],
                dueDate: '',
                notes: '',
                status: 'PENDING',
                amountReceived: 0
            });
            fetchLending();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to add record.');
        } finally {
            setLoading(false);
        }
    };

    const handleClearRecord = async (id) => {
        try {
            const params = new URLSearchParams();
            params.append('status', 'CLEARED');
            await api.put(`/lending/${id}?${params.toString()}`);
            fetchLending();
        } catch (err) {
            alert('Update failed: ' + (err?.response?.data?.message || 'Unknown error'));
        }
    };

    const handlePartialPayment = async (e) => {
        e.preventDefault();
        if (!partialAmount || isNaN(partialAmount) || parseFloat(partialAmount) <= 0) return;
        try {
            const params = new URLSearchParams();
            params.append('status', 'PARTIAL');
            params.append('received', partialAmount);
            await api.put(`/lending/${selectedRecord.id}?${params.toString()}`);
            setShowPartialModal(false);
            setPartialAmount('');
            setSelectedRecord(null);
            fetchLending();
        } catch (err) {
            alert('Update failed: ' + (err?.response?.data?.message || 'Unknown error'));
        }
    };

    const openPartialModal = (record) => {
        setSelectedRecord(record);
        setPartialAmount('');
        setShowPartialModal(true);
    };

    const deleteLending = async (id) => {
        if (!window.confirm('Delete this lending record?')) return;
        try {
            await api.delete(`/lending/${id}`);
            fetchLending();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const getDaysUntilDue = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    };

    const getStatusBadge = (record) => {
        const days = getDaysUntilDue(record.dueDate);
        if (record.status === 'CLEARED') {
            return <Badge bg="success" className="px-3 py-2 rounded-pill">✓ Cleared</Badge>;
        }
        if (record.status === 'PARTIAL') {
            return <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill">⟳ Partial</Badge>;
        }
        if (days < 0) {
            return <Badge bg="danger" className="px-3 py-2 rounded-pill">⚠ Overdue</Badge>;
        }
        if (days <= 7) {
            return <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill">⏰ Due Soon</Badge>;
        }
        return <Badge bg="secondary" className="px-3 py-2 rounded-pill">● Pending</Badge>;
    };

    const getAvatarColor = (name) => {
        const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed'];
        const index = name?.charCodeAt(0) % colors.length;
        return colors[index] || '#4f46e5';
    };

    const filteredLending = lending.filter(r => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'PENDING') return r.status === 'PENDING' || r.status === 'PARTIAL';
        if (activeTab === 'OVERDUE') return getDaysUntilDue(r.dueDate) < 0 && r.status !== 'CLEARED';
        if (activeTab === 'CLEARED') return r.status === 'CLEARED';
        return true;
    });

    const totalLent = lending.filter(r => r.status !== 'CLEARED')
        .reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalReceived = lending.reduce((sum, r) => sum + (r.amountReceived || 0), 0);
    const totalPending = lending.filter(r => r.status !== 'CLEARED')
        .reduce((sum, r) => sum + ((r.amount || 0) - (r.amountReceived || 0)), 0);
    const overdueCount = lending.filter(r =>
        getDaysUntilDue(r.dueDate) < 0 && r.status !== 'CLEARED').length;
    const dueSoonCount = lending.filter(r => {
        const d = getDaysUntilDue(r.dueDate);
        return d >= 0 && d <= 7 && r.status !== 'CLEARED';
    }).length;

    if (pageLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <p className="text-muted">Loading lending records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="lending pb-5">

            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Lending Tracker</h2>
                    <p className="text-muted mb-0 small">Track money you've lent to others</p>
                </div>
                <Button variant="primary" className="rounded-pill px-4"
                    onClick={() => setShowModal(true)}>
                    <i className="bi bi-person-plus-fill me-2"></i>Log Lending
                </Button>
            </div>

            {/* Overdue / Due Soon Alerts */}
            {overdueCount > 0 && (
                <Alert variant="danger" className="mb-3 d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill fs-5 me-3"></i>
                    <div>
                        <strong>{overdueCount} record{overdueCount > 1 ? 's are' : ' is'} overdue!</strong>
                        <span className="ms-2 text-muted small">Follow up to collect your money.</span>
                    </div>
                </Alert>
            )}
            {dueSoonCount > 0 && (
                <Alert variant="warning" className="mb-3 d-flex align-items-center">
                    <i className="bi bi-clock-fill fs-5 me-3"></i>
                    <div>
                        <strong>{dueSoonCount} record{dueSoonCount > 1 ? 's are' : ' is'} due within 7 days.</strong>
                        <span className="ms-2 text-muted small">Remind them soon!</span>
                    </div>
                </Alert>
            )}

            {/* Summary Banner */}
            <Card className="border-0 shadow-sm mb-4 overflow-hidden">
                <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0d6efd 100%)', padding: '24px' }}>
                    <Row className="align-items-center">
                        <Col md={5}>
                            <h6 className="text-white-50 mb-1 small text-uppercase fw-bold">
                                Total Pending Recovery
                            </h6>
                            <h2 className="text-white fw-bold mb-0">
                                ₹{totalPending.toLocaleString('en-IN')}
                            </h2>
                            <small className="text-white-50">
                                from {lending.filter(r => r.status !== 'CLEARED').length} active records
                            </small>
                        </Col>
                        <Col md={7}>
                            <Row className="mt-3 mt-md-0 g-3">
                                <Col xs={4}>
                                    <div className="bg-white bg-opacity-10 rounded-3 p-3 text-center">
                                        <div className="text-white fw-bold fs-5">
                                            ₹{totalLent.toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-white-50 small">Total Lent</div>
                                    </div>
                                </Col>
                                <Col xs={4}>
                                    <div className="bg-white bg-opacity-10 rounded-3 p-3 text-center">
                                        <div className="text-white fw-bold fs-5">
                                            ₹{totalReceived.toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-white-50 small">Received</div>
                                    </div>
                                </Col>
                                <Col xs={4}>
                                    <div className="bg-white bg-opacity-10 rounded-3 p-3 text-center">
                                        <div className="text-white fw-bold fs-5 text-warning">
                                            {overdueCount}
                                        </div>
                                        <div className="text-white-50 small">Overdue</div>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </div>
            </Card>

            {/* Filter Tabs */}
            <div className="d-flex gap-2 mb-4 flex-wrap">
                {[
                    { key: 'ALL', label: 'All', count: lending.length },
                    { key: 'PENDING', label: 'Pending', count: lending.filter(r => r.status !== 'CLEARED').length },
                    { key: 'OVERDUE', label: 'Overdue', count: overdueCount },
                    { key: 'CLEARED', label: 'Cleared', count: lending.filter(r => r.status === 'CLEARED').length },
                ].map(tab => (
                    <Button
                        key={tab.key}
                        variant={activeTab === tab.key ? 'primary' : 'outline-secondary'}
                        className="rounded-pill px-3"
                        size="sm"
                        onClick={() => setActiveTab(tab.key)}>
                        {tab.label}
                        <Badge bg={activeTab === tab.key ? 'light' : 'secondary'}
                            text={activeTab === tab.key ? 'primary' : 'white'}
                            className="ms-2">
                            {tab.count}
                        </Badge>
                    </Button>
                ))}
            </div>

            {/* Records */}
            {filteredLending.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                        <div style={{ fontSize: '56px' }} className="mb-3">🤝</div>
                        <h5 className="fw-bold text-dark mb-2">No records found</h5>
                        <p className="text-muted mb-4">
                            {activeTab === 'ALL'
                                ? 'No lending records yet. Start tracking money you lend!'
                                : `No ${activeTab.toLowerCase()} records.`}
                        </p>
                        {activeTab === 'ALL' && (
                            <Button variant="primary" className="rounded-pill px-4"
                                onClick={() => setShowModal(true)}>
                                <i className="bi bi-plus-lg me-2"></i>Log First Lending
                            </Button>
                        )}
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {filteredLending.map(record => {
                        const days = getDaysUntilDue(record.dueDate);
                        const percent = record.amount > 0
                            ? Math.min(100, (record.amountReceived / record.amount) * 100)
                            : 0;
                        const isCleared = record.status === 'CLEARED';
                        const isOverdue = days < 0 && !isCleared;

                        return (
                            <Col md={6} lg={4} key={record.id} className="mb-4">
                                <Card
                                    className="border-0 shadow-sm h-100"
                                    style={{
                                        transition: 'transform 0.2s',
                                        borderLeft: isOverdue ? '4px solid #dc3545' :
                                            isCleared ? '4px solid #198754' :
                                                days <= 7 ? '4px solid #ffc107' :
                                                    '4px solid #0d6efd'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <Card.Body className="p-4">

                                        {/* Top Row */}
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="d-flex align-items-center gap-3">
                                                {/* Avatar */}
                                                <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-5"
                                                    style={{
                                                        width: '48px',
                                                        height: '48px',
                                                        minWidth: '48px',
                                                        backgroundColor: getAvatarColor(record.personName)
                                                    }}>
                                                    {record.personName?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">{record.personName}</h6>
                                                    <small className="text-muted">
                                                        <i className="bi bi-calendar me-1"></i>
                                                        Lent on {record.lendingDate
                                                            ? new Date(record.lendingDate).toLocaleDateString('en-IN')
                                                            : '-'}
                                                    </small>
                                                </div>
                                            </div>
                                            {getStatusBadge(record)}
                                        </div>

                                        {/* Amount */}
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between mb-1">
                                                <div>
                                                    <div className="text-muted small">Amount Lent</div>
                                                    <div className="fw-bold fs-4 text-dark">
                                                        ₹{(record.amount || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="text-muted small">Received</div>
                                                    <div className="fw-bold fs-4 text-success">
                                                        ₹{(record.amountReceived || 0).toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Recovery Progress */}
                                            <ProgressBar
                                                now={percent}
                                                variant={isCleared ? 'success' : percent > 50 ? 'info' : 'warning'}
                                                style={{ height: '8px', borderRadius: '8px' }}
                                                className="mb-1"
                                            />
                                            <div className="d-flex justify-content-between">
                                                <small className="text-muted">{percent.toFixed(0)}% recovered</small>
                                                <small className="text-danger fw-bold">
                                                    ₹{((record.amount || 0) - (record.amountReceived || 0))
                                                        .toLocaleString('en-IN')} pending
                                                </small>
                                            </div>
                                        </div>

                                        {/* Due Date Info */}
                                        <div className="bg-light rounded-3 p-3 mb-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div className="text-muted small">Due Date</div>
                                                    <div className="fw-bold small">
                                                        {record.dueDate
                                                            ? new Date(record.dueDate).toLocaleDateString('en-IN')
                                                            : '-'}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="text-muted small">Status</div>
                                                    <div className={`fw-bold small ${isOverdue ? 'text-danger' : days <= 7 && !isCleared ? 'text-warning' : 'text-success'}`}>
                                                        {isCleared ? 'Fully Collected ✓' :
                                                            isOverdue ? `${Math.abs(days)} days overdue!` :
                                                                days === 0 ? 'Due Today!' :
                                                                    `${days} days left`}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {record.notes && (
                                            <div className="text-muted small mb-3 fst-italic">
                                                <i className="bi bi-chat-quote me-1"></i>
                                                "{record.notes}"
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {!isCleared ? (
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    className="flex-grow-1 rounded-pill"
                                                    onClick={() => handleClearRecord(record.id)}>
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    Fully Paid
                                                </Button>
                                                <Button
                                                    variant="outline-warning"
                                                    size="sm"
                                                    className="rounded-pill"
                                                    onClick={() => openPartialModal(record)}>
                                                    <i className="bi bi-cash me-1"></i>
                                                    Partial
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="rounded-pill"
                                                    onClick={() => deleteLending(record.id)}>
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="d-flex gap-2">
                                                <div className="flex-grow-1 text-center py-2 bg-success bg-opacity-10 rounded-pill">
                                                    <span className="text-success fw-bold small">
                                                        🎉 Fully Recovered!
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="rounded-pill"
                                                    onClick={() => deleteLending(record.id)}>
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Add Lending Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); setError(''); }} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">
                        <i className="bi bi-person-plus-fill me-2 text-primary"></i>
                        New Lending Record
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddRecord}>
                    <Modal.Body className="pt-2">
                        {error && (
                            <Alert variant="danger" className="mb-3">
                                <i className="bi bi-exclamation-triangle me-2"></i>{error}
                            </Alert>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                                Person's Name <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                required
                                placeholder="Who did you lend to?"
                                value={newRecord.personName}
                                onChange={(e) => setNewRecord({ ...newRecord, personName: e.target.value })}
                                className="rounded-3"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                                Amount (₹) <span className="text-danger">*</span>
                            </Form.Label>
                            <div className="input-group">
                                <span className="input-group-text">₹</span>
                                <Form.Control
                                    type="number"
                                    required
                                    min="1"
                                    placeholder="10,000"
                                    value={newRecord.amount}
                                    onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                                />
                            </div>
                        </Form.Group>

                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">Lending Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        required
                                        value={newRecord.lendingDate}
                                        onChange={(e) => setNewRecord({ ...newRecord, lendingDate: e.target.value })}
                                        className="rounded-3"
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        Due Date <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        required
                                        min={newRecord.lendingDate}
                                        value={newRecord.dueDate}
                                        onChange={(e) => setNewRecord({ ...newRecord, dueDate: e.target.value })}
                                        className="rounded-3"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                placeholder="What was it for? (Optional)"
                                value={newRecord.notes}
                                onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                                className="rounded-3"
                            />
                        </Form.Group>

                        {/* Preview */}
                        {newRecord.amount && newRecord.dueDate && (
                            <div className="bg-primary bg-opacity-10 rounded-3 p-3">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-info-circle text-primary fs-5"></i>
                                    <div>
                                        <div className="text-primary fw-bold small">
                                            ₹{parseFloat(newRecord.amount).toLocaleString('en-IN')} due on{' '}
                                            {new Date(newRecord.dueDate).toLocaleDateString('en-IN')}
                                        </div>
                                        <div className="text-muted small">
                                            {getDaysUntilDue(newRecord.dueDate)} days from today
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" className="rounded-pill"
                            onClick={() => { setShowModal(false); setError(''); }}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading} className="rounded-pill px-4">
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-check-circle me-2"></i>Save Record
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Partial Payment Modal */}
            <Modal show={showPartialModal} onHide={() => {
                setShowPartialModal(false);
                setPartialAmount('');
            }} centered size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Log Partial Payment</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handlePartialPayment}>
                    <Modal.Body>
                        {selectedRecord && (
                            <>
                                <div className="text-center mb-4">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4 mx-auto mb-2"
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            backgroundColor: getAvatarColor(selectedRecord.personName)
                                        }}>
                                        {selectedRecord.personName?.charAt(0).toUpperCase()}
                                    </div>
                                    <h6 className="fw-bold">{selectedRecord.personName}</h6>
                                    <div className="text-muted small">
                                        Pending: ₹{((selectedRecord.amount || 0) - (selectedRecord.amountReceived || 0))
                                            .toLocaleString('en-IN')}
                                    </div>
                                    <ProgressBar
                                        now={selectedRecord.amount > 0
                                            ? (selectedRecord.amountReceived / selectedRecord.amount) * 100 : 0}
                                        variant="warning"
                                        className="mt-2"
                                        style={{ height: '6px' }}
                                    />
                                </div>

                                <Form.Group>
                                    <Form.Label className="fw-semibold">Amount Received (₹)</Form.Label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <Form.Control
                                            type="number"
                                            required
                                            min="1"
                                            max={(selectedRecord.amount || 0) - (selectedRecord.amountReceived || 0)}
                                            placeholder="Enter amount"
                                            value={partialAmount}
                                            onChange={(e) => setPartialAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </Form.Group>

                                {/* Quick amounts */}
                                <div className="d-flex gap-2 flex-wrap mt-3">
                                    {[500, 1000, 2000, 5000].map(amt => (
                                        <Button key={amt} variant="outline-primary"
                                            size="sm" className="rounded-pill"
                                            onClick={() => setPartialAmount(amt.toString())}>
                                            ₹{amt.toLocaleString('en-IN')}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" className="rounded-pill"
                            onClick={() => { setShowPartialModal(false); setPartialAmount(''); }}>
                            Cancel
                        </Button>
                        <Button variant="warning" type="submit" className="rounded-pill px-4">
                            <i className="bi bi-cash me-2"></i>
                            Record ₹{parseFloat(partialAmount || 0).toLocaleString('en-IN')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Lending;