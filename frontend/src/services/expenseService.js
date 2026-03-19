import api from './api';

const getAllExpenses = (page = 0, size = 20) => api.get(`/expenses?page=${page}&size=${size}`);
const addExpense = (data) => api.post('/expenses', data);
const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
const deleteExpense = (id) => api.delete(`/expenses/${id}`);

const expenseService = { getAllExpenses, addExpense, updateExpense, deleteExpense };
export default expenseService;
