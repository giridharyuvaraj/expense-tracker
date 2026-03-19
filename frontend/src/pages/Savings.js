import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Button, Form, Modal, Alert, Badge } from 'react-bootstrap';
import api from '../services/api';

const Savings = () => {
    const [goals, setGoals] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAddSavingsModal, setShowAddSavingsModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [addAmount, setAddAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [newGoal, setNewGoal] = useState({
        goalName: '',
        goalAmount: '',
        savedAmount: 0,
        targetDate: '',
        icon: '🎯'
    });

    const goalIcons = [
        { icon: '🚗', label: 'Car' },
        { icon: '🏠', label: 'Home' },
        { icon: '✈️', label: 'Travel' },
        { icon: '📱', label: 'Gadget' },
        { icon: '🎓', label: 'Education' },
        { icon: '💍', label: 'Wedding' },
        { icon: '🏥', label: 'Medical' },
        { icon: '🎯', label: 'Other' },
    ];

    const fetchGoals = async () => {
        try {
            const res = await api.get('/savings-goals');
            setGoals(res.data.data || []);
        } catch (err) {
            console.error('Fetch goals error:', err);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => { fetchGoals(); }, []);

    const handleAddGoal = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const payload = {
            goalName: newGoal.goalName,
            goalAmount: parseFloat(newGoal.goalAmount),
            savedAmount: 0,
            targetDate: newGoal.targetDate
        };
        try {
            await api.post('/savings-goals', payload);
            setShowModal(false);
            setNewGoal({ goalName: '', goalAmount: '', savedAmount: 0, targetDate: '', icon: '🎯' });
            fetchGoals();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to add goal.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSavings = async (e) => {
        e.preventDefault();
        if (!addAmount || isNaN(addAmount) || parseFloat(addAmount) <= 0) return;
        try {
            await api.put(`/savings-goals/${selectedGoal.id}?amount=${addAmount}`);
            setShowAddSavingsModal(false);
            setAddAmount('');
            setSelectedGoal(null);
            fetchGoals();
        } catch (err) {
            alert('Update failed: ' + (err?.response?.data?.message || 'Unknown error'));
        }
    };

    const openAddSavings = (goal) => {
        setSelectedGoal(goal);
        setAddAmount('');
        setShowAddSavingsModal(true);
    };

    const deleteGoal = async (id) => {
        if (!window.confirm('Delete this savings goal?')) return;
        try {
            await api.delete(`/savings-goals/${id}`);
            fetchGoals();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const getProgressVariant = (percent) => {
        if (percent >= 100) return 'success';
        if (percent >= 60) return 'info';
        if (percent >= 30) return 'warning';
        return 'danger';
    };

    const getDaysLeft = (targetDate) => {
        if (!targetDate) return null;
        const today = new Date();
        const target = new Date(targetDate);
        return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    };

    const getMonthlyNeeded = (goal) => {
        const daysLeft = getDaysLeft(goal.targetDate);
        if (!daysLeft || daysLeft <= 0) return null;
        const remaining = parseFloat(goal.goalAmount) - parseFloat(goal.savedAmount);
        const monthsLeft = daysLeft / 30;
        return Math.ceil(remaining / monthsLeft);
    };

    const getCardBorderClass = (isCompleted, isOverdue) => {
        if (isCompleted) return 'border-0 shadow-sm h-100 border-top border-success border-3';
        if (isOverdue) return 'border-0 shadow-sm h-100 border-top border-danger border-3';
        return 'border-0 shadow-sm h-100';
    };

    const totalTarget = goals.reduce((sum, g) => sum + (parseFloat(g.goalAmount) || 0), 0);
    const totalSaved = goals.reduce((sum, g) => sum + (parseFloat(g.savedAmount) || 0), 0);
    const completedGoals = goals.filter(g => parseFloat(g.savedAmount) >= parseFloat(g.goalAmount)).length;
    const overallPercent = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

    if (pageLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <p className="text-muted">Loading your savings goals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="savings pb-5">

            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Savings Goals</h2>
                    <p className="text-muted mb-0 small">Track your progress towards financial dreams</p>
                </div>
                <Button variant="primary" className="rounded-pill px-4" onClick={() => setShowModal(true)}>
                    <i className="bi bi-plus-lg me-2"></i>New Goal
                </Button>
            </div>

            {/* Overall Summary Banner */}
            {goals.length > 0 && (
                <Card className="border-0 shadow-sm mb-4 overflow-hidden">
                    <div style={{ background: 'linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)', padding: '24px' }}>
                        <Row className="align-items-center">
                            <Col md={6}>
                                <h5 className="text-white mb-1 fw-bold">Overall Savings Progress</h5>
                                <p className="text-white-50 mb-3 small">
                                    {completedGoals} of {goals.length} goals completed
                                </p>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <span className="text-white fw-bold fs-4">
                                        ₹{totalSaved.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-white-50">
                                        / ₹{totalTarget.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <ProgressBar
                                    now={overallPercent}
                                    style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.2)' }}
                                    className="rounded-pill"
                                />
                                <small className="text-white-50 mt-1 d-block">
                                    {overallPercent.toFixed(1)}% of total target saved
                                </small>
                            </Col>
                            <Col md={6}>
                                <Row className="mt-3 mt-md-0">
                                    <Col xs={4} className="text-center">
                                        <div className="bg-white bg-opacity-10 rounded-3 p-3">
                                            <div className="text-white fw-bold fs-5">
                                                ₹{totalSaved.toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-white-50 small">Saved</div>
                                        </div>
                                    </Col>
                                    <Col xs={4} className="text-center">
                                        <div className="bg-white bg-opacity-10 rounded-3 p-3">
                                            <div className="text-white fw-bold fs-5">
                                                ₹{(totalTarget - totalSaved).toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-white-50 small">Remaining</div>
                                        </div>
                                    </Col>
                                    <Col xs={4} className="text-center">
                                        <div className="bg-white bg-opacity-10 rounded-3 p-3">
                                            <div className="text-white fw-bold fs-5">{completedGoals}</div>
                                            <div className="text-white-50 small">Completed</div>
                                        </div>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </div>
                </Card>
            )}

            {/* Goals Grid */}
            {goals.length === 0 ? (
                <Card className="border-0 shadow-sm text-center py-5">
                    <Card.Body>
                        <div className="mb-4" style={{ fontSize: '64px' }}>🎯</div>
                        <h4 className="fw-bold text-dark mb-2">No savings goals yet</h4>
                        <p className="text-muted mb-4">
                            Set a goal and start building your financial future, one rupee at a time!
                        </p>
                        <Button variant="primary" className="rounded-pill px-4" onClick={() => setShowModal(true)}>
                            <i className="bi bi-plus-lg me-2"></i>Create Your First Goal
                        </Button>
                    </Card.Body>
                </Card>
            ) : (
                <Row>
                    {goals.map(goal => {
                        const saved = parseFloat(goal.savedAmount || 0);
                        const target = parseFloat(goal.goalAmount || 0);
                        const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
                        const daysLeft = getDaysLeft(goal.targetDate);
                        const isCompleted = percent >= 100;
                        const isOverdue = daysLeft !== null && daysLeft < 0 && !isCompleted;
                        const monthlyNeeded = getMonthlyNeeded(goal);

                        return (
                            <Col md={6} lg={4} key={goal.id} className="mb-4">
                                <Card
                                    className={getCardBorderClass(isCompleted, isOverdue)}
                                    style={{ transition: 'transform 0.2s', cursor: 'default' }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <Card.Body className="p-4">

                                        {/* Card Top Row */}
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <div
                                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{
                                                        width: '44px',
                                                        height: '44px',
                                                        backgroundColor: isCompleted ? '#d1fae5' : '#eff6ff',
                                                        fontSize: '22px'
                                                    }}>
                                                    {isCompleted ? '🏆' : '🎯'}
                                                </div>
                                                <div>
                                                    <h6 className="fw-bold mb-0">{goal.goalName}</h6>
                                                    {isCompleted ? (
                                                        <Badge bg="success" className="small">✓ Completed</Badge>
                                                    ) : isOverdue ? (
                                                        <Badge bg="danger" className="small">Overdue</Badge>
                                                    ) : daysLeft !== null && daysLeft <= 30 ? (
                                                        <Badge bg="warning" text="dark" className="small">
                                                            {daysLeft} days left
                                                        </Badge>
                                                    ) : (
                                                        <small className="text-muted">{daysLeft} days left</small>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="link"
                                                className="text-muted p-0"
                                                onClick={() => deleteGoal(goal.id)}>
                                                <i className="bi bi-x-circle fs-5"></i>
                                            </Button>
                                        </div>

                                        {/* Amount Display */}
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-end mb-1">
                                                <div>
                                                    <div className="text-muted small">Saved</div>
                                                    <div className="fw-bold fs-5 text-success">
                                                        ₹{saved.toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <div className="text-muted small">Target</div>
                                                    <div className="fw-bold fs-5 text-primary">
                                                        ₹{target.toLocaleString('en-IN')}
                                                    </div>
                                                </div>
                                            </div>
                                            <ProgressBar
                                                now={percent}
                                                variant={getProgressVariant(percent)}
                                                style={{ height: '10px', borderRadius: '10px' }}
                                                className="mb-1"
                                            />
                                            <div className="d-flex justify-content-between">
                                                <small className="text-muted">{percent.toFixed(1)}%</small>
                                                <small className="text-muted">
                                                    ₹{(target - saved).toLocaleString('en-IN')} left
                                                </small>
                                            </div>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="bg-light rounded-3 p-3 mb-3">
                                            <Row className="g-0 text-center">
                                                <Col xs={6} className="border-end">
                                                    <div className="text-muted small">Target Date</div>
                                                    <div className="fw-bold small">
                                                        {goal.targetDate ?
                                                            new Date(goal.targetDate).toLocaleDateString('en-IN')
                                                            : 'Not set'}
                                                    </div>
                                                </Col>
                                                <Col xs={6}>
                                                    <div className="text-muted small">Monthly Need</div>
                                                    <div className="fw-bold small text-primary">
                                                        {isCompleted ? '—' :
                                                            monthlyNeeded ?
                                                                `₹${monthlyNeeded.toLocaleString('en-IN')}`
                                                                : '—'}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Action Button */}
                                        {isCompleted ? (
                                            <div className="text-center py-2 bg-success bg-opacity-10 rounded-3">
                                                <span className="text-success fw-bold">🎉 Goal Achieved!</span>
                                            </div>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="w-100 rounded-pill"
                                                onClick={() => openAddSavings(goal)}>
                                                <i className="bi bi-plus-circle me-2"></i>Add Savings
                                            </Button>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Create Goal Modal */}
            <Modal show={showModal} onHide={() => { setShowModal(false); setError(''); }} centered size="md">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Create New Savings Goal</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddGoal}>
                    <Modal.Body className="pt-2">
                        {error && (
                            <Alert variant="danger" className="mb-3">
                                <i className="bi bi-exclamation-triangle me-2"></i>{error}
                            </Alert>
                        )}

                        {/* Icon Picker */}
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">Goal Category</Form.Label>
                            <div className="d-flex flex-wrap gap-2">
                                {goalIcons.map(({ icon, label }) => (
                                    <div
                                        key={icon}
                                        onClick={() => setNewGoal({ ...newGoal, icon })}
                                        className="rounded-3 p-2 text-center"
                                        style={{
                                            cursor: 'pointer',
                                            width: '60px',
                                            border: newGoal.icon === icon ? '2px solid #0d6efd' : '2px solid #e9ecef',
                                            backgroundColor: newGoal.icon === icon ? '#eff6ff' : 'white',
                                            transition: 'all 0.15s'
                                        }}>
                                        <div style={{ fontSize: '22px' }}>{icon}</div>
                                        <div style={{ fontSize: '10px' }} className="text-muted">{label}</div>
                                    </div>
                                ))}
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold">
                                Goal Name <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                required
                                placeholder="e.g. New Car, Europe Trip..."
                                value={newGoal.goalName}
                                onChange={(e) => setNewGoal({ ...newGoal, goalName: e.target.value })}
                                className="rounded-3"
                            />
                        </Form.Group>

                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        Target Amount (₹) <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <Form.Control
                                            type="number"
                                            required
                                            min="1"
                                            placeholder="50000"
                                            value={newGoal.goalAmount}
                                            onChange={(e) => setNewGoal({ ...newGoal, goalAmount: e.target.value })}
                                        />
                                    </div>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold">
                                        Target Date <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        value={newGoal.targetDate}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                                        className="rounded-3"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Monthly savings preview */}
                        {newGoal.goalAmount && newGoal.targetDate && (
                            <div className="bg-primary bg-opacity-10 rounded-3 p-3 mt-2">
                                <div className="d-flex align-items-center gap-2">
                                    <i className="bi bi-calculator text-primary fs-5"></i>
                                    <div>
                                        <div className="text-primary fw-bold">
                                            Save ₹{Math.ceil(
                                                parseFloat(newGoal.goalAmount) /
                                                Math.max(1, Math.ceil(
                                                    (new Date(newGoal.targetDate) - new Date()) /
                                                    (1000 * 60 * 60 * 24 * 30)
                                                ))
                                            ).toLocaleString('en-IN')} per month
                                        </div>
                                        <div className="text-muted small">to reach your goal on time</div>
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
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-piggy-bank me-2"></i>Create Goal
                                </>
                            )}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Add Savings Modal */}
            <Modal show={showAddSavingsModal} onHide={() => {
                setShowAddSavingsModal(false);
                setAddAmount('');
            }} centered size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold">Add Savings</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAddSavings}>
                    <Modal.Body>
                        {selectedGoal && (
                            <>
                                <div className="text-center mb-4">
                                    <div style={{ fontSize: '40px' }}>💰</div>
                                    <h6 className="fw-bold mt-2">{selectedGoal.goalName}</h6>
                                    <div className="text-muted small">
                                        ₹{parseFloat(selectedGoal.savedAmount).toLocaleString('en-IN')} saved
                                        of ₹{parseFloat(selectedGoal.goalAmount).toLocaleString('en-IN')}
                                    </div>
                                    <ProgressBar
                                        now={Math.min(100,
                                            (parseFloat(selectedGoal.savedAmount) /
                                            parseFloat(selectedGoal.goalAmount)) * 100)}
                                        variant="success"
                                        className="mt-2"
                                        style={{ height: '6px' }}
                                    />
                                </div>

                                <Form.Group>
                                    <Form.Label className="fw-semibold">Amount to Add (₹)</Form.Label>
                                    <div className="input-group">
                                        <span className="input-group-text">₹</span>
                                        <Form.Control
                                            type="number"
                                            required
                                            min="1"
                                            placeholder="1000"
                                            value={addAmount}
                                            onChange={(e) => setAddAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </Form.Group>

                                {/* Quick amounts */}
                                <div className="d-flex gap-2 flex-wrap mt-3">
                                    {[500, 1000, 2000, 5000].map(amt => (
                                        <Button
                                            key={amt}
                                            variant="outline-primary"
                                            size="sm"
                                            className="rounded-pill"
                                            onClick={() => setAddAmount(amt.toString())}>
                                            +₹{amt.toLocaleString('en-IN')}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="border-0 pt-0">
                        <Button variant="light" className="rounded-pill"
                            onClick={() => { setShowAddSavingsModal(false); setAddAmount(''); }}>
                            Cancel
                        </Button>
                        <Button variant="success" type="submit" className="rounded-pill px-4">
                            <i className="bi bi-plus-circle me-2"></i>
                            Add ₹{parseFloat(addAmount || 0).toLocaleString('en-IN')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default Savings;