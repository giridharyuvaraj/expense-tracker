import api from './api';

const getBudgets = () => api.get('/budgets');
const setBudget = (data) => api.post('/budgets', data);
const deleteBudget = (id) => api.delete(`/budgets/${id}`);

const budgetService = { getBudgets, setBudget, deleteBudget };
export default budgetService;