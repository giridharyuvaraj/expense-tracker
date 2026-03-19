import api from './api';

const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
};

const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
};

const authService = { login, register };
export default authService;