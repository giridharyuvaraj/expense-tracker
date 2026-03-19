import api from './api';

const getSummary = (month, year) => api.get(`/analytics/summary?month=${month}&year=${year}`);
const getComparison = () => api.get('/analytics/comparison');
const getBreakdown = () => api.get('/analytics/breakdown');
const getInsights = () => api.get('/analytics/insights');

const analyticsService = { getSummary, getComparison, getBreakdown, getInsights };
export default analyticsService;
