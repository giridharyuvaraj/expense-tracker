import api from './api';

const createSession = () => api.post('/chatbot/session');

const sendMessage = (data) => api.post('/chatbot/message', {
    sessionId: data.sessionId,
    message: data.message
});

const getSessions = () => api.get('/chatbot/sessions');

const getSessionMessages = (sessionId) =>
    api.get(`/chatbot/sessions/${sessionId}/messages`);

const chatbotService = {
    createSession,
    sendMessage,
    getSessions,
    getSessionMessages
};

export default chatbotService;