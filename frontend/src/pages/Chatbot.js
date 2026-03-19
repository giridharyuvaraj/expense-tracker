import React, { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-bootstrap';
import chatbotService from '../services/chatbotService';

const Chatbot = () => {
    const [messages, setMessages] = useState([{
        role: 'model',
        message: 'Hello! I am your AI Financial Advisor powered by Gemini. How can I help you optimize your loans and spending today?'
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [sessionError, setSessionError] = useState(false);
    const [sessionLoading, setSessionLoading] = useState(true);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => {
        const initSession = async () => {
            setSessionLoading(true);
            try {
                const savedId = localStorage.getItem('chatSessionId');
                if (savedId) {
                    setSessionId(parseInt(savedId));
                    try {
                        const res = await chatbotService.getSessionMessages(savedId);
                        const msgs = res?.data?.data;
                        if (msgs?.length > 0) {
                            setMessages(msgs.map(m => ({ role: m.role, message: m.message })));
                        }
                    } catch (err) {
                        if (err?.response?.status === 404) {
                            localStorage.removeItem('chatSessionId');
                            await createNewSession();
                        }
                    }
                } else {
                    await createNewSession();
                }
            } catch (err) {
                setSessionError(true);
            } finally {
                setSessionLoading(false);
            }
        };
        initSession();
    }, []);

    useEffect(scrollToBottom, [messages]);

    const createNewSession = async () => {
        try {
            const res = await chatbotService.createSession();
            const id = res?.data?.data?.id;
            if (id) {
                setSessionId(id);
                localStorage.setItem('chatSessionId', id.toString());
                setMessages([{ role: 'model', message: 'Hello! I am your AI Financial Advisor powered by Gemini. How can I help you optimize your loans and spending today?' }]);
            } else { setSessionError(true); }
        } catch { setSessionError(true); }
    };

    const handleSend = async (text) => {
        const userMsg = typeof text === 'string' ? text : input;
        if (!userMsg.trim() || loading || !sessionId) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', message: userMsg }]);
        setLoading(true);
        try {
            const res = await chatbotService.sendMessage({ sessionId, message: userMsg });
            setMessages(prev => [...prev, { role: 'model', message: res?.data?.data?.reply || 'Could not get response.' }]);
        } catch (err) {
            const msg = err?.response?.data?.message || 'Connection error. Please try again.';
            setMessages(prev => [...prev, { role: 'model', message: `⚠️ ${msg}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = async () => {
        if (!window.confirm('Start a new chat?')) return;
        localStorage.removeItem('chatSessionId');
        setSessionLoading(true);
        setMessages([{ role: 'model', message: 'Hello! I am your AI Financial Advisor powered by Gemini. How can I help you?' }]);
        await createNewSession();
        setSessionLoading(false);
    };

    const quickPrompts = [
        "Which loan should I pay first?",
        "How to reduce my interest?",
        "What expenses can I cut?",
        "Give me a monthly plan"
    ];

    return (
        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '2px' }}>AI Financial Advisor</h2>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Powered by Google Gemini</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        backgroundColor: sessionId ? '#dcfce7' : sessionError ? '#fef2f2' : '#fef9c3',
                        color: sessionId ? '#16a34a' : sessionError ? '#dc2626' : '#d97706'
                    }}>
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '7px' }}></i>
                        {sessionId ? `Session #${sessionId}` : sessionError ? 'Failed' : 'Connecting...'}
                    </span>
                    <button onClick={handleNewChat} disabled={sessionLoading || loading}
                        style={{
                            padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
                            border: '1px solid #e2e8f0', backgroundColor: 'white',
                            color: '#64748b', cursor: 'pointer', fontWeight: '600'
                        }}>
                        <i className="bi bi-plus-circle me-1"></i>New Chat
                    </button>
                </div>
            </div>

            {sessionError && (
                <Alert variant="danger" className="py-2 mb-2" style={{ fontSize: '12px' }}>
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Session failed. <a href="/chatbot">Refresh page</a> to try again.
                </Alert>
            )}

            {sessionLoading && !sessionError && (
                <Alert variant="info" className="py-2 mb-2" style={{ fontSize: '12px' }}>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    Loading session...
                </Alert>
            )}

            {/* Chat Container */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                backgroundColor: '#fff', borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden'
            }}>

                {/* Chat Header */}
                <div style={{
                    padding: '10px 14px', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    backgroundColor: '#fafafa', flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c3aed, #0d6efd)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '14px'
                        }}>🤖</div>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: '#0f172a' }}>Gemini AI Advisor</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                <i className="bi bi-database me-1"></i>Chat saved to database
                            </div>
                        </div>
                    </div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {messages.filter(m => m.role === 'user').length} messages
                    </span>
                </div>

                {/* Messages */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '14px',
                    backgroundColor: '#f8fafc',
                    scrollbarWidth: 'thin'
                }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} style={{
                            display: 'flex', marginBottom: '10px',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-end', gap: '6px'
                        }}>
                            {msg.role !== 'user' && (
                                <div style={{
                                    width: '26px', height: '26px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #7c3aed, #0d6efd)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: '11px', flexShrink: 0
                                }}>🤖</div>
                            )}
                            <div style={{
                                maxWidth: '78%', padding: '8px 12px',
                                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                backgroundColor: msg.role === 'user' ? '#0d6efd' : '#fff',
                                color: msg.role === 'user' ? '#fff' : '#0f172a',
                                fontSize: '12.5px', lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                border: msg.role !== 'user' ? '1px solid #f1f5f9' : 'none'
                            }}>
                                {msg.message}
                            </div>
                            {msg.role === 'user' && (
                                <div style={{
                                    width: '26px', height: '26px', borderRadius: '50%',
                                    backgroundColor: '#0d6efd',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: '11px', flexShrink: 0
                                }}>
                                    <i className="bi bi-person-fill"></i>
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '10px' }}>
                            <div style={{
                                width: '26px', height: '26px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #7c3aed, #0d6efd)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontSize: '11px'
                            }}>🤖</div>
                            <div style={{
                                padding: '8px 14px', borderRadius: '12px 12px 12px 2px',
                                backgroundColor: '#fff', border: '1px solid #f1f5f9',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                            }}>
                                <span className="spinner-grow spinner-grow-sm me-1 text-primary" role="status"></span>
                                <span className="spinner-grow spinner-grow-sm me-1 text-primary" role="status"></span>
                                <span className="spinner-grow spinner-grow-sm text-primary" role="status"></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Quick Prompts */}
                <div style={{
                    padding: '8px 12px', borderTop: '1px solid #f1f5f9',
                    backgroundColor: '#fff', flexShrink: 0
                }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '5px', fontWeight: '600' }}>
                        <i className="bi bi-lightning-fill me-1 text-warning"></i>Quick questions:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {quickPrompts.map((p, i) => (
                            <button key={i}
                                disabled={loading || !sessionId}
                                onClick={() => handleSend(p)}
                                style={{
                                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                                    border: '1px solid #dbeafe', backgroundColor: '#eff6ff',
                                    color: '#0d6efd', cursor: loading || !sessionId ? 'not-allowed' : 'pointer',
                                    fontWeight: '500', opacity: loading || !sessionId ? 0.5 : 1
                                }}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input */}
                <div style={{
                    padding: '10px 12px', borderTop: '1px solid #f1f5f9',
                    backgroundColor: '#fff', flexShrink: 0
                }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
                            disabled={loading || !sessionId}
                            placeholder={sessionId ? "Ask about your loans, savings, or budget..." : "Loading session..."}
                            style={{
                                flex: 1, padding: '8px 14px', borderRadius: '20px',
                                border: '1px solid #e2e8f0', fontSize: '12.5px',
                                outline: 'none', backgroundColor: '#f8fafc',
                                color: '#0f172a'
                            }}
                        />
                        <button
                            onClick={() => handleSend(input)}
                            disabled={loading || !sessionId || !input.trim()}
                            style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                border: 'none', backgroundColor: '#0d6efd',
                                color: '#fff', cursor: loading || !sessionId || !input.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, opacity: loading || !sessionId || !input.trim() ? 0.5 : 1,
                                transition: 'all 0.15s'
                            }}>
                            {loading ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : (
                                <i className="bi bi-send-fill" style={{ fontSize: '13px' }}></i>
                            )}
                        </button>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '6px' }}>
                        <i className="bi bi-shield-check me-1"></i>
                        AI advice is for guidance only. Consult a financial advisor for major decisions.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;